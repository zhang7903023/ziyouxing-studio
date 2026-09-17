#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
把 head 里 FAQPage 结构化数据中「已声明但页面上看不见」的问答，渲染成真实可见的 HTML 区块。

背景：Google 结构化数据政策要求 FAQPage 声明的问答必须对用户可见。
部分页面的 FAQPage 是纯声明（页面零支撑），本脚本以 schema 为真源补出可见内容。

版式自动选择：
  - 引用了 article.css 的页面 → div.faq-block > div.faq-item > h4 + p（静态列表）
  - 其他（服务页，只用 style.css）→ details.faq-item > summary + p（可折叠，匹配 style.css）

用法：
  python3 scripts/render-faq-from-schema.py            # 预览
  python3 scripts/render-faq-from-schema.py --write    # 写入
  python3 scripts/render-faq-from-schema.py --write a.html b.html
"""
import re, json, sys, glob, html

ANCHORS = [
    '<div class="article-cta">',
    '<section class="cta-section">',
    '<div class="related-articles">',
    '<!-- 悬浮咨询按钮 -->',
    '<div class="float-consult">',
    '<footer',
]


def get_faqpage(s):
    for b in re.findall(r'<script type="application/ld\+json">(.*?)</script>', s, re.S):
        try:
            d = json.loads(b)
        except Exception:
            continue
        if isinstance(d, dict) and d.get('@type') == 'FAQPage':
            items = []
            for q in d.get('mainEntity', []):
                name = (q.get('name') or '').strip()
                ans = ((q.get('acceptedAnswer') or {}).get('text') or '').strip()
                if name and ans:
                    items.append((name, ans))
            return items
    return None


def esc(t):
    t = t.replace('&', '&amp;') if not re.search(r'&[a-zA-Z#0-9]+;', t) else t
    return t.replace('<', '&lt;').replace('>', '&gt;')


def has_visible_faq(s):
    body = s.split('</head>')[-1]
    return bool(re.search(r'class="[^"]*faq-item', body))


def build_block(items, is_article, lang, indent):
    head = '常見問題' if lang.startswith('zh-TW') or lang.startswith('zh-Hant') else '常见问题'
    L = []
    pad = ' ' * indent
    if is_article:
        L.append(f'{pad}<h2 id="faq">七、{head}</h2>' if False else f'{pad}<h2 id="faq">{head}</h2>')
        L.append(f'{pad}<div class="faq-block">')
        for q, a in items:
            L.append(f'{pad}    <div class="faq-item">')
            L.append(f'{pad}        <h4>Q：{esc(q)}</h4>')
            L.append(f'{pad}        <p>{esc(a)}</p>')
            L.append(f'{pad}    </div>')
        L.append(f'{pad}</div>')
    else:
        L.append(f'{pad}<section class="faq-section" id="faq">')
        L.append(f'{pad}    <div class="container">')
        L.append(f'{pad}        <h2>{head}</h2>')
        L.append(f'{pad}        <div class="faq-list">')
        for q, a in items:
            L.append(f'{pad}            <details class="faq-item">')
            L.append(f'{pad}                <summary>{esc(q)}</summary>')
            L.append(f'{pad}                <p>{esc(a)}</p>')
            L.append(f'{pad}            </details>')
        L.append(f'{pad}        </div>')
        L.append(f'{pad}    </div>')
        L.append(f'{pad}</section>')
    return '\n'.join(L) + '\n'


def main():
    write = '--write' in sys.argv
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    files = args or [f for f in sorted(glob.glob('*.html')) + sorted(glob.glob('articles/*.html'))
                     if not re.search(r'new-design|preview|404|google', f)]

    done = skip = 0
    for f in files:
        s = open(f, encoding='utf-8').read()
        items = get_faqpage(s)
        if not items:
            continue
        if has_visible_faq(s):
            skip += 1
            continue
        lang = (re.search(r'<html[^>]*\blang="([^"]+)"', s) or [None, 'zh-CN'])[1]
        is_article = 'article.css' in s
        pos = -1
        anchor = None
        for a in ANCHORS:
            p = s.find(a)
            if p != -1:
                pos, anchor = p, a
                break
        if pos == -1:
            print(f"⚠  {f}  找不到插入锚点，跳过")
            continue
        line_start = s.rfind('\n', 0, pos) + 1
        indent = pos - line_start
        block = build_block(items, is_article, lang, indent)
        s2 = s[:line_start] + block + s[line_start:]
        done += 1
        print(f"✓  {f}  插入 {len(items)} 条可见问答（{'文章版式' if is_article else '折叠版式'}，锚点 {anchor[:28]}）")
        if write:
            open(f, 'w', encoding='utf-8').write(s2)

    print(f"\n{'已写入' if write else '预览'}: 补充 {done} 个页面，已有可见问答跳过 {skip} 个")
    if not write and done:
        print("（加 --write 才会真正写文件）")


if __name__ == '__main__':
    main()
