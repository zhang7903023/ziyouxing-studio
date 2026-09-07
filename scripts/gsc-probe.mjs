#!/usr/bin/env node
/** 探测 GSC 顶部检查输入框。node scripts/gsc-probe.mjs */
const PORT = 9222;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const list = await fetch(`http://127.0.0.1:${PORT}/json/list`).then(r => r.json());
let page = list.find(t => t.type === 'page' && t.url.includes('search-console'));
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
let id = 0; const pending = new Map();
ws.onmessage = e => { const d = JSON.parse(e.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d.result); pending.delete(d.id); } };
const call = (m, p) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
await call('Page.enable');
await call('Page.navigate', { url: 'https://search.google.com/search-console?resource_id=' + encodeURIComponent('https://zyxstudio.net/') });
await sleep(6000);
const info = await call('Runtime.evaluate', {
  expression: `JSON.stringify([...document.querySelectorAll('input')].map(i => ({type: i.type, label: i.getAttribute('aria-label'), ph: i.placeholder, visible: !!i.offsetParent})))`,
  returnByValue: true
}).then(r => r.result.value);
console.log('当前URL:', await call('Runtime.evaluate', { expression: 'location.href.slice(0,120)', returnByValue: true }).then(r => r.result.value));
console.log('inputs:', info);
process.exit(0);
