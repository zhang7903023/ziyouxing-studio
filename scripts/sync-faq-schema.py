#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
把页面 FAQPage 结构化数据与「页面上真正可见的问答」严格对齐。

背景：Google 结构化数据政策要求 FAQPage 里声明的问答必须对用户可见。
本脚本以页面可见的 div.faq-item 为唯一真源，反向重建 FAQPage JSON-LD。

用法：
  python3 scripts/sync-faq-schema.py            # 预览差异，不改文件
  python3 scripts/sync-faq-schema.py --write    # 实际写入
  python3 scripts/sync-faq-schema.py --write articles/xxx.html
"""
import re, json, sys, glob, os
from html.parser import HTMLParser

VOID = {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}


class FAQExtractor(HTMLParser):
    """提取每个 div.faq-item 的 问题（首个 h3/h4）+ 答案（其余可见文本）"""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.depth = 0            # faq-item 内嵌套深度
        self.items = []           # [{'q':..., 'a':...}]
        self.cur = None
        self.cap_q = False
        self.cap_a = False
        self.skip = 0             # script/style 深度

    def handle_starttag(self, tag, attrs):
        if tag in ('script', 'style'):
            self.skip += 1
            return
        a = dict(attrs)
        cls = a.get('class') or ''
        if tag in ('div', 'details') and 'faq-item' in cls:
            self.cur = {'q': '', 'a': ''}
            self.items.append(self.cur)
            self.depth = 1
            return
        if self.cur is not None:
            if tag in ('div', 'details'):
                self.depth += 1
            elif tag == 'summary' or (tag in ('h3', 'h4') and not self.cur['q']):
                self.cap_q = True
            elif tag in ('p', 'li', 'span', 'strong', 'td'):
                self.cap_a = True

    def handle_endtag(self, tag):
        if tag in ('script', 'style'):
            self.skip = max(0, self.skip - 1)
            return
        if self.cur is None:
            return
        if tag == 'summary' or tag in ('h3', 'h4'):
            self.cap_q = False
        if tag in ('div', 'details'):
            self.depth -= 1
            if self.depth <= 0:
                self.cur = None
                self.cap_a = False

    def handle_data(self, d):
        if self.cur is None or self.skip:
            return
        if self.cap_q:
            self.cur['q'] += d
        elif self.cap_a:
            self.cur['a'] += d


def clean(t):
    t = re.sub(r'\s+', ' ', t).strip()
    return t


def strip_prefix(q):
    """去掉展示用的 'Q：' 前缀，schema 里用干净的问题"""
    return re.sub(r'^\s*Q\s*[:：]\s*', '', q).strip()


def extract_faq(path):
    s = open(path, encoding='utf-8').read()
    p = FAQExtractor()
    p.feed(s)
    out = []
    for it in p.items:
        q = strip_prefix(clean(it['q']))
        a = clean(it['a'])
        if q and a:
            out.append({'q': q, 'a': a})
    return s, out


def build_faqpage(items):
    ld = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": it['q'],
                "acceptedAnswer": {"@type": "Answer", "text": it['a']},
            } for it in items
        ],
    }
    return json.dumps(ld, ensure_ascii=False, separators=(',', ':'))


def main():
    write = '--write' in sys.argv
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if args:
        files = args
    else:
        files = [f for f in sorted(glob.glob('*.html')) + sorted(glob.glob('articles/*.html'))
                 if not re.search(r'new-design|preview|404|google', f)]

    changed = no_visible = already = 0
    for f in files:
        s, items = extract_faq(f)
        has_ld = bool(re.search(r'"@type"\s*:\s*"FAQPage"', s))
        if not items:
            if has_ld:
                no_visible += 1
                print(f"⚠  {f}")
                print(f"    有 FAQPage 声明，但页面无可见问答 → 需人工处理（补可见FAQ或删schema）")
            continue
        new_ld = build_faqpage(items)
        block = '<script type="application/ld+json">' + new_ld + '</script>'
        m = re.search(r'<script type="application/ld\+json">(\s*\{[^<]*?"@type"\s*:\s*"FAQPage".*?)</script>', s, re.S)
        if m:
            old = m.group(0)
            if old == block:
                already += 1
                continue
            s2 = s[:m.start()] + block + s[m.end():]
        else:
            # 没有则插到 </head> 前
            s2 = s.replace('</head>', '    ' + block + '\n</head>', 1)
        changed += 1
        print(f"✓  {f}  → FAQPage {len(items)} 条（对齐可见内容）")
        if write:
            open(f, 'w', encoding='utf-8').write(s2)

    print(f"\n{'已写入' if write else '预览'}: 待更新 {changed} 个，已一致 {already} 个，无可见问答待人工处理 {no_visible} 个")
    if not write and changed:
        print("（加 --write 才会真正写文件）")


if __name__ == '__main__':
    main()
