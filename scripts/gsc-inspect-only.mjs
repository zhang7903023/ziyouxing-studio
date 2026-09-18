#!/usr/bin/env node
/** GSC 网址检查（**只读**，绝不点「请求编入索引」）。
 *  入口：search.google.com/search-console/inspect?resource_id=<资源>
 *  输入框 aria-label = 「检查 https://zyxstudio.net/ 中的任何网址」
 *  用法: node scripts/gsc-inspect-only.mjs <url> [<url> ...]
 */
const PORT = 9222;
const urls = process.argv.slice(2);
if (!urls.length) { console.error('usage: gsc-inspect-only.mjs <url>...'); process.exit(1); }
const RES = encodeURIComponent('https://zyxstudio.net/');
const ENTRY = 'https://search.google.com/search-console/inspect?resource_id=' + RES;
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
  await call('Page.enable');

  for (const u of urls) {
    console.log('==================== ' + u);
    await call('Page.navigate', { url: ENTRY });
    await sleep(10000);

    const filled = await ev(`(() => {
      const ins = [...document.querySelectorAll('input')];
      const input = ins.find(i => (i.getAttribute('aria-label')||'').includes('中的任何网址'))
                 || ins.find(i => (i.getAttribute('aria-label')||'').includes('检查'));
      if (!input) return 'no-input:' + JSON.stringify(ins.map(i=>i.getAttribute('aria-label')));
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, ${JSON.stringify(u)});
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.focus();
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
      return 'ok';
    })()`);
    console.log('  输入: ' + filled);

    let got = '';
    for (let i = 0; i < 24; i++) {
      await sleep(2500);
      got = await ev(`document.body.innerText`);
      const busy = /正在检查|正在检索|正在测试|正在获取|正在加载/.test(got);
      if (!busy && /已编入索引|未编入索引|网址不在 Google|已发现|备用网页|重复网页|无法编入索引/.test(got)) break;
    }
    const pick = re => { const m = (got || '').match(re); return m ? m[0].replace(/\s+/g, ' ').trim() : '-'; };
    console.log('  状态      : ' + pick(/(已编入索引[^\n]{0,40}|未编入索引[^\n]{0,60}|网址不在 Google 上[^\n]{0,30}|已发现[^\n]{0,40}尚未编入索引)/));
    console.log('  抓取      : ' + pick(/(已抓取[^\n]{0,30}|尚未抓取[^\n]{0,30})/));
    console.log('  上次抓取  : ' + pick(/(上次抓取时间[^\n]{0,40})/));
    console.log('  请求编入  : ' + pick(/(未请求编入索引|已请求编入索引|编入索引请求[^\n]{0,30})/));
    console.log('  规范网页  : ' + pick(/(Google 选择的规范网页[^\n]{0,90}|用户声明的规范网页[^\n]{0,90})/));
    console.log('  片段      : ' + (got || '').replace(/\n+/g, ' | ').slice(0, 900));
    console.log('');
  }
  process.exit(0);
}
main().catch(e => { console.error('ERR', e.message); process.exit(1); });
