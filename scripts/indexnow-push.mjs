#!/usr/bin/env node
/**
 * IndexNow 全量/按需推送 —— 直通 Bing / Yandex / Seznam / Naver
 *
 * 用法：
 *   node scripts/indexnow-push.mjs                 # 推送 sitemap.xml 全部 URL
 *   node scripts/indexnow-push.mjs --dry           # 只打印不发
 *   node scripts/indexnow-push.mjs --file list.txt # 从文件读 URL（每行一条）
 *   node scripts/indexnow-push.mjs --url https://zyxstudio.net/a.html --url https://...
 *
 * 说明：
 * - 单次请求最多 10000 条，本站在限内，一次发完。
 * - 200/202 都算成功（202 = 已接受待验证）。
 * - 422 = 格式/主机不符；403 = key 校验失败；429 = 频率超限。
 */
import fs from 'node:fs';
import path from 'node:path';

const HOST = 'zyxstudio.net';
const KEY = '765012d5c999c95fabaef9d9fb5758f4';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const ENDPOINT = 'https://api.indexnow.org/indexnow';

const argv = process.argv.slice(2);
const DRY = argv.includes('--dry');
const fileArg = argv.indexOf('--file');
const urlArgs = argv.reduce((acc, a, i) => (a === '--url' ? [...acc, argv[i + 1]] : acc), []);

function urlsFromSitemap() {
  const root = path.resolve(process.cwd());
  const xml = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim());
}

let urls;
if (urlArgs.length) {
  urls = urlArgs;
} else if (fileArg >= 0 && argv[fileArg + 1]) {
  urls = fs.readFileSync(argv[fileArg + 1], 'utf8').split('\n').map(s => s.trim()).filter(Boolean);
} else {
  urls = urlsFromSitemap();
}

// 只推本主机、去重
urls = [...new Set(urls)].filter(u => {
  try { return new URL(u).host.replace(/^www\./, '') === HOST; } catch { return false; }
});

console.log(`[IndexNow] 主机=${HOST}  URL 数=${urls.length}  dry=${DRY}`);
urls.forEach(u => console.log('  ·', u));

if (DRY) { console.log('[IndexNow] --dry 模式，未发送。'); process.exit(0); }

const body = { host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList: urls };

const res = await fetch(ENDPOINT, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify(body),
});

const text = await res.text().catch(() => '');
const meaning = {
  200: 'OK —— 全部成功接收',
  202: 'Accepted —— 已接受，等待 key 验证',
  400: 'Bad Request —— 请求格式错误',
  403: 'Forbidden —— key 校验失败（检查 keyLocation 是否可公开访问）',
  422: 'Unprocessable —— URL 与 host 不匹配或 URL 不属于该 host',
  429: 'Too Many Requests —— 推送过于频繁',
};

console.log(`\n[IndexNow] HTTP ${res.status} — ${meaning[res.status] || '未知状态'}`);
if (text) console.log('[IndexNow] 响应体:', text.slice(0, 500));
process.exit(res.ok || res.status === 202 ? 0 : 1);
