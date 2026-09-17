#!/usr/bin/env node
/**
 * GSC 网址检查·严谨版：逐个报告真实收录判定，并对未收录页执行完整「请求编入索引」流程。
 * 用法: node scripts/gsc-submit-strict.mjs <url>...
 * 每个URL输出: [判定] + [提交结果] + 截图路径
 */
import fs from 'fs';
const PORT = 9222;
const RES = encodeURIComponent('https://zyxstudio.net/');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const stamp = () => new Date().toTimeString().slice(0, 8);

async function main() {
  const urls = process.argv.slice(2);
  if (!urls.length) { console.error('用法: node gsc-submit-strict.mjs <url>...'); process.exit(1); }

  const list = await fetch(`http://127.0.0.1:${PORT}/json/list`).then(r => r.json());
  let page = list.find(t => t.type === 'page' && t.url.includes('search-console')) || list.find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let id = 0; const pending = new Map();
  ws.onmessage = e => { const d = JSON.parse(e.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d.result); pending.delete(d.id); } };
  const call = (m, p) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
  const ev = async expr => (await call('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result?.value;
  await call('Page.enable');

  for (const u of urls) {
    const slug = u.split('/').pop().replace('.html', '');
    const png = `/tmp/gsc-strict-${slug}.png`;
    console.log(`\n════════ [${stamp()}] ${u}`);

    // 1) 打开概览并输入网址
    await call('Page.navigate', { url: 'https://search.google.com/search-console?resource_id=' + RES });
    await sleep(6500);
    const filled = await ev(`(() => {
      const i = [...document.querySelectorAll('input')].find(x => (x.getAttribute('aria-label')||'').includes('检查'));
      if (!i) return 'no-input';
      const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      s.call(i, ${JSON.stringify(u)});
      i.dispatchEvent(new Event('input', { bubbles: true }));
      i.focus();
      i.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }));
      i.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', keyCode: 13, bubbles: true }));
      return 'ok';
    })()`);
    if (filled !== 'ok') { console.log('  ✗ 输入框未找到，跳过'); continue; }

    // 2) 等真实判定（只认这两个精确句子）
    let verdict = '';
    for (let i = 0; i < 30; i++) {
      await sleep(2500);
      verdict = await ev(`(() => {
        const t = document.body.innerText;
        if (t.includes('网址已收录到 Google')) return '已收录';
        if (t.includes('网址尚未收录到 Google')) return '未收录';
        if (t.includes('网址不是 Google') ) return '非Google属性';
        return '';
      })()`);
      if (verdict) break;
    }
    console.log(`  判定: ${verdict || '!! 超时未取到'}`);

    // 3) 点「请求编入索引」
    let clicked = 'no-btn';
    for (let i = 0; i < 12; i++) {
      await sleep(2500);
      clicked = await ev(`(() => {
        const hits = [...document.querySelectorAll('button, [role="button"], a, div, span')]
          .filter(e => (e.textContent||'').trim() === '请求编入索引' && e.offsetParent !== null);
        if (!hits.length) return 'no-btn';
        let el = hits[hits.length - 1];
        while (el && !['BUTTON','A'].includes(el.tagName) && !(el.getAttribute('role') === 'button')) el = el.parentElement;
        (el || hits[hits.length-1]).click();
        return 'clicked';
      })()`);
      if (clicked === 'clicked') break;
    }
    console.log(`  请求按钮: ${clicked}`);
    if (clicked !== 'clicked') {
      const shot = await call('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(png, Buffer.from(shot.data, 'base64'));
      console.log(`  截图: ${png}`);
      continue;
    }

    // 4) 等待面板完成（未收录页会先跑实时测试，最长 150s），然后点面板里的确认按钮
    let done = '';
    for (let i = 0; i < 60; i++) {
      await sleep(3000);
      const st = await ev(`(() => {
        const t = document.body.innerText;
        if (t.includes('已收到编入索引请求')) return '已收到编入索引请求';
        if (/已请求编入索引/.test(t) && !/请求编入索引$/.test(t.trim())) return '已请求编入索引';
        // 面板里可点的确认按钮（排除右上角入口那个）
        const cands = [...document.querySelectorAll('button, [role="button"]')]
          .filter(e => (e.textContent||'').trim() === '请求编入索引' && e.offsetParent !== null);
        if (cands.length >= 2) { cands[cands.length-1].click(); return 'confirm-clicked'; }
        if (cands.length === 1 && cands[0].closest('[role="dialog"], .protection-dialog, [class*="dialog"]')) { cands[0].click(); return 'confirm-clicked'; }
        if (t.includes('正在测试') || t.includes('正在确认') || t.includes('正在检查')) return 'testing';
        return '';
      })()`);
      if (st === '已收到编入索引请求' || st === '已请求编入索引') { done = st; break; }
      if (st === 'confirm-clicked') console.log(`  [${stamp()}] 已点面板确认按钮`);
    }
    console.log(`  提交结果: ${done ? '✅ ' + done : '⚠️ 未见成功回执'}`);

    const shot = await call('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(png, Buffer.from(shot.data, 'base64'));
    console.log(`  截图: ${png}`);
  }
  process.exit(0);
}
main().catch(e => { console.error('ERR', e.message); process.exit(1); });
