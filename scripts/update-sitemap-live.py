#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把两个新建的海外直播页写入 sitemap，并刷新被改写页面的 lastmod（幂等）。"""
import os

BASE = "/Users/zyxstudio/WorkBuddy/2026-09-07-09-53-08/ziyouxing-studio"
p = os.path.join(BASE, "sitemap.xml")
s = open(p, encoding="utf-8").read()

# 1) 刷新被重写页面的 lastmod
s = s.replace(
    "    <loc>https://zyxstudio.net/articles/overseas-live-guide.html</loc>\n    <lastmod>2026-09-14</lastmod>",
    "    <loc>https://zyxstudio.net/articles/overseas-live-guide.html</loc>\n    <lastmod>2026-09-17</lastmod>",
)

NEW = """  <url>
    <loc>https://zyxstudio.net/articles/shipinhao-overseas-live.html</loc>
    <lastmod>2026-09-17</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://zyxstudio.net/articles/xiaohongshu-overseas-live.html</loc>
    <lastmod>2026-09-17</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
"""

anchor = """    <loc>https://zyxstudio.net/articles/overseas-live-guide.html</loc>
    <lastmod>2026-09-17</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
"""

if "shipinhao-overseas-live" in s:
    print("·  sitemap 已包含新页面，跳过插入")
else:
    if anchor not in s:
        raise SystemExit("✗ 未找到插入锚点")
    s = s.replace(anchor, anchor + NEW, 1)
    print("✓  sitemap 已加入 2 条新 URL")

open(p, "w", encoding="utf-8").write(s)

total = s.count("<loc>")
print(f"  sitemap 现有 URL 数: {total}")
