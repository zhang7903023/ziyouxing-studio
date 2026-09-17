#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""在可直连 Google 的机器上跑：抓 Google 搜索建议，产出真实长尾需求词表。
用法: python3 collect-suggest.py > suggest-out.json
"""
import json, time, urllib.parse, urllib.request, sys

SEEDS = [
    # ── 微信双开核心（主力变现主题）
    "微信双开", "微信多开", "微信分身", "微信雙開", "微信多開",
    "苹果微信双开", "iphone微信双开", "ios微信双开", "iphone微信多开", "ios微信多开",
    "苹果手机微信双开", "苹果手机多开", "苹果微信分身", "微信分身版", "两个微信", "兩個微信",
    "微信双开电脑", "微信双开mac", "微信双开下载", "微信双开安卓", "微信双开软件",
    "微信双开会被封吗", "微信双开怎么弄",
    # ── 虚拟定位
    "虚拟定位", "模拟定位", "改定位", "定位修改", "手机改定位", "修改手机定位",
    "虛擬定位", "更改定位", "定位更改", "iphone虚拟定位", "ios虚拟定位",
    "安卓虚拟定位", "安卓改定位", "iphone改定位", "苹果改定位",
    "虚拟定位软件", "虚拟定位app", "虚拟定位教程", "虚拟定位怎么用",
    # ── 打卡考勤
    "钉钉打卡", "钉钉打卡虚拟定位", "钉钉打卡定位", "钉钉虚拟定位",
    "企业微信打卡", "企业微信打卡虚拟定位", "企业微信虚拟定位",
    "飞书打卡", "飞书打卡定位", "打卡定位修改", "打卡不在范围内",
    "远程打卡", "考勤打卡定位", "打卡改定位",
    # ── 水印相机
    "今日水印相机", "水印相机", "水印相机改定位", "今日水印相机定位",
    "今日水印相机关闭通知权限",
    # ── 社媒
    "抖音改定位", "抖音虚拟定位", "抖音同城", "小红书改定位", "小红书虚拟定位",
    "海外发抖音", "海外发小红书",
    # ── 其他
    "微信改定位", "微信定位修改", "手机定位修改", "定位修改app",
    "ios26 定位", "ios26 虚拟定位",
]

SUFFIXES = ["", "怎么", "如何", "下载", "教程", "哪个好", "免费", "安卓", "ios", "电脑", "苹果", "2026"]

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36"

def suggest(q, hl="zh-CN"):
    url = ("https://suggestqueries.google.com/complete/search?client=firefox"
           "&hl=%s&q=%s" % (hl, urllib.parse.quote(q)))
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=12) as r:
            data = json.loads(r.read().decode("utf-8", "ignore"))
        return data[1] if len(data) > 1 else []
    except Exception as e:
        sys.stderr.write("  ! %s : %s\n" % (q, e))
        return []

found = {}          # 词 -> 来源种子集合
def add(words, src):
    for w in words:
        w = w.strip()
        if not w or len(w) < 2:
            continue
        found.setdefault(w, set()).add(src)

# 第 1 轮：种子词 × 后缀
queries = []
for s in SEEDS:
    for suf in SUFFIXES:
        queries.append(s if not suf else (s + " " + suf))

sys.stderr.write("第1轮 %d 次查询…\n" % len(queries))
for i, q in enumerate(queries, 1):
    add(suggest(q), q)
    if i % 25 == 0:
        sys.stderr.write("  %d/%d  已收 %d 词\n" % (i, len(queries), len(found)))
    time.sleep(0.35)

# 第 2 轮：对第1轮新发现的核心建议词再挖一层
round2 = [w for w in list(found.keys()) if len(w) <= 12][:260]
sys.stderr.write("第2轮 %d 次查询…\n" % len(round2))
for i, q in enumerate(round2, 1):
    add(suggest(q), "L2:" + q)
    if i % 40 == 0:
        sys.stderr.write("  %d/%d  已收 %d 词\n" % (i, len(round2), len(found)))
    time.sleep(0.35)

# 繁体（台湾/香港用词）
tw = ["微信雙開", "手機虛擬定位", "打卡定位修改", "釘釘打卡", "虛擬位置", "定位修改"]
sys.stderr.write("繁体 %d 次查询…\n" % len(tw))
for q in tw:
    add(suggest(q, hl="zh-TW"), "TW:" + q)
    for suf in ["怎麼", "下載", "教學", "ios"]:
        add(suggest(q + " " + suf, hl="zh-TW"), "TW:" + q)
        time.sleep(0.35)

out = {"total": len(found),
       "words": {w: sorted(s) for w, s in sorted(found.items())}}
print(json.dumps(out, ensure_ascii=False, indent=1))
sys.stderr.write("完成：%d 个唯一建议词\n" % len(found))
