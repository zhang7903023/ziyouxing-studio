#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
把海外直播线三个页面的简化 CTA 升级为全站标准转化组件
（article-cta wechat-cta + 复制微信号按钮 + 状态提示），
与 feishu/workwechat/dingtalk/iphone-clone 等已验证页面保持一致。

用法：python3 scripts/upgrade-live-cta.py
幂等：已升级过的页面会跳过。
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
STORE = 'https://www.gexiv.com/categories/%E6%B5%B7%E5%A4%96%E7%9B%B4%E6%92%AD'

SPECS = [
    {
        "file": "articles/shipinhao-overseas-live.html",
        "anchor": '<div class="cta-section">',
        "source": "视频号海外直播",
        "h": "视频号海外开播条件不满足？",
        "p": "把账号情况一次发全，我们先判断是卡在硬指标还是材料环节，再说怎么处理。不需要提供账号密码或验证码。",
        "items": ["账号粉丝数", "已发布动态数", "账号注册时间", "当前所在国家/地区"],
    },
    {
        "file": "articles/xiaohongshu-overseas-live.html",
        "anchor": '<div class="cta-section">',
        "source": "小红书海外直播",
        "h": "小红书海外开播走不通？",
        "p": "把账号情况一次发全，我们先判断该走白名单通道还是先补账号基础，再说具体路径。不需要提供账号密码或验证码。",
        "items": ["账号粉丝数", "内容垂类", "有无被限流", "当前所在国家/地区"],
    },
    {
        "file": "articles/overseas-live-guide.html",
        "anchor": '<div class="article-cta">',
        "source": "海外直播权限",
        "h": "需要开通直播权限？",
        "p": "说清目标平台和账号现状，帮你判断可行性与报价。不需要提供账号密码或验证码。",
        "items": ["目标平台", "粉丝数与注册时长", "有无违规记录", "当前所在国家/地区"],
    },
]


def build_cta(spec):
    items = "\n".join("                    <li>%s</li>" % i for i in spec["items"])
    return (
        '<div class="article-cta wechat-cta" data-consult-source="%s">\n'
        '                <p class="cta-eyebrow">微信优先咨询</p>\n'
        '                <h3>%s</h3>\n'
        '                <p>%s</p>\n'
        '                <ul class="wechat-checklist">\n'
        '%s\n'
        '                </ul>\n'
        '                <div class="cta-buttons">\n'
        '                    <button type="button" class="btn btn-primary wechat-copy-btn" data-wechat-copy="yes1974g" data-consult-source="%s" data-label="复制微信号：yes1974g">复制微信号：yes1974g</button>\n'
        '                    <a href="../overseas-live.html" class="btn btn-outline">查看海外直播服务</a>\n'
        '                    <a href="%s" class="btn btn-outline" rel="noopener">查看海外直播商品</a>\n'
        '                </div>\n'
        '                <p class="wechat-copy-status" aria-live="polite"></p>\n'
        '            </div>'
    ) % (spec["source"], spec["h"], spec["p"], items, spec["source"], STORE)


def replace_div_block(html, start_marker, new_html):
    """从 start_marker 开始，按 <div>/</div> 平衡计数替换整个块。"""
    i = html.find(start_marker)
    if i < 0:
        return None
    depth = 0
    pos = i
    tag_re = re.compile(r"<div\b|</div>")
    while True:
        m = tag_re.search(html, pos)
        if not m:
            raise RuntimeError("div 标签不平衡，替换中止：%s" % start_marker)
        if m.group(0) == "</div>":
            depth -= 1
            if depth == 0:
                return html[:i] + new_html + html[m.end():]
        else:
            depth += 1
        pos = m.end()


def main():
    changed = 0
    for spec in SPECS:
        path = ROOT / spec["file"]
        html = path.read_text(encoding="utf-8")

        if "wechat-copy-btn" in html and "wechat-cta" in html:
            print("跳过（已升级）: %s" % spec["file"])
            continue

        new_html = build_cta(spec)
        out = replace_div_block(html, spec["anchor"], new_html)
        if out is None:
            print("✗ 未找到锚点 %s 于 %s" % (spec["anchor"], spec["file"]), file=sys.stderr)
            continue

        path.write_text(out, encoding="utf-8")
        changed += 1
        print("✓ 已升级 CTA: %s" % spec["file"])

    print("\n共修改 %d 个文件" % changed)


if __name__ == "__main__":
    main()
