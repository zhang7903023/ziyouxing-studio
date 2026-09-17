#!/usr/bin/env node
/** 核对 GSC 网址检查状态（截图 + 状态区文本）。用法: node scripts/gsc-verify-submit.mjs <url> [输出png] */
import fs from 'fs';
const PORT = 9222;
const targetUrl = process.argv[2];
const outPng = process.argv[3] || '/tmp/gsc-verify.png';
const RES = encodeURIComponent('https://zyxstudio.net/');
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  const list = await fetch(`http://127.0.0.1:${PORT}/json/list`).then(r => r.json());
  let page = list.find(t => t.type === 'page' && t.url.includes('search-console')) || list.find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let id = 0; const pending = new Map();
  ws.onmessage = e => { const d = JSON.parse(e.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d.result); pending.delete(d.id); } };
  const call = (m, p) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
  const ev = async expr => (await call('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result?.value;
  await call('Page.enable');

  await call('Page.navigate', { url: 'https://search.google.com/search-console?resource_id=' + RES });
  await sleep(7000);

  const filled = await ev(`(() => {
    const i = [...document.querySelectorAll('input')].find(x => (x.getAttribute('aria-label')||'').includes('检查'));
    if (!i) return 'no-input';
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(i, ${JSON.stringify(targetUrl)});
    i.dispatchEvent(new Event('input', { bubbles: true }));
    i.focus();
    i.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }));
    i.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', keyCode: 13, bubbles: true }));
    return 'ok';
  })()`);
  console.log('输入:', filled);

  let txt = '';
  for (let i = 0; i < 25; i++) {
    await sleep(2500);
    txt = await ev(`(() => {
      const t = document.body.innerText;
      const k = t.indexOf('已编入索引');
      if (k < 0) return '';
      return t.slice(Math.max(0, k - 300), k + 620);
    })()`);
    if (txt) break;
  }
  console.log('──── 状态区文本 ────');
  console.log(txt || '未取到');
  const shot = await call('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(outPng, Buffer.from(shot.data, 'base64'));
  console.log('截图:', outPng);
  process.exit(0);
}
main().catch(e => { console.error('ERR', e.message); process.exit(1); });
