#!/usr/bin/env python3
"""统一 articles/ 下文章页的页头/页脚为主站新版结构，并补齐 style.css 与 site.js 引用。"""
import re
import glob
import pathlib

ART_DIR = pathlib.Path(__file__).resolve().parent.parent / "articles"

HEADER = """<header class="site-header">
  <div class="container header-inner">
    <a href="../" class="logo" aria-label="自由行Studio首页">自由行<span>Studio</span></a>
    <nav class="site-nav" id="siteNav" aria-label="主导航">
      <a href="../virtual-location.html" class="nav-item">虚拟定位</a>
      <a href="../overseas-live.html" class="nav-item">海外直播</a>
      <a href="../services.html" class="nav-item">服务总览</a>
      <a href="../articles/" class="nav-item" aria-current="page">教程</a>
      <a href="https://www.gexiv.com/" class="nav-item nav-store" target="_blank" rel="noopener" title="商品与价格请前往 Gexiv 产品商城查看">商品商城 <span aria-hidden="true">↗</span></a>
      <span class="store-note">商品与价格请前往 Gexiv 产品商城查看</span>
    </nav>
    <div class="header-actions">
      <a href="../contact.html" class="header-cta">立即咨询</a>
      <button type="button" class="menu-toggle" id="menuToggle" aria-expanded="false" aria-controls="siteNav" aria-label="打开菜单">
        <span class="menu-label-open">菜单</span>
        <span class="menu-label-close">关闭</span>
        <span class="menu-icon" aria-hidden="true"></span>
      </button>
    </div>
  </div>
</header>"""

FOOTER = """<footer class="site-footer minimal-footer">
  <div class="container footer-directory">
    <div class="footer-brand">
      <p>自由行 Studio</p>
      <span>一对一设备配置与技术支持</span>
    </div>
    <div class="footer-links">
      <h2>设备与定位</h2>
      <a href="../virtual-location.html">虚拟定位</a>
      <a href="../remote-checkin.html">定位异常与打卡</a>
      <a href="../phone-clone.html">iPhone 分身</a>
    </div>
    <div class="footer-links">
      <h2>海外与平台</h2>
      <a href="../overseas-live.html">海外直播</a>
      <a href="../social-media-growth.html">粉丝与互动服务</a>
      <a href="../platform-auth.html">平台认证</a>
    </div>
    <div class="footer-links">
      <h2>帮助</h2>
      <a href="../services.html">服务总览</a>
      <a href="./">文章与教程</a>
      <a href="https://www.gexiv.com/" target="_blank" rel="noopener">Gexiv 产品商城 ↗</a>
      <a href="../contact.html">联系我们</a>
    </div>
  </div>
  <p class="container footer-copyright">© 2026 自由行 Studio</p>
</footer>"""

RE_HEADER = re.compile(r'<header class="header">.*?</header>', re.S)
RE_FOOTER = re.compile(r'<footer class="footer">.*?</footer>', re.S)

changed, skipped = [], []
for f in sorted(ART_DIR.glob("*.html")):
    t = f.read_text(encoding="utf-8")
    orig = t
    t = RE_HEADER.sub(lambda m: HEADER, t, count=1)
    t = RE_FOOTER.sub(lambda m: FOOTER, t, count=1)
    # 新版导航样式依赖 style.css（放 article.css 之前，文章样式可覆盖）
    if '../css/style.css' not in t:
        t = t.replace('<link rel="stylesheet" href="../css/article.css">',
                      '<link rel="stylesheet" href="../css/style.css">\n    <link rel="stylesheet" href="../css/article.css">', 1)
    # site.js 提供移动菜单逻辑，需在 main.js 之前（main.js 置 HAS_MAIN_JS 标记）
    if '../js/site.js' not in t:
        t = t.replace('<script src="../js/main.js"></script>',
                      '<script src="../js/site.js"></script>\n    <script src="../js/main.js"></script>', 1)
    if t != orig:
        f.write_text(t, encoding="utf-8")
        changed.append(f.name)
    else:
        skipped.append(f.name)

print("changed:", len(changed))
for n in changed: print("  ", n)
print("skipped:", skipped)
