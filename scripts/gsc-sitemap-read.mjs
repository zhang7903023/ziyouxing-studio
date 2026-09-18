#!/usr/bin/env node
/** 读 GSC 站点地图报告的 thead/tbody 单元格（对齐用，只读） */
const PORT = 9222;
const RES = encodeURIComponent('https://zyxstudio.net/');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const list = await fetch(`http://127.0.0.1:${PORT}/json/list`).then(r => r.json());
const page = list.find(t => t.type === 'page' && t.url.includes('search-console')) || list.find(t => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
let id = 0; const pending = new Map();
ws.onmessage = e => { const d = JSON.parse(e.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d.result); pending.delete(d.id); } };
const call = (m, p) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
const ev = async x => (await call('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true })).result?.value;
await call('Page.enable');
await call('Page.navigate', { url: 'https://search.google.com/search-console/sitemaps?resource_id=' + RES });
await sleep(14000);
console.log(await ev(`(() => {
  const t = [...document.querySelectorAll('table')].find(t => t.getBoundingClientRect().width > 0);
  if (!t) return 'NO_TABLE';
  const head = [...t.querySelectorAll('thead th, thead td')].map(c => (c.innerText||'').trim());
  const rows = [...t.querySelectorAll('tbody tr')].map(tr => [...tr.querySelectorAll('td')].map(c => (c.innerText||'').trim()));
  return 'HEAD(' + head.length + '): ' + JSON.stringify(head) + '\\nROWS: ' + JSON.stringify(rows);
})()`));
process.exit(0);
