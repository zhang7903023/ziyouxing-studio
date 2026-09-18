#!/usr/bin/env node
/**
 * 按「查询词包含 X」过滤 + 网页维度，看该查询词族落在哪些 URL 上（用于归因页面曝光来源）
 * 用法: node scripts/gsc-queryfamily-pages.mjs 聚光 小红书 水印
 */
const PORT = 9222;
const RES = encodeURIComponent('https://zyxstudio.net/');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const TERMS = process.argv.slice(2);

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
    await call('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'none', buttons: 0 });
    await sleep(150);
    await call('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 });
    await sleep(120);
    await call('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1 });
  };
  const clickLike = async (text, opt = {}) => {
    const { exact = true, minW = 40, maxW = 900, minH = 18, maxH = 90, minLeft = 0, pick = 'small' } = opt;
    const pos = await ev(`(() => {
      const cands = [];
      [...document.querySelectorAll('button,[role=button],[role=option],[role=menuitem],li,a,span,div')].forEach(e => {
        const r = e.getBoundingClientRect();
        if (r.width < ${minW} || r.width > ${maxW} || r.height < ${minH} || r.height > ${maxH}) return;
        if (r.left < ${minLeft} || r.top < 0 || r.right > innerWidth || r.bottom > innerHeight) return;
        const t = (e.innerText || '').trim();
        const hit = ${exact} ? t === ${JSON.stringify(text)} : t.includes(${JSON.stringify(text)});
        if (!hit) return;
        cands.push({ x: Math.round(r.left + r.width/2), y: Math.round(r.top + r.height/2), a: r.width * r.height, t: t.slice(0,20) });
      });
      if (!cands.length) return null;
      cands.sort((p,q) => ${pick === 'small' ? 'p.a - q.a' : 'q.a - p.a'});
      return cands[0];
    })()`);
    if (!pos) return null;
    await clickAt(pos.x, pos.y);
    return pos;
  };
  const clickMenu = async (text) => {
    const pos = await ev(`(() => {
      const menus = [...document.querySelectorAll('[role=menu],[role=listbox]')].filter(e => { const r=e.getBoundingClientRect(); return r.width>0&&r.height>20; });
      for (const m of menus) { const t=[...m.querySelectorAll('[role=menuitem],li')].find(e=>(e.innerText||'').trim()===${JSON.stringify(text)}); if(t){const r=t.getBoundingClientRect();return {x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),t:(t.innerText||'').trim()};} }
      return null;
    })()`);
    if (!pos) return null; await clickAt(pos.x, pos.y); return pos;
  };
  const switchDim = async (name) => {
    const pos = await ev(`(() => {
      const l = [...document.querySelectorAll('[role=tablist]')].find(l => l.getBoundingClientRect().width > 0);
      if (!l) return null;
      const t = [...l.querySelectorAll('[role=tab]')].find(t => (t.innerText||'').trim() === ${JSON.stringify(name)});
      if (!t) return null;
      const r = t.getBoundingClientRect();
      return { x: Math.round(r.left+r.width/2), y: Math.round(r.top+r.height/2) };
    })()`);
    if (!pos) return 'no-tab';
    await clickAt(pos.x, pos.y);
    await sleep(9000);
    return 'ok';
  };
  const set250 = async () => {
    const c = await ev(`(() => { const s=[...document.querySelectorAll('[role=combobox]')].filter(e=>e.getBoundingClientRect().width>0); if(!s.length) return null; const e=s[s.length-1]; e.scrollIntoView({block:'center'}); const r=e.getBoundingClientRect(); return {x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2)}; })()`);
    if (!c) return 'no-combobox';
    await clickAt(c.x, c.y); await sleep(2500);
    const o = await ev(`(() => { const e=[...document.querySelectorAll('[role=option]')].find(e=>(e.textContent||'').trim()==='250'); if(!e) return null; const r=e.getBoundingClientRect(); return {x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2)}; })()`);
    if (!o) return 'no-250';
    await clickAt(o.x, o.y); await sleep(5000);
    return 'ok';
  };
  const visRows = () => ev(`(() => {
    const t = [...document.querySelectorAll('table')].find(t => t.getBoundingClientRect().width > 0);
    if (!t) return ['NO_VISIBLE_TABLE'];
    const rows = [...t.querySelectorAll('tbody tr')].map(tr => [...tr.querySelectorAll('td')].map(td => (td.innerText||'').trim()).join('\\t')).filter(Boolean);
    let pager = '';
    let p = t.parentElement;
    for (let i=0;i<6 && p;i++,p=p.parentElement) { const m=(p.innerText||'').match(/第 [\\d,\\-]+ 行/); if(m){ pager=m[0]; break; } }
    return [...rows, 'PAGER: ' + pager];
  })()`);
  const summary = () => ev(`(() => { const b=document.body.innerText; const j=b.indexOf('总点击次数'); return j<0?'NO_SUMMARY':b.slice(j,j+110).replace(/\\n+/g,' | '); })()`);

  await call('Page.enable');

  for (const term of TERMS) {
    try {
      await call('Page.navigate', { url: 'https://search.google.com/search-console/performance/search-analytics?resource_id=' + RES });
      await sleep(13000);
      await ev(`(async () => { const b=[...document.querySelectorAll('button')].find(b=>(b.innerText||'').trim()==='28 天'); if(b) b.click(); await new Promise(r=>setTimeout(r,6000)); return 1; })()`);

      const entry = await clickLike('添加过滤条件', { exact: false, minW: 60, maxW: 400, minH: 24, maxH: 70, minLeft: 400 });
      console.error('### ' + term + ' 入口: ' + JSON.stringify(entry));
      if (!entry) { console.log('===TERM ' + term + '===\nNO_FILTER_ENTRY'); continue; }
      await sleep(2800);

      const dim = (await clickMenu('查询数')) || (await clickMenu('查询')) || (await clickMenu('查询词'));
      console.error('  维度查询数: ' + JSON.stringify(dim));
      if (!dim) { console.log('===TERM ' + term + '===\nNO_DIM'); continue; }
      await sleep(2200);

      const typed = await ev(`(async () => {
        const inp=[...document.querySelectorAll('input,textarea')].filter(e=>e.getBoundingClientRect().width>0&&e.offsetParent);
        if(!inp.length) return 'no-input';
        const el=inp[inp.length-1];
        Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set.call(el, ${JSON.stringify(term)});
        el.dispatchEvent(new Event('input',{bubbles:true}));
        await new Promise(r=>setTimeout(r,1600)); return el.value; })()`);
      console.error('  输入: ' + JSON.stringify(typed));

      const apply = await clickLike('应用', { exact: true, minW: 40, maxW: 300, minH: 24, maxH: 70, minLeft: 400, pick: 'large' });
      console.error('  应用: ' + JSON.stringify(apply));
      if (apply) await sleep(10000);

      console.error('  切网页维度: ' + await switchDim('网页'));
      console.error('  set250: ' + await set250());

      console.log('===TERM ' + term + '===');
      console.log('SUMMARY: ' + await summary());
      console.log(((await visRows()) || []).join('\n'));
    } catch (e) {
      console.log('===TERM ' + term + '===\nERR ' + e.message);
    }
  }
  process.exit(0);
}
main().catch(e => { console.error('ERR', e.message); process.exit(1); });
