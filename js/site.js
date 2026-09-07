/**
 * 自由行Studio - 全站交互脚本（2026-09 刷新）
 * 职责：移动端菜单（键盘/Escape/焦点/背景滚动）、复制反馈（含失败处理与读屏提示）、旧版 copyText 兼容。
 * 页面需在 </body> 前引入：<script src="js/site.js"></script>
 */
(function () {
    'use strict';

    /* ---------- 读屏提示区 ---------- */
    let announcer = document.getElementById('siteAnnouncer');
    if (!announcer) {
        announcer = document.createElement('div');
        announcer.id = 'siteAnnouncer';
        announcer.setAttribute('role', 'status');
        announcer.setAttribute('aria-live', 'polite');
        announcer.className = 'visually-hidden';
        document.body.appendChild(announcer);
    }
    function announce(text) {
        announcer.textContent = '';
        // 让连续两次提示都能被读到
        window.setTimeout(function () { announcer.textContent = text; }, 30);
    }

    /* ---------- 移动端菜单 ---------- */
    const toggle = document.getElementById('menuToggle');
    const nav = document.getElementById('siteNav');

    function setMenu(open) {
        if (!toggle || !nav) return;
        document.body.classList.toggle('menu-open', open);
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        toggle.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
        if (open) {
            const first = nav.querySelector('a');
            if (first) first.focus();
        } else {
            toggle.focus();
        }
    }

    if (toggle && nav) {
        toggle.addEventListener('click', function () {
            const open = document.body.classList.toggle('menu-open');
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            toggle.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
            if (open) {
                const first = nav.querySelector('a');
                if (first) first.focus();
            }
        });

        // 关闭后回到按钮，Escape 关闭
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && document.body.classList.contains('menu-open')) {
                e.preventDefault();
                document.body.classList.remove('menu-open');
                toggle.setAttribute('aria-expanded', 'false');
                toggle.setAttribute('aria-label', '打开菜单');
                toggle.focus();
            }
            // 简单焦点圈定：菜单打开时 Tab 在菜单内循环
            if (e.key === 'Tab' && document.body.classList.contains('menu-open')) {
                const items = nav.querySelectorAll('a');
                if (!items.length) return;
                const first = items[0];
                const last = items[items.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        });

        // 点击菜单内链接后关闭
        nav.addEventListener('click', function (e) {
            if (e.target.closest('a')) {
                document.body.classList.remove('menu-open');
                toggle.setAttribute('aria-expanded', 'false');
                toggle.setAttribute('aria-label', '打开菜单');
            }
        });

        // 窗口拉宽后清理状态
        window.addEventListener('resize', function () {
            if (window.matchMedia('(min-width: 901px)').matches && document.body.classList.contains('menu-open')) {
                document.body.classList.remove('menu-open');
                toggle.setAttribute('aria-expanded', 'false');
                toggle.setAttribute('aria-label', '打开菜单');
            }
        });
    }

    /* ---------- 复制工具 ---------- */

    // 旧页面 inline onclick="copyText('xxx', this)" 兼容
    window.copyText = function (text, btn) {
        copy(text, btn);
    };

    function fallbackCopy(text, btn) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        let ok = false;
        try {
            ok = document.execCommand('copy');
        } catch (err) {
            ok = false;
        }
        document.body.removeChild(ta);
        return ok;
    }

    function setButtonLabel(btn, label) {
        if (btn) btn.textContent = label;
    }

    // 用操作序号处理连续点击：只有最后一次点击的定时器能恢复文案
    function scheduleRestore(btn, original, delay) {
        btn._copySeq = (btn._copySeq || 0) + 1;
        const seq = btn._copySeq;
        window.setTimeout(function () {
            if (btn._copySeq === seq) setButtonLabel(btn, original);
        }, delay);
    }

    function copy(text, btn, statusBox) {
        const original = btn ? (btn.dataset.originalLabel || btn.textContent || '复制') : '';
        if (btn) btn.dataset.originalLabel = original;
        const doWrite = navigator.clipboard && navigator.clipboard.writeText
            ? navigator.clipboard.writeText(text)
            : Promise.resolve(fallbackCopy(text, btn)).then(function (ok) {
                if (!ok) throw new Error('fallback copy failed');
            });

        // 成功/失败都等剪贴板结果后再反馈，不提前报成功
        doWrite.then(function () {
            setButtonLabel(btn, '已复制');
            announce('已复制');
            if (statusBox) statusBox.textContent = '已复制：' + text + '。请打开微信添加好友继续沟通。';
            if (btn) scheduleRestore(btn, original, 2200);
        }).catch(function () {
            setButtonLabel(btn, '复制失败');
            announce('复制失败，请手动复制');
            if (statusBox) statusBox.textContent = '复制失败。微信号：' + text + '，请手动复制。';
            if (btn) scheduleRestore(btn, original, 2600);
        });
    }

    // 统一代理：data-copy / .copy-btn / [data-wechat-copy]
    // （main.js 加载时会设置 window.HAS_MAIN_JS，避免双重处理）
    document.addEventListener('click', function (e) {
        if (window.HAS_MAIN_JS) return;
        const btn = e.target.closest('[data-copy], .copy-btn, [data-wechat-copy]');
        if (!btn) return;
        const text = btn.getAttribute('data-copy')
            || btn.getAttribute('data-wechat-copy')
            || '';
        if (!text) return;
        e.preventDefault();
        const scope = btn.closest('.contact-item, .contact-card, .page-hero-text, .service-block');
        const statusBox = scope && scope.querySelector('[data-copy-status], .wechat-inline-status');
        copy(text, btn, statusBox);
    }, true);
})();
