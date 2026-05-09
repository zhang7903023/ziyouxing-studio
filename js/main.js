/**
 * 自由行Studio - 主脚本
 */

const pageKey = (() => {
    const path = window.location.pathname.replace(/\/+$/, '');
    const file = path.split('/').pop() || 'index.html';
    if (!file || file === 'index.html') return 'home';
    return file.replace('.html', '');
})();

const pageTitles = {
    home: {
        zh: '自由行Studio｜iPhone/安卓虚拟定位·远程打卡一对一配置',
        en: 'Ziyouxing Studio | iPhone & Android Virtual Location and Remote Check-in Setup'
    },
    services: {
        zh: '服务总览｜iPhone/安卓虚拟定位·远程打卡配置 - 自由行Studio',
        en: 'Services | Virtual Location, Remote Check-in and Account Environment Setup - Ziyouxing Studio'
    },
    'virtual-location': {
        zh: 'iPhone/安卓虚拟定位配置｜微信/钉钉/水印相机 GPS 定位调整 - 自由行Studio',
        en: 'iPhone & Android Virtual Location Setup | WeChat, DingTalk and GPS Support - Ziyouxing Studio'
    },
    'remote-checkin': {
        zh: '钉钉/企业微信远程打卡配置｜GPS/WiFi定位异常处理 - 自由行Studio',
        en: 'DingTalk and WeCom Remote Check-in Setup | GPS / WiFi Attendance Support - Ziyouxing Studio'
    },
    'overseas-live': {
        zh: '抖音/小红书/视频号海外直播权限开通 - 自由行Studio',
        en: 'Overseas Live-stream Access | Douyin, Xiaohongshu and WeChat Channels - Ziyouxing Studio'
    },
    'phone-clone': {
        zh: '苹果手机分身/iOS多开配置 - 自由行Studio',
        en: 'iPhone App Clone and iOS Multi-account Setup - Ziyouxing Studio'
    },
    'platform-auth': {
        zh: '抖音巨量引擎/小红书聚光/视频号互选平台代办 - 自由行Studio',
        en: 'Platform Verification and Ad Account Setup - Ziyouxing Studio'
    },
    'social-media-growth': {
        zh: '抖音/小红书/视频号涨粉服务 - 自由行Studio',
        en: 'Douyin, Xiaohongshu and WeChat Channels Growth Service - Ziyouxing Studio'
    },
    contact: {
        zh: '联系自由行Studio｜微信 WhatsApp 邮箱',
        en: 'Contact Ziyouxing Studio | WeChat, WhatsApp and Email'
    }
};

