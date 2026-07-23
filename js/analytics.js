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
        var copyButton = event.target.closest && event.target.closest('button');
        if (copyButton && /复制|copy/i.test(cleanText(copyButton.textContent || copyButton.getAttribute('aria-label') || ''))) {
            sendEvent('copy_contact_click', {
                button_text: cleanText(copyButton.textContent || copyButton.getAttribute('aria-label') || '')
            });
        }

        var link = event.target.closest && event.target.closest('a[href]');
        if (!link) return;

        var info = classifyLink(link);
        if (!info) return;

        sendEvent(info.event, {
            link_url: link.href,
            link_text: cleanText(link.textContent || link.getAttribute('aria-label') || ''),
            channel: info.channel
        });
    }, true);

    document.addEventListener('submit', function (event) {
        var form = event.target;
        if (!form || form.tagName !== 'FORM') return;

        sendEvent('lead_form_submit', {
            form_id: form.id || '',
            form_name: form.getAttribute('name') || ''
        });
    }, true);
})();
