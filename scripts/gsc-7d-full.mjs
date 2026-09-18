#!/usr/bin/env node
/** GSC 7天 汇总 + 查询词维度 + 网页维度（可见表）——用于「匹配窗口」对照基线
 *  用法：与启动调试 Chrome 放在同一条 bash 命令内
 *  可选环境变量 WINDOW=7d|28d|3m，默认 7d；按钮文案分别为 '7 天' / '28 天' / '3 个月'
 */
const PORT = 9222;
const RES = encodeURIComponent('https://zyxstudio.net/');
const WINDOW = process.env.WINDOW || '7d';
const LABEL = { '7d': '7 天', '28d': '28 天', '3m': '3 个月' }[WINDOW] || '7 天';
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
    await call('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'none', buttons: 0 });
    await sleep(150);
    await call('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 });
    await sleep(120);
    await call('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1 });
  };
  const visRows = () => ev(`(() => {
    const t = [...document.querySelectorAll('table')].find(t => t.getBoundingClientRect().width > 0);
    if (!t) return ['NO_VISIBLE_TABLE'];
    return [...t.querySelectorAll('tbody tr')].map(tr => [...tr.querySelectorAll('td')].map(td => (td.innerText||'').trim()).join('\\t')).filter(Boolean);
  })()`);
  const pageInfo = () => ev(`(() => {
    const t = document.body.innerText;
    const m = t.match(/第\\s*[\\d,\\s-]+\\s*行[，,]\\s*共\\s*[\\d,]+\\s*行/);
    return m ? m[0] : 'NO_PAGER';
  })()`);
  const switchDim = async (name) => {
    const pos = await ev(`(() => {
      const l = [...document.querySelectorAll('[role=tablist]')].find(l => l.getBoundingClientRect().width > 0);
      if (!l) return null;
      const t = [...l.querySelectorAll('[role=tab]')].find(t => (t.innerText||'').trim() === ${JSON.stringify(name)});
      if (!t) return null;
      t.scrollIntoView({block:'center'});
      const r = t.getBoundingClientRect();
      return { x: Math.round(r.left+r.width/2), y: Math.round(r.top+r.height/2) };
    })()`);
    if (!pos) return 'no-tab';
    await clickAt(pos.x, pos.y);
    await sleep(9000);
    return 'ok';
  };
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

  await call('Page.enable');
  await call('Page.navigate', { url: 'https://search.google.com/search-console/performance/search-analytics?resource_id=' + RES });
  await sleep(14000);
  // 切窗口
  await ev(`(async () => { const b=[...document.querySelectorAll('button')].find(b=>(b.innerText||'').trim()===${JSON.stringify(LABEL)}); if(b) b.click(); await new Promise(r=>setTimeout(r,7000)); return 1; })()`);
  const summary = await ev(`(() => { const b=document.body.innerText; const j=b.indexOf('总点击次数'); return b.slice(j, j+200).replace(/\\n+/g,' | '); })()`);
  const curRange = await ev(`(() => { const b=document.body.innerText; const m=b.match(/[A-Z][a-z]{2}\\s+\\d{1,2}[^\\n]{0,30}/); return m?m[0]:''; })()`);
  console.log('### WINDOW_REQ: ' + LABEL);
  console.log('### SUMMARY: ' + summary);
  console.log('### RANGE_HINT: ' + curRange);

  // 查询数维度（初始即为查询数，不要先点切换）
  console.error('set250(queries):', await set250());
  console.log('### QUERIES_PAGER: ' + (await pageInfo()));
  console.log('===QUERIES===');
  console.log(((await visRows()) || []).join('\n'));

  // 网页维度 + 250
  console.error('switch 网页:', await switchDim('网页'));
  console.error('set250:', await set250());
  console.log('### PAGES_PAGER: ' + (await pageInfo()));
  console.log('===PAGES===');
  console.log(((await visRows()) || []).join('\n'));

  process.exit(0);
}
main().catch(e => { console.error('ERR', e.message); process.exit(1); });
