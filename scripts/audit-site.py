#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
自由行Studio 全站 SEO / 结构审计（无第三方依赖）

检查项：
  1. HTML 标签平衡
  2. JSON-LD 能否解析、@type 是否齐全
  3. 本地资源（css/js/图片）是否存在
  4. 站内链接目标是否存在（正确解析相对路径）
  5. 重复 title / description / H1
  6. canonical 是否自引用且域名正确
  7. 图片是否都有 alt
  8. H1 数量是否为 1
  9. 孤立页面（入链为 0，首页除外）
 10. sitemap.xml 与页面集合是否一致
 11. FAQPage 结构化数据条数

用法：python3 scripts/audit-site.py
"""
import os, re, sys, json, glob, posixpath, html
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKIP = {"404.html", "googlee56f0f8c7ab23103.html", "gsc-index-helper.html"}
# 明确声明 noindex 的站内工具页，不要求出现在 sitemap 中
NOINDEX = {"search.html"}
SITE = "https://zyxstudio.net/"

VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link",
        "meta", "param", "source", "track", "wbr"}


def pages():
    out = []
    for f in sorted(glob.glob(os.path.join(ROOT, "*.html"))) + \
             sorted(glob.glob(os.path.join(ROOT, "articles", "*.html"))):
        rel = os.path.relpath(f, ROOT).replace(os.sep, "/")
        if rel in SKIP:
            continue
        out.append(rel)
    return out


def strip_tags(s):
    s = re.sub(r"(?is)<script.*?</script>", " ", s)
    s = re.sub(r"(?is)<style.*?</style>", " ", s)
    s = re.sub(r"(?s)<[^>]+>", " ", s)
    return re.sub(r"\s+", " ", html.unescape(s)).strip()


def strip_code(raw):
    """去掉 script / style 内容，避免把 JS 模板字符串当成 HTML"""
    raw = re.sub(r"(?is)<script\b[^>]*>.*?</script>", "<script></script>", raw)
    raw = re.sub(r"(?is)<style\b[^>]*>.*?</style>", "<style></style>", raw)
    return raw


def check_tags(rel, raw):
    """粗略标签平衡检查（排除 void 元素与自闭合）"""
    raw = strip_code(raw)
    stack, errs = [], []
    for m in re.finditer(r"<(/?)([a-zA-Z][a-zA-Z0-9]*)((?:[^>\"']|\"[^\"]*\"|'[^']*')*)>", raw):
        closing, tag, attrs = m.group(1), m.group(2).lower(), m.group(3)
        if tag in VOID or attrs.rstrip().endswith("/"):
            continue
        if not closing:
            stack.append(tag)
        else:
            if not stack:
                errs.append("多余的 </%s>" % tag)
            elif stack[-1] == tag:
                stack.pop()
            else:
                if tag in stack:
                    while stack and stack[-1] != tag:
                        errs.append("未闭合 <%s>" % stack.pop())
                    if stack:
                        stack.pop()
                else:
                    errs.append("多余的 </%s>" % tag)
    for t in stack:
        if t not in ("script", "style"):
            errs.append("未闭合 <%s>" % t)
    return errs


def main():
    ps = pages()
    keys = set(ps)
    titles, descs, h1s = defaultdict(list), defaultdict(list), defaultdict(list)
    inbound = defaultdict(int)
    problems, notes = [], []

    for rel in ps:
        fp = os.path.join(ROOT, rel)
        raw = open(fp, encoding="utf-8").read()
        base = posixpath.dirname(rel)

        # 1 标签
        for e in check_tags(rel, raw):
            problems.append("%s  标签问题：%s" % (rel, e))

        # 2 JSON-LD
        lds = re.findall(r'application/ld\+json[^>]*>(.*?)</script>', raw, re.S | re.I)
        types = []
        for b in lds:
            try:
                d = json.loads(b.strip())
            except Exception as ex:
                problems.append("%s  JSON-LD 解析失败：%s" % (rel, ex))
                continue
            for it in (d if isinstance(d, list) else [d]):
                if isinstance(it, dict) and "@graph" in it:
                    for g in it["@graph"]:
                        if isinstance(g, dict) and g.get("@type"):
                            types.append(g["@type"])
                elif isinstance(it, dict) and it.get("@type"):
                    types.append(it["@type"])
        # 3 本地资源
        for src, tag in re.findall(r'<(?:link[^>]*href|script[^>]*src|img[^>]*src)="([^"]+)"', raw) and [] or []:
            pass
        for m in re.finditer(r'(?:href|src)="([^"]+)"', raw):
            u = m.group(1)
            if u.startswith(("http", "//", "mailto:", "tel:", "javascript:", "data:", "#")):
                continue
            path = u.split("#")[0].split("?")[0]
            if not path or not re.search(r"\.(css|js|png|jpe?g|webp|svg|ico|jpg|gif|woff2?)$", path, re.I):
                continue
            tgt = posixpath.normpath(posixpath.join(base, path))
            if not os.path.exists(os.path.join(ROOT, tgt)):
                problems.append("%s  缺失资源：%s" % (rel, u))

        # 4 站内链接 + 入链
        for u in set(re.findall(r'href="([^"]+)"', strip_code(raw))):
            if u.startswith(("http", "//", "mailto:", "tel:", "javascript:", "data:", "#")):
                continue
            path = u.split("#")[0].split("?")[0]
            if not path:
                continue
            if path.startswith("/"):
                tgt = path.lstrip("/")
            else:
                tgt = posixpath.join(base, path)
            if tgt == "" or tgt.endswith("/"):
                tgt = tgt + "index.html"
            tgt = posixpath.normpath(tgt)
            if tgt in keys:
                if tgt != rel:
                    inbound[tgt] += 1
            elif not os.path.exists(os.path.join(ROOT, tgt)):
                problems.append("%s  死链：%s" % (rel, u))

        # 5 TDK
        t = re.search(r"<title[^>]*>(.*?)</title>", raw, re.S)
        titles[(t.group(1).strip() if t else "")].append(rel)
        d = re.search(r'<meta[^>]*name="description"[^>]*content="(.*?)"', raw, re.S)
        descs[(d.group(1).strip() if d else "")].append(rel)
        hs = re.findall(r"<h1[^>]*>(.*?)</h1>", raw, re.S | re.I)
        h1s[strip_tags(hs[0]) if hs else ""].append(rel)
        if len(hs) != 1:
            problems.append("%s  H1 数量为 %d（应为 1）" % (rel, len(hs)))

        # 6 canonical
        c = re.search(r'<link[^>]*rel="canonical"[^>]*href="([^"]+)"', raw)
        expect = SITE + (posixpath.dirname(rel) + "/" if "/" in rel else "") + \
                 ("index.html" if rel.endswith("index.html") and "/" in rel else
                  ("" if rel == "index.html" else os.path.basename(rel)))
        if rel == "articles/index.html":
            expect = SITE + "articles/"
        if not c:
            problems.append("%s  缺少 canonical" % rel)
        elif c.group(1) != expect:
            problems.append("%s  canonical 异常：%s（期望 %s）" % (rel, c.group(1), expect))

        # 7 图片 alt
        for m in re.finditer(r"<img\b[^>]*>", raw, re.I):
            if "alt=" not in m.group(0):
                problems.append("%s  图片缺少 alt：%s" % (rel, m.group(0)[:70]))

        # 8 FAQ 条数
        n_faq = len(re.findall(r'class="faq-item', raw))
        if n_faq and "FAQPage" not in " ".join(types):
            notes.append("%s  有 %d 条可见问答但无 FAQPage schema" % (rel, n_faq))
        if "FAQPage" in types and not n_faq:
            problems.append("%s  FAQPage schema 但页面无可见问答" % rel)

        # 9 OG 完整性
        for prop in ("og:title", "og:description", "og:url", "og:type"):
            if 'property="%s"' % prop not in raw and "name=\"%s\"" % prop not in raw:
                notes.append("%s  缺少 %s" % (rel, prop))

    # 重复项
    for k, v in titles.items():
        if len(v) > 1:
            problems.append("重复 title（%s）：%s" % (k[:40], v))
    for k, v in descs.items():
        if len(v) > 1:
            problems.append("重复 description（%s）：%s" % (k[:40], v))
    for k, v in h1s.items():
        if len(v) > 1:
            problems.append("重复 H1（%s）：%s" % (k[:40], v))

    # 孤立页
    for rel in ps:
        if rel != "index.html" and inbound[rel] == 0:
            problems.append("%s  孤立页面（站内 0 入链）" % rel)

    # sitemap 一致性
    sm = open(os.path.join(ROOT, "sitemap.xml"), encoding="utf-8").read()
    locs = re.findall(r"<loc>(.*?)</loc>", sm)
    sm_set = set(l.rstrip("/") for l in locs)

    def page_url(p):
        if p == "index.html":
            return SITE.rstrip("/")
        if p.endswith("/index.html"):
            return SITE + posixpath.dirname(p)
        return SITE + p

    missing = [p for p in ps if page_url(p).rstrip("/") not in sm_set and p not in NOINDEX]
    known = {page_url(p).rstrip("/") for p in ps}
    extra = [l for l in locs if l.rstrip("/") not in known]
    if missing:
        problems.append("sitemap 缺少页面：%s" % missing)
    if extra:
        problems.append("sitemap 存在多余 URL：%s" % extra)

    print("=" * 64)
    print("全站审计：%d 个页面 | sitemap %d 条" % (len(ps), len(locs)))
    print("=" * 64)
    if problems:
        print("\n【需处理】%d 项" % len(problems))
        for x in problems:
            print("  ✗ " + x)
    else:
        print("\n✅ 无问题项")
    if notes:
        print("\n【提示】%d 项" % len(notes))
        for x in notes[:30]:
            print("  · " + x)
        if len(notes) > 30:
            print("  · …其余 %d 项" % (len(notes) - 30))
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
