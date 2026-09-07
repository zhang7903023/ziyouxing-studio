#!/usr/bin/env node
/** GSC 第二步：查看 sitemap 提交状态。用法: node scripts/gsc-step2.mjs */
const PORT = 9222;

async function main() {
  const list = await fetch(`http://127.0.0.1:${PORT}/json/list`).then(r => r.json());
  let page = list.find(t => t.type === 'page' && t.url.includes('search-console'));
  if (!page) page = list.find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let id = 0; const pending = new Map();
  ws.onmessage = e => { const d = JSON.parse(e.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d.result); pending.delete(d.id); } };
  const call = (m, p) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method: m, params: p })); });

  await call('Page.enable');
  await call('Page.navigate', { url: 'https://search.google.com/search-console/sitemaps?resource_id=' + encodeURIComponent('https://zyxstudio.net/') });
  await new Promise(r => setTimeout(r, 7000));
  const url = await call('Runtime.evaluate', { expression: 'location.href', returnByValue: true }).then(r => r.result.value);
  const text = await call('Runtime.evaluate', { expression: `document.querySelector('table')?.innerText || document.body.innerText.slice(0, 1200)`, returnByValue: true }).then(r => r.result.value);
  const shot = await call('Page.captureScreenshot', { format: 'png' });
  const { writeFileSync } = await import('node:fs');
  writeFileSync('/tmp/gsc-step2.png', Buffer.from(shot.data, 'base64'));
  console.log('URL:', url);
  console.log('=== SITEMAP TABLE ===');
  console.log(text);
  process.exit(0);
}
main().catch(e => { console.error('ERR', e.message); process.exit(1); });
