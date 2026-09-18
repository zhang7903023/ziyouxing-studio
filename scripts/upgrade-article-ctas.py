#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
给 8 个缺标准转化组件的文章页插入 article-cta wechat-cta 区块。
锚点：优先 <div class="related-articles"> 前，否则 <footer 前。
幂等：已有 wechat-cta 的页面跳过。
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

SPECS = [
    {
        "file": "articles/water-mark-camera-guide.html",
        "source": "水印相机修改",
        "h": "水印相机改时间/定位搞不定？",
        "p": "把手机型号和想改的内容一次说清，我们帮你判断是设置路径问题还是版本不支持，再给可行方案。不需要提供账号密码或验证码。",
        "items": ["手机型号与系统版本", "想改的内容（时间/地点/通知）", "用于哪个 App 打卡", "遇到的具体现象"],
        "link": "../remote-checkin.html", "link_text": "查看远程打卡协助",
    },
    {
        "file": "articles/ios-26-location-guide.html",
        "source": "iOS虚拟定位",
        "h": "iOS 26 改定位遇到问题？",
        "p": "iPhone 改定位的坑和系统版本强相关，把机型和报错发来，我们先帮你判断路线是否可行。不需要提供账号密码或验证码。",
        "items": ["iPhone 机型与 iOS 版本", "目标定位城市", "是否装过侧载/模拟工具", "遇到的报错提示"],
        "link": "../virtual-location.html", "link_text": "查看虚拟定位服务",
    },
    {
        "file": "articles/android-gps-tools-compare.html",
        "source": "安卓定位工具",
        "h": "不知道哪款定位工具适合你？",
        "p": "工具没有最好的只有合适的，把你的机型和用途发来，我们直接推荐匹配的方案。不需要提供账号密码或验证码。",
        "items": ["手机品牌与安卓版本", "需要改定位的 App", "是否要求免 ROOT", "要改到的目标位置"],
        "link": "../virtual-location.html", "link_text": "查看虚拟定位服务",
    },
    {
        "file": "articles/douyin-overseas-live-fix.html",
        "source": "抖音海外开播",
        "h": "抖音海外开播还是被拦？",
        "p": "把报错提示和网络环境发全，我们帮你定位是 IP、GPS 还是账号权限的问题。不需要提供账号密码或验证码。",
        "items": ["当前所在国家/地区", "报错提示截图", "账号粉丝数", "网络环境（家宽/流量/机场）"],
        "link": "../overseas-live.html", "link_text": "查看海外直播服务",
    },
    {
        "file": "articles/wechat-clone-all-platforms.html",
        "source": "微信双开",
        "h": "微信双开遇到闪退或封号？",
        "p": "双开方式和账号安全强相关，把你的机型和已用方案发来，我们先评估风险再给建议。不需要提供账号密码或验证码。",
        "items": ["手机机型与系统版本", "已用的双开方式", "用途（营销/客服/个人）", "遇到的具体问题"],
        "link": "../phone-clone.html", "link_text": "查看分身/多开服务",
    },
    {
        "file": "articles/wechat-clone-mac-pc.html",
        "source": "电脑微信多开",
        "h": "电脑微信多开需要协助？",
        "p": "Windows 和 Mac 的多开方案完全不同，说清系统和数量，我们给你对应的操作路径。不需要提供账号密码或验证码。",
        "items": ["电脑系统（Windows/Mac）", "需要同时开几个微信", "用途（客服/营销/个人）"],
        "link": "../phone-clone.html", "link_text": "查看分身/多开服务",
    },
    {
        "file": "articles/xiaohongshu-douyin-guide.html",
        "source": "改定位无效果",
        "h": "改了定位抖音/小红书没变化？",
        "p": "App 定位和系统定位是两套逻辑，把你的操作方式和现象发来，我们帮你判断卡在哪一层。不需要提供账号密码或验证码。",
        "items": ["手机机型与系统版本", "目标城市", "使用的改定位方式", "App 内的具体现象"],
        "link": "../virtual-location.html", "link_text": "查看虚拟定位服务",
    },
    {
        "file": "articles/xiaohongshu-jiguang-guide.html",
        "source": "聚光开户",
        "h": "聚光开户/海外投放需要咨询？",
        "p": "说清行业和目标市场，我们帮你判断资质要求和开户路径，再谈怎么投。不需要提供账号密码或验证码。",
        "items": ["投放行业与产品", "目标市场", "日预算范围", "是否已有投放账号"],
        "link": "../social-media-growth.html", "link_text": "查看粉丝与互动服务",
    },
]


def build_cta(spec):
    items = "\n".join("                <li>%s</li>" % i for i in spec["items"])
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
        '                    <a href="%s" class="btn btn-outline">%s</a>\n'
        '                </div>\n'
        '                <p class="wechat-copy-status" aria-live="polite"></p>\n'
        '            </div>\n'
        '            '
    ) % (spec["source"], spec["h"], spec["p"], items, spec["source"], spec["link"], spec["link_text"])


def insert_before_anchor(html, anchor, new_html):
    i = html.find(anchor)
    if i < 0:
        return None
    return html[:i] + new_html + html[i:]


def main():
    changed = 0
    for spec in SPECS:
        path = ROOT / spec["file"]
        html = path.read_text(encoding="utf-8")
        if "wechat-cta" in html:
            print("跳过（已有）: %s" % spec["file"])
            continue
        anchor = '<div class="related-articles">'
        if anchor not in html:
            anchor = "<footer"
        out = insert_before_anchor(html, anchor, build_cta(spec))
        if out is None:
            print("✗ 未找到锚点: %s" % spec["file"], file=sys.stderr)
            continue
        path.write_text(out, encoding="utf-8")
        changed += 1
        print("✓ 已插入 CTA: %s（锚点 %s）" % (spec["file"], anchor.strip()[:30]))

    print("\n共修改 %d 个文件" % changed)


if __name__ == "__main__":
    main()
