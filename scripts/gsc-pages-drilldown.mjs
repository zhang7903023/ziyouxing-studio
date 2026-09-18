#!/usr/bin/env node
/** 逐页抓取指定页面在 GSC 28 天的查询词（每页独立导航，避免状态串扰） */
const PORT = 9222;
const RES = encodeURIComponent('https://zyxstudio.net/');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const TARGETS = process.argv.slice(2).length ? process.argv.slice(2) : [
  'remote-checkin.html', 'dingtalk-virtual-location.html', 'dingtalk-wifi-gps-checkin.html',
  'checkin-out-of-range-guide.html', 'checkin-out-of-range-guide-tw.html',
  'workwechat-location-guide.html', 'feishu-dingtalk-guide.html', 'overseas-dingtalk.html'
];

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

  const visRows = () => ev(`(() => {
    const t = [...document.querySelectorAll('table')].find(t => t.getBoundingClientRect().width > 0);
    if (!t) return [];
    return [...t.querySelectorAll('tbody tr')].map(tr => [...tr.querySelectorAll('td')].map(td => (td.innerText||'').trim()).join('\\t')).filter(Boolean);
  })()`);

  for (const target of TARGETS) {
    try {
      await call('Page.navigate', { url: 'https://search.google.com/search-console/performance/search-analytics?resource_id=' + RES });
      await sleep(13000);
      await ev(`(async () => { const b=[...document.querySelectorAll('button')].find(b=>(b.innerText||'').trim()==='28 天'); if(b) b.click(); await new Promise(r=>setTimeout(r,6000)); return 1; })()`);

      const pos = await ev(`(() => {
        const l = [...document.querySelectorAll('[role=tablist]')].find(l => l.getBoundingClientRect().width > 0);
        if (!l) return null;
        const t = [...l.querySelectorAll('[role=tab]')].find(t => (t.innerText||'').trim() === '网页');
        if (!t) return null;
        t.scrollIntoView({block:'center'}); const r = t.getBoundingClientRect();
        return { x: Math.round(r.left+r.width/2), y: Math.round(r.top+r.height/2) };
      })()`);
      if (!pos) { console.log('===PAGE ' + target + '===\nNO_TAB'); continue; }
      await clickAt(pos.x, pos.y);
      await sleep(8000);
      // 校验是否切到网页维度；未成功则重试点击
      for (let v = 0; v < 4; v++) {
        const probe = await ev(`(() => { const t=[...document.querySelectorAll('table')].find(t=>t.getBoundingClientRect().width>0); return t ? (t.querySelector('tbody tr')||{innerText:''}).innerText.slice(0,60) : 'no-table'; })()`);
        if (/http|zyxstudio/.test(probe)) break;
        console.error('  维度未切换，重试 ' + (v + 1) + '，当前首行: ' + probe);
        await clickAt(pos.x, pos.y);
        await sleep(8000);
      }
      await sleep(3000);

      // 每页行数 → 250，让所有页面行都渲染
      const c = await ev(`(() => {
        const s = [...document.querySelectorAll('[role=combobox]')].filter(e => e.getBoundingClientRect().width > 0);
        if (!s.length) return null;
        const e = s[s.length-1]; e.scrollIntoView({block:'center'});
        const r = e.getBoundingClientRect();
        return { x: Math.round(r.left+r.width/2), y: Math.round(r.top+r.height/2) };
      })()`);
      if (c) {
        await clickAt(c.x, c.y);
        await sleep(2500);
        const o = await ev(`(() => {
          const e = [...document.querySelectorAll('[role=option]')].find(e => (e.textContent||'').trim() === '250');
          if (!e) return null;
          const r = e.getBoundingClientRect();
          return { x: Math.round(r.left+r.width/2), y: Math.round(r.top+r.height/2) };
        })()`);
        if (o) { await clickAt(o.x, o.y); await sleep(5000); }
      }
      await sleep(2000);

      let rp = null;
      for (let tries = 0; tries < 8 && !rp; tries++) {
        rp = await ev(`(async () => {
          const t = [...document.querySelectorAll('table')].find(t => t.getBoundingClientRect().width > 0);
          if (!t) return null;
          const tr = [...t.querySelectorAll('tbody tr')].find(r => (r.innerText||'').includes(${JSON.stringify(target)}));
          if (!tr) return 'NO_ROW';
          tr.scrollIntoView({block:'center'});
          await new Promise(r => setTimeout(r, 1200));
          const rc = tr.getBoundingClientRect();
          if (rc.width === 0) return 'ZERO_RECT';
          return { x: Math.round(rc.left + Math.min(rc.width/2, 220)), y: Math.round(rc.top + rc.height/2) };
        })()`);
        if (rp === 'ZERO_RECT') { await sleep(2500); rp = null; continue; }
        if (rp === 'NO_ROW') { await sleep(3000); rp = null; if (tries > 4) break; continue; }
      }
      console.error('### ' + target + ' row: ' + JSON.stringify(rp));
      if (!rp || rp === 'NO_ROW') {
        console.log('===PAGE ' + target + '===\nNO_DATA(28天内无曝光或不在前52行)');
        continue;
      }
      await clickAt(rp.x, rp.y);
      await sleep(9000);
      const rows = await visRows();
      console.log('===PAGE ' + target + '===');
      console.log((rows || []).join('\n'));
    } catch (e) {
      console.log('===PAGE ' + target + '===\nERR ' + e.message);
    }
  }
  process.exit(0);
}
main().catch(e => { console.error('ERR', e.message); process.exit(1); });
