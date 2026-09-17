#!/usr/bin/env node
/** GSC 常用区间摘要 + 按日期趋势（真实鼠标事件版）。node scripts/gsc-trend2.mjs */
const PORT = 9222;
const RES = encodeURIComponent('https://zyxstudio.net/');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fs = await import('node:fs');

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
  await call('Runtime.enable');

  await call('Page.navigate', { url: 'https://search.google.com/search-console/performance/search-analytics?resource_id=' + RES });
  await sleep(12000);

  // 真实鼠标点击：返回元素中心坐标，用 Input.dispatchMouseEvent 点
  const realClick = async (selectorExpr) => {
    const box = await ev(`(() => {
      const els = ${selectorExpr};
      if (!els || !els.length) return null;
      const r = els[0].getBoundingClientRect();
      return { x: r.x + r.width/2, y: r.y + r.height/2, w: r.width, txt: (els[0].innerText||'').trim() };
    })()`);
    if (!box) return 'not-found';
    for (const type of ['mousePressed', 'mouseReleased']) {
      await call('Input.dispatchMouseEvent', { type, x: box.x, y: box.y, button: 'left', clickCount: 1 });
      await sleep(120);
    }
    return `clicked@${Math.round(box.x)},${Math.round(box.y)} (${box.txt})`;
  };

  const summary = async () => {
    const t = await ev(`(() => {
      const b = document.body.innerText;
      const i = b.indexOf('上次更新日期');
      return b.slice(i, i + 260).replace(/\\n+/g, ' | ');
    })()`);
    return t;
  };

  const dumpRows = async () => ev(`(() => {
    const rs = [...document.querySelectorAll('table tbody tr')];
    return rs.map(tr => [...tr.querySelectorAll('td')].map(td => (td.innerText||'').trim()).join(' | ')).filter(Boolean);
  })()`);

  for (const range of ['7 天', '28 天', '3 个月']) {
    const r = await realClick(`[...document.querySelectorAll('button,[role=tab],a,div')].filter(e => (e.innerText||'').trim() === ${JSON.stringify(range)} && e.offsetParent)`);
    console.error(`区间 ${range}: ${r}`);
    await sleep(6000);
    console.log(`### 区间 ${range} 汇总`);
    console.log(await summary());
    console.log('');
  }

  // 回到 7 天，取按日期维度
  await realClick(`[...document.querySelectorAll('button,[role=tab],a,div')].filter(e => (e.innerText||'').trim() === '7 天' && e.offsetParent)`);
  await sleep(5000);
  const tabs = await ev(`[...document.querySelectorAll('[role=tab],button,div')].filter(e => e.offsetParent && (e.innerText||'').trim().length <= 6 && (e.innerText||'').trim().length > 1).map(e => (e.innerText||'').trim())`);
  console.log('### 候选小标签:', JSON.stringify([...new Set(tabs)].slice(0, 60)));

  // 试「日期」维度
  for (const name of ['日期', '天']) {
    const r = await realClick(`[...document.querySelectorAll('[role=tab],button,div,span')].filter(e => (e.innerText||'').trim() === ${JSON.stringify(name)} && e.offsetParent)`);
    console.error(`维度 ${name}: ${r}`);
    await sleep(5000);
  }
  const rows = await dumpRows();
  console.log('### 7天 按日期');
  console.log((rows || []).slice(0, 40).join('\n'));

  const shot = await call('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('/tmp/gsc-7d.png', Buffer.from(shot.data, 'base64'));
  console.log('截图: /tmp/gsc-7d.png');
  process.exit(0);
}
main().catch(e => { console.error('ERR', e.message); process.exit(1); });
