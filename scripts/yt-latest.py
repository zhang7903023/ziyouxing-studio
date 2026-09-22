#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
抓取 @ziyouxingstudio 频道最新视频，写入 latest-video.json 供首页引用。

为什么不用 RSS：
  2026-09-22 实测 https://www.youtube.com/feeds/videos.xml?channel_id=... 恒返回 404
  （响应头 server: YouTube RSS Feeds server），本地与服务器均如此，非 IP 封锁。
  因此改为解析频道 /videos 页面的 ytInitialData。

输出（与原 yt-latest.sh 完全兼容）：
  {"id":"<videoId>","title":"<标题>","updated":"<UTC 日期>"}

用法：
  python3 yt-latest.py                 # 写文件
  python3 yt-latest.py --dry           # 只打印，不写
  python3 yt-latest.py --out /path.json
"""
import argparse
import html as htmlmod
import json
import re
import sys
import urllib.request
from datetime import datetime, timezone

HANDLE = "ziyouxingstudio"
PAGE_URL = f"https://www.youtube.com/@{HANDLE}/videos"
UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36"
)
DEFAULT_OUT = "/srv/zyxstudio/site/latest-video.json"


def fetch(url: str, timeout: int = 30) -> str:
    req = urllib.request.Request(
        url,
        headers={"User-Agent": UA, "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8"},
    )
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode("utf-8", "ignore")


def extract_initial_data(page: str) -> dict:
    m = re.search(r"var ytInitialData\s*=\s*(\{.*?\});</script>", page, re.S)
    if not m:
        m = re.search(r'ytInitialData"\]\s*=\s*(\{.*?\});', page, re.S)
    if not m:
        raise RuntimeError("未找到 ytInitialData")
    return json.loads(m.group(1))


def _title_of(node):
    """从 {title:{runs:[{text}]}} 或 {title:{simpleText}} 或 {title:{content}} 取标题"""
    t = node.get("title") if isinstance(node, dict) else None
    if isinstance(t, dict):
        if isinstance(t.get("runs"), list) and t["runs"]:
            return t["runs"][0].get("text", "")
        if "simpleText" in t:
            return t["simpleText"]
        if "content" in t:
            return t["content"]
    return ""


def collect_videos(obj, out):
    """递归收集视频节点，保持 DOM 顺序。
    兼容两种结构：
      - lockupViewModel  （YouTube 2024+ 新版网格页，实测 /videos 页在用）
      - videoRenderer    （旧版结构，作为兜底）
    """
    if isinstance(obj, dict):
        lv = obj.get("lockupViewModel")
        if isinstance(lv, dict):
            vid = lv.get("contentId")
            if vid and re.fullmatch(r"[A-Za-z0-9_-]{11}", vid):
                md = lv.get("metadata", {}).get("lockupMetadataViewModel", {})
                title = ""
                t = md.get("title")
                if isinstance(t, dict):
                    title = t.get("content", "") or _title_of(md)
                pub = ""
                cm = md.get("metadata", {}).get("contentMetadataViewModel", {})
                rows = cm.get("metadataRows") or []
                if rows:
                    parts = [
                        p.get("text", {}).get("content", "")
                        for p in rows[0].get("metadataParts", [])
                    ]
                    pub = " · ".join([p for p in parts if p])
                out.append({"id": vid, "title": htmlmod.unescape(title), "published": pub})

        vr = obj.get("videoRenderer")
        if isinstance(vr, dict):
            vid = vr.get("videoId")
            if vid and re.fullmatch(r"[A-Za-z0-9_-]{11}", vid):
                p = vr.get("publishedTimeText")
                out.append({
                    "id": vid,
                    "title": htmlmod.unescape(_title_of(vr)),
                    "published": p.get("simpleText", "") if isinstance(p, dict) else "",
                })

        for v in obj.values():
            collect_videos(v, out)
    elif isinstance(obj, list):
        for v in obj:
            collect_videos(v, out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry", action="store_true", help="只打印不写文件")
    ap.add_argument("--out", default=DEFAULT_OUT, help="输出路径")
    args = ap.parse_args()

    page = fetch(PAGE_URL)
    data = extract_initial_data(page)

    videos = []
    collect_videos(data, videos)

    if not videos:
        print("FAIL: /videos 页面未解析出任何视频", file=sys.stderr)
        return 1

    latest = videos[0]
    payload = {
        "id": latest["id"],
        "title": latest["title"],
        "updated": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
    }

    print(f"解析到 {len(videos)} 个视频，取最新：")
    for v in videos[:5]:
        print(f"  · {v['id']}  {v['published']:>12}  {v['title'][:60]}")
    print("\n写入内容：")
    print("  " + json.dumps(payload, ensure_ascii=False))

    if args.dry:
        print("\n--dry 模式，未写文件。")
        return 0

    with open(args.out, "w", encoding="utf-8") as f:
        f.write(json.dumps(payload, ensure_ascii=False) + "\n")
    print(f"\n已写入 {args.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
