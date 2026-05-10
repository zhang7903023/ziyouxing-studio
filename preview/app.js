const data = window.ZYX_PREVIEW_CONTENT;

function setText(selector, value) {
    const node = document.querySelector(selector);
    if (node && value) node.textContent = value;
}

function createEl(tag, className) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    return node;
}

function renderNav() {
    const nav = document.querySelector('.site-nav');
    nav.innerHTML = data.nav.map(item => `<a href="${item.href}">${item.label}</a>`).join('');
}

function renderHero() {
    setText('[data-brand]', data.brand);
    setText('[data-field="hero.badge"]', data.hero.badge);
    setText('[data-field="hero.titlePrefix"]', data.hero.titlePrefix);
    setText('[data-field="hero.name"]', data.hero.name);
    setText('[data-field="hero.role"]', data.hero.role);
    setText('[data-field="hero.focusPrefix"]', data.hero.focusPrefix);
    setText('[data-field="hero.focus"]', data.hero.focus);
    setText('[data-field="hero.lead"]', data.hero.lead);
    setText('[data-field="hero.note"]', data.hero.note);
    setText('[data-field="hero.avatarLabel"]', data.hero.avatarLabel);
    setText('.hero-actions .button-primary', data.hero.primaryCta);
    setText('.hero-actions .button-secondary', data.hero.secondaryCta);

    document.querySelectorAll('[data-action="whatsapp"]').forEach(link => {
        link.href = data.contact.whatsappUrl;
    });
}

function renderProof() {
    const proof = document.querySelector('.proof-strip');
    proof.innerHTML = '';
    data.proof.forEach((item, index) => {
        const badge = createEl('span', 'proof-pill');
        badge.innerHTML = `<small>${String(index + 1).padStart(2, '0')}</small>${item}`;
        proof.appendChild(badge);
    });
}

function renderServices() {
    const grid = document.querySelector('.services-grid');
    grid.innerHTML = '';
    data.services.forEach((service, index) => {
        const card = createEl('a', `service-card tone-${service.tone || 'pink'}`);
        card.href = service.href;
        card.innerHTML = `
            <div class="service-visual" aria-hidden="true">
                <span>${String(index + 1).padStart(2, '0')}</span>
            </div>
            <div class="service-copy">
                <span class="service-tag">${service.tag}</span>
                <h3>${service.title}</h3>
                <p>${service.description}</p>
                <div class="service-meta">
                    <strong>${service.price}</strong>
                    <span>View case</span>
                </div>
            </div>
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
    renderProcess();
    renderFaq();
    renderContact();
}

init();