const translations = {
    common: [
        { selector: '.nav-link[href="index.html"], .nav-link[href="../index.html"], .mobile-menu > a[href="index.html"], .mobile-menu > a[href="../index.html"], .footer-links a[href="index.html"], .footer-links a[href="../index.html"]', zh: '首页', en: 'Home' },
        { selector: '.nav-link[href="services.html"], .nav-link[href="../services.html"], .mobile-menu > a[href="services.html"], .mobile-menu > a[href="../services.html"], .footer-links a[href="services.html"], .footer-links a[href="../services.html"]', zh: '服务', en: 'Services' },
        { selector: '.nav-link[href="articles/"], .nav-link[href="../articles/"], .mobile-menu > a[href="articles/"], .mobile-menu > a[href="../articles/"], .footer-links a[href="articles/"], .footer-links a[href="../articles/"]', zh: '教程', en: 'Guides' },
        { selector: '.nav-link[href="contact.html"], .nav-link[href="../contact.html"], .mobile-menu > a[href="contact.html"], .mobile-menu > a[href="../contact.html"], .footer-links a[href="contact.html"], .footer-links a[href="../contact.html"]', zh: '联系', en: 'Contact' },
        { selector: '.mobile-menu-btn', attr: 'aria-label', zh: '菜单', en: 'Menu' },
        { selector: '.footer-tagline', zh: '一对一设备环境配置与技术支持', en: 'One-on-one device environment setup and technical support' },
        { selector: '.consult-btn', zh: '咨询', en: 'Contact' },
        { selector: '.consult-popup a[href="contact.html"]', zh: '微信', en: 'WeChat' },
        { selector: '.contact-label', zh: ['微信', 'WhatsApp', '邮箱'], en: ['WeChat', 'WhatsApp', 'Email'] },
        { selector: '.copy-btn', zh: '复制', en: 'Copy' },
        { selector: '.contact-link', zh: ['打开', '写信'], en: ['Open', 'Email'] },
        { selector: '.footer .footer-links p:nth-child(1)', zh: '微信：yes1974g', en: 'WeChat: yes1974g' },
        { selector: '.footer .footer-links p:nth-child(2)', zh: '邮箱：zhang7903023@gmail.com', en: 'Email: zhang7903023@gmail.com' }
    ],
    home: [
        { selector: '.hero .hero-kicker', zh: '自由行Studio · 一对一远程配置', en: 'Ziyouxing Studio · One-on-one remote setup' },
        { selector: '.hero h1', zh: 'iPhone / 安卓虚拟定位，远程打卡直接给你配好', en: 'iPhone / Android virtual location and remote check-in setup, handled one-on-one' },
        { selector: '.hero-subtitle', zh: '支持 iOS 17/18/26 免越狱、安卓免 ROOT，覆盖钉钉、企业微信、飞书、微信、水印相机等常见场景。', en: 'Support for iOS 17/18/26 without jailbreak and Android without root, covering DingTalk, WeCom, Feishu, WeChat, watermark camera and other location-based scenarios.' },
        { selector: '.hero-desc', zh: '先发机型、系统版本和目标 App，我先判断能不能做，再给你最省时间的方案。通常 15-30 分钟完成配置，海外也能远程处理。', en: 'Send your phone model, system version and target app first. I will check feasibility and suggest the fastest workable path. Most common cases can be handled remotely in 15-30 minutes.' },
        { selector: '.hero-btns .btn-primary', zh: 'WhatsApp 立即咨询', en: 'Contact on WhatsApp' },
        { selector: '.hero-btns .btn-outline', zh: '发机型先确认', en: 'Send device info first' },
        { selector: '.hero-note', zh: '建议直接发：手机型号、iOS/安卓版本、目标 App、当前报错截图。', en: 'Best to send: phone model, iOS / Android version, target app and a screenshot of the current issue.' },
        { selector: '.hero-proof span', zh: ['免越狱 / 免 ROOT', '15-30 分钟远程配置', '支持海外用户', '配置后可继续问'], en: ['No jailbreak / no root first', '15-30 minute remote setup', 'Works for overseas users', 'Follow-up support available'] },
        { selector: '.proof-strip .proof-card strong', zh: ['主打需求', '沟通方式', '适用人群', '售后方式'], en: ['Main requests', 'How to contact', 'Who it fits', 'After-sales support'] },
        { selector: '.proof-strip .proof-card span', zh: ['iPhone / 安卓虚拟定位、钉钉 / 企业微信远程打卡', '微信、WhatsApp 直接发机型和报错截图即可', '海外华人、远程办公、外勤打卡、内容账号运营', '不是发完教程就结束，后续问题可继续确认'], en: ['iPhone / Android virtual location, DingTalk / WeCom remote check-in', 'Send your model and screenshots via WeChat or WhatsApp', 'Overseas Chinese users, remote work, field check-in and content accounts', 'Not just a tutorial link. Follow-up questions are welcome.'] },
        { selector: '.why-us .section-title', zh: '为什么很多人先来问我能不能做', en: 'Why people ask me before trying random tools' },
        { selector: '.why-item h3', zh: ['先判断机型和场景', '直接远程配到能用', '后续有问题还能继续问'], en: ['Check device and scenario first', 'Remote setup until it works', 'Follow-up support after setup'] },
        { selector: '.why-item p', zh: ['不是先收钱再试。先看你的手机型号、系统版本、目标 App 和报错，再告诉你值不值得做。', '尽量不让你自己到处试。沟通清楚后，按你的设备环境直接配置，省掉反复试错的时间。', '不是发个教程链接就结束。配置后如果系统更新、App 改规则，后续还能继续确认。'], en: ['No blind trial first. I check your phone model, system version, target app and error screenshots before advising.', 'I try to avoid making you test random steps. Once the case is clear, setup is guided around your device environment.', 'It does not end with one tutorial link. If system updates or app rules change, you can still ask for follow-up help.'] },
        { selector: '.services > .container > .section-title', zh: '热门需求', en: 'Popular Requests' },
        { selector: '.service-card h3', zh: ['iPhone / 安卓虚拟定位', '钉钉 / 企业微信远程打卡', '海外直播权限开通', 'App 分身 / 聚光 / 专业号'], en: ['iPhone / Android Virtual Location', 'DingTalk / WeCom Remote Check-in', 'Overseas Live-stream Access', 'App Clone / Jiguang / Pro Account'] },
        { selector: '.service-card p', zh: ['免越狱、免 ROOT 方案为主，覆盖微信、钉钉、企业微信、水印相机、小红书、抖音等常见 App。', '处理 GPS / WiFi 双重校验、异地打卡、海外定位异常、不在打卡范围内等常见问题。', '抖音、小红书、视频号海外开播相关咨询与协助，适合人在海外但目标市场仍在国内的平台需求。', '补充处理微信分身、多账号环境、聚光平台开户、专业号认证等延伸需求。'], en: ['No-jailbreak and no-root options first, covering WeChat, DingTalk, WeCom, watermark camera, Xiaohongshu, Douyin and more.', 'For GPS / WiFi validation, remote work, overseas location issues and out-of-range check-in prompts.', 'Consultation and support for Douyin, Xiaohongshu and WeChat Channels live-stream access when you are overseas.', 'Additional help with WeChat clones, multi-account environments, Jiguang ad accounts and professional account setup.'] },
        { selector: '.result-heading .guides-title', zh: '大家通常来问的真实场景', en: 'Common real-world scenarios' },
        { selector: '.result-heading p', zh: '把自己的情况代进去看，如果很像，直接把机型和截图发过来会更快。', en: 'If your case looks similar, send your phone model and screenshots directly. It saves a lot of back-and-forth.' },
        { selector: '.result-card .result-tag', zh: ['iPhone 定位', '远程打卡', '账号环境'], en: ['iPhone location', 'Remote check-in', 'Account environment'] },
        { selector: '.result-card h4', zh: ['人在海外，微信 / 小红书 / 抖音想显示国内城市', '钉钉 / 企业微信提示不在范围内，或 GPS / WiFi 校验不过', '想做多开分身、直播权限或聚光平台开户'], en: ['Overseas, but WeChat / Xiaohongshu / Douyin should show a China city', 'DingTalk / WeCom says out of range, or GPS / WiFi validation fails', 'Need app clones, live access or Jiguang ad account setup'] },
        { selector: '.result-card p', zh: ['常见于内容运营、账号养号、朋友圈定位和直播预热。重点先看 iOS 版本、目标 App 和是否要兼容多场景。', '常见于远程办公、出差、海外打卡。重点先看打卡方式、是否有 WiFi 限制、是否出现异常告警。', '这类需求通常和定位、账号归属地、设备环境一起判断，先确认目标平台和当前卡在哪一步更重要。'], en: ['Common for content operations, account warming, Moments location and live-stream preparation. The key is iOS version, target app and multi-app compatibility.', 'Common for remote work, business trips and overseas check-in. The key is the check-in method, WiFi limits and any abnormal warnings.', 'These cases often involve location, account region and device environment together. The first step is finding exactly where the process is stuck.'] },
        { selector: '.guides-section .guides-title', zh: '相关教程', en: 'Related Guides' },
        { selector: '.guides-more', zh: '查看全部教程 →', en: 'View all guides →' },
        { selector: '.subscribe-btn', zh: '订阅', en: 'Subscribe' },
        { selector: '.platforms-section .platforms-label', zh: '支持平台', en: 'Supported Platforms' },
        { selector: '.compat-section .platforms-label', zh: '支持范围', en: 'Scope' },
        { selector: '.compat-section .section-title', zh: '先看你是不是这几类需求', en: 'Check whether your case fits these categories' },
        { selector: '.compat-desc', zh: '不是所有设备和场景都适合同一套方案。下面这张表可以先帮你快速判断，大方向对了，再来聊细节会更省时间。', en: 'Not every device or scenario fits the same solution. This quick table helps you see whether the direction is right before we discuss details.' },
        { selector: '.compat-col h3', zh: ['设备环境', '常见 App', '最常问的问题'], en: ['Device environment', 'Common apps', 'Frequent questions'] },
        { selector: '[data-i18n="how.title"]', zh: '合作流程', en: 'How It Works' },
        { selector: '[data-i18n="how.1.title"]', zh: '1. 发机型和需求', en: '1. Send device and request' },
        { selector: '[data-i18n="how.1.desc"]', zh: '把手机型号、系统版本、目标 App 和当前报错发过来，我先判断能不能做。', en: 'Send your phone model, system version, target app and current error screenshot. I will first check feasibility.' },
        { selector: '[data-i18n="how.2.title"]', zh: '2. 确认方案再处理', en: '2. Confirm the plan first' },
        { selector: '[data-i18n="how.2.desc"]', zh: '确认适合你的方案后再开始，尽量减少无效尝试，也避免你走弯路。', en: 'We start only after confirming the suitable plan, reducing wasted attempts and confusion.' },
        { selector: '[data-i18n="how.3.title"]', zh: '3. 配置后继续跟进', en: '3. Follow up after setup' },
        { selector: '[data-i18n="how.3.desc"]', zh: '配置完成后会一起测试，后续如果系统更新或场景变化，也可以继续联系确认。', en: 'After setup, we test together. If your system updates or scenario changes later, you can continue to ask.' },
        { selector: '.intake-section .platforms-label', zh: '咨询前先准备', en: 'Before contacting' },
        { selector: '.intake-copy h2', zh: '这样发消息，判断会快很多', en: 'Send these details to get a faster answer' },
        { selector: '.intake-copy p', zh: '我最需要的是你当前设备环境和报错现场，不是“能不能做”这五个字。把下面几项一起发过来，通常能更快给你明确结论。', en: 'The most useful information is your device environment and current error, not only “can it be done?”. Send the items below and I can usually give a clearer answer faster.' },
        { selector: '.intake-item strong', zh: ['1. 手机信息', '2. 目标 App', '3. 目标效果', '4. 当前截图'], en: ['1. Phone info', '2. Target app', '3. Desired result', '4. Current screenshot'] },
        { selector: '.intake-item span', zh: ['品牌型号、iPhone 或安卓、系统版本', '钉钉、企业微信、微信、小红书、抖音、水印相机等', '改城市、远程打卡、处理异地告警、开播权限、多开分身', '报错提示、打卡异常、App 页面截图，有图比纯文字快很多'], en: ['Brand, model, iPhone or Android, and system version', 'DingTalk, WeCom, WeChat, Xiaohongshu, Douyin, watermark camera, etc.', 'Change city, remote check-in, resolve region warning, live access, app clone', 'Error prompt, check-in issue or app screenshot. Screenshots are much faster than text.'] },
        { selector: '.intake-actions .btn-primary', zh: '把截图发到 WhatsApp', en: 'Send screenshots on WhatsApp' },
        { selector: '.intake-actions .btn-outline', zh: '查看微信和邮箱', en: 'View WeChat and email' },
        { selector: '.faq-section .section-title', zh: '常见问题', en: 'FAQ' },
        { selector: '[data-i18n="contact.title"]', zh: '直接把你的情况发过来', en: 'Send your case directly' },
        { selector: '[data-i18n="contact.desc"]', zh: '最有效的发法是：手机型号、系统版本、目标 App、报错截图、你想达到的效果。我会先判断，再告诉你下一步。', en: 'Best message format: phone model, system version, target app, screenshot and desired result. I will check first and then suggest the next step.' },
        { selector: '.final-cta .platforms-label', zh: '最后一步', en: 'Next step' },
        { selector: '.final-cta h2', zh: '别先问“能不能做”，先把截图发过来', en: 'Instead of asking “can it be done?”, send the screenshots first' },
        { selector: '.final-cta p', zh: '你发得越具体，我给结论越快。手机型号、系统版本、目标 App、报错页面，这四样最重要。', en: 'The more specific your message is, the faster I can answer. Phone model, system version, target app and error page matter most.' },
        { selector: '.final-cta .btn-primary', zh: 'WhatsApp 发截图', en: 'Send screenshots on WhatsApp' },
        { selector: '.final-cta .btn-outline', zh: '看微信联系方式', en: 'View WeChat contact' }
    ],
    services: [
        { selector: '.page-hero .hero-kicker', zh: '服务总览 · 先判断再配置', en: 'Services · Check first, then configure' },
        { selector: '.page-hero h1', zh: '把设备和截图发来，我先判断哪种方案最合适', en: 'Send your device info and screenshots. I will choose the most suitable path first.' },
        { selector: '.page-hero p', zh: '覆盖 iPhone / 安卓虚拟定位、钉钉 / 企业微信远程打卡、海外直播权限、App 分身和账号环境配置。重点不是让你自己研究教程，而是先确认机型、系统和目标 App，再给可执行方案。', en: 'Services include iPhone / Android virtual location, DingTalk / WeCom remote check-in, overseas live-stream access, app clone and account environment setup. The goal is not to make you study tutorials, but to confirm your device, system and target app first.' },
        { selector: '.page-hero .btn-primary', zh: 'WhatsApp 发截图', en: 'Send screenshots on WhatsApp' },
        { selector: '.page-hero .btn-outline', zh: '查看微信联系方式', en: 'View WeChat contact' },
        { selector: '.proof-strip .proof-card strong', zh: ['先看设备', '远程处理', '按场景报价', '后续跟进'], en: ['Check device first', 'Remote support', 'Scenario-based quote', 'Follow-up support'] },
        { selector: '.proof-strip .proof-card span', zh: ['iPhone / 安卓、系统版本、目标 App 是判断方案的关键。', '适合海外、异地办公、外勤和内容运营用户远程沟通。', '不同机型、平台和校验方式差异很大，先确认再报价。', '配置后遇到系统更新或 App 变化，可以继续确认。'], en: ['Phone type, system version and target app are the key factors.', 'Works for overseas users, remote work, field work and content operations.', 'Different devices, apps and validation rules can change the price. We confirm first.', 'If system updates or app rules change later, we can continue checking.'] },
        { selector: '.service-page-head .platforms-label', zh: '核心服务', en: 'Core Services' },
        { selector: '.service-page-head .section-title', zh: '按你的目标来选，不用先懂技术', en: 'Choose by your goal, not by technical jargon' },
        { selector: '.service-page-head > p', zh: '如果你不确定自己属于哪一类，直接发机型、系统版本和报错截图。我会先判断是否适合处理，再告诉你下一步。', en: 'If you are not sure which category fits, send your model, system version and screenshots. I will first check whether it is suitable to handle.' },
        { selector: '.service-block h2', zh: ['iPhone / 安卓虚拟定位', '钉钉 / 企业微信远程打卡', '海外直播权限开通', 'App 分身 / 多账号环境', '聚光 / 专业号 / 平台认证', '账号增长与运营辅助'], en: ['iPhone / Android Virtual Location', 'DingTalk / WeCom Remote Check-in', 'Overseas Live-stream Access', 'App Clone / Multi-account Environment', 'Jiguang / Pro Account / Platform Verification', 'Account Growth and Operation Support'] },
        { selector: '.service-block .service-intro', zh: ['适合微信、钉钉、企业微信、水印相机、小红书、抖音等定位场景。先看系统版本、App 版本和是否要兼顾多个 App。', '适合海外、异地办公、外勤、出差等场景。重点先判断 GPS、WiFi、拍照、异常告警这些校验条件。', '适合人在海外，但要处理抖音、小红书、视频号等国内平台直播或账号环境问题的用户。', '适合需要微信、抖音、小红书等多账号环境的用户。先看机型、系统和目标 App，再判断方案。', '适合需要抖音聚光、小红书专业号、视频号互选等平台功能开通和资料准备的用户。', '适合抖音、小红书、视频号等账号基础增长和运营配套需求。具体按平台、目标数量和账号状态评估。'], en: ['For WeChat, DingTalk, WeCom, watermark camera, Xiaohongshu, Douyin and other GPS-based app scenarios. We check system and app versions first.', 'For overseas users, remote work, field work and business trips. The key is checking GPS, WiFi, photo and abnormal-warning rules.', 'For overseas users who need support with Douyin, Xiaohongshu, WeChat Channels live access or account environment issues.', 'For users who need multiple app/account environments for WeChat, Douyin, Xiaohongshu and more. Device and target app come first.', 'For users who need help preparing and opening platform functions such as Douyin Jiguang, Xiaohongshu pro account or WeChat Channels matching.', 'For basic account growth and operation support on Douyin, Xiaohongshu and WeChat Channels. It depends on platform, target quantity and account status.'] },
        { selector: '.service-actions .btn-outline', zh: '查看详情', en: 'Details' },
        { selector: '.service-actions .btn-primary', zh: ['发机型确认', '发报错截图', '联系咨询', '联系咨询', '联系咨询', '联系咨询'], en: ['Send device info', 'Send error screenshot', 'Contact me', 'Contact me', 'Contact me', 'Contact me'] },
        { selector: '.intake-card .platforms-label', zh: '咨询前准备', en: 'Before contacting' },
        { selector: '.intake-card h2', zh: '你发的信息越完整，我判断越快', en: 'The more details you send, the faster I can judge' },
        { selector: '.intake-actions .btn-primary', zh: 'WhatsApp 发截图', en: 'Send screenshots on WhatsApp' },
        { selector: '.intake-actions .btn-outline', zh: '查看微信联系方式', en: 'View WeChat contact' },
        { selector: '.related-articles h3', zh: '相关教程', en: 'Related Guides' },
        { selector: '.contact-section .section-title', zh: '直接把你的情况发过来', en: 'Send your case directly' },
        { selector: '.contact-desc', zh: '最有效的发法是：手机型号、系统版本、目标 App、报错截图、你想达到的效果。我会先判断，再告诉你下一步。', en: 'Best message format: phone model, system version, target app, screenshot and desired result. I will check first and then suggest the next step.' }
    ],
    'virtual-location': [
        { selector: '.page-hero .hero-kicker', zh: 'GPS 坐标配置 · 先判断设备和 App', en: 'GPS coordinate setup · Check device and app first' },
        { selector: '.page-hero h1', zh: 'iPhone / 安卓虚拟定位，先看系统版本和目标 App', en: 'iPhone / Android virtual location, based on your system version and target app' },
        { selector: '.page-hero p', zh: '适合微信、钉钉、企业微信、水印相机、抖音、小红书等基于 GPS 坐标的场景。先确认机型、系统、App 版本和校验规则，再给远程配置建议。', en: 'For GPS-based scenarios such as WeChat, DingTalk, WeCom, watermark camera, Douyin and Xiaohongshu. We check the device, system, app version and validation rules before setup.' },
        { selector: '.page-hero .btn-primary', zh: 'WhatsApp 发截图', en: 'Send screenshots on WhatsApp' },
        { selector: '.page-hero .btn-outline', zh: '查看微信联系方式', en: 'View WeChat contact' },
        { selector: '.service-block > h2', zh: ['iPhone 苹果手机虚拟定位（免越狱）', '安卓手机虚拟定位（免ROOT）', '支持的 App 平台（示例）', '联系方式'], en: ['iPhone Virtual Location Setup', 'Android Virtual Location Setup', 'Supported Apps and Platforms', 'Contact'] },
        { selector: '.service-block > p', zh: ['需要把 iPhone 的 GPS 坐标定位修改到指定城市/地点，用于定位测试、外勤/打卡场景、LBS 功能测试等（不是改 IP）。', '通过「创建分身 App」实现分身内定位修改，修改的是 GPS 坐标，只对分身生效。'], en: ['For setting an iPhone GPS coordinate to a specific city or place for location testing, field work, check-in scenarios or LBS testing. This is GPS, not IP.', 'For Android, setup is usually handled inside a cloned app environment. It changes GPS coordinates inside that clone, not the whole network IP.'] },
        { selector: '.service-block h3', zh: ['核心特点', '使用步骤（1–2 分钟）', '支持设备（全系列）', '使用步骤', '适配说明（v1.5）', '相关服务', '相关教程'], en: ['Key points', 'Setup steps (1-2 minutes)', 'Supported devices', 'Setup steps', 'Compatibility notes (v1.5)', 'Related services', 'Related guides'] },
        { selector: '.feature-name', zh: ['无需越狱', '即插即用', '1–2 分钟上手'], en: ['No jailbreak first', 'Plug and follow steps', '1-2 minute onboarding'] },
        { selector: '.feature-desc', zh: ['直接远程配置', '插上设备按步骤操作', '快速完成定位修改'], en: ['Remote guidance available', 'Connect and follow the steps', 'Quick GPS coordinate setup'] },
        { selector: '.details-block summary', zh: ['为什么一直强调「GPS 不是 IP」？', '各版本权益详情', '方案原理（务必看）', '如何验证是否生效', '服务包含', '恢复真实定位 / 清理方法', '常见问题'], en: ['Why GPS is not IP', 'Version details', 'How the Android approach works', 'How to verify it works', 'What the service includes', 'Restore real location / cleanup', 'FAQ'] },
        { selector: '.btn.btn-primary[style]', zh: '立即咨询 →', en: 'Contact now →' },
        { selector: '.related-services h3', zh: '相关服务', en: 'Related Services' },
        { selector: '.related-articles h3', zh: '相关教程', en: 'Related Guides' },
        { selector: '.contact-section .section-title', zh: '直接联系我', en: 'Contact Me Directly' },
        { selector: '.contact-desc', zh: '把设备、平台和当前问题简单发过来。我会先判断，再告诉你怎么沟通更有效。', en: 'Send your device, platform and current issue. I will check first and then tell you the best next step.' }
    ],
    'remote-checkin': [
        { selector: '.page-hero .hero-kicker', zh: '考勤定位配置 · 先看规则再处理', en: 'Attendance location setup · Check rules first' },
        { selector: '.page-hero h1', zh: '钉钉 / 企业微信打卡异常，先判断 GPS、WiFi 和拍照校验', en: 'DingTalk / WeCom check-in issues: check GPS, WiFi and photo validation first' },
        { selector: '.page-hero p', zh: '遇到不在考勤范围、海外/异地提示、GPS 偏移、WiFi 考勤、外勤拍照等情况，不建议盲目试工具。把机型、系统版本、考勤规则和报错截图发来，先判断哪种配置方式更稳。', en: 'If you see out-of-range, overseas / remote-location prompts, GPS drift, WiFi attendance or photo check-in rules, do not try random tools first. Send your device, system version, attendance rules and screenshots so I can check the safer path.' },
        { selector: '.page-hero .btn-primary', zh: 'WhatsApp 发截图', en: 'Send screenshots on WhatsApp' },
        { selector: '.page-hero .btn-outline', zh: '查看微信联系方式', en: 'View WeChat contact' },
        { selector: '.proof-strip .proof-card strong', zh: ['先看规则', '看设备环境', '远程协助', '不盲目承诺'], en: ['Check rules first', 'Check device environment', 'Remote support', 'No blind promises'] },
        { selector: '.proof-strip .proof-card span', zh: ['GPS、WiFi、拍照、外勤审批，每种考勤规则处理方式不同。', 'iPhone 看 iOS 版本，安卓看品牌系统和权限环境。', '适合海外、异地办公、外勤和不方便当面处理的用户。', '先判断能否处理、风险点和后续维护，再给明确建议。'], en: ['GPS, WiFi, photo and field-work approval rules need different handling.', 'For iPhone we check iOS version; for Android we check brand, system and permissions.', 'Suitable for overseas users, remote work, field work and people who cannot meet in person.', 'I check feasibility, risks and follow-up needs before giving a clear suggestion.'] },
        { selector: '.service-page-head .platforms-label', zh: '远程打卡配置', en: 'Remote Check-in Setup' },
        { selector: '.service-page-head .section-title', zh: '不是所有打卡异常都一样，先把校验方式拆清楚', en: 'Not every check-in issue is the same. Start by identifying the validation rules.' },
        { selector: '.service-page-head > p', zh: '很多问题表面都是“不在范围内”，实际可能是 GPS、WiFi、拍照水印、外勤审批、设备风控或账号策略共同触发。先诊断，能少走很多弯路。', en: 'Many issues look like “out of range”, but may actually involve GPS, WiFi, photo watermark, field approval, device checks or account rules. Diagnosis first saves time.' },
        { selector: '.service-block .result-tag', zh: ['常见场景', '诊断重点', '处理流程', '参考费用'], en: ['Common cases', 'Diagnosis focus', 'Process', 'Reference pricing'] },
        { selector: '.service-block h2', zh: ['你可能遇到的问题', '先确认这几件事', '一对一远程怎么做', '按设备和规则报价'], en: ['Issues you may be seeing', 'What we confirm first', 'How one-on-one remote setup works', 'Pricing depends on device and rules'] },
        { selector: '.service-block .service-intro', zh: ['适合先发截图判断，不需要你先懂技术细节。', '不同规则对应的处理路径不同，先看清楚再动手更稳。', '流程尽量简单：先判断，再配置，最后用你的页面确认效果。', '简单 GPS 场景和复杂 WiFi/拍照/多规则场景差异很大，先确认再报价。'], en: ['Send screenshots first. You do not need to understand the technical details.', 'Different attendance rules require different paths. Checking first is more stable.', 'The process is simple: check first, configure, then verify on your app page.', 'Simple GPS cases and complex WiFi / photo / multi-rule cases are very different, so pricing is confirmed after diagnosis.'] },
        { selector: '.service-actions .btn-primary', zh: '发截图判断', en: 'Send screenshots' },
        { selector: '.service-actions .btn-outline', zh: '微信咨询', en: 'WeChat contact' },
        { selector: '.intake-card .platforms-label', zh: '咨询前准备', en: 'Before contacting' },
        { selector: '.intake-card h2', zh: '发这 4 样信息，我可以更快判断', en: 'Send these 4 items for faster diagnosis' },
        { selector: '.intake-copy p', zh: '越具体，越能避免来回问。你直接复制下面这份清单发给我就行。', en: 'The more specific your message is, the less back-and-forth we need. You can copy this checklist directly.' },
        { selector: '.intake-actions .btn-primary', zh: 'WhatsApp 发资料', en: 'Send details on WhatsApp' },
        { selector: '.intake-actions .btn-outline', zh: '查看微信', en: 'View WeChat' },
        { selector: '.related-articles h3', zh: '相关页面', en: 'Related Pages' },
        { selector: '.contact-section .section-title', zh: '直接联系我', en: 'Contact Me Directly' },
        { selector: '.contact-desc', zh: '说明你的手机型号、使用的打卡App和当前问题，直接沟通。', en: 'Tell me your phone model, check-in app and current issue. We can discuss directly.' }
    ],
    'overseas-live': [
        { selector: '.page-hero h1', zh: '抖音 / 小红书 / 视频号海外直播权限开通', en: 'Overseas Live-stream Access for Douyin, Xiaohongshu and WeChat Channels' },
        { selector: '.page-hero p', zh: '人在海外也能正常直播 · 全程代办 · 快速审核', en: 'Go live from overseas · Full-service application support · Fast review' },
        { selector: '.service-block h2', zh: ['抖音海外直播权限开通', '小红书海外直播权限', '视频号海外直播权限', '常见问题'], en: ['Douyin Overseas Live-stream Access', 'Xiaohongshu Overseas Live Access', 'WeChat Channels Overseas Live Access', 'FAQ'] },
        { selector: '.service-intro', zh: ['人在海外无法直播？抖音海外直播权限开通，全程代办，快速审核。', '小红书海外账号直播权限开通，海外华人也能正常开播。', '微信视频号海外直播权限开通，海外华人/外贸从业者适用。'], en: ['Unable to go live while overseas? I can help with Douyin overseas live-stream access and application support.', 'Xiaohongshu overseas live access setup for overseas Chinese creators and accounts.', 'WeChat Channels overseas live access support for overseas Chinese users and cross-border sellers.'] },
        { selector: '.price-box .label', zh: '参考区间', en: 'Reference range' },
        { selector: '.price-note', zh: '根据账号情况确定', en: 'Depends on account status' },
        { selector: '.service-block .btn-primary', zh: '联系咨询', en: 'Contact me' },
        { selector: '.contact-section .section-title', zh: '直接联系我', en: 'Contact Me Directly' },
        { selector: '.contact-desc', zh: '说明你所在的地区、想开通的平台，直接沟通方案。', en: 'Tell me your region and target platform, and I will suggest the next step.' }
    ],
    'phone-clone': [
        { selector: '.page-hero h1', zh: '苹果手机分身 / iOS多开', en: 'iPhone App Clone / iOS Multi-account Setup' },
        { selector: '.page-hero p', zh: '微信多开 · 抖音多账号 · 数据完全隔离 · iPhone专用', en: 'Multiple WeChat / Douyin accounts · Isolated data · iPhone focused' },
        { selector: '.service-block h2', zh: ['iOS多开 · 苹果手机分身', '常见问题'], en: ['iOS Multi-account / iPhone App Clone', 'FAQ'] },
        { selector: '.service-intro', zh: '一个iPhone同时登录多个微信/抖音/小红书账号，工作和生活分开，数据完全隔离，互不影响。', en: 'Use multiple WeChat, Douyin or Xiaohongshu accounts on one iPhone, with work and personal data separated.' },
        { selector: '.price-box .label', zh: '支持的多开场景', en: 'Supported multi-account scenarios' },
        { selector: '.service-block .btn-primary', zh: '联系咨询', en: 'Contact me' },
        { selector: '.contact-section .section-title', zh: '直接联系我', en: 'Contact Me Directly' },
        { selector: '.contact-desc', zh: '说明你的iPhone机型和想多开的App，直接沟通方案。', en: 'Tell me your iPhone model and the apps you want to clone, and I will check the setup path.' }
    ],
    'platform-auth': [
        { selector: '.page-hero h1', zh: '抖音巨量引擎 / 小红书聚光平台 / 视频号互选平台', en: 'Douyin Ocean Engine / Xiaohongshu Jiguang / WeChat Channels Platform Setup' },
        { selector: '.page-hero p', zh: '平台认证代办 · 全程代办 · 快速审核', en: 'Platform verification support · Full-service application · Faster review' },
        { selector: '.service-block h2', zh: ['抖音巨量引擎开通', '小红书专业号认证', '视频号互选平台入驻'], en: ['Douyin Ocean Engine Account Setup', 'Xiaohongshu Professional Account Verification', 'WeChat Channels Matching Platform Setup'] },
        { selector: '.service-intro', zh: ['抖音巨量引擎（广告投放平台）开通入驻，投放广告/内容合作的必备资质。', '小红书专业号认证，提升账号可信度，解锁更多商业功能。', '视频号互选平台入驻，接品牌合作和广告任务。'], en: ['Douyin Ocean Engine ad account setup for advertising and content cooperation needs.', 'Xiaohongshu professional account verification to improve trust and unlock commercial features.', 'WeChat Channels matching platform setup for brand cooperation and advertising tasks.'] },
        { selector: '.price-box .label', zh: '参考区间', en: 'Reference range' },
        { selector: '.price-note', zh: ['根据账号情况确定', '根据认证类型确定', '根据平台确定'], en: ['Depends on account status', 'Depends on verification type', 'Depends on platform'] },
        { selector: '.service-block .btn-primary', zh: '联系咨询', en: 'Contact me' },
        { selector: '.contact-section .section-title', zh: '直接联系我', en: 'Contact Me Directly' },
        { selector: '.contact-desc', zh: '说明想开通的平台和账号现状，直接沟通代办方案。', en: 'Tell me the platform and current account status, and I will suggest the application path.' }
    ],
    'social-media-growth': [
        { selector: '.page-hero h1', zh: '抖音 / 小红书 / 视频号涨粉服务', en: 'Douyin, Xiaohongshu and WeChat Channels Growth Service' },
        { selector: '.page-hero p', zh: '真人粉丝 · 安全不封号 · 快速提升账号权重', en: 'Real followers · Safer delivery · Improve account momentum' },
        { selector: '.service-block h2', zh: ['抖音涨粉', '小红书涨粉', '视频号涨粉', '为什么选我们'], en: ['Douyin Follower Growth', 'Xiaohongshu Follower Growth', 'WeChat Channels Follower Growth', 'Why Work With Us'] },
        { selector: '.service-intro', zh: ['抖音账号快速增粉，真人粉丝，真实互动，提升账号活跃度和推荐权重。', '小红书账号快速增粉，真人粉丝，真实互动，帮助账号快速起步。', '视频号账号增粉，真人粉丝，支持直播间引流和视频曝光同步提升。'], en: ['Follower growth support for Douyin accounts, focused on real followers and account activity.', 'Follower growth support for Xiaohongshu accounts to help early-stage accounts gain momentum.', 'Follower growth support for WeChat Channels, including live-room traffic and video exposure support.'] },
        { selector: '.price-box .label', zh: '说明', en: 'Note' },
        { selector: '.price-note', zh: ['根据粉丝数量和交付周期定价，联系获取报价', '根据粉丝数量定价，联系获取报价', '根据粉丝数量和交付周期定价，联系获取报价'], en: ['Pricing depends on follower quantity and delivery timeline. Contact me for a quote.', 'Pricing depends on follower quantity. Contact me for a quote.', 'Pricing depends on follower quantity and delivery timeline. Contact me for a quote.'] },
        { selector: '.service-block .btn-primary', zh: '联系咨询', en: 'Contact me' },
        { selector: '.contact-section .section-title', zh: '直接联系我', en: 'Contact Me Directly' },
        { selector: '.contact-desc', zh: '说明你的平台、账号现状和想达到的目标，直接给方案和报价。', en: 'Tell me your platform, current account status and goal, and I will suggest a plan and quote.' }
    ],
    contact: [
        { selector: '.contact-page h1, .contact-section .section-title', zh: '直接联系我', en: 'Contact Me Directly' },
        { selector: '.contact-page .container > p, .contact-desc', zh: '把设备、平台和当前问题简单发过来。我会先判断，再告诉你怎么处理。', en: 'Send your device, platform and current issue. I will check first and suggest the next step.' },
        { selector: '.contact-page h2', zh: '或者填写表单', en: 'Or fill out the form' },
        { selector: '.form-group label', zh: ['称呼', '联系方式', '想了解的服务', '情况说明'], en: ['Name', 'Contact', 'Service you need', 'Your situation'] },
        { selector: '#name', attr: 'placeholder', zh: '怎么称呼你', en: 'What should I call you?' },
        { selector: '#contact', attr: 'placeholder', zh: '微信 / WhatsApp / 邮箱', en: 'WeChat / WhatsApp / Email' },
        { selector: '#message', attr: 'placeholder', zh: '简单说明一下你的设备和需求', en: 'Briefly describe your device and what you need' },
        { selector: '#service option', zh: ['选择服务类型', '虚拟定位', '远程打卡', '社媒涨粉', '海外权限', '手机分身', '平台认证', '其他'], en: ['Select a service', 'Virtual location', 'Remote check-in', 'Social media growth', 'Overseas access', 'App clone', 'Platform verification', 'Other'] },
        { selector: '.form-submit .btn-primary', zh: '发送', en: 'Send' },
        { selector: '#formSuccess h3', zh: '已收到', en: 'Received' },
        { selector: '#formSuccess p', zh: '我会尽快回复你。', en: 'I will reply as soon as possible.' }
    ]
};

