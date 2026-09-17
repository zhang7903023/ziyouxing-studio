#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""为新建的视频号/小红书海外直播页补内链（幂等，可重复运行）。"""
import os

BASE = "/Users/zyxstudio/WorkBuddy/2026-09-07-09-53-08/ziyouxing-studio"

SHIPINHAO_CARD = """        <a href="articles/shipinhao-overseas-live.html">视频号海外直播权限怎么开通？<span>查看教程 →</span></a>
        <a href="articles/xiaohongshu-overseas-live.html">小红书海外直播权限怎么开通？<span>查看教程 →</span></a>"""

SERVICE_LINKS = """
                <p style="margin-top:8px;"><a href="articles/shipinhao-overseas-live.html">视频号：境外开播的官方门槛与申请流程 →</a></p>
                <p style="margin-top:8px;"><a href="articles/xiaohongshu-overseas-live.html">小红书：官方口径与白名单材料清单 →</a></p>"""

INDEX_CARDS = """

        <!-- 视频号海外直播 -->
        <a href="shipinhao-overseas-live.html" class="article-card" data-category="social">
            <div class="card-cover"><img src="../images/article-covers/overseas-live-guide.jpg" alt="视频号海外直播权限开通封面" loading="lazy"></div>
            <div class="card-top">
                <span class="tag tag-social">直播</span>
                <span class="tag tag-guide">教程</span>
            </div>
            <div class="card-body">
                <h2>视频号海外直播权限怎么开通？</h2>
                <p>按微信官方直播资质指引整理境外开播门槛：中国籍主播粉丝＞200、动态≥10、账号注册满30天，附申请材料与被拒原因。</p>
            </div>
            <div class="card-footer">
                <span class="card-meta">2026-09-17 · 约2100字</span>
                <span class="read-link">阅读 →</span>
            </div>
        </a>

        <!-- 小红书海外直播 -->
        <a href="xiaohongshu-overseas-live.html" class="article-card" data-category="social">
            <div class="card-cover"><img src="../images/article-covers/xiaohongshu-jiguang-guide.jpg" alt="小红书海外直播权限开通封面" loading="lazy"></div>
            <div class="card-top">
                <span class="tag tag-social">直播</span>
                <span class="tag tag-guide">教程</span>
            </div>
            <div class="card-body">
                <h2>小红书海外直播权限怎么开通？</h2>
                <p>官方口径「直播仅针对境内」，海外开播走白名单通道。整理 10 项申请材料、账号要求与常见被拒原因。</p>
            </div>
            <div class="card-footer">
                <span class="card-meta">2026-09-17 · 约1900字</span>
                <span class="read-link">阅读 →</span>
            </div>
        </a>"""

RELATED_CARDS = """
                    <a href="shipinhao-overseas-live.html" class="related-card">
                        <span class="related-category">直播教程</span>
                        <h4>视频号海外直播权限怎么开通？</h4>
                    </a>
                    <a href="xiaohongshu-overseas-live.html" class="related-card">
                        <span class="related-category">直播教程</span>
                        <h4>小红书海外直播权限怎么开通？</h4>
                    </a>"""

JOBS = [
    ("index.html",
     '<a href="articles/douyin-overseas-live-fix.html">抖音海外直播异地开播排查<span>查看教程 →</span></a>',
     "\n" + SHIPINHAO_CARD,
     "shipinhao-overseas-live.html"),

    ("overseas-live.html",
     '<p style="margin-top:8px;"><a href="articles/douyin-overseas-live-fix.html">排查：抖音提示“异地开播”的常见原因 →</a></p>',
     SERVICE_LINKS,
     "shipinhao-overseas-live.html"),

    ("articles/index.html",
     '                <span class="card-meta">2026-04-25 · 约1200字</span>\n                <span class="read-link">阅读 →</span>\n            </div>\n        </a>',
     INDEX_CARDS,
     "shipinhao-overseas-live.html"),

    ("articles/douyin-overseas-live-fix.html",
     '                    <a href="overseas-live-guide.html" class="related-card">\n                        <span class="related-category">直播教程</span>\n                        <h4>海外直播权限怎么开通？</h4>\n                    </a>',
     RELATED_CARDS,
     "shipinhao-overseas-live.html"),

    ("articles/xiaohongshu-jiguang-guide.html",
     '<div class="related-grid">',
     RELATED_CARDS,
     "shipinhao-overseas-live.html"),

    ("articles/xiaohongshu-douyin-guide.html",
     '<div class="related-grid">',
     RELATED_CARDS,
     "shipinhao-overseas-live.html"),
]

ok = skip = fail = 0
for path, anchor, insert, marker in JOBS:
    p = os.path.join(BASE, path)
    if not os.path.exists(p):
        print(f"✗ 文件不存在: {path}")
        fail += 1
        continue
    s = open(p, encoding="utf-8").read()
    if marker in s:
        print(f"·  已有内链，跳过: {path}")
        skip += 1
        continue
    if anchor not in s:
        print(f"✗ 锚点未命中: {path}")
        fail += 1
        continue
    s = s.replace(anchor, anchor + insert, 1)
    open(p, "w", encoding="utf-8").write(s)
    print(f"✓  已补内链: {path}")
    ok += 1

print(f"\n成功 {ok} 个 / 跳过 {skip} 个 / 失败 {fail} 个")
