#!/usr/bin/env node
/**
 * 自由行Studio 全站刷新检查脚本（无需第三方依赖）
 * 检查：header 组件完整性、重复 ID、label/for 关联、标题层级、
 *       站内链接目标存在、旧文案残留、重复商城入口、菜单控件存在。
 * 用法：node scripts/check-site.mjs
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pages = ['index.html', 'services.html', 'contact.html',
  'virtual-location.html', 'overseas-live.html', 'remote-checkin.html',
  'phone-clone.html', 'platform-auth.html', 'social-media-growth.html'];

const problems = [];
const notes = [];
const allFiles = collectFiles(root);

function collectFiles(dir) {
  const out = [];
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (f.startsWith('.')) continue;
    if (['node_modules', '.git'].includes(f)) continue;
    if (f.endsWith('.html')) out.push(p);
  }
  return out;
}
function existsRel(pageAbs, href) {
  if (/^(https?:|mailto:|tel:|javascript:|#)/i.test(href)) return true;
  const base = dirname(pageAbs);
  const clean = href.split('#')[0].split('?')[0];
  return existsSync(join(base, decodeURIComponent(clean)));
}

for (const rel of pages) {
  const page = join(root, rel);
  if (!existsSync(page)) { problems.push(`${rel}: 文件不存在`); continue; }
  let html = '';
  try { html = readFileSync(page, 'utf8'); } catch (e) { problems.push(`${rel}: 读取失败 ${e.message}`); continue; }

  // 1. 统一页头组件
  for (const needle of ['id="siteNav"', 'id="menuToggle"', 'class="site-header"', 'nav-store', '立即咨询']) {
    if (!html.includes(needle)) problems.push(`${rel}: 缺少 ${needle}`);
  }
  // 页头商城入口唯一性（header 内只出现一次 nav-store）
  const headerSlice = html.slice(html.indexOf('<header'), html.indexOf('</header>') + 9);
  const storeCount = (headerSlice.match(/nav-store/g) || []).length;
  if (storeCount !== 1) problems.push(`${rel}: 页头商城入口出现 ${storeCount} 次（期望 1）`);
  if (html.includes('site-connection')) notes.push(`${rel}: 仍包含 site-connection 提示条（可确认是否应移除）`);
  if (html.includes('nav-store') && html.indexOf('nav-store') !== html.lastIndexOf('nav-store')) notes.push(`${rel}: 全页多处 nav-store（需人工确认位置）`);

  // 2. 重复 ID
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
  const dup = ids.filter((v, i) => ids.indexOf(v) !== i);
  if (dup.length) problems.push(`${rel}: 重复 ID ${[...new Set(dup)].join(',')}`);

  // 2.5 嵌套 <a> 检查
  let aDepth = 0; let nestedA = false;
  for (const m of html.matchAll(/<a\b|<\/a\s*>/gi)) {
    if (m[0].toLowerCase().startsWith('<a')) { aDepth++; if (aDepth > 1) { nestedA = true; break; } }
    else aDepth = Math.max(0, aDepth - 1);
  }
  if (nestedA) problems.push(`${rel}: 存在嵌套 <a>（浏览器会拆散 DOM，需改为 div/article）`);

  // 3. label for 关联
  const labels = [...html.matchAll(/<label[^>]*\sfor="([^"]+)"/g)].map(m => m[1]);
  for (const f of labels) if (!ids.includes(f)) problems.push(`${rel}: label for=${f} 无对应控件`);
  const controls = [...html.matchAll(/<(input|select|textarea)[^>]*\sid="([^"]+)"/g)].map(m => m[2]);
  for (const c of controls) if (!labels.includes(c)) notes.push(`${rel}: 控件 ${c} 缺少关联 label`);

  // 4. 标题层级
  const heads = [...html.matchAll(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/g)].map(m => +m[1]);
  const firstH1 = heads.indexOf(1);
  const seq = firstH1 >= 0 ? heads.slice(firstH1) : heads;
  let prev = seq[0] || 0;
  for (const h of seq.slice(1)) {
    if (h > prev + 1) problems.push(`${rel}: 标题层级跳级 ${prev}→${h}（附近：${html.match(/<h' + h + '.../)}）`.replace(/（附近：.*/,''));
    prev = h;
  }
  if (seq.length === 0) problems.push(`${rel}: 无 h1`);

  // 5. 站内链接完整性
  const links = [...html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)].map(m => m[1]).filter(h => !/^(https?:|mailto:|tel:|javascript:)/i.test(h));
  for (const href of links) {
    if (href.startsWith('#')) {
      const anchor = href.slice(1);
      if (anchor && !ids.includes(anchor)) problems.push(`${rel}: 锚点 #${anchor} 无对应 id`);
    } else if (!existsRel(page, href)) {
      problems.push(`${rel}: 链接目标缺失 ${href}`);
    }
  }

  // 6. 旧文案残留（涉及要求点）
  const stalePatterns = [
    ['发送平台与账号信息', '直播卡片按钮应改为「了解海外直播方案」'],
    ['原有服务页面和实用教程仍然保留', '维护式说明应改为面向用户文案'],
    ['商品与购买', '旧商城入口文案']
  ];
  for (const [pat, why] of stalePatterns) {
    if (html.includes(pat)) problems.push(`${rel}: 残留文案「${pat}」（${why}）`);
  }

  // 7. contact 特别检查
  if (rel === 'contact.html') {
    if (/<h4/i.test(html)) problems.push('contact.html: 存在 h4（标题跳级风险）');
    for (const field of ['cf-name', 'cf-contact', 'cf-service', 'cf-message']) {
      if (!html.includes(`id="${field}"`)) problems.push(`contact.html: 缺少字段 id=${field}`);
    }
    if (!html.includes('password') || html.includes('type="password"')) {} // 无敏感字段
    if (/type="password"/.test(html)) problems.push('contact.html: 出现密码字段（不应存在）');
  }
}

console.log(`\n=== 检查 ${pages.length} 个页面 ===`);
if (problems.length) { console.log('\n❌ 问题：'); problems.forEach(p => console.log('  - ' + p)); }
else console.log('\n✅ 未发现问题项');
if (notes.length) { console.log('\n⚠️ 提示：'); notes.forEach(n => console.log('  - ' + n)); }
console.log(`\n统计：问题 ${problems.length}，提示 ${notes.length}`);
process.exit(problems.length ? 1 : 0);
