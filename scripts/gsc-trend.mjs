#!/usr/bin/env node
/** GSC 按日期趋势 + 近7天查询词。node scripts/gsc-trend.mjs */
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

  // 顶部汇总数字
  const sum = await ev(`document.body.innerText.slice(0, 1600)`);
  console.log('=== 顶部汇总（默认3个月）===');
  console.log((sum || '').split('\n').filter(l => l.trim() && !/^[a-z_]+$/.test(l.trim())).slice(0, 40).join(' | '));

  // 点日期维度 tab
  const clickTab = async (name) => ev(`(async () => {
    const hits = [...document.querySelectorAll('div,span,button,a,[role=tab]')].filter(e => (e.textContent||'').trim() === ${JSON.stringify(name)} && e.offsetParent);
    if (!hits.length) return 'no-tab:' + ${JSON.stringify(name)};
    hits[hits.length-1].click();
    await new Promise(r => setTimeout(r, 3500));
    return 'ok';
  })()`);

  const dump = async (label) => {
    const rows = await ev(`(() => {
      const rs = [...document.querySelectorAll('table tbody tr')];
      return rs.map(tr => [...tr.querySelectorAll('td')].map(td => (td.innerText||'').trim()).join(' | ')).filter(Boolean);
    })()`);
    console.log('===' + label + '===');
    console.log((rows || []).join('\n'));
  };

  const t1 = await clickTab('日期');
  console.error('日期tab:', t1);
  await dump('按日期（3个月）');

  // 切 7 天
  const clickRange = async (name) => ev(`(async () => {
    const hits = [...document.querySelectorAll('div,span,button,a,[role=tab]')].filter(e => (e.textContent||'').trim() === ${JSON.stringify(name)} && e.offsetParent);
    if (!hits.length) return 'no-range';
    hits[0].click();
    await new Promise(r => setTimeout(r, 4000));
    return 'ok';
  })()`);

  await clickRange('7 天');
  await ev(`(() => { const h=[...document.querySelectorAll('div,span,button,a,[role=tab]')].filter(e=>(e.textContent||'').trim()==='日期'&&e.offsetParent); if(h.length) h[h.length-1].click(); return 1; })()`);
  await sleep(4000);
  await dump('按日期（近7天）');

  await clickRange('24 小时');
  await sleep(4000);
  await dump('近24小时（按日期）');

  process.exit(0);
}
main().catch(e => { console.error('ERR', e.message); process.exit(1); });
