(function () {
    if (typeof window.gtag === 'function') {
        window.gtag('set', 'linker', {
            domains: ['zyxstudio.net', 'www.gexiv.com']
        });
    }

    function sendEvent(name, params) {
        if (typeof window.gtag !== 'function') return;
        window.gtag('event', name, Object.assign({
            page_path: window.location.pathname
        }, params || {}));
    }

    function cleanText(value) {
        return (value || '').replace(/\s+/g, ' ').trim().slice(0, 80);
    }

    function cleanLabel(value, fallback) {
        var label = cleanText(value)
            .replace(/(?:https?:\/\/|mailto:)\S+/gi, '')
            .replace(/\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b/g, '')
            .replace(/\+?\d[\d\s().-]{5,}\d/g, '')
            .replace(/((?:微信(?:号|账号)?|wechat(?:\s*(?:id|number))?|whatsapp(?:\s*(?:number|号码))?|邮箱|email|电话|phone|手机号)\s*[:：])\s*\S+/gi, function (match, prefix) {
                return prefix.replace(/\s*[:：]$/, '');
            });

        return cleanText(label) || fallback;
    }

    function getElementLabel(element, fallback) {
        if (!element) return fallback;

        return cleanLabel(
            element.getAttribute('data-analytics-label') ||
            element.getAttribute('data-label') ||
            element.getAttribute('aria-label') ||
            element.textContent || '',
            fallback
        );
    }

    function getConsultSource(element) {
        var sourceElement = element && element.closest && element.closest('[data-consult-source]');
        var source = sourceElement && sourceElement.getAttribute('data-consult-source');

        return cleanLabel(source, 'site_consultation');
    }

    function classifyLink(link) {
        var href = link.getAttribute('href') || '';
        var text = cleanText(link.textContent || link.getAttribute('aria-label') || '');

        if (/gexiv\.com/i.test(href)) {
            return {
                event: 'store_outbound_click',
                channel: 'gexiv_store'
            };
        }

        if (/wa\.me|whatsapp/i.test(href + ' ' + text)) {
            return {
                event: 'whatsapp_click',
                channel: 'whatsapp'
            };
        }

        if (/^mailto:/i.test(href)) {
            return {
                event: 'email_click',
                channel: 'email'
            };
        }

        if (/contact\.html|\/contact\/?$/i.test(href) || /咨询|联系|contact/i.test(text)) {
            return {
                event: 'contact_click',
                channel: 'contact_page'
            };
        }

        return null;
    }

    document.addEventListener('click', function (event) {
        if (!event || event.__zyxstudioConsultationEventHandled) return;
        event.__zyxstudioConsultationEventHandled = true;

        var copyButton = event.target.closest && event.target.closest('button');
        if (copyButton && (
            copyButton.getAttribute('data-wechat-copy') ||
            copyButton.getAttribute('data-copy') ||
            /(?:^|\s)copy-btn(?:\s|$)/.test(copyButton.getAttribute('class') || '') ||
            /复制|copy/i.test(cleanText(copyButton.textContent || copyButton.getAttribute('aria-label') || ''))
        )) {
            // 反馈文案可能包含手动复制的账号，不将它作为统计参数。
            var copyLabel = cleanLabel(copyButton.getAttribute('data-analytics-label') || 'copy_contact', 'copy_contact');
            sendEvent('copy_contact_click', {
                button_text: copyLabel,
                button_label: copyLabel,
                consult_source: getConsultSource(copyButton),
                channel: 'copy_contact'
            });
            return;
        }

        var link = event.target.closest && event.target.closest('a[href]');
        if (!link) return;

        var info = classifyLink(link);
        if (!info) return;

        if (info.event === 'store_outbound_click') {
            sendEvent(info.event, {
                link_url: link.href,
                link_text: cleanText(link.textContent || link.getAttribute('aria-label') || ''),
                channel: info.channel
            });
            return;
        }

        var linkLabel = getElementLabel(link, info.channel);
        sendEvent(info.event, {
            link_text: linkLabel,
            button_label: linkLabel,
            consult_source: getConsultSource(link),
            channel: info.channel
        });
    }, true);

    // 页面在"校验通过后生成草稿""复制成功/失败"等真实动作后调用；
    // 不再监听裸 submit（空表单/校验失败也会计入），不采集表单内容
    window.zsTrack = function (name, params) {
        sendEvent(name, params || {});
    };
})();
