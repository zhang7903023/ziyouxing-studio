/**
 * 自由行Studio - 主脚本
 * 功能：中英双语切换、表单处理、FAQ折叠、移动端菜单
 */

// ========================================
// 中英双语文本数据
// ========================================
const i18n = {
    zh: {
        'nav.home': '首页',
        'nav.services': '服务项目',
        'nav.contact': '联系我们',
        
        'hero.title': '专业数字服务解决方案',
        'hero.subtitle': '虚拟定位 · 打卡服务 · 涨粉运营 · 海外权限',
        'hero.desc': '服务全球华人，助力你的数字生活',
        'hero.btn.services': '查看服务',
        'hero.btn.contact': '立即咨询',
        
        'features.title': '我们的核心服务',
        'features.subtitle': '覆盖手机工具、办公打卡、社媒运营、海外权限等多场景需求',
        'features.more': '查看全部服务 →',
        
        'service.location.title': '虚拟定位服务',
        'service.location.desc': '通过先进定位修改技术，让你的手机出现在世界任何角落，满足旅游打卡、位置测试等多种需求。',
        'service.location.1': '苹果/安卓手机虚拟定位',
        'service.location.2': '支持海外版本',
        'service.location.3': '支持微信、钉钉、抖音等主流App定位',
        'service.location.price': '¥60 - ¥999',
        
        'service.clock.title': '远程打卡服务',
        'service.clock.desc': '告别迟到烦恼！我们提供专业的远程打卡服务，支持多种考勤系统，让你轻松完成每日打卡。',
        'service.clock.1': '钉钉远程打卡（支持GPS/WiFi打卡）',
        'service.clock.2': '企业微信打卡（支持外勤打卡）',
        'service.clock.3': '自定义打卡时间和位置',
        'service.clock.4': '支持拍照打卡、水印打卡',
        'service.clock.5': '稳定不掉线，告别异常提醒',
        'service.clock.price': '¥199/月 起',
        
        'service.fans.title': '社媒涨粉服务',
        'service.fans.desc': '快速提升账号影响力！我们提供真实用户增长服务，帮助你的内容获得更多曝光。',
        'service.fans.1': '小红书/抖音/视频号涨粉',
        'service.fans.2': '真人粉丝，拒绝机器粉',
        'service.fans.3': '安全不封号，无风险',
        'service.fans.price': '咨询客服获取报价',
        
        'service.overseas.title': '海外直播权限',
        'service.overseas.desc': '解决海外用户无法使用国内平台直播的问题！我们提供专业的海外直播权限开通服务。',
        'service.overseas.1': '抖音海外直播权限开通',
        'service.overseas.2': '视频号海外直播权限',
        'service.overseas.3': '小红书海外直播权限',
        'service.overseas.4': '全程代办，省心省力',
        'service.overseas.5': '快速审核，快速开通',
        'service.overseas.price': '¥500 - ¥800',
        
        'service.clone.title': '手机分身软件',
        'service.clone.desc': '一部手机，多个身份！我们提供专业的手机分身解决方案，让你轻松管理多个账号。',
        'service.clone.1': '苹果手机分身（iOS多开）',
        'service.clone.2': '多账号同时在线',
        'service.clone.3': '数据完全隔离，互不干扰',
        'service.clone.4': '支持微信、抖音、小红书等多App',
        'service.clone.5': '稳定不闪退，使用流畅',
        'service.clone.price': '¥199 - ¥399',
        
        'service.light.title': '聚光开通服务',
        'service.light.desc': '快速开通各平台专业功能！我们提供一站式代办服务，让你快速获得平台认证。',
        'service.light.1': '抖音聚光平台开通',
        'service.light.2': '小红书专业号认证',
        'service.light.3': '视频号互选平台开通',
        'service.light.4': '全程代办，无需自己操作',
        'service.light.5': '快速审核，快速上线',
        'service.light.price': '¥299 - ¥599/项',
        
        'service.price': '参考价格：',
        'service.price_note': '（根据机型和服务内容定价）',
        'service.consult': '立即咨询 →',
        
        'why.title': '为什么选择我们',
        'why.1.title': '安全稳定',
        'why.1.desc': '采用先进加密技术，保护用户隐私安全',
        'why.2.title': '快速响应',
        'why.2.desc': '24小时内完成服务，及时沟通全程透明',
        'why.3.title': '专业可靠',
        'why.3.desc': '多年行业经验，服务超过10000+客户',
        'why.4.title': '售后保障',
        'why.4.desc': '7×24小时在线支持，问题无忧解决',
        
        'cta.title': '准备好开始了吗？',
        'cta.desc': '添加微信或WhatsApp，立即咨询你的需求',
        
        'footer.tagline': '专业数字服务解决方案',
        'footer.services': '服务项目',
        'footer.contact': '联系我们',
        
        'services.page_title': '服务项目',
        'services.page_desc': '一站式数字服务解决方案，满足你的多样化需求',
        'services.cta.title': '没找到你需要的服务？',
        'services.cta.desc': '告诉我们你的需求，定制化服务等你来问',
        'services.cta.contact': '填写咨询表单',
        
        'contact.page_title': '联系我们',
        'contact.page_desc': '有任何问题或需求，欢迎通过以下方式联系我们',
        'contact.info.title': '联系方式',
        'contact.info.wechat': '微信',
        'contact.info.email': '邮箱',
        'contact.copy': '复制',
        'contact.open_whatsapp': '打开 WhatsApp',
        'contact.send_email': '发送邮件',
        'contact.note.title': '⏰ 服务时间',
        'contact.note.time': '24小时在线，留言必回',
        'contact.note.response': '预计回复时间：1-24小时',
        
        'contact.form.title': '在线咨询',
        'contact.form.name': '您的称呼 *',
        'contact.form.contact_method': '联系方式 *',
        'contact.form.contact_value': '联系方式详情 *',
        'contact.form.service': '咨询项目 *',
        'contact.form.message': '留言内容 *',
        'contact.form.submit': '提交咨询',
        'contact.form.select_option': '请选择',
        'contact.form.wechat': '微信',
        'contact.form.whatsapp': 'WhatsApp',
        'contact.form.email': '邮箱',
        'contact.form.location': '虚拟定位服务',
        'contact.form.clock': '远程打卡服务',
        'contact.form.fans': '社媒涨粉服务',
        'contact.form.overseas': '海外权限认证',
        'contact.form.clone': '手机分身软件',
        'contact.form.light': '聚光开通服务',
        'contact.form.other': '其他服务',
        
        'contact.success.title': '提交成功！',
        'contact.success.desc': '我们已收到您的咨询，将在24小时内回复您',
        
        'faq.title': '常见问题',
        'faq.1.q': '服务多久能完成？',
        'faq.1.a': '大部分服务在付款后1-24小时内完成，具体时间根据服务类型而定。',
        'faq.2.q': '付款方式有哪些？',
        'faq.2.a': '支持微信、支付宝、PayPal等支付方式，详情咨询客服。',
        'faq.3.q': '服务有售后吗？',
        'faq.3.a': '我们提供完善的售后服务，如有问题可随时联系客服解决。',
        'faq.4.q': '如何保证账号安全？',
        'faq.4.a': '我们采用行业领先的安全技术，全程加密操作，不留存用户敏感信息。'
    },
    en: {
        'nav.home': 'Home',
        'nav.services': 'Services',
        'nav.contact': 'Contact',
        
        'hero.title': 'Professional Digital Service Solutions',
        'hero.subtitle': 'GPS Spoofing · Attendance · Social Growth · Overseas Access',
        'hero.desc': 'Serving Global Chinese, Empowering Your Digital Life',
        'hero.btn.services': 'View Services',
        'hero.btn.contact': 'Contact Us',
        
        'features.title': 'Our Core Services',
        'features.subtitle': 'Covering mobile tools, attendance, social media, overseas access & more',
        'features.more': 'View All Services →',
        
        'service.location.title': 'GPS Spoofing Service',
        'service.location.desc': 'Advanced location modification technology lets your phone appear anywhere in the world, perfect for travel check-ins and location testing.',
        'service.location.1': 'iPhone/Android GPS Spoofing',
        'service.location.2': 'Overseas Version Available',
        'service.location.3': 'Support WeChat, DingTalk, Douyin & more',
        'service.location.price': '¥60 - ¥999',
        
        'service.clock.title': 'Remote Check-in Service',
        'service.clock.desc': 'Say goodbye to being late! We provide professional remote check-in services supporting multiple attendance systems.',
        'service.clock.1': 'DingTalk Remote Check-in (GPS/WiFi)',
        'service.clock.2': 'WeCom Check-in (Field check-in supported)',
        'service.clock.3': 'Customize check-in time and location',
        'service.clock.4': 'Support photo check-in with watermarks',
        'service.clock.5': 'Stable connection, no alerts',
        'service.clock.price': '$30/month',
        
        'service.fans.title': 'Social Media Growth',
        'service.fans.desc': 'Quickly boost your account influence! We provide real user growth services to help your content get more exposure.',
        'service.fans.1': 'Xiaohongshu/Douyin/Video Account Growth',
        'service.fans.2': 'Real followers, no bots',
        'service.fans.3': 'Safe, no ban risk',
        'service.fans.price': 'Contact for quote',
        
        'service.overseas.title': 'Overseas Live Streaming',
        'service.overseas.desc': 'Solving overseas users issues with domestic live streaming platforms! We provide professional overseas live streaming access services.',
        'service.overseas.1': 'Douyin Overseas Live Access',
        'service.overseas.2': 'Video Account Overseas Live',
        'service.overseas.3': 'Xiaohongshu Overseas Live',
        'service.overseas.4': 'Full agency service, hassle-free',
        'service.overseas.5': 'Fast review, quick activation',
        'service.overseas.price': '¥500 - ¥800',
        
        'service.clone.title': 'Phone Clone/Multi-Account',
        'service.clone.desc': 'One phone, multiple identities! We provide professional phone cloning solutions for easy multi-account management.',
        'service.clone.1': 'iPhone Clone/Multi-instance (iOS)',
        'service.clone.2': 'Multiple accounts online simultaneously',
        'service.clone.3': 'Complete data isolation',
        'service.clone.4': 'Support WeChat, Douyin, Xiaohongshu & more',
        'service.clone.5': 'Stable, no crashes',
        'service.clone.price': '$30 - $60',
        
        'service.light.title': 'Platform Certification Service',
        'service.light.desc': 'Quickly activate platform professional features! We provide one-stop agency services for platform certification.',
        'service.light.1': 'Douyin Jiguang Platform Activation',
        'service.light.2': 'Xiaohongshu Professional Account',
        'service.light.3': 'Video Account Cross-Selection Platform',
        'service.light.4': 'Full agency service',
        'service.light.5': 'Fast review, quick launch',
        'service.light.price': '$50 - $100/item',
        
        'service.price': 'Price: ',
        'service.price_note': '(Based on device and service type)',
        'service.consult': 'Consult Now →',
        
        'why.title': 'Why Choose Us',
        'why.1.title': 'Safe & Secure',
        'why.1.desc': 'Advanced encryption technology protects your privacy',
        'why.2.title': 'Fast Response',
        'why.2.desc': 'Complete within 24 hours, transparent communication',
        'why.3.title': 'Professional & Reliable',
        'why.3.desc': 'Years of experience, 10,000+ satisfied clients',
        'why.4.title': 'After-sales Support',
        'why.4.desc': '24/7 online support, problems solved',
        
        'cta.title': 'Ready to Get Started?',
        'cta.desc': 'Add us on WeChat or WhatsApp for immediate consultation',
        
        'footer.tagline': 'Professional Digital Service Solutions',
        'footer.services': 'Services',
        'footer.contact': 'Contact Us',
        
        'services.page_title': 'Services',
        'services.page_desc': 'One-stop digital service solutions for all your needs',
        'services.cta.title': "Can't Find What You Need?",
        'services.cta.desc': 'Tell us your requirements, custom services available',
        'services.cta.contact': 'Fill Contact Form',
        
        'contact.page_title': 'Contact Us',
        'contact.page_desc': 'Feel free to reach out for any questions or needs',
        'contact.info.title': 'Contact Info',
        'contact.info.wechat': 'WeChat',
        'contact.info.email': 'Email',
        'contact.copy': 'Copy',
        'contact.open_whatsapp': 'Open WhatsApp',
        'contact.send_email': 'Send Email',
        'contact.note.title': '⏰ Service Hours',
        'contact.note.time': '24/7 Online, Response Guaranteed',
        'contact.note.response': 'Response time: 1-24 hours',
        
        'contact.form.title': 'Online Consultation',
        'contact.form.name': 'Your Name *',
        'contact.form.contact_method': 'Contact Method *',
        'contact.form.contact_value': 'Contact Details *',
        'contact.form.service': 'Service Interested *',
        'contact.form.message': 'Message *',
        'contact.form.submit': 'Submit',
        'contact.form.select_option': 'Please select',
        'contact.form.wechat': 'WeChat',
        'contact.form.whatsapp': 'WhatsApp',
        'contact.form.email': 'Email',
        'contact.form.location': 'GPS Spoofing',
        'contact.form.clock': 'Remote Check-in',
        'contact.form.fans': 'Social Media Growth',
        'contact.form.overseas': 'Overseas Access',
        'contact.form.clone': 'Phone Clone',
        'contact.form.light': 'Platform Certification',
        'contact.form.other': 'Other',
        
        'contact.success.title': 'Submitted Successfully!',
        'contact.success.desc': 'We received your inquiry and will respond within 24 hours.',
        
        'faq.title': 'FAQ',
        'faq.1.q': 'How long does the service take?',
        'faq.1.a': 'Most services are completed within 1-24 hours after payment, depending on service type.',
        'faq.2.q': 'What payment methods are available?',
        'faq.2.a': 'We accept WeChat Pay, Alipay, PayPal and more. Contact us for details.',
        'faq.3.q': 'Is there after-sales support?',
        'faq.3.a': 'We provide comprehensive after-sales service. Feel free to contact us if you have any issues.',
        'faq.4.q': 'How do you ensure account security?',
        'faq.4.a': 'We use industry-leading security technology with full encryption. No sensitive user data is stored.'
    }
};