let currentLang = localStorage.getItem('lang') || 'zh';

function getValue(entry, lang, index) {
    const value = entry[lang];
    if (Array.isArray(value)) {
        return value[index] !== undefined ? value[index] : value[value.length - 1];
    }
    return value;
}

function applyEntry(entry, lang) {
    const nodes = document.querySelectorAll(entry.selector);
    nodes.forEach((node, index) => {
        const value = getValue(entry, lang, index);
        if (value === undefined || value === null) return;
        if (entry.attr) {
            node.setAttribute(entry.attr, value);
        } else if (entry.html) {
            node.innerHTML = value;
        } else {
            node.textContent = value;
        }
    });
}

function applyTranslations(lang) {
    [...translations.common, ...(translations[pageKey] || [])].forEach(entry => applyEntry(entry, lang));
}

function updatePageMeta(lang) {
    document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
    if (pageTitles[pageKey]) {
        document.title = pageTitles[pageKey][lang];
    }
}

function updateFallbackNotice(lang) {
    const existing = document.querySelector('.i18n-fallback-notice');
    if (existing) existing.remove();

    if (lang !== 'en' || translations[pageKey]) return;

    const notice = document.createElement('div');
    notice.className = 'i18n-fallback-notice';
    notice.textContent = 'English navigation is available. This page is still primarily Chinese; send the link or screenshots on WhatsApp for an English summary.';
    notice.style.cssText = 'margin:88px auto 0;max-width:1120px;padding:12px 18px;border:1px solid #E5E7EB;border-radius:12px;background:#F9FAFB;color:#444;font-size:14px;line-height:1.6;';

    const header = document.querySelector('.header');
    if (header && header.nextElementSibling) {
        header.nextElementSibling.insertAdjacentElement('afterend', notice);
    } else {
        document.body.prepend(notice);
    }
}

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);

    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    applyTranslations(lang);
    updatePageMeta(lang);
    updateFallbackNotice(lang);
}

