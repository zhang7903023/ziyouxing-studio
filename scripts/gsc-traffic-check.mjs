#!/usr/bin/env node
/**
 * 流量变化检查（一次跑完）：
 *   1) 7 天窗口汇总
 *   2) 「天」维度逐日（全站）
 *   3) 「网页」维度逐页（全站，250 行）
 *   4) 28 天窗口汇总
 * 用法：与启动调试 Chrome 放同一条 bash 命令
 *
 * 已知标签名：查询数 / 网页 / 国家地区 / 设备 / 搜索结果呈现 / 天
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
  const ev = async expr => (await call('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result?.value;
  const clickAt = async (x, y) => {
    await call('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'none', buttons: 0 }); await sleep(150);
    await call('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 }); await sleep(120);
    await call('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1 });
  };
  const summary = () => ev(`(() => { const b=document.body.innerText; const j=b.indexOf('总点击次数'); if(j<0) return 'NO_SUMMARY'; const k=b.indexOf('图表，包含从'); return b.slice(j, k>j? j+120 : j+140).replace(/\\n+/g,' | '); })()`);
  const rows = () => ev(`(() => {
    const t = [...document.querySelectorAll('table')].find(t => t.getBoundingClientRect().width > 0);
    if (!t) return ['NO_VISIBLE_TABLE'];
    const head = [...t.querySelectorAll('thead th')].map(c=>(c.innerText||'').trim());
    const body = [...t.querySelectorAll('tbody tr')].map(tr => [...tr.querySelectorAll('td')].map(td => (td.innerText||'').trim()).join('\\t')).filter(Boolean);
    let pager=''; let p=t.parentElement;
    for (let i=0;i<6&&p;i++,p=p.parentElement){const m=(p.innerText||'').match(/第 [\\d,\\-]+ 行[^\\n]*/); if(m){pager=m[0];break;}}
    return ['HEAD: ' + head.join(' | '), ...body, 'PAGER: ' + pager];
  })()`);
  // tab 定位（唯一可见 tablist）
  const tabPos = (name) => ev(`(() => {
    const l = [...document.querySelectorAll('[role=tablist]')].find(l => l.getBoundingClientRect().width > 200);
    if (!l) return null;
    const t = [...l.querySelectorAll('[role=tab]')].find(t => (t.innerText||'').trim() === ${JSON.stringify(name)});
    if (!t) return null;
    t.scrollIntoView({block:'center'});
    const r = t.getBoundingClientRect();
    return { x: Math.round(r.left+r.width/2), y: Math.round(r.top+r.height/2), selected: t.getAttribute('aria-selected') };
  })()`);
  const switchTab = async (name, verifyRe) => {
    for (let attempt = 1; attempt <= 3; attempt++) {
      const pos = await tabPos(name);
      if (!pos) return 'no-tab';
      await clickAt(pos.x, pos.y);
      await sleep(9000);
      const r = await rows();
      const first = (r[1] || '').split('\t')[0] || '';
      if (!verifyRe || verifyRe.test(first)) { await set250(); return 'ok(attempt ' + attempt + ')'; }
      console.error('  [' + name + '] 第' + attempt + '次未生效，首行=' + first.slice(0, 30));
      await sleep(2500);
    }
    return 'FAILED';
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
  const setWindow = async (label) => {
    await ev(`(async () => { const b=[...document.querySelectorAll('button')].find(b=>(b.innerText||'').trim()===${JSON.stringify(label)}); if(b) b.click(); await new Promise(r=>setTimeout(r,7000)); return 1; })()`);
    await sleep(2500);
  };

  await call('Page.enable');
  await call('Page.navigate', { url: 'https://search.google.com/search-console/performance/search-analytics?resource_id=' + RES });
  await sleep(14000);

  console.log('########## 1 · 7 天窗口汇总');
  await setWindow('7 天');
  console.log(await summary());
  console.log('');

  console.log('########## 2 · 逐日（天维度）');
  console.error('switch 天: ' + await switchTab('天', /^\d{4}年\d{1,2}月\d{1,2}日$/));
  console.log((await rows()).join('\n'));
  console.log('');

  console.log('########## 3 · 逐页（网页维度）');
  console.error('switch 网页: ' + await switchTab('网页', /^https?:\/\//));
  console.log((await rows()).join('\n'));
  console.log('');

  console.log('########## 4 · 28 天窗口汇总');
  await setWindow('28 天');
  console.log(await summary());
  console.log('');

  console.log('########## 5 · 3 个月窗口汇总（看长期趋势）');
  await setWindow('3 个月');
  console.log(await summary());

  process.exit(0);
}
main().catch(e => { console.error('ERR', e.message); process.exit(1); });
