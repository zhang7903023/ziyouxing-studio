#!/usr/bin/env node
/** GSC 请求编入索引（稳健版）。用法: node scripts/gsc-request.mjs <url> */
const PORT = 9222;
const targetUrl = process.argv[2];
const RES = encodeURIComponent('https://zyxstudio.net/');
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  const list = await fetch(`http://127.0.0.1:${PORT}/json/list`).then(r => r.json());
  let page = list.find(t => t.type === 'page' && t.url.includes('search-console'));
  if (!page) {
    page = await fetch(`http://127.0.0.1:${PORT}/json/new?about%3Ablank`, { method: 'PUT' }).then(r => r.json());
  }
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let id = 0; const pending = new Map();
  ws.onmessage = e => { const d = JSON.parse(e.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d.result); pending.delete(d.id); } };
  const call = (m, p) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
  const ev = async expr => (await call('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result?.value;
  await call('Page.enable');

  // 1) 概览页
  await call('Page.navigate', { url: 'https://search.google.com/search-console?resource_id=' + RES });
  await sleep(5000);

  // 2) 输入 URL + 回车
  const filled = await ev(`(() => {
    const input = [...document.querySelectorAll('input')].find(i => (i.getAttribute('aria-label')||'').includes('检查'));
    if (!input) return 'no-input';
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(input, ${JSON.stringify(targetUrl)});
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.focus();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
    return 'filled';
  })()`);
  console.log('[' + targetUrl + '] 输入:', filled);

  // 3) 等检查结果（出现"已收录/不在 Google"等结论）
  let status = '';
  for (let i = 0; i < 30; i++) {
    await sleep(2000);
    status = await ev(`(() => {
      const t = document.body.innerText;
      const m = t.match(/网址已收录到 Google|网址不在 Google 上|无法编入索引|网址不是 Google|已编入索引|重复|备用网页|暂时无法访问/);
      return m ? m[0] : '';
    })()`);
    if (status) break;
  }
  console.log('[' + targetUrl + '] 状态:', status || '!! 未知');

  // 4) 点「请求编入索引」（含已收录页面的重新抓取请求）— 轮询等待按钮渲染
  let clicked = 'no-btn';
  for (let i = 0; i < 15; i++) {
    await sleep(2500);
    clicked = await ev(`(() => {
      const all = [...document.querySelectorAll('button, [role="button"], div, span, a')];
      const hits = all.filter(e => (e.textContent||'').trim() === '请求编入索引' && e.offsetParent !== null);
      if (!hits.length) return 'no-btn';
      let el = hits[hits.length - 1];
      while (el && !['BUTTON','A'].includes(el.tagName) && !el.getAttribute('role')) el = el.parentElement;
      (el || hits[hits.length-1]).click();
      return 'clicked';
    })()`);
    if (clicked === 'clicked') break;
    // 若出现"此网址今天已请求过"类提示，直接判定
    const already = await ev(`/今天已请求|已请求编入索引/.test(document.body.innerText)`);
    if (already) { console.log('[' + targetUrl + '] 今天已请求过，跳过'); process.exit(3); }
  }
  console.log('[' + targetUrl + '] 请求按钮:', clicked);
  if (clicked === 'no-btn') { console.log('!! 未找到请求按钮'); process.exit(2); }

  // 5) 确认弹窗（找 提交/GO 类按钮）
  let confirmed = 'no-confirm';
  for (let i = 0; i < 10; i++) {
    await sleep(2500);
    confirmed = await ev(`(() => {
      const all = [...document.querySelectorAll('button, [role="button"], div, span')];
      const hits = all.filter(e => { const t = (e.textContent||'').trim(); return /^(提交|请求编入索引|GO|Request indexing)$/i.test(t) && e.offsetParent !== null && e.clientWidth > 30 && e.clientHeight > 20; });
      if (!hits.length) return 'no-confirm';
      let el = hits[hits.length - 1];
      while (el && !['BUTTON','A'].includes(el.tagName) && !el.getAttribute('role')) el = el.parentElement;
      (el || hits[hits.length-1]).click();
      return 'confirmed';
    })()`);
    if (confirmed === 'confirmed') break;
  }
  console.log('[' + targetUrl + '] 确认:', confirmed);

  // 6) 完成提示
  let done = '';
  for (let i = 0; i < 20; i++) {
    await sleep(3000);
    done = await ev(`(() => {
      const t = document.body.innerText;
      const m = t.match(/已收到编入索引请求|已请求编入索引|将.*列入处理队列|会尽快|我们已收到你的请求/);
      return m ? m[0] : '';
    })()`);
    if (done) break;
  }
  console.log('[' + targetUrl + '] 结果:', done ? '✅ ' + done : '⚠️ 未见明确成功');
  process.exit(0);
}
main().catch(e => { console.error('ERR', e.message); process.exit(1); });
