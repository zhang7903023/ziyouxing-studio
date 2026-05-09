const data = window.ZYX_PREVIEW_CONTENT;

function setText(selector, value) {
    const node = document.querySelector(selector);
    if (node && value) node.textContent = value;
}

function createEl(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
}

function renderNav() {
    const nav = document.querySelector('.site-nav');
    nav.innerHTML = data.nav.map(item => `<a href="${item.href}">${item.label}</a>`).join('');
}

function renderHero() {
    setText('.brand', data.brand);
    setText('[data-field="hero.eyebrow"]', data.hero.eyebrow);
    setText('[data-field="hero.title"]', data.hero.title);
    setText('[data-field="hero.lead"]', data.hero.lead);
    setText('[data-field="hero.note"]', data.hero.note);
    setText('.hero-actions .button-dark', data.hero.primaryCta);
    setText('.hero-actions .button-light', data.hero.secondaryCta);

    document.querySelectorAll('[data-action="whatsapp"]').forEach(link => {
        link.href = data.contact.whatsappUrl;
    });

    const stats = document.querySelector('.hero-stats');
    stats.innerHTML = '';
    data.hero.stats.forEach(item => {
        const row = createEl('div', 'stat-row');
        row.innerHTML = `<strong>${item.value}</strong><span>${item.label}</span>`;
        stats.appendChild(row);
    });
}

function renderProof() {
    const proof = document.querySelector('.proof-row');
    proof.innerHTML = data.proof.map(item => `<span>${item}</span>`).join('');
}

function renderServices() {
    const grid = document.querySelector('.services-grid');
    grid.innerHTML = '';
    data.services.forEach((service, index) => {
        const card = createEl('a', 'service-card');
        card.href = service.href;
        card.innerHTML = `
            <span class="service-index">${String(index + 1).padStart(2, '0')}</span>
            <span class="service-tag">${service.tag}</span>
            <h3>${service.title}</h3>
            <p>${service.description}</p>
            <div class="service-meta">
                <span>${service.price}</span>
                <span>查看详情</span>
            </div>
        `;
        grid.appendChild(card);
    });
}

function renderScenarios() {
    const grid = document.querySelector('.scenario-grid');
    grid.innerHTML = '';
    data.scenarios.forEach(item => {
        const card = createEl('article', 'scenario-card');
        card.innerHTML = `
            <span>${item.label}</span>
            <h3>${item.title}</h3>
            <p>${item.text}</p>
        `;
        grid.appendChild(card);
    });
}

function renderProcess() {
    const list = document.querySelector('.process-list');
    list.innerHTML = '';
    data.process.forEach((item, index) => {
        const step = createEl('article', 'process-step');
        step.innerHTML = `
            <span>${String(index + 1).padStart(2, '0')}</span>
            <div>
                <h3>${item.title}</h3>
                <p>${item.text}</p>
            </div>
        `;
        list.appendChild(step);
    });
}

function renderFaq() {
    const list = document.querySelector('.faq-list');
    list.innerHTML = '';
    data.faq.forEach(item => {
        const detail = createEl('details', 'faq-item');
        detail.innerHTML = `<summary>${item.question}</summary><p>${item.answer}</p>`;
        list.appendChild(detail);
    });
}

function renderContact() {
    setText('[data-contact="whatsapp"]', data.contact.whatsapp);
    setText('[data-contact="wechat"]', data.contact.wechat);
    setText('[data-contact="email"]', data.contact.email);
    const emailLink = document.querySelector('[data-contact-link="email"]');
    if (emailLink) emailLink.href = `mailto:${data.contact.email}`;
}

function init() {
    renderNav();
    renderHero();
    renderProof();
    renderServices();
    renderScenarios();
    renderProcess();
    renderFaq();
    renderContact();
}

init();
