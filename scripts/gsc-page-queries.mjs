#!/usr/bin/env node
/** 查看某个页面对应的查询词。用法: node scripts/gsc-page-queries.mjs <页面路径片段> */
const PORT = 9222;
const RES = encodeURIComponent('https://zyxstudio.net/');
const NEEDLE = process.argv[2] || '';
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

  await ev(`(async () => { const b=[...document.querySelectorAll('button')].find(b=>(b.innerText||'').trim()==='28 天'); if(b) b.click(); await new Promise(r=>setTimeout(r,5000)); return 1; })()`);

  // 切到「网页」维度
  await ev(`(async () => {
    const h = [...document.querySelectorAll('div,span,button,a,[role=tab]')].filter(e => (e.textContent||'').trim() === '网页' && e.offsetParent);
    if (h.length) h[h.length-1].click();
    await new Promise(r => setTimeout(r, 4500));
    return 1;
  })()`);

  // 点击目标页面行
  const clicked = await ev(`(async () => {
    const tr = [...document.querySelectorAll('table tbody tr')].find(t => (t.innerText||'').includes(${JSON.stringify(NEEDLE)}));
    if (!tr) return 'no-row';
    const cell = tr.querySelector('td') || tr;
    cell.click();
    await new Promise(r => setTimeout(r, 9000));
    return 'ok';
  })()`);
  console.error('点击页面行:', clicked);

  const rows = await ev(`(() => {
    const rs = [...document.querySelectorAll('table tbody tr')];
    return rs.map(tr => [...tr.querySelectorAll('td')].map(td => (td.innerText||'').trim()).join('\\t')).filter(Boolean);
  })()`);
  console.log('=== 该页面的查询词 ===');
  console.log((rows || []).join('\n'));

  const sum = await ev(`(() => { const b=document.body.innerText; const j=b.indexOf('总点击次数'); return b.slice(j, j+120).replace(/\\n+/g,' | '); })()`);
  console.log('\n=== 筛选后汇总 ===');
  console.log(sum);
  process.exit(0);
}
main().catch(e => { console.error('ERR', e.message); process.exit(1); });
