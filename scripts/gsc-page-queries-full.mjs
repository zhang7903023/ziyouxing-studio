#!/usr/bin/env node
/**
 * 用「网页」过滤器抓指定页面的 28 天全量查询词（250 行/页，按曝光倒序）
 * 用法: node scripts/gsc-page-queries-full.mjs "articles/xxx.html" ["articles/yyy.html" ...]
 */
const PORT = 9222;
const RES = encodeURIComponent('https://zyxstudio.net/');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const TARGETS = process.argv.slice(2);

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

  /**
   * 按「控件几何特征」点击：只在视口内、尺寸像按钮/选项的元素里挑，
   * 避免命中整页容器 div 或离屏隐藏模板。
   */
  const clickLike = async (text, opt = {}) => {
    const { exact = true, minW = 40, maxW = 900, minH = 18, maxH = 80, minLeft = 0, pick = 'small' } = opt;
    const pos = await ev(`(() => {
      const cands = [];
      [...document.querySelectorAll('button,[role=button],[role=option],[role=menuitem],li,a,span,div')].forEach(e => {
        const r = e.getBoundingClientRect();
        if (r.width < ${minW} || r.width > ${maxW} || r.height < ${minH} || r.height > ${maxH}) return;
        if (r.left < ${minLeft} || r.top < 0 || r.right > innerWidth || r.bottom > innerHeight) return;
        const t = (e.innerText || '').trim();
        const hit = ${exact} ? t === ${JSON.stringify(text)} : t.includes(${JSON.stringify(text)});
        if (!hit) return;
        cands.push({ x: Math.round(r.left + r.width/2), y: Math.round(r.top + r.height/2), a: r.width * r.height, t: t.slice(0,24) });
      });
      if (!cands.length) return null;
      cands.sort((p,q) => ${pick === 'small' ? 'p.a - q.a' : 'q.a - p.a'});
      return cands[0];
    })()`);
    if (!pos) return null;
    await clickAt(pos.x, pos.y);
    return pos;
  };

  /** 在弹出的 [role=menu] 里点某一项（维度选择面板） */
  const clickMenu = async (text) => {
    const pos = await ev(`(() => {
      const menus = [...document.querySelectorAll('[role=menu],[role=listbox]')]
        .filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 20; });
      for (const m of menus) {
        const items = [...m.querySelectorAll('[role=menuitem],li')];
        const t = items.find(e => (e.innerText||'').trim() === ${JSON.stringify(text)});
        if (t) { const r = t.getBoundingClientRect(); return { x: Math.round(r.left+r.width/2), y: Math.round(r.top+r.height/2), t: (t.innerText||'').trim().slice(0,16) }; }
      }
      return null;
    })()`);
    if (!pos) return null;
    await clickAt(pos.x, pos.y);
    return pos;
  };

  const visRows = () => ev(`(() => {
    const t = [...document.querySelectorAll('table')].find(t => t.getBoundingClientRect().width > 0);
    if (!t) return ['NO_VISIBLE_TABLE'];
    return [...t.querySelectorAll('tbody tr')].map(tr => [...tr.querySelectorAll('td')].map(td => (td.innerText||'').trim()).join('\\t')).filter(Boolean);
  })()`);
  const summary = () => ev(`(() => { const b=document.body.innerText; const j=b.indexOf('总点击次数'); return j < 0 ? 'NO_SUMMARY' : b.slice(j, j+120).replace(/\\n+/g,' | '); })()`);
  const set250 = async () => {
    const c = await ev(`(() => {
      const s = [...document.querySelectorAll('[role=combobox]')].filter(e => e.getBoundingClientRect().width > 0);
      if (!s.length) return null;
      const e = s[s.length-1]; e.scrollIntoView({block:'center'});
      const r = e.getBoundingClientRect();
      return { x: Math.round(r.left+r.width/2), y: Math.round(r.top+r.height/2) };
    })()`);
    if (!c) return 'no-combobox';
    await clickAt(c.x, c.y);
    await sleep(2500);
    const o = await ev(`(() => {
      const e = [...document.querySelectorAll('[role=option]')].find(e => (e.textContent||'').trim() === '250');
      if (!e) return null;
      const r = e.getBoundingClientRect();
      return { x: Math.round(r.left+r.width/2), y: Math.round(r.top+r.height/2) };
    })()`);
    if (!o) return 'no-250';
    await clickAt(o.x, o.y);
    await sleep(5000);
    return 'ok';
  };
  const sortBy = async (label) => {
    const pos = await ev(`(() => {
      const t = [...document.querySelectorAll('table')].find(t => t.getBoundingClientRect().width > 0);
      if (!t) return null;
      const th = [...t.querySelectorAll('th,[role=columnheader]')].find(e => (e.innerText||'').trim().startsWith(${JSON.stringify(label)}));
      if (!th) return null;
      const r = th.getBoundingClientRect();
      return { x: Math.round(r.left+r.width/2), y: Math.round(r.top+r.height/2) };
    })()`);
    if (!pos) return 'no-th';
    await clickAt(pos.x, pos.y);
    await sleep(4500);
    return 'ok';
  };

  await call('Page.enable');

  for (const target of TARGETS) {
    try {
      await call('Page.navigate', { url: 'https://search.google.com/search-console/performance/search-analytics?resource_id=' + RES });
      await sleep(13000);
      await ev(`(async () => { const b=[...document.querySelectorAll('button')].find(b=>(b.innerText||'').trim()==='28 天'); if(b) b.click(); await new Promise(r=>setTimeout(r,6000)); return 1; })()`);

      const entry = await clickLike('添加过滤条件', { exact: false, minW: 60, maxW: 400, minH: 24, maxH: 70, minLeft: 400 });
      console.error('### ' + target + ' 入口: ' + JSON.stringify(entry));
      if (!entry) { console.log('===PAGE ' + target + '===\nNO_FILTER_ENTRY'); continue; }
      await sleep(2800);

      const dim = (await clickMenu('网页')) || (await clickLike('网页', { exact: true, minW: 60, maxW: 300, minH: 20, maxH: 80, minLeft: 400 }));
      console.error('  维度网页: ' + JSON.stringify(dim));
      if (!dim) { console.log('===PAGE ' + target + '===\nNO_DIM_OPTION'); continue; }
      await sleep(2200);

      const typed = await ev(`(async () => {
        const inp = [...document.querySelectorAll('input,textarea')].filter(e => e.getBoundingClientRect().width > 0 && e.offsetParent);
        if (!inp.length) return 'no-input';
        const el = inp[inp.length-1];
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(el, ${JSON.stringify(target)});
        el.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise(r => setTimeout(r, 1800));
        return el.value;
      })()`);
      console.error('  输入: ' + JSON.stringify(typed));

      const apply = await clickLike('应用', { exact: true, minW: 40, maxW: 300, minH: 24, maxH: 70, minLeft: 400, pick: 'large' });
      console.error('  应用: ' + JSON.stringify(apply));
      if (apply) await sleep(10000);

      console.error('  set250: ' + await set250());
      let sorted = await sortBy('展示');
      console.error('  按曝光排序: ' + sorted);
      if (sorted !== 'ok') { console.error('  重试排序: ' + await sortBy('展示')); }

      console.log('===PAGE ' + target + '===');
      console.log('SUMMARY: ' + await summary());
      console.log('SORT: ' + sorted);
      console.log(((await visRows()) || []).join('\n'));
    } catch (e) {
      console.log('===PAGE ' + target + '===\nERR ' + e.message);
    }
  }
  process.exit(0);
}
main().catch(e => { console.error('ERR', e.message); process.exit(1); });