document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
});

// 移动端菜单
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const mobileMenu = document.querySelector('.mobile-menu');

if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('show');
    });

    mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('show');
        });
    });
}

// 咨询浮窗
function toggleContact(btn) {
    btn.classList.toggle('active');
    btn.nextElementSibling.classList.toggle('show');
}

// 点击页面其他区域关闭浮窗
document.addEventListener('click', (e) => {
    const popup = document.querySelector('.consult-popup.show');
    if (popup && !e.target.closest('.float-consult')) {
        popup.classList.remove('show');
        const btn = document.querySelector('.consult-btn.active');
        if (btn) btn.classList.remove('active');
    }
});

// 统一处理复制按钮，避免英文界面点击后按钮文字又回到中文。
document.addEventListener('click', (e) => {
    const btn = e.target.closest('.copy-btn');
    if (!btn) return;

    const inlineHandler = btn.getAttribute('onclick') || '';
    const match = inlineHandler.match(/copyText\('([^']+)'/);
    const text = btn.dataset.copy || (match ? match[1] : '');
    if (!text) return;

    e.preventDefault();
    e.stopImmediatePropagation();

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
    }
    btn.textContent = currentLang === 'en' ? 'Copied' : '已复制';
    setTimeout(() => {
        btn.textContent = currentLang === 'en' ? 'Copy' : '复制';
    }, 2000);
}, true);

// 页面加载时初始化语言
document.addEventListener('DOMContentLoaded', () => {
    setLanguage(currentLang);
});
