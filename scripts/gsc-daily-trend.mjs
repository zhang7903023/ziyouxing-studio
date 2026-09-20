#!/usr/bin/env node
/**
 * 全站「日期」维度逐日趋势（不设过滤器 = 全站）
 * 用法：WINDOW=7d|28d|3m node scripts/gsc-daily-trend.mjs
 * 输出：每行 日期 / 点击次数 / 曝光次数 / CTR / 平均排名
 */
const PORT = 9222;
const RES = encodeURIComponent('https://zyxstudio.net/');
const WINDOW = process.env.WINDOW || '28d';
const LABEL = { '7d': '7 天', '28d': '28 天', '3m': '3 个月' }[WINDOW] || '28 天';
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  const list = await fetch(`http://127.0.0.1:${PORT}/json/list`).then(r => r.json());
  const page = list.find(t => t.type === 'page' && t.url.includes('search-console')) || list.find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let id = 0; const pending = new Map();
  ws.onmessage = e => { const d = JSON.parse(e.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d.result); pending.delete(d.id); } };
  const call = (m, p) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
  const ev = async expr => (await call('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result?.value;
  const clickAt = async (x, y) => {
    await call('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'none', buttons: 0 }); await sleep(150);
    await call('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 }); await sleep(120);
    await call('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1 });
  };
  const switchDim = async (name) => {
    const pos = await ev(`(() => {
      const l = [...document.querySelectorAll('[role=tablist]')].find(l => l.getBoundingClientRect().width > 0);
      if (!l) return null;
      const t = [...l.querySelectorAll('[role=tab]')].find(t => (t.innerText||'').trim() === ${JSON.stringify(name)});
      if (!t) return null; const r = t.getBoundingClientRect();
      return { x: Math.round(r.left+r.width/2), y: Math.round(r.top+r.height/2) };
    })()`);
    if (!pos) return 'no-tab';
    await clickAt(pos.x, pos.y); await sleep(10000); return 'ok';
  };
  const set250 = async () => {
    const c = await ev(`(() => { const s=[...document.querySelectorAll('[role=combobox]')].filter(e=>e.getBoundingClientRect().width>0); if(!s.length) return null; const e=s[s.length-1]; e.scrollIntoView({block:'center'}); const r=e.getBoundingClientRect(); return {x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2)}; })()`);
    if (!c) return 'no-combobox';
    await clickAt(c.x, c.y); await sleep(2500);
    const o = await ev(`(() => { const e=[...document.querySelectorAll('[role=option]')].find(e=>(e.textContent||'').trim()==='250'); if(!e) return null; const r=e.getBoundingClientRect(); return {x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2)}; })()`);
    if (!o) return 'no-250';
    await clickAt(o.x, o.y); await sleep(6000);
    return 'ok';
  };

  await call('Page.enable');
  await call('Page.navigate', { url: 'https://search.google.com/search-console/performance/search-analytics?resource_id=' + RES });
  await sleep(13000);

  // 切窗口
  await ev(`(async () => { const b=[...document.querySelectorAll('button')].find(b=>(b.innerText||'').trim()===${JSON.stringify(LABEL)}); if(b) b.click(); await new Promise(r=>setTimeout(r,7000)); return 1; })()`);
  await sleep(2000);

  // 汇总
  const summary = await ev(`(() => { const b=document.body.innerText; const j=b.indexOf('总点击次数'); return j<0?'NO_SUMMARY':b.slice(j,j+120).replace(/\\n+/g,' | '); })()`);
  console.log('===== WINDOW ' + WINDOW + ' / 全站汇总 =====');
  console.log(summary);

  // 日期维度
  console.error('切日期: ' + await switchDim('日期'));
  console.error('set250: ' + await set250());
  console.log('===== 日期维度（逐日） =====');
  const rows = await ev(`(() => {
    const t = [...document.querySelectorAll('table')].find(t => t.getBoundingClientRect().width > 0);
    if (!t) return ['NO_VISIBLE_TABLE'];
    const head = [...t.querySelectorAll('thead th')].map(c=>(c.innerText||'').trim());
    const body = [...t.querySelectorAll('tbody tr')].map(tr => [...tr.querySelectorAll('td')].map(td => (td.innerText||'').trim()).join('\\t')).filter(Boolean);
    let pager=''; let p=t.parentElement;
    for (let i=0;i<6&&p;i++,p=p.parentElement){const m=(p.innerText||'').match(/第 [\\d,\\-]+ 行[^\\n]*/); if(m){pager=m[0];break;}}
    return ['HEAD: ' + head.join(' | '), ...body, 'PAGER: ' + pager];
  })()`);
  console.log((rows || []).join('\n'));
  console.log('===== 汇总行（页面底部）=====');
  console.log(await ev(`(() => { const b=document.body.innerText||''; const m=b.match(/总计[^\\n]*/g); return m? m.slice(0,3).join(' || ') : '-'; })()`));
  process.exit(0);
}
main().catch(e => { console.error('ERR', e.message); process.exit(1); });
