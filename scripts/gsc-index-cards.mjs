#!/usr/bin/env node
/**
 * 读 GSC「网页编制索引」报告顶部两张卡片（已编入索引 / 未编入索引）的计数。
 * 用法：与启动调试 Chrome 同一条 bash 命令内运行，无需参数。
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

  await call('Page.enable');
  await call('Page.navigate', { url: 'https://search.google.com/search-console/index?resource_id=' + RES });
  await sleep(16000);

  const out = await ev(`(() => {
    const b = document.body.innerText || '';
    const lines = b.split('\\n').map(s => s.trim()).filter(Boolean);
    const res = {};
    // 卡片形态：「已编入索引」下一行是数字
    for (let i = 0; i < lines.length; i++) {
      if (lines[i] === '已编入索引') { for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) { if (/^[\\d,]+$/.test(lines[j])) { res.indexed = lines[j]; break; } } }
      if (lines[i] === '未编入索引') { for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) { if (/^[\\d,]+$/.test(lines[j])) { res.notIndexed = lines[j]; break; } } }
    }
    return JSON.stringify({ res, head: lines.slice(0, 40) }, null, 1);
  })()`);
  console.log(out);
  process.exit(0);
}
main().catch(e => { console.error('ERR', e.message); process.exit(1); });
