/**
 * 自由行Studio - 主脚本
 */

// 中英双语
const i18n = {
    zh: {
        'hero.title': '一对一设备环境配置与技术支持',
        'hero.subtitle': '面向定位、直播环境、网络配置等需求，提供更直接的沟通与处理方案。',
        'hero.btn.services': '查看服务',
        'hero.btn.contact': '立即联系',
        'services.title': '我能帮到你',
        's.location.title': '虚拟定位',
        's.location.desc': '苹果 / 安卓 / 海外版本',
        's.clock.title': '远程打卡',
        's.clock.desc': '钉钉 / 企业微信',
        's.fans.title': '社媒涨粉',
        's.fans.desc': '抖音 / 小红书 / 视频号',
        's.overseas.title': '海外权限',
        's.overseas.desc': '抖音 / 视频号 / 小红书直播',
        's.clone.title': '手机分身',
        's.clone.desc': '苹果多开 / 多账号',
        's.light.title': '平台认证',
        's.light.desc': '聚光开通 / 专业号',
        'how.title': '工作方式',
        'how.1.title': '先判断，再建议',
        'how.1.desc': '不是直接套模板回复。先了解你的设备和需求，再告诉你怎么处理更有效。',
        'how.2.title': '沟通更直接',
        'how.2.desc': '减少反复试错，也减少无效操作。说明情况，直接给方案。',
        'how.3.title': '后续还能继续',
        'how.3.desc': '不是发完就结束。后续有问题，直接联系继续确认。',
        'contact.title': '直接联系我',
        'contact.desc': '把设备、平台和当前问题简单发过来。我会先判断，再告诉你怎么沟通更有效。',
        'float.consult': '咨询',
        'footer.tagline': '一对一设备环境配置与技术支持'
    },
    en: {
        'hero.title': 'One-on-One Device Configuration & Support',
        'hero.subtitle': 'Direct communication for location, streaming environment, and network needs.',
        'hero.btn.services': 'View Services',
        'hero.btn.contact': 'Contact',
        'services.title': 'What I Can Help With',
        's.location.title': 'GPS Spoofing',
        's.location.desc': 'iPhone / Android / Overseas',
        's.clock.title': 'Remote Check-in',
        's.clock.desc': 'DingTalk / WeCom',
        's.fans.title': 'Social Growth',
        's.fans.desc': 'Douyin / Xiaohongshu / Video',
        's.overseas.title': 'Overseas Access',
        's.overseas.desc': 'Douyin / Video / Xiaohongshu Live',
        's.clone.title': 'Phone Clone',
        's.clone.desc': 'iOS Multi-instance',
        's.light.title': 'Platform Verification',
        's.light.desc': 'Jiguang / Pro Account',
        'how.title': 'How I Work',
        'how.1.title': 'Assess First',
        'how.1.desc': 'Not template replies. Understand your device and needs first, then advise.',
        'how.2.title': 'Direct Communication',
        'how.2.desc': 'Reduce trial and error. Explain your situation, get a direct solution.',
        'how.3.title': 'Ongoing Support',
        'how.3.desc': 'Not one-time. Continue to reach out if you have questions later.',
        'contact.title': 'Contact Me Directly',
        'contact.desc': 'Send me your device, platform, and current issue. I will assess and advise.',
        'float.consult': 'Contact',
        'footer.tagline': 'One-on-One Device Configuration & Support'
    }
};

// 语言切换
let currentLang = localStorage.getItem('lang') || 'zh';

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });
    
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        if (i18n[lang] && i18n[lang][key]) {
            el.textContent = i18n[lang][key];
        }
    });
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

// 页面加载时初始化语言
document.addEventListener('DOMContentLoaded', () => {
    setLanguage(currentLang);
});
