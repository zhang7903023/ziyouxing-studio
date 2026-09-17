#!/usr/bin/env node
/** 探测 GSC 区间按钮真实元素与点击路径 */
const PORT = 9222;
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function main() {
  const list = await fetch(`http://127.0.0.1:${PORT}/json/list`).then(r => r.json());
  let page = list.find(t => t.type === 'page' && t.url.includes('search-console')) || list.find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let id = 0; const pending = new Map();
  ws.onmessage = e => { const d = JSON.parse(e.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d.result); pending.delete(d.id); } };
  const call = (m, p) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
  const ev = async expr => (await call('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result?.value;

  const info = await ev(`(() => {
    const out = [];
    for (const label of ['7 天','3 个月']) {
      const els = [...document.querySelectorAll('*')].filter(e => (e.innerText||'').trim() === label && e.offsetParent && e.children.length === 0);
      for (const e of els) {
        const r = e.getBoundingClientRect();
        const cx = r.x + r.width/2, cy = r.y + r.height/2;
        const at = document.elementFromPoint(cx, cy);
        const chain = [];
        let n = e; for (let i=0;i<5&&n;i++){ const role = n.getAttribute ? (n.getAttribute('role')||'') : ''; const cls = (n.className && typeof n.className==='string') ? n.className.split(' ').slice(0,2).join('.') : ''; chain.push(n.tagName + (role?('['+role+']'):'') + (cls?('.'+cls):'')); n = n.parentElement; }
        out.push({ label, tag: e.tagName, rect: {x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)}, center:[Math.round(cx),Math.round(cy)], elementFromPoint: at ? at.tagName + '.' + String(at.className).split(' ').slice(0,2).join('.') : 'null', atIsSelf: at === e || e.contains(at), chain, aria: e.getAttribute('aria-pressed'), selected: e.getAttribute('aria-checked') });
      }
    }
    const dpr = window.devicePixelRatio; const vw = window.innerWidth, vh = window.innerHeight;
    return { dpr, vw, vh, out };
  })()`);
  console.log(JSON.stringify(info, null, 1));
  process.exit(0);
}
main().catch(e => { console.error('ERR', e.message); process.exit(1); });
