#!/usr/bin/env node
/**
 * GSC 站点地图「重新提交」（Phase 3B · Discovery Refresh）
 *
 * 只做一件事：在 GSC 站点地图报告里，把现有 sitemap URL 再提交一次，
 * 触发 Google 重新读取（不改 sitemap URL、不新建、不删除）。
 *
 * 输出：提交前状态 → 提交动作 → 提交后状态（同一脚本内，便于对照）
 * 用法：node scripts/gsc-sitemap-resubmit.mjs
 */
const PORT = 9222;
const RES = encodeURIComponent('https://zyxstudio.net/');
const SITEMAP = 'https://zyxstudio.net/sitemap.xml';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const list = await fetch(`http://127.0.0.1:${PORT}/json/list`).then(r => r.json());
const page = list.find(t => t.type === 'page' && t.url.includes('search-console')) || list.find(t => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
let id = 0; const pending = new Map();
ws.onmessage = e => { const d = JSON.parse(e.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d.result); pending.delete(d.id); } };
const call = (m, p) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
const ev = async x => (await call('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true })).result?.value;
const clickAt = async (x, y) => {
  await call('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'none', buttons: 0 }); await sleep(120);
  await call('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 }); await sleep(120);
  await call('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1 });
};

const readState = `(() => {
  const t = [...document.querySelectorAll('table')].find(t => t.getBoundingClientRect().width > 0);
  if (!t) return { err: 'NO_TABLE' };
  const head = [...t.querySelectorAll('thead th, thead td')].map(c => (c.innerText||'').trim());
  const rows = [...t.querySelectorAll('tbody tr')].map(tr => [...tr.querySelectorAll('td')].map(c => (c.innerText||'').trim()));
  const body = document.body.innerText || '';
  const grab = (re) => { const m = body.match(re); return m ? m[0].replace(/\\s+/g,' ').trim() : '-'; };
  return {
    head, rows,
    lastRead: grab(/上次读取时间[:：]?\\s*[^\\n]{0,40}/),
    discovered: grab(/已发现的网页[^\\n]{0,30}|已发现网址[^\\n]{0,30}/),
    status: grab(/(成功|无法读取|有错误)[^\\n]{0,40}/),
    toast: grab(/已提交[^\\n]{0,60}|站点地图已提交[^\\n]{0,60}|无法提交[^\\n]{0,60}|无效[^\\n]{0,60}/)
  };
})()`;

await call('Page.enable');
await call('Page.navigate', { url: 'https://search.google.com/search-console/sitemaps?resource_id=' + RES });
await sleep(15000);

console.log('##### STEP 1 · 提交前状态');
const before = await ev(readState);
console.log(JSON.stringify(before, null, 1));
console.log('');

// ---- 定位输入框 ----
const box = await ev(`(() => {
  const ins = [...document.querySelectorAll('input,textarea')].filter(i => i.getBoundingClientRect().width > 60);
  const hit = ins.find(i => {
    const s = ((i.getAttribute('aria-label')||'') + ' ' + (i.placeholder||'')).trim();
    return /站点地图|sitemap/i.test(s);
  });
  if (!hit) return { err: 'NO_INPUT', candidates: ins.map(i => ({ al: i.getAttribute('aria-label'), ph: i.placeholder, w: Math.round(i.getBoundingClientRect().width) })) };
  hit.scrollIntoView({ block: 'center' });
  const r = hit.getBoundingClientRect();
  return { x: Math.round(r.left + r.width/2), y: Math.round(r.top + r.height/2), al: hit.getAttribute('aria-label'), ph: hit.placeholder, val: hit.value };
})()`);
console.log('##### STEP 2 · 输入框定位');
console.log(JSON.stringify(box));
console.log('');
if (box.err) { console.log('未找到站点地图输入框，终止'); process.exit(1); }

// ---- 聚焦 + 清空 + 键入 ----
await clickAt(box.x, box.y); await sleep(900);
await ev(`(() => {
  const ins = [...document.querySelectorAll('input,textarea')].filter(i => i.getBoundingClientRect().width > 60);
  const hit = ins.find(i => /站点地图|sitemap/i.test(((i.getAttribute('aria-label')||'')+' '+(i.placeholder||''))));
  if (!hit) return 'no';
  hit.focus(); hit.select && hit.select();
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(hit, ''); hit.dispatchEvent(new Event('input', { bubbles: true }));
  return 'cleared';
})()`);
await sleep(600);
await call('Input.insertText', { text: SITEMAP });
await sleep(1200);
console.log('##### STEP 3 · 已键入');
console.log(await ev(`(() => { const i=[...document.querySelectorAll('input')].find(i=>/站点地图|sitemap/i.test((i.getAttribute('aria-label')||'')+(i.placeholder||''))); return i? i.value : 'n/a'; })()`));
console.log('');

// ---- 定位「提交」按钮 ----
const btn = await ev(`(() => {
  const bs = [...document.querySelectorAll('button,[role=button]')].filter(b => {
    const r = b.getBoundingClientRect();
    return r.width > 40 && r.height > 20 && r.top >= 0 && r.bottom <= innerHeight && !b.disabled;
  });
  const hit = bs.find(b => (b.innerText||'').trim() === '提交');
  if (!hit) return { err: 'NO_BTN', cands: bs.map(b => ({ t: (b.innerText||'').trim().slice(0,20), w: Math.round(b.getBoundingClientRect().width) })) };
  hit.scrollIntoView({ block: 'center' });
  const r = hit.getBoundingClientRect();
  return { x: Math.round(r.left + r.width/2), y: Math.round(r.top + r.height/2), text: (hit.innerText||'').trim(), disabled: hit.disabled };
})()`);
console.log('##### STEP 4 · 提交按钮定位');
console.log(JSON.stringify(btn));
console.log('');
if (btn.err) { console.log('未找到提交按钮，终止（未做任何提交动作）'); process.exit(1); }

// ---- 点击提交 ----
console.log('##### STEP 5 · 点击提交 @ ' + new Date().toISOString());
await clickAt(btn.x, btn.y);
await sleep(6000);

// ---- 提交后状态 ----
console.log('');
console.log('##### STEP 6 · 提交后状态（+6s）');
console.log(JSON.stringify(await ev(readState), null, 1));

await sleep(6000);
console.log('');
console.log('##### STEP 7 · 提交后状态（+12s）');
console.log(JSON.stringify(await ev(readState), null, 1));

process.exit(0);
