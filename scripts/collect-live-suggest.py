#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""挖「海外直播权限」这条线的真实长尾词（Google 搜索建议，中简 + 繁中）。

这条线上一轮完全没覆盖（440 词里 0 个直播词），而它才是纯海外向的业务。
用法: python3 collect-live-suggest.py > data-live-suggest.json
"""
import json
import sys
import time
import urllib.parse
import urllib.request

ENDPOINT = "https://suggestqueries.google.com/complete/search"

SEEDS = [
    # ── 视频号（缺口最大，无独立页）
    "视频号直播", "视频号海外直播", "视频号直播权限", "视频号 国外",
    "微信视频号直播", "视频号直播怎么开", "视频号开播", "视频号直播权限开通",
    # ── 抖音（已有两页，补充词）
    "抖音海外直播", "抖音海外直播权限", "抖音直播权限", "抖音国外直播",
    "抖音海外开播", "抖音直播权限开通", "国外能开抖音直播吗",
    # ── 小红书（无直播权限页）
    "小红书海外直播", "小红书直播权限", "小红书国外直播", "小红书开播",
    # ── 通用
    "海外直播权限", "海外开播", "国外直播", "海外直播权限开通",
    "海外 直播 国内平台", "人在国外直播",
    # ── 繁体（中国台湾/中国香港/新马）
    "視頻號直播", "視頻號海外", "抖音海外直播權限", "海外直播權限",
    "小紅書海外直播", "海外開播",
]

LANGS = ["zh-CN", "zh-TW"]


def fetch(q, hl):
    params = urllib.parse.urlencode({"q": q, "client": "firefox", "hl": hl})
    url = f"{ENDPOINT}?{params}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=15) as r:
        data = json.loads(r.read().decode("utf-8", "replace"))
    return data[1] if len(data) > 1 else []


def main():
    result = {}
    all_words = set()

    for seed in SEEDS:
        for hl in LANGS:
            try:
                sug = fetch(seed, hl)
            except Exception as e:
                print(f"[warn] {seed} ({hl}): {e}", file=sys.stderr)
                continue
            result.setdefault(seed, {})[hl] = sug
            for s in sug:
                all_words.add(s)
            time.sleep(0.35)

    # 二级扩展：对一级结果里带"直播/开播/权限"的词再挖一层
    level2_src = [w for w in sorted(all_words) if any(k in w for k in ("直播", "开播", "权限"))]
    print(f"[info] 一级词 {len(all_words)} 个，二级扩展源 {len(level2_src)} 个", file=sys.stderr)

    for seed in level2_src[:40]:
        try:
            sug = fetch(seed, "zh-CN")
        except Exception as e:
            print(f"[warn] L2 {seed}: {e}", file=sys.stderr)
            continue
        result.setdefault(seed, {}).setdefault("L2", []).extend(sug)
        for s in sug:
            all_words.add(s)
        time.sleep(0.35)

    out = {
        "total": len(all_words),
        "words": sorted(all_words),
        "by_seed": result,
    }
    json.dump(out, sys.stdout, ensure_ascii=False, indent=2)
    print(f"[done] 共 {len(all_words)} 词", file=sys.stderr)


if __name__ == "__main__":
    main()