// ========================================
// 语言切换
// ========================================
let currentLang = localStorage.getItem('lang') || 'zh';

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    
    // 更新按钮状态
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });
    
    // 更新HTML lang属性
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    
    // 更新所有带 data-i18n 属性的元素
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        if (i18n[lang] && i18n[lang][key]) {
            el.textContent = i18n[lang][key];
        }
    });
    
    // 更新表单提示占位符
    const placeholders = {
        zh: {
            name: '请输入您的称呼',
            contact: '微信号/WhatsApp/邮箱',
            message: '请详细描述您的需求...'
        },
        en: {
            name: 'Enter your name',
            contact: 'WeChat ID/WhatsApp/Email',
            message: 'Please describe your requirements...'
        }
    };
    
    const nameInput = document.getElementById('name');
    const contactInput = document.getElementById('contact_value');
    const messageInput = document.getElementById('message');
    
    if (nameInput) nameInput.placeholder = placeholders[lang].name;
    if (contactInput) contactInput.placeholder = placeholders[lang].contact;
    if (messageInput) messageInput.placeholder = placeholders[lang].message;
}

// 语言切换按钮事件
document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
});

// ========================================
// 移动端菜单
// ========================================
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const mobileMenu = document.querySelector('.mobile-menu');

if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('show');
    });
    
    // 点击菜单链接后关闭
    mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('show');
        });
    });
}

