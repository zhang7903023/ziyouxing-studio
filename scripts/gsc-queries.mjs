#!/usr/bin/env node
/** GSC 全量查询词+页面数据抓取（每页250行）。node scripts/gsc-queries.mjs */
const PORT = 9222;
const RES = encodeURIComponent('https://zyxstudio.net/');
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  await sleep(1500);
  const list = await fetch(`http://127.0.0.1:${PORT}/json/list`).then(r => r.json());
  let page = list.find(t => t.type === 'page' && t.url.includes('search-console'));
  if (!page) {
    page = list.find(t => t.type === 'page');
    if (!page) page = await fetch(`http://127.0.0.1:${PORT}/json/new?about%3Ablank`, { method: 'PUT' }).then(r => r.json());
  }
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let id = 0; const pending = new Map();
  ws.onmessage = e => { const d = JSON.parse(e.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d.result); pending.delete(d.id); } };
  const call = (m, p) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
  const ev = async expr => (await call('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result?.value;
  await call('Page.enable');

  await call('Page.navigate', { url: 'https://search.google.com/search-console/performance/search-analytics?resource_id=' + RES });
  await sleep(9000);

  // 1) 点「查询数」标签
  const tab = await ev(`(() => {
    const hits = [...document.querySelectorAll('div,span,button,a,[role=tab]')].filter(e => (e.textContent||'').trim() === '查询数' && e.offsetParent);
    if (!hits.length) return 'no-tab';
    hits[hits.length-1].click(); return 'ok';
  })()`);
  console.error('查询tab:', tab);
  await sleep(4000);

  // 2) 每页行数 → 250（mat-select 下拉）
  const pageSize = await ev(`(async () => {
    const foot = [...document.querySelectorAll('*')].find(e => (e.textContent||'').includes('每页行数') && e.children.length < 8 && e.offsetParent);
    if (!foot) return 'no-foot';
    const sel = foot.closest('mat-form-field')?.querySelector('mat-select') || foot.parentElement.querySelector('mat-select') || [...document.querySelectorAll('mat-select')].pop();
    if (!sel) return 'no-select';
    sel.click();
    await new Promise(r => setTimeout(r, 1200));
    const opt = [...document.querySelectorAll('[role=option], .mat-mdc-option, .cdk-overlay-pane *')].find(e => (e.textContent||'').trim() === '250');
    if (!opt) return 'no-option';
    opt.click();
    await new Promise(r => setTimeout(r, 3000));
    return 'ok';
  })()`);
  console.error('每页行数:', pageSize);
  await sleep(2000);

  // 3) 抓查询表
  const queries = await ev(`(() => {
    const rows = [...document.querySelectorAll('table tbody tr')];
    return rows.map(tr => [...tr.querySelectorAll('td')].map(td => (td.innerText||'').trim()).join('\\t')).filter(r => r);
  })()`);
  console.log('===QUERIES===');
  console.log((queries || []).join('\n'));

  // 4) 切「网页」标签（行数设置保留）
  const tab2 = await ev(`(() => {
    const hits = [...document.querySelectorAll('div,span,button,a,[role=tab]')].filter(e => (e.textContent||'').trim() === '网页' && e.offsetParent);
    if (!hits.length) return 'no-tab';
    hits[hits.length-1].click(); return 'ok';
  })()`);
  console.error('网页tab:', tab2);
  await sleep(4000);
  const pages = await ev(`(() => {
    const rows = [...document.querySelectorAll('table tbody tr')];
    return rows.map(tr => [...tr.querySelectorAll('td')].map(td => (td.innerText||'').trim()).join('\\t')).filter(r => r);
  })()`);
  console.log('===PAGES===');
  console.log((pages || []).join('\n'));

  process.exit(0);
}
main().catch(e => { console.error('ERR', e.message); process.exit(1); });
