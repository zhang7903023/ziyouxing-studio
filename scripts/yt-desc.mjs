#!/usr/bin/env node
/** YouTube Studio 批量给视频简介追加 zyxstudio.net 链接。用法: node scripts/yt-desc.mjs <videoId>... */
const PORT = 9222;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const APPEND = '\n\n🔗 工具站（虚拟定位/双开/打卡定位服务）：https://zyxstudio.net';

async function connect() {
  const list = await fetch(`http://127.0.0.1:${PORT}/json/list`).then(r => r.json());
  const page = list.find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let id = 0; const pending = new Map();
  ws.onmessage = e => { const d = JSON.parse(e.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d.result); pending.delete(d.id); } };
  const call = (m, p) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
  const ev = async expr => (await call('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result?.value;
  await call('Page.enable');
  return { ev };
}

async function processVideo(ev, vid) {
  await ev(`location.href = 'https://studio.youtube.com/video/${vid}/edit'`);
  let loaded = false;
  for (let i = 0; i < 20; i++) { await sleep(3000); if (await ev(`document.querySelectorAll('#textbox').length > 1`)) { loaded = true; break; } }
  if (!loaded) return `${vid} FAIL: 编辑器未加载`;

  // 简介框 = 较长的那个 #textbox
  const state = await ev(`(() => {
    const tbs = [...document.querySelectorAll('#textbox')];
    const desc = tbs.reduce((a,b) => b.innerText.length > a.innerText.length ? b : a);
    return { len: desc.innerText.length, hasNew: desc.innerText.includes('zyxstudio.net'), hasContact: /yes1974g/.test(desc.innerText) };
  })()`);
  if (state.hasNew) return `${vid} SKIP: 已有 zyxstudio.net`;
  const contactNote = state.hasContact ? '' : ' (原简介无联系方式,已补链接)';

  const appendRes = await ev(`(() => {
    const tbs = [...document.querySelectorAll('#textbox')];
    const tb = tbs.reduce((a,b) => b.innerText.length > a.innerText.length ? b : a);
    tb.focus();
    const sel = window.getSelection(); const range = document.createRange();
    range.selectNodeContents(tb); range.collapse(false);
    sel.removeAllRanges(); sel.addRange(range);
    document.execCommand('insertText', false, ${JSON.stringify(APPEND)});
    return 'appended→' + tb.innerText.length;
  })()`);

  await sleep(1500);
  const saveRes = await ev(`(() => {
    const btn = document.querySelector('ytcp-button#save') || document.querySelector('#save-button');
    if (!btn) return 'no-save-btn';
    if (btn.disabled || btn.hasAttribute('disabled')) return 'save-disabled';
    btn.click();
    return 'clicked';
  })()`);
  let saved = false;
  for (let i = 0; i < 15; i++) {
    await sleep(2000);
    const st = await ev(`(() => {
      const btn = document.querySelector('ytcp-button#save') || document.querySelector('#save-button');
      if (document.body.innerText.includes('已保存')) return 'ok';
      if (btn && (btn.disabled || btn.hasAttribute('disabled'))) return 'ok';
      return '';
    })()`);
    if (st) { saved = true; break; }
  }
  return `${vid}${contactNote} ${appendRes} | 保存:${saveRes}${saved ? '✓' : '(未确认)'}`;
}

async function main() {
  const vids = process.argv.slice(2);
  const { ev } = await connect();
  for (const vid of vids) {
    try { console.log(await processVideo(ev, vid)); }
    catch (e) { console.log(`${vid} ERROR: ${e.message}`); }
    await sleep(2500);
  }
}
main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