// ========================================
// 表单处理
// ========================================
const contactForm = document.getElementById('contactForm');
const formSuccess = document.getElementById('formSuccess');

if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(contactForm);
        const data = Object.fromEntries(formData);
        
        // 简单验证
        if (!data.name || !data.contact_method || !data.contact_value || !data.service || !data.message) {
            alert(currentLang === 'zh' ? '请填写所有必填项' : 'Please fill in all required fields');
            return;
        }
        
        // 模拟提交（实际使用时替换为真实API）
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = currentLang === 'zh' ? '提交中...' : 'Submitting...';
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // 显示成功信息
        contactForm.style.display = 'none';
        formSuccess.style.display = 'block';
        
        // 打印数据（实际使用时发送到服务器）
        console.log('Form submitted:', data);
        
        // 如果需要发送邮件，可以使用 mailto:
        // window.location.href = `mailto:zhang7903023@gmail.com?subject=${encodeURIComponent('新咨询: ' + data.service)}&body=${encodeURIComponent(JSON.stringify(data, null, 2))}`;
    });
}

// ========================================
// 复制功能
// ========================================
document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const text = btn.dataset.copy;
        navigator.clipboard.writeText(text).then(() => {
            const originalText = btn.textContent;
            btn.textContent = currentLang === 'zh' ? '已复制!' : 'Copied!';
            setTimeout(() => {
                btn.textContent = originalText;
            }, 2000);
        });
    });
});

// ========================================
// FAQ 折叠
// ========================================
function toggleFaq(element) {
    const item = element.parentElement;
    item.classList.toggle('open');
}

// ========================================
// 滚动显示/隐藏返回顶部按钮
// ========================================
const backTopBtn = document.querySelector('.float-btn.back-top');
if (backTopBtn) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backTopBtn.style.opacity = '1';
            backTopBtn.style.pointerEvents = 'auto';
        } else {
            backTopBtn.style.opacity = '0.5';
            backTopBtn.style.pointerEvents = 'auto';
        }
    });
}

// ========================================
// 页面加载时初始化
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    // 设置初始语言
    setLanguage(currentLang);
    
    // 滚动动画
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    }, observerOptions);
    
    document.querySelectorAll('.feature-card, .service-detail, .why-item').forEach(el => {
        observer.observe(el);
    });
});
