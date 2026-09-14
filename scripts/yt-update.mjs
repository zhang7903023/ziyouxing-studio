#!/usr/bin/env node
/** YouTube Studio 批量更新视频简介(追加推广块)+标签。用法: node scripts/yt-update.mjs <videoId> [videoId...] */
const PORT = 9222;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const APPEND = '\n\n工具与方案咨询：微信 yes1974g\n图文教程：https://zyxstudio.net\n更多虚拟定位/双开/打卡定位实测视频，欢迎订阅本频道。';
// 视频 → 标签映射
const TAGS = {
  '9drq4FmpuCM': ['双开','微信双开','微信多开','微信分身','iOS双开','雙開'],
};

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
  return { call, ev };
}

async function processVideo(ev, vid) {
  // 1) 打开编辑页
  await ev(`location.href = 'https://studio.youtube.com/video/${vid}/edit'`);
  // 2) 等简介编辑框出现
  let ok = false;
  for (let i = 0; i < 20; i++) {
    await sleep(2000);
    ok = await ev(`!!document.querySelector('#description #textbox, #textbox[contenteditable="true"], ytcp-video-metadata-editor #textbox')`);
    if (ok) break;
  }
  if (!ok) return `${vid} FAIL: 编辑框未加载`;
  await sleep(2000);

  // 3) 读取已有简介，已含则跳过简介追加
  const descState = await ev(`(() => {
    const tb = document.querySelector('#description #textbox') || document.querySelector('#textbox[contenteditable="true"]');
    if (!tb) return { found: false };
    return { found: true, hasPromo: /yes1974g|zyxstudio\\.net/.test(tb.innerText), len: tb.innerText.length };
  })()`);
  if (!descState || !descState.found) return `${vid} FAIL: 简介框不可读`;

  let descResult = '简介已含推广(跳过)';
  if (!descState.hasPromo) {
    descResult = await ev(`(() => {
      const tb = document.querySelector('#description #textbox') || document.querySelector('#textbox[contenteditable="true"]');
      tb.focus();
      const sel = window.getSelection(); const range = document.createRange();
      range.selectNodeContents(tb); range.collapse(false);
      sel.removeAllRanges(); sel.addRange(range);
      document.execCommand('insertText', false, ${JSON.stringify(APPEND)});
      return 'appended, newLen=' + tb.innerText.length;
    })()`);
  }

  // 4) 追加标签（读现有 chips，只加缺的）
  const want = TAGS[vid] || ['虚拟定位','改定位','虚拟定位教程'];
  const tagResult = await ev(`(() => {
    const host = document.querySelector('ytcp-form-tags-input');
    if (!host) return 'no-tags-input';
    const existing = [...host.querySelectorAll('ytcp-chip,tcp-chip')].map(c => c.getAttribute('aria-label') || c.textContent.trim().toLowerCase());
    const input = host.querySelector('input');
    if (!input) return 'no-inner-input';
    window.__ytAdded = [];
    const toAdd = ${JSON.stringify(want)}.filter(t => !existing.some(e => (e||'').toLowerCase().includes(t.toLowerCase())));
    if (!toAdd.length) return 'tags-already-ok';
    return new Promise(resolve => {
      let i = 0;
      const addNext = () => {
        if (i >= toAdd.length) { resolve('added=' + window.__ytAdded.join('|')); return; }
        const t = toAdd[i++];
        const inp = document.querySelector('ytcp-form-tags-input input');
        inp.focus();
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(inp, t);
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        setTimeout(() => {
          inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
          inp.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
          window.__ytAdded.push(t);
          setTimeout(addNext, 600);
        }, 400);
      };
      addNext();
    });
  })()`);

  // 5) 保存
  await sleep(1000);
  const saveResult = await ev(`(() => {
    const btn = document.querySelector('ytcp-video-metadata-save-button #save-button') || document.querySelector('#save-button');
    if (!btn) return 'no-save-btn';
    if (btn.disabled || btn.getAttribute('disabled') != null) return 'save-disabled(无改动?)';
    btn.click();
    return 'clicked';
  })()`);
  // 等保存完成（按钮回到 disabled 或 toast 出现）
  let saved = false;
  for (let i = 0; i < 15; i++) {
    await sleep(2000);
    const st = await ev(`(() => {
      const btn = document.querySelector('ytcp-video-metadata-save-button #save-button') || document.querySelector('#save-button');
      const t = document.body.innerText;
      if (t.includes('已保存') || t.includes('Saved')) return 'saved';
      if (btn && (btn.disabled || btn.getAttribute('disabled') != null)) return 'saved';
      return '';
    })()`);
    if (st) { saved = true; break; }
  }
  return `${vid} => 简介:${descResult} | 标签:${tagResult} | 保存:${saveResult}${saved ? '(确认)' : '(未确认,需复查)'}`;
}

async function main() {
  const vids = process.argv.slice(2);
  if (!vids.length) { console.error('usage: yt-update.mjs <videoId>...'); process.exit(1); }
  const { ev } = await connect();
  // 登录检查
  await sleep(3000);
  const who = await ev(`document.body.innerText.slice(0, 200)`);
  if (!who || who.includes('登入') || who.includes('Sign in')) { console.log('未登录 YouTube Studio:', who); process.exit(2); }
  for (const vid of vids) {
    try { console.log(await processVideo(ev, vid)); }
    catch (e) { console.log(`${vid} ERROR: ${e.message}`); }
    await sleep(2000);
  }
}
main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
