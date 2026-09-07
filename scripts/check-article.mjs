#!/usr/bin/env node
/** 一次性检查：文章页新版页头/移动菜单/JS错误。用法: node scripts/check-article.mjs [path] */
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9343;
const BASE = 'http://127.0.0.1:8600';
const path = process.argv[2] || '/articles/checkin-out-of-range-guide.html';

const profile = mkdtempSync(join(tmpdir(), 'chrom-'));
const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-proxy-server',
  '--remote-debugging-port=' + PORT, '--user-data-dir=' + profile, '--window-size=390,844', 'about:blank'
], { stdio: 'ignore' });

let id = 0; const pending = new Map();
const send = (method, params = {}, sessionId) => new Promise(res => {
  const m = ++id; pending.set(m, res);
  chrome._wsSend({ id: m, method, params, sessionId });
});

await new Promise(r => setTimeout(r, 1200));
const list = await fetch(`http://127.0.0.1:${PORT}/json/list`).then(r => r.json());
const ws = new WebSocket(list[0].webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
chrome._wsSend = o => ws.send(JSON.stringify(o));
ws.onmessage = e => { const d = JSON.parse(e.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d.result); pending.delete(d.id); } };
const call = (m, p, s) => send(m, p, s);

const errors = [];
const { targetId } = await call('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await call('Target.attachToTarget', { targetId, flatten: true });
await call('Page.enable', {}, sessionId);
await call('Runtime.enable', {}, sessionId);
ws.addEventListener('message', e => {
  const d = JSON.parse(e.data);
  if (d.method === 'Runtime.exceptionThrown') errors.push(d.params.exceptionDetails.text + ' ' + (d.params.exceptionDetails.exception?.description || ''));
});
await call('Page.navigate', { url: BASE + path }, sessionId);
await new Promise(r => setTimeout(r, 2000));

const evalJs = async expr => (await call('Runtime.evaluate', { expression: expr, returnByValue: true }, sessionId)).result?.value;
const checks = await evalJs(`JSON.stringify({
  header: !!document.querySelector('.site-header'),
  nav: !!document.querySelector('.site-nav'),
  toggle: !!document.querySelector('.menu-toggle'),
  footer: !!document.querySelector('.site-footer'),
  styleCss: getComputedStyle(document.querySelector('.site-header')).display,
  h1: document.querySelector('h1')?.textContent.trim().slice(0,30)
})`);
await call('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true }, sessionId);
const before = await evalJs(`getComputedStyle(document.querySelector('.site-nav')).display`);
await evalJs(`document.querySelector('.menu-toggle').click()`);
await new Promise(r => setTimeout(r, 400));
const after = await evalJs(`getComputedStyle(document.querySelector('.site-nav')).display`);
const expanded = await evalJs(`document.querySelector('.menu-toggle').getAttribute('aria-expanded')`);
const { data } = await call('Page.captureScreenshot', { format: 'png' }, sessionId);
writeFileSync('screenshots/article-unified-mobile.png', Buffer.from(data, 'base64'));

console.log('checks:', checks);
console.log('mobile menu:', before, '->', after, '| aria-expanded:', expanded);
console.log('js errors:', errors.length ? errors : '无');
chrome.kill(); process.exit(0);
