#!/usr/bin/env node
/** 用「网页过滤器」抓取指定页面 28 天查询词 */
const PORT = 9222;
const RES = encodeURIComponent('https://zyxstudio.net/');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const TARGETS = process.argv.slice(2).length ? process.argv.slice(2) : ['remote-checkin.html'];

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
  await call('Page.enable');

  for (const target of TARGETS) {
    try {
      await call('Page.navigate', { url: 'https://search.google.com/search-console/performance/search-analytics?resource_id=' + RES });
      await sleep(13000);
      await ev(`(async () => { const b=[...document.querySelectorAll('button')].find(b=>(b.innerText||'').trim()==='28 天'); if(b) b.click(); await new Promise(r=>setTimeout(r,6000)); return 1; })()`);

      // 1. 找到「网页」新建过滤器入口
      const entry = await ev(`(() => {
        const cands = [...document.querySelectorAll('button,[role=button],div[role=button],a')]
          .filter(e => e.getBoundingClientRect().width > 0 && (e.innerText||'').trim().includes('添加过滤'));
        if (!cands.length) return null;
        const r = cands[0].getBoundingClientRect();
        return { x: Math.round(r.left+r.width/2), y: Math.round(r.top+r.height/2), txt: (cands[0].innerText||'').trim() };
      })()`);
      console.error('### ' + target + ' 过滤器入口: ' + JSON.stringify(entry));
      if (!entry) { console.log('===PAGE ' + target + '===\nNO_FILTER_ENTRY'); continue; }
      await clickAt(entry.x, entry.y);
      await sleep(2500);

      // 2. 面板里选「网页」
      const dim = await ev(`(() => {
        const e = [...document.querySelectorAll('[role=option],[role=menuitem],li,button,div')]
          .filter(e => e.getBoundingClientRect().width > 0 && (e.innerText||'').trim() === '网页');
        if (!e.length) return null;
        const r = e[e.length-1].getBoundingClientRect();
        return { x: Math.round(r.left+r.width/2), y: Math.round(r.top+r.height/2) };
      })()`);
      console.error('  维度「网页」: ' + JSON.stringify(dim));
      if (!dim) { console.log('===PAGE ' + target + '===\nNO_DIM_OPTION'); continue; }
      await clickAt(dim.x, dim.y);
      await sleep(2000);

      // 3. 在输入框输入路径
      const typed = await ev(`(async () => {
        const inp = [...document.querySelectorAll('input,textarea')].filter(e => e.getBoundingClientRect().width > 0 && e.offsetParent);
        if (!inp.length) return 'no-input';
        const el = inp[inp.length-1];
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(el, ${JSON.stringify(target)});
        el.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise(r => setTimeout(r, 1500));
        return el.value;
      })()`);
      console.error('  输入: ' + JSON.stringify(typed));

      // 4. 点「应用」
      const apply = await ev(`(() => {
        const e = [...document.querySelectorAll('button,[role=button],span,div')]
          .filter(e => e.getBoundingClientRect().width > 0 && (e.innerText||'').trim() === '应用');
        if (!e.length) return null;
        const r = e[e.length-1].getBoundingClientRect();
        return { x: Math.round(r.left+r.width/2), y: Math.round(r.top+r.height/2) };
      })()`);
      console.error('  应用按钮: ' + JSON.stringify(apply));
      if (apply) { await clickAt(apply.x, apply.y); await sleep(9000); }

      // 5. 抓查询表
      const rows = await ev(`(() => {
        const t = [...document.querySelectorAll('table')].find(t => t.getBoundingClientRect().width > 0);
        if (!t) return [];
        return [...t.querySelectorAll('tbody tr')].map(tr => [...tr.querySelectorAll('td')].map(td => (td.innerText||'').trim()).join('\\t')).filter(Boolean);
      })()`);
      const sum = await ev(`(() => { const b=document.body.innerText; const j=b.indexOf('总点击次数'); return b.slice(j, j+90).replace(/\\n+/g,' | '); })()`);
      console.log('===PAGE ' + target + '===');
      console.log('SUMMARY: ' + sum);
      console.log((rows || []).join('\n'));

      // 6. 移除过滤器（点过滤器 chip 的 × 或「移除」）
      const rm = await ev(`(() => {
        const e = [...document.querySelectorAll('button,[role=button],[aria-label]')]
          .filter(e => e.getBoundingClientRect().width > 0 && (e.getAttribute('aria-label')||'').includes('移除') === false && (e.innerText||'').trim() === '移除');
        if (!e.length) return null;
        const r = e[e.length-1].getBoundingClientRect();
        return { x: Math.round(r.left+r.width/2), y: Math.round(r.top+r.height/2) };
      })()`);
      if (rm) { await clickAt(rm.x, rm.y); await sleep(5000); }
    } catch (e) {
      console.log('===PAGE ' + target + '===\nERR ' + e.message);
    }
  }
  process.exit(0);
}
main().catch(e => { console.error('ERR', e.message); process.exit(1); });
