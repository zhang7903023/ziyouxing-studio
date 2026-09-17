#!/usr/bin/env node
/** GSC 近28天 查询词+网页 明细（含排名）。node scripts/gsc-28d.mjs */
const PORT = 9222;
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

  await call('Page.navigate', { url: 'https://search.google.com/search-console/performance/search-analytics?resource_id=' + RES });
  await sleep(11000);

  // 切 28 天
  await ev(`(async () => { const b=[...document.querySelectorAll('button')].find(b=>(b.innerText||'').trim()==='28 天'); if(b) b.click(); await new Promise(r=>setTimeout(r,5000)); return 1; })()`);
  const sum = await ev(`(() => { const b=document.body.innerText; const j=b.indexOf('总点击次数'); return b.slice(j, j+130).replace(/\\n+/g,' | '); })()`);
  console.log('### 28天汇总: ' + sum + '\n');

  // 每页行数 → 250
  await ev(`(async () => {
    const foot = [...document.querySelectorAll('*')].find(e => (e.textContent||'').includes('每页行数') && e.children.length < 8 && e.offsetParent);
    if (!foot) return 'no-foot';
    const sel = foot.closest('mat-form-field')?.querySelector('mat-select') || foot.parentElement.querySelector('mat-select');
    if (!sel) return 'no-select';
    sel.click();
    await new Promise(r => setTimeout(r, 1200));
    const opt = [...document.querySelectorAll('[role=option], .mat-mdc-option')].find(e => (e.textContent||'').trim() === '250');
    if (!opt) return 'no-option';
    opt.click();
    await new Promise(r => setTimeout(r, 3000));
    return 'ok';
  })()`);
  await sleep(2500);

  const dumpRows = async () => ev(`(() => {
    const rs = [...document.querySelectorAll('table tbody tr')];
    return rs.map(tr => [...tr.querySelectorAll('td')].map(td => (td.innerText||'').trim()).join('\\t')).filter(Boolean);
  })()`);

  console.log('===QUERIES28===');
  console.log(((await dumpRows()) || []).join('\n'));

  // 切网页
  await ev(`(async () => {
    const h = [...document.querySelectorAll('div,span,button,a,[role=tab]')].filter(e => (e.textContent||'').trim() === '网页' && e.offsetParent);
    if (h.length) h[h.length-1].click();
    await new Promise(r => setTimeout(r, 4500));
    return 1;
  })()`);
  console.log('===PAGES28===');
  console.log(((await dumpRows()) || []).join('\n'));
  process.exit(0);
}
main().catch(e => { console.error('ERR', e.message); process.exit(1); });
