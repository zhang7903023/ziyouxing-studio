#!/usr/bin/env node
/**
 * 多宽度截图与验证（CDP，零第三方依赖）
 * 用法：
 *   1) 先在 8600 端口起静态服务（工作目录即站点根）
 *   2) node scripts/capture.mjs --local http://127.0.0.1:8600 --out screenshots/verify
 * 说明：仅对本地页面做交互验证；"before" 图由同一脚本对线上域名抓取。
 */
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9333;
const args = process.argv.slice(2);
const localBase = (args[args.indexOf('--local') + 1]) || 'http://127.0.0.1:8600';
const outDir = args[args.indexOf('--out') + 1] || 'screenshots/verify';
const profile = join(outDir, '.chrome-profile');
mkdirSync(outDir, { recursive: true });

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--no-proxy-server', '--proxy-bypass-list=<-loopback>',
  '--remote-debugging-port=' + PORT, '--user-data-dir=' + profile,
  '--window-size=1280,900', 'about:blank'
], { stdio: 'ignore' });

let ws = null;
let msgId = 0;
const pending = new Map();

function connect() {
  return new Promise((resolve, reject) => {
    const t0 = Date.now();
    const poll = async () => {
      try {
        await fetch(`http://127.0.0.1:${PORT}/json/version`);
        let page;
        try {
          page = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about%3Ablank`, { method: 'PUT' })).json();
        } catch (e) {
          page = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json();
        }
        const s = new WebSocket(page.webSocketDebuggerUrl);
        s.onopen = () => { ws = s; resolve(); };
        s.onmessage = (e) => {
          const m = JSON.parse(e.data);
          if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
        };
        s.onerror = () => reject(new Error('ws error'));
      } catch (err) {
        if (Date.now() - t0 > 15000) return reject(new Error('chrome 启动超时'));
        setTimeout(poll, 200);
      }
    };
    poll();
  });
}
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++msgId;
    pending.set(id, (m) => m.error ? reject(new Error(m.error.message)) : resolve(m.result));
    ws.send(JSON.stringify({ id, method, params }));
  });
}
async function evalJs(expr) {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error('evaluate error: ' + JSON.stringify(r.exceptionDetails).slice(0, 300));
  return r.result && r.result.value;
}
async function newPage(url) {
  const r = await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' });
  return (await r.json()).webSocketDebuggerUrl;
}
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function loadIn(targetUrl) {
  await send('Page.navigate', { url: targetUrl });
  for (let i = 0; i < 60; i++) {
    const st = await evalJs('document.readyState');
    if (st === 'complete') break;
    await sleep(150);
  }
  await sleep(600);
}
async function setViewport(w, h, fullPageH) {
  const height = fullPageH || h;
  await send('Emulation.setDeviceMetricsOverride', {
    width: w, height: h, deviceScaleFactor: 1, mobile: false, screenWidth: w, screenHeight: height
  });
  if (fullPageH) {
    // 让文档高度至少等于指定高度以便整页截图
  }
}
async function shot(path) {
  const clip = await evalJs('({x:0,y:0,w:document.documentElement.clientWidth,h:document.documentElement.scrollHeight,sw:document.documentElement.scrollWidth})');
  const r = await send('Page.captureScreenshot', {
    format: 'png',
    clip: { x: 0, y: 0, width: clip.w, height: Math.min(clip.h, 20000), scale: 1 },
    captureBeyondViewport: true
  });
  writeFileSync(join(outDir, path), Buffer.from(r.data, 'base64'));
}
async function metrics() {
  return evalJs(`({
    vw: window.innerWidth,
    docW: document.documentElement.scrollWidth,
    bodyW: document.body.scrollWidth,
    hasHScroll: document.documentElement.scrollWidth > window.innerWidth + 1,
    h1: (document.querySelector('h1')||{}).textContent||'',
    primaryBtnVisible: (() => { const b = document.querySelector('.hero-actions .btn-primary, .form-submit .btn-primary, .cta-row .btn-primary'); if(!b) return null; const r = b.getBoundingClientRect(); return {top:Math.round(r.top), bottom:Math.round(r.bottom), inFirstScreen: r.bottom <= window.innerHeight}; })(),
    title: document.title
  })`);
}

async function run() {
  await connect();
  await send('Page.enable');
  await send('Runtime.enable');
  const results = {};
  const localPages = {
    'index': '/', 'services': '/services.html', 'contact': '/contact.html',
    'overseas-live': '/overseas-live.html', 'virtual-location': '/virtual-location.html'
  };
  const widths = [360, 390, 768, 1280, 1440];
  const fullWidths = [360, 390, 768, 1280, 1440];

  // --- 本地：各宽度溢出 + 首屏主按钮 + 整页截图 ---
  for (const [name, path] of Object.entries(localPages)) {
    results[name] = {};
    await loadIn(localBase + path);
    for (const w of widths) {
      await setViewport(w, 900, 1200);
      results[name][w] = await metrics();
    }
    // 整页截图（几个关键宽度）
    for (const w of fullWidths) {
      await setViewport(w, 800, 1);
      await shot(`after-${name}-${w}.png`);
    }
  }

  // --- 菜单开合交互（本地 index/contact） ---
  for (const name of ['index', 'contact']) {
    const url = localBase + (name === 'index' ? '/' : '/contact.html');
    await loadIn(url);
    await setViewport(390, 844, 1);
    await evalJs(`document.getElementById('menuToggle').click()`);
    await sleep(120);
    const open = await evalJs(`({bodyOpen: document.body.classList.contains('menu-open'), navVis: getComputedStyle(document.getElementById('siteNav')).display, exp: document.getElementById('menuToggle').getAttribute('aria-expanded'), h: document.documentElement.scrollHeight})`);
    await shot(`after-${name}-menu-open-390.png`);
    await evalJs(`document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}))`);
    await sleep(120);
    const close = await evalJs(`({bodyOpen: document.body.classList.contains('menu-open'), exp: document.getElementById('menuToggle').getAttribute('aria-expanded')})`);
    results[name]._menu = { open, close };
  }

  // --- 咨询页：URL 参数预选 & 校验（不触发真实发送） ---
  await loadIn(localBase + '/contact.html?service=overseas-live');
  await setViewport(1280, 900, 1);
  results.contact._param = await evalJs(`({sel: document.getElementById('cf-service').value, hint: document.getElementById('serviceHint').textContent, note: document.getElementById('preselectNote').textContent})`);
  await loadIn(localBase + '/contact.html');
  await setViewport(390, 844, 1);
  // 清空必填并提交：应出现错误提示且不打开任何外链（validate 拦截）
  const beforeTabs = await evalJs('1');
  await evalJs(`(() => { const f=document.getElementById('contactForm'); document.getElementById('cf-name').value=''; document.getElementById('cf-contact').value=''; document.getElementById('cf-service').value=''; document.getElementById('cf-message').value=''; f.requestSubmit(); return true; })()`);
  await sleep(300);
  results.contact._validate = await evalJs(`({
    contactErr: !!document.querySelector('#cf-contact').closest('.form-group').classList.contains('has-error'),
    serviceErr: !!document.querySelector('#cf-service').closest('.form-group').classList.contains('has-error'),
    messageErr: !!document.querySelector('#cf-message').closest('.form-group').classList.contains('has-error'),
    resultShown: document.getElementById('submitResult').style.display
  })`);
  // 微信复制反馈
  await evalJs(`(() => { const b=document.getElementById('wechatCopy'); b.click(); return true; })()`);
  await sleep(400);
  results.contact._copy = await evalJs(`({btnText: document.getElementById('wechatCopy').textContent, status: document.getElementById('wechatCopyStatus').textContent})`);
  await shot('after-contact-validate-390.png');

  // --- 键盘可达性（本地，TAB 遍历首屏链接） ---
  await loadIn(localBase + '/');
  await setViewport(1280, 900, 1);
  const kb = await evalJs(`(async () => { const focusables=[...document.querySelectorAll('a[href],button,input,select,textarea')].filter(el=>el.offsetParent!==null); return {count: focusables.length, first: focusables[0] ? focusables[0].tagName+':'+(focusables[0].textContent||'').trim().slice(0,12) : null}; })()`);
  results.index._kb = kb;

  // --- before（线上现网快照，仅供对比；网络不可达则跳过） ---
  let liveOk = false;
  try {
    await loadIn('https://zyxstudio.net/');
    liveOk = await evalJs(`location.hostname === 'zyxstudio.net' && !!document.querySelector('h1')`);
  } catch (e) { liveOk = false; }
  if (liveOk) {
    for (const [name, path] of Object.entries({ 'index': '/', 'services': '/services.html', 'contact': '/contact.html' })) {
      await loadIn('https://zyxstudio.net/' + path.replace(/^\//, ''));
      for (const w of [390, 1280]) {
        await setViewport(w, 800, 1);
        await shot(`before-${name}-${w}.png`);
      }
    }
  } else {
    console.log('live 不可达，跳过 before 截图');
  }

  writeFileSync(join(outDir, 'metrics.json'), JSON.stringify(results, null, 2));
  console.log('完成，输出目录：' + outDir);
  try { rmSync(profile, { recursive: true, force: true }); } catch (e) {}
  chrome.kill();
  process.exit(0);
}

run().catch(e => { console.error(e); try { chrome.kill(); } catch (_) {} process.exit(1); });
