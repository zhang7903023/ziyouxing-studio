#!/usr/bin/env node
/** GSC 编制索引报告的**精确表格读取** + 原因下钻（只读）
 *  用法: node scripts/gsc-index-drill.mjs
 */
const PORT = 9222;
const RES = encodeURIComponent('https://zyxstudio.net/');
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
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
  const visTable = () => ev(`(() => {
    const t = [...document.querySelectorAll('table')].find(t => t.getBoundingClientRect().width > 0);
    if (!t) return ['NO_VISIBLE_TABLE'];
    return [...t.querySelectorAll('tbody tr')].map(tr => [...tr.querySelectorAll('td,th')].map(c => (c.innerText||'').trim()).join(' || ')).filter(Boolean);
  })()`);
  const pager = () => ev(`(() => { const m = (document.body.innerText||'').match(/第\\s*[\\d,\\s-]+\\s*行[，,]\\s*共\\s*[\\d,]+\\s*行/); return m ? m[0] : 'NO_PAGER'; })()`);
  const set250 = async () => {
    const c = await ev(`(() => { const s=[...document.querySelectorAll('[role=combobox]')].filter(e=>e.getBoundingClientRect().width>0); if(!s.length) return null; const e=s[s.length-1]; e.scrollIntoView({block:'center'}); const r=e.getBoundingClientRect(); return {x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2)}; })()`);
    if (!c) return 'no-combobox';
    await clickAt(c.x, c.y); await sleep(2200);
    const o = await ev(`(() => { const e=[...document.querySelectorAll('[role=option]')].find(e=>(e.textContent||'').trim()==='250'); if(!e) return null; const r=e.getBoundingClientRect(); return {x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2)}; })()`);
    if (!o) return 'no-250';
    await clickAt(o.x, o.y); await sleep(5000);
    return 'ok';
  };
  const clickRowByText = async (label, nth = 0) => {
    const cands = await ev(`(() => {
      const out = [];
      [...document.querySelectorAll('tr,[role=row]')].forEach(e => {
        const t = (e.innerText || '').trim();
        if (!t.includes(${JSON.stringify(label)})) return;
        e.scrollIntoView({ block: 'center' });
        const r = e.getBoundingClientRect();
        out.push({ x: Math.round(r.left + 40), y: Math.round(r.top + r.height / 2), h: Math.round(r.height), t: t.slice(0, 60) });
      });
      return out;
    })()`);
    if (!cands || !cands.length) return null;
    const c = cands[nth] || cands[0];
    await clickAt(c.x, c.y);
    return c;
  };

  await call('Page.enable');
  await call('Page.navigate', { url: 'https://search.google.com/search-console/index?resource_id=' + RES });
  await sleep(15000);
  console.error('set250: ' + await set250());

  console.log('===== A. 原因表（精确单元格） =====');
  console.log((await visTable() || []).join('\n'));
  console.log('PAGER: ' + await pager());

  for (const label of ['备用网页', '已发现 - 尚未编入索引', '已抓取 - 尚未编入索引']) {
    console.log('');
    console.log('===== 下钻: ' + label + ' =====');
    const row = await clickRowByText(label);
    console.log('点击行: ' + JSON.stringify(row));
    if (!row) continue;
    await sleep(8000);
    console.error('  下钻 set250: ' + await set250());
    console.log('PAGER: ' + await pager());
    const t = await visTable();
    console.log((t || []).join('\n'));
    const us = await ev(`(() => { const m=(document.body.innerText||'').match(/https:\\/\\/zyxstudio\\.net\\/[^\\s|]+/g)||[]; return [...new Set(m)]; })()`);
    console.log('URL 汇总 (' + (us || []).length + '):');
    (us || []).forEach(u => console.log('  ' + u));
    await call('Page.navigate', { url: 'https://search.google.com/search-console/index?resource_id=' + RES });
    await sleep(13000);
  }

  console.log('');
  console.log('===== B. 站点地图表（精确单元格） =====');
  await call('Page.navigate', { url: 'https://search.google.com/search-console/sitemaps?resource_id=' + RES });
  await sleep(13000);
  console.log((await visTable() || []).join('\n'));
  process.exit(0);
}
main().catch(e => { console.error('ERR', e.message); process.exit(1); });
