#!/usr/bin/env node
/** GSC URL 检查 + 请求编入索引。用法: node scripts/gsc-index.mjs <url> [--shot /tmp/x.png] */
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
  await call('Page.enable');

  // 打开 URL 检查
  await call('Page.navigate', { url: `https://search.google.com/search-console/inspect?resource_id=${RES}&id=${encodeURIComponent(targetUrl)}` });
  // 等检查完成（面板出现结果文本），最多 45s
  let state = '';
  for (let i = 0; i < 22; i++) {
    await sleep(2000);
    state = await call('Runtime.evaluate', { expression: `document.body.innerText.slice(0,800)`, returnByValue: true }).then(r => r.result.value);
    if (/已编入索引|不在 Google|无法编入索引|网址不是 Google|重复网页|备用网页|抓取|编入索引/.test(state) && !/正在检查|正在检索/.test(state)) break;
  }
  console.log('--- 检查结果摘要:', state.replace(/\n+/g, ' | ').slice(0, 200));

  // 找"请求编入索引"按钮并点击
  const clicked = await call('Runtime.evaluate', {
    expression: `(() => {
      const els = [...document.querySelectorAll('button, [role="button"], a, span')];
      const btn = els.find(e => /请求编入索引/.test(e.textContent || '') && e.offsetParent !== null && (e.tagName === 'BUTTON' || e.getAttribute('role') === 'button' || e.tagName === 'A' || e.className.includes('button')));
      if (btn) { btn.click(); return btn.tagName + ':' + btn.textContent.trim().slice(0,30); }
      return null;
    })()`,
    returnByValue: true
  }).then(r => r.result.value);
  console.log('--- 点击请求按钮:', clicked);
  if (!clicked) { console.log('!! 未找到「请求编入索引」按钮'); if (shotPath) { const s = await call('Page.captureScreenshot', { format: 'png' }); (await import('node:fs')).writeFileSync(shotPath, Buffer.from(s.data, 'base64')); } process.exit(2); }

  // 等弹窗出现并点确认
  await sleep(4000);
  let confirmed = null;
  for (let i = 0; i < 8; i++) {
    confirmed = await call('Runtime.evaluate', {
      expression: `(() => {
        const els = [...document.querySelectorAll('button, [role="button"]')];
        const btn = els.find(e => e.offsetParent !== null && /^(提交|测试实际网址|GO|Request indexing)$/i.test((e.textContent || '').trim()));
        if (btn) { btn.click(); return btn.textContent.trim(); }
        return null;
      })()`,
      returnByValue: true
    }).then(r => r.result.value);
    if (confirmed) break;
    await sleep(2500);
  }
  console.log('--- 确认按钮:', confirmed);

  // 等提交完成提示，最多 60s
  let done = '';
  for (let i = 0; i < 20; i++) {
    await sleep(3000);
    done = await call('Runtime.evaluate', { expression: `document.body.innerText.slice(0,1000)`, returnByValue: true }).then(r => r.result.value);
    if (/已收到|已提交|已请求|会尽快|成功/.test(done)) break;
  }
  console.log('--- 完成状态:', /已收到|已提交|已请求|会尽快|成功/.test(done) ? '✅ 提交成功' : '⚠️ 未见成功提示');
  console.log('--- 页面摘要:', done.replace(/\n+/g, ' | ').slice(0, 220));
  if (shotPath) { const s = await call('Page.captureScreenshot', { format: 'png' }); (await import('node:fs')).writeFileSync(shotPath, Buffer.from(s.data, 'base64')); }
  process.exit(0);
}
main().catch(e => { console.error('ERR', e.message); process.exit(1); });
