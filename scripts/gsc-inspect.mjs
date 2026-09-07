#!/usr/bin/env node
/** GSC 网址检查 + 请求编入索引（走 UI 顶部输入框）。用法: node scripts/gsc-inspect.mjs <url> [--shot 路径] */
const PORT = 9222;
const targetUrl = process.argv[2];
const shotPath = process.argv.includes('--shot') ? process.argv[process.argv.indexOf('--shot') + 1] : null;
const RES = encodeURIComponent('https://zyxstudio.net/');
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  const list = await fetch(`http://127.0.0.1:${PORT}/json/list`).then(r => r.json());
  let page = list.find(t => t.type === 'page' && t.url.includes('search-console'));
  if (!page) throw new Error('GSC tab 不存在');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let id = 0; const pending = new Map();
  ws.onmessage = e => { const d = JSON.parse(e.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d.result); pending.delete(d.id); } };
  const call = (m, p) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
  const ev = async expr => (await call('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result?.value;
  await call('Page.enable');

  // 1) 回到概览页（保证输入框存在）
  await call('Page.navigate', { url: 'https://search.google.com/search-console?resource_id=' + RES });
  await sleep(5000);

  // 2) 找检查输入框填入 URL + 回车
  const filled = await ev(`(() => {
    const inputs = [...document.querySelectorAll('input')];
    const input = inputs.find(i => (i.getAttribute('aria-label')||'').includes('检查')) || inputs.find(i => (i.placeholder||'').includes('检查'));
    if (!input) return 'no-input';
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(input, ${JSON.stringify(targetUrl)});
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.focus();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
    return 'filled:' + input.getAttribute('aria-label');
  })()`);
  console.log('--- 输入:', filled);

  // 3) 等检查结果出现，最多 60s
  let state = '';
  for (let i = 0; i < 30; i++) {
    await sleep(2000);
    state = await ev(`document.body.innerText.slice(0, 600)`);
    if (/已编入索引|不在 Google 上|无法编入索引|网址不是 Google|重复|备用网页|已编入索引 \(|已抓取/.test(state) && !/正在检查|正在检索|正在测试/.test(state)) break;
  }
  const urlNow = await ev('location.href.slice(0,140)');
  console.log('--- 当前URL:', urlNow);
  console.log('--- 检查结果:', state.replace(/\n+/g, ' | ').slice(0, 160));

  // 4) 点「请求编入索引」
  const clicked = await ev(`(() => {
    const els = [...document.querySelectorAll('button, [role="button"], a, span, div')];
    const btn = els.find(e => { const t = (e.textContent||'').trim(); return t === '请求编入索引' && e.offsetParent !== null && e.clientHeight > 0 && e.children.length <= 1; });
    if (btn) { btn.click(); return 'clicked:' + btn.tagName; }
    return 'no-btn';
  })()`);
  console.log('--- 请求按钮:', clicked);

  // 5) 等弹窗 + 点确认提交按钮
  let confirmed = 'no-confirm';
  for (let i = 0; i < 10; i++) {
    await sleep(2500);
    confirmed = await ev(`(() => {
      const els = [...document.querySelectorAll('button, [role="button"]')];
      const btn = els.find(e => { const t = (e.textContent||'').trim(); return e.offsetParent !== null && e.clientHeight > 0 && /^提交|^GO$|^Request indexing$/i.test(t); });
      if (btn) { btn.click(); return 'confirmed:' + t; }
      return 'no-confirm';
    })()`);
    if (confirmed !== 'no-confirm') break;
  }
  console.log('--- 确认弹窗:', confirmed);

  // 6) 等完成提示，最多 60s
  let done = '';
  for (let i = 0; i < 20; i++) {
    await sleep(3000);
    done = await ev(`document.body.innerText.slice(0, 500)`);
    if (/已收到编入索引请求|已请求编入索引|已提交|会尽快|已在.*排队/.test(done)) break;
  }
  console.log('--- 完成:', /已收到编入索引请求|已请求编入索引|已提交|会尽快|已在.*排队/.test(done) ? '✅ 成功' : '⚠️ 未见明确成功');
  console.log('--- 页面片段:', done.replace(/\n+/g, ' | ').slice(0, 180));
  if (shotPath) { const s = await call('Page.captureScreenshot', { format: 'png' }); (await import('node:fs')).writeFileSync(shotPath, Buffer.from(s.data, 'base64')); console.log('截图:', shotPath); }
  process.exit(0);
}
main().catch(e => { console.error('ERR', e.message); process.exit(1); });
