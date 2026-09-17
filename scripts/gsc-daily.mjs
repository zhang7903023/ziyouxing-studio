#!/usr/bin/env node
/** GSC 区间汇总 + 尝试按日期维度。node scripts/gsc-daily.mjs */
const PORT = 9222;
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

  const clickBtn = async label => ev(`(async () => {
    const btn = [...document.querySelectorAll('button')].find(b => (b.innerText||'').trim() === ${JSON.stringify(label)});
    if (!btn) return 'no-btn';
    btn.click();
    await new Promise(r => setTimeout(r, 5000));
    return 'ok';
  })()`);

  const summary = async () => ev(`(() => {
    const b = document.body.innerText; const j = b.indexOf('总点击次数');
    return b.slice(j, j + 150).replace(/\\n+/g, ' | ');
  })()`);

  for (const range of ['24 小时', '7 天', '28 天', '3 个月']) {
    console.error('切区间', range, await clickBtn(range));
    console.log(`### ${range}`);
    console.log(await summary());
  }

  // 找「日期」维度（含隐藏元素）
  const probe = await ev(`(() => {
    const els = [...document.querySelectorAll('*')].filter(e => (e.textContent||'').trim() === '日期');
    return els.map(e => { const r = e.getBoundingClientRect(); return { tag: e.tagName, role: e.getAttribute('role'), visible: !!e.offsetParent, rect: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)], cls: String(e.className).slice(0, 40) }; });
  })()`);
  console.log('### 「日期」元素探测:', JSON.stringify(probe));

  // 尝试点击可见的日期 tab
  const clicked = await ev(`(async () => {
    const cand = [...document.querySelectorAll('[role=tab],div,span')].filter(e => (e.textContent||'').trim() === '日期' && e.offsetParent);
    if (!cand.length) return 'none';
    cand[cand.length-1].click();
    await new Promise(r => setTimeout(r, 4000));
    return 'clicked:' + cand.length;
  })()`);
  console.error('日期tab:', clicked);

  if (String(clicked).startsWith('clicked')) {
    const rows = await ev(`(() => {
      const rs = [...document.querySelectorAll('table tbody tr')];
      return rs.map(tr => [...tr.querySelectorAll('td')].map(td => (td.innerText||'').trim()).join(' | ')).filter(Boolean);
    })()`);
    console.log('### 7天按日期表');
    console.log((rows || []).join('\n'));
  }
  process.exit(0);
}
main().catch(e => { console.error('ERR', e.message); process.exit(1); });
