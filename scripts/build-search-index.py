#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""重新生成 search-index.json（站内搜索索引）。

用法: python3 scripts/build-search-index.py
以各页面当前的 <title> / meta description / 正文纯文本为准，覆盖式重建。
"""
import json
import re
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 纳入索引的根目录页面（404 / 校验文件 / 搜索页 / 预览与草稿目录不收录）
ROOT_PAGES = [
    "index.html", "virtual-location.html", "remote-checkin.html", "phone-clone.html",
    "overseas-live.html", "social-media-growth.html", "platform-auth.html",
    "services.html", "contact.html",
    "iphone-virtual-location.html", "ios27-virtual-location.html",
    "android-virtual-location.html", "overseas-mobile-network.html",
]

X_LIMIT = 3000


def strip_tags(html: str) -> str:
    html = re.sub(r"(?is)<script.*?</script>", " ", html)
    html = re.sub(r"(?is)<style.*?</style>", " ", html)
    html = re.sub(r"(?is)<noscript.*?</noscript>", " ", html)
    html = re.sub(r"(?s)<[^>]+>", " ", html)
    html = html.replace("&nbsp;", " ").replace("&amp;", "&")
    html = html.replace("&lt;", "<").replace("&gt;", ">").replace("&quot;", '"')
    return re.sub(r"\s+", " ", html).strip()


def field(html: str, pattern: str) -> str:
    m = re.search(pattern, html, re.I | re.S)
    if not m:
        return ""
    return re.sub(r"\s+", " ", m.group(1)).strip()


def build_entry(path: str, url: str) -> dict:
    with open(path, encoding="utf-8") as f:
        html = f.read()
    title = field(html, r"<title>(.*?)</title>")
    desc = field(html, r'<meta\s+name="description"\s+content="(.*?)"')
    body = html.split("</head>", 1)[-1]
    return {"u": url, "t": title, "d": desc, "x": strip_tags(body)[:X_LIMIT]}


def main() -> None:
    entries = []
    for name in ROOT_PAGES:
        p = os.path.join(ROOT, name)
        if not os.path.exists(p):
            print(f"  ! 缺失: {name}")
            continue
        entries.append(build_entry(p, "" if name == "index.html" else name))

    adir = os.path.join(ROOT, "articles")
    for name in sorted(os.listdir(adir)):
        if not name.endswith(".html") or name == "index.html":
            continue
        entries.append(build_entry(os.path.join(adir, name), f"articles/{name}"))
    entries.append(build_entry(os.path.join(adir, "index.html"), "articles/"))

    out = os.path.join(ROOT, "search-index.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(entries, f, ensure_ascii=False, indent=1)
    print(f"✓ search-index.json 已生成：{len(entries)} 条")
    for e in entries:
        print(f"   {e['u'] or '(首页)':<50} x={len(e['x'])}")


if __name__ == "__main__":
    main()
