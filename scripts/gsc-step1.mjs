#!/usr/bin/env node
/** GSC 第一步：连 9222 已登录 Chrome，打开 Search Console，截图 + 提取页面状态。用法: node scripts/gsc-step1.mjs */
const PORT = 9222;

async function main() {
  // 取现有 page target
  let list = await fetch(`http://127.0.0.1:${PORT}/json/list`).then(r => r.json());
  let page = list.find(t => t.type === 'page');
  if (!page) {
    page = await fetch(`http://127.0.0.1:${PORT}/json/new?https%3A%2F%2Fsearch.google.com%2Fsearch-console`, { method: 'PUT' }).then(r => r.json());
  }
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 0; const pending = new Map();
  ws.onmessage = e => { const d = JSON.parse(e.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d.result); pending.delete(d.id); } };
  const call = (m, p) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method: m, params: p })); });

  await call('Page.enable');
  await call('Runtime.enable');
  await call('Page.navigate', { url: 'https://search.google.com/search-console' });
  // 等待加载 + 可能的跳转
  await new Promise(r => setTimeout(r, 8000));

  const url = await call('Runtime.evaluate', { expression: 'location.href', returnByValue: true }).then(r => r.result.value);
  const text = await call('Runtime.evaluate', {
    expression: `document.body.innerText.slice(0, 1500)`,
    returnByValue: true
  }).then(r => r.result.value);

  const shot = await call('Page.captureScreenshot', { format: 'png' });
  const { writeFileSync } = await import('node:fs');
  writeFileSync('/tmp/gsc-step1.png', Buffer.from(shot.data, 'base64'));
  console.log('URL:', url);
  console.log('=== PAGE TEXT ===');
  console.log(text);
  process.exit(0);
}
main().catch(e => { console.error('ERR', e.message); process.exit(1); });
