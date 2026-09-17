#!/usr/bin/env python3
"""百度普通收录 API 推送。
前置：在 ziyuan.baidu.com 完成站点验证后，普通收录->API推送 页面会给出 site 和 token。
用法:
  python3 scripts/baidu-push.py <token> [urls.txt]
  不带 urls.txt 时，默认推送 sitemap.xml 里的全部 URL（分批，每批最多 2000 条）。
"""
import sys, json, re, urllib.request

SITE = "https://zyxstudio.net/"
API = "http://data.zz.baidu.com/urls?site=zyxstudio.net&token={token}"

def urls_from_sitemap():
    xml = open("sitemap.xml", encoding="utf-8").read()
    return re.findall(r"<loc>([^<]+)</loc>", xml)

def main():
    if len(sys.argv) < 2:
        print(__doc__); sys.exit(1)
    token = sys.argv[1]
    if len(sys.argv) > 2:
        urls = [l.strip() for l in open(sys.argv[2], encoding="utf-8") if l.strip()]
    else:
        urls = urls_from_sitemap()
    ok = fail = remain = 0
    for i in range(0, len(urls), 2000):
        batch = urls[i:i+2000]
        req = urllib.request.Request(
            API.format(token=token),
            data="\n".join(batch).encode("utf-8"),
            headers={"Content-Type": "text/plain"},
            method="POST")
        try:
            with urllib.request.urlopen(req, timeout=20) as r:
                res = json.loads(r.read().decode("utf-8"))
            print(f"批次{i//2000+1}: {res}")
            ok += res.get("success", 0)
            remain = res.get("remain", remain)
        except Exception as e:
            print(f"批次{i//2000+1} 失败: {e}")
            fail += 1
    print(f"完成: 成功 {ok} 条，剩余配额 {remain}，失败批次 {fail}")

if __name__ == "__main__":
    main()
