#!/usr/bin/env node
/** GSC 效果数据提取。node scripts/gsc-report.mjs */
const PORT = 9222;
const RES = encodeURIComponent('https://zyxstudio.net/');
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  await sleep(2000);
  const list = await fetch(`http://127.0.0.1:${PORT}/json/list`).then(r => r.json());
  let page = list.find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let id = 0; const pending = new Map();
  ws.onmessage = e => { const d = JSON.parse(e.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d.result); pending.delete(d.id); } };
  const call = (m, p) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
  const ev = async expr => (await call('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result?.value;
  await call('Page.enable');

  // 效果报告页（默认最近3个月）
  await call('Page.navigate', { url: 'https://search.google.com/search-console/performance/search-analytics?resource_id=' + RES });
  await sleep(10000);
  const text = await ev(`document.body.innerText.slice(0, 2500)`);
  console.log('=== 效果报告(默认范围) ===');
  console.log(text);
  // 概览页
  await call('Page.navigate', { url: 'https://search.google.com/search-console?resource_id=' + RES });
  await sleep(8000);
  const ov = await ev(`document.body.innerText.slice(0, 1200)`);
  console.log('=== 概览 ===');
  console.log(ov);
  const shot = await call('Page.captureScreenshot', { format: 'png' });
  (await import('node:fs')).writeFileSync('/tmp/gsc-report.png', Buffer.from(shot.data, 'base64'));
  process.exit(0);
}
main().catch(e => { console.error('ERR', e.message); process.exit(1); });
