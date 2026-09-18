#!/usr/bin/env node
/** GSC 「网页」编制索引报告 + 站点地图状态（只读）
 *  用法: node scripts/gsc-index-report.mjs
 *  输出：未编入索引 / 已编入索引 计数、各原因行与示例 URL、sitemap 读取状态
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
  const urlsInBody = () => ev(`(() => {
    const t = document.body.innerText || '';
    const m = t.match(/https:\\/\\/zyxstudio\\.net\\/[^\\s|,）)"]+/g) || [];
    return [...new Set(m)].filter(u => !u.includes('…'));
  })()`);
  const set250 = async () => {
    const c = await ev(`(() => { const s=[...document.querySelectorAll('[role=combobox]')].filter(e=>e.getBoundingClientRect().width>0); if(!s.length) return null; const e=s[s.length-1]; e.scrollIntoView({block:'center'}); const r=e.getBoundingClientRect(); return {x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2)}; })()`);
    if (!c) return 'no-combobox';
    await clickAt(c.x, c.y); await sleep(2200);
    const o = await ev(`(() => { const e=[...document.querySelectorAll('[role=option]')].find(e=>(e.textContent||'').trim()==='250'); if(!e) return null; const r=e.getBoundingClientRect(); return {x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2)}; })()`);
    if (!o) return 'no-250';
    await clickAt(o.x, o.y); await sleep(5000);
    return 'ok';
  };

  await call('Page.enable');

  // ===== A. 网页编制索引报告 =====
  console.log('===== A. 网页编制索引报告 =====');
  await call('Page.navigate', { url: 'https://search.google.com/search-console/index?resource_id=' + RES });
  await sleep(15000);
  console.error('set250: ' + await set250());
  const head = await ev(`(() => { const b = document.body.innerText; const i = b.indexOf('网页索引编制'); return b.slice(i, i + 900).replace(/\\n+/g, ' | '); })()`);
  console.log('概览: ' + head);

  const reasons = await ev(`(() => {
    const t = document.body.innerText;
    const out = [];
    for (const r of ['备用网页（有适当的规范标记）','备用网页','已发现 - 尚未编入索引','已抓取 - 尚未编入索引','已发现，尚未编入索引','重复网页，Google 选择的规范网页与用户声明的不同','已排除','找不到 (404)','Soft 404','已通过“noindex”标记排除']) {
      const i = t.indexOf(r);
      if (i >= 0) out.push(r + ' >> ' + t.slice(i, i + 90).replace(/\\n+/g, ' '));
    }
    return out;
  })()`);
  console.log('原因行:');
  (reasons || []).forEach(r => console.log('  ' + r));

  for (const label of ['备用网页（有适当的规范标记）', '已发现 - 尚未编入索引', '已抓取 - 尚未编入索引']) {
    const pos = await ev(`(() => {
      const cands = [];
      [...document.querySelectorAll('tr,[role=row],div,a')].forEach(e => {
        const r = e.getBoundingClientRect();
        if (r.width < 200 || r.height < 18 || r.height > 80 || r.top < 0 || r.bottom > innerHeight) return;
        const t = (e.innerText || '').trim();
        if (!t.includes(${JSON.stringify(label)})) return;
        cands.push({ x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), a: r.width * r.height });
      });
      cands.sort((p, q) => p.a - q.a);
      return cands[0] || null;
    })()`);
    if (!pos) { console.log('  [' + label + '] 行不可见，跳过'); continue; }
    await clickAt(pos.x, pos.y); await sleep(7000);
    const us = await urlsInBody();
    console.log('  [' + label + '] 示例 URL (' + (us || []).length + '):');
    (us || []).forEach(u => console.log('     ' + u));
    const frag = await ev(`document.body.innerText.replace(/\\n+/g,' | ').slice(0,500)`);
    console.log('     片段: ' + frag);
    await call('Page.navigate', { url: 'https://search.google.com/search-console/index?resource_id=' + RES });
    await sleep(12000);
  }

  // ===== B. 站点地图 =====
  console.log('');
  console.log('===== B. 站点地图状态 =====');
  await call('Page.navigate', { url: 'https://search.google.com/search-console/sitemaps?resource_id=' + RES });
  await sleep(13000);
  const sm = await ev(`(() => { const b = document.body.innerText; const i = b.indexOf('站点地图'); return b.slice(i, i + 1200).replace(/\\n+/g, ' | '); })()`);
  console.log(sm);
  process.exit(0);
}
main().catch(e => { console.error('ERR', e.message); process.exit(1); });
