#!/usr/bin/env node
/** 实搜 Google SERP 快照：AI 概览是否存在 + 自然结果列表 + 本站位次 + 是否被改写 Title
 *  用法：与启动调试 Chrome 同一条 bash 命令内；QUERIES 用 | 分隔
 */
const PORT = 9222;
const QUERIES = (process.env.QUERIES ||
  '小红书聚光怎么开通|小红书开户|小红书蓝v认证海外').split('|');
const HL = process.env.HL || 'zh-CN';
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

  await call('Page.enable');
  for (const q of QUERIES) {
    const url = `https://www.google.com/search?q=${encodeURIComponent(q)}&hl=${HL}&gl=us&pws=0&num=20`;
    await call('Page.navigate', { url });
    await sleep(9000);
    const out = await ev(`(() => {
      const txt = document.body.innerText || '';
      const hasAIO = /AI 概览|AI Overview|AI\\s*概览/.test(txt);
      const aioIx = txt.search(/AI 概览|AI Overview/);
      // 自然结果
      const seen = new Set(); const items = [];
      [...document.querySelectorAll('div#search a h3, div#rso a h3')].forEach(h => {
        const a = h.closest('a'); if (!a) return;
        const href = a.href || '';
        if (!/^https?:/.test(href)) return;
        if (seen.has(href)) return; seen.add(href);
        let host = ''; try { host = new URL(href).hostname; } catch (e) {}
        items.push({ t: (h.innerText||'').trim(), href, host });
      });
      const ours = items.findIndex(i => i.host.endsWith('zyxstudio.net'));
      // 顶部是否有广告 / 购物 / 视频模块
      const flags = {
        ad: /赞助|广告|Sponsored/i.test(txt.slice(0, 2500)),
        video: /视频|Videos/i.test(txt.slice(0, 3500)),
        paa: /其他人还搜了|People also ask/i.test(txt),
        shopping: /购物|Shopping/i.test(txt.slice(0, 4000)),
        discuss: /论坛|Discussions and forums/i.test(txt),
        aiSnippetTop: aioIx >= 0 && aioIx < 1200
      };
      const titles = [...document.querySelectorAll('h1,h2,h3')].slice(0,6).map(e=>(e.innerText||'').trim()).filter(Boolean);
      return { hasAIO, aioPos: aioIx, flags, m: { host: location.hostname }, titles, total: items.length, ours, itemsTop: items.slice(0, 14) };
    })()`);
    console.log('===== QUERY: ' + q);
    console.log(JSON.stringify(out, null, 1));
    console.log('');
  }
  process.exit(0);
}
main().catch(e => { console.error('ERR', e.message); process.exit(1); });
