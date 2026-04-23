# 📁 素材上传指南

网站已搭建完成，请按以下指引上传你的素材。

---

## 📂 目录结构

```
website/
├── index.html          # 首页
├── services.html       # 服务详情页
├── contact.html        # 联系我们页
├── css/
│   └── style.css       # 样式文件（无需修改）
├── js/
│   └── main.js         # 脚本文件（无需修改）
├── images/             # ⬇️ 素材放这里
│   ├── logo.png        # [位置1] Logo（建议 200x60px，透明背景）
│   ├── logo-white.png  # [位置2] 白色Logo（页脚用）
│   ├── banner-1.jpg     # [位置3] Banner图1（建议 1920x600px）
│   ├── banner-2.jpg     # [位置4] Banner图2（可选）
│   ├── banner-3.jpg     # [位置5] Banner图3（可选）
│   ├── icons/          # 图标文件夹
│   │   ├── location.png   # [位置6] 虚拟定位图标
│   │   ├── clock.png      # [位置7] 打卡服务图标
│   │   ├── fans.png       # [位置8] 涨粉服务图标
│   │   ├── globe.png      # [位置9] 海外权限图标
│   │   ├── phone.png      # [位置10] 分身软件图标
│   │   ├── light.png      # [位置11] 聚光开通图标
│   │   └── whatsapp.svg   # WhatsApp图标（已提供）
│   └── services/       # 服务详情图
│       ├── location.jpg   # [位置12] 虚拟定位详情图
│       ├── clock.jpg      # [位置13] 打卡服务详情图
│       ├── fans.jpg       # [位置14] 涨粉服务详情图
│       ├── overseas.jpg   # [位置15] 海外权限详情图
│       ├── clone.jpg      # [位置16] 分身软件详情图
│       └── light.jpg      # [位置17] 聚光开通详情图
└── README-素材上传指南.md  # 本文件
```

---

## 🖼️ 素材规格要求

| 位置 | 文件名 | 建议尺寸 | 格式 | 说明 |
|------|--------|---------|------|------|
| 1 | `logo.png` | 200×60px | PNG | 主Logo，透明背景 |
| 2 | `logo-white.png` | 200×60px | PNG | 白色版，用于深色背景 |
| 3-5 | `banner-*.jpg` | 1920×600px | JPG/PNG | Hero轮播图 |
| 6-11 | `icons/*.png` | 64×64px | PNG | 服务图标，透明背景 |
| 12-17 | `services/*.jpg` | 800×600px | JPG/PNG | 服务详情配图 |

---

## 🚀 快速开始

### 1. 基础必传（最简方案）
只需上传 2 个文件：
- `images/logo.png` — 你的Logo
- `images/logo-white.png` — 白色版Logo

其他位置会显示占位图标（如 📍 ⏰ 📈），不影响使用。

### 2. 完整上传
按上表规格准备所有图片，放入对应文件夹即可。

---

## ⚠️ 注意事项

1. **图片命名**：严格按照文件命名，区分大小写
2. **格式兼容**：PNG/JPG/WebP 均可，优先使用 PNG
3. **占位显示**：如果图片不存在，会显示 Emoji 占位符，不影响页面显示
4. **图标的备选方案**：如果不想自己做图标，可以：
   - 使用免费图标网站：[Flaticon.com](https://www.flaticon.com)
   - 搜索关键词：location, clock, chart, globe, smartphone, lightbulb

---

## 📱 素材示例参考

如果你没有设计资源，可以参考以下免费素材：

### 图标来源
- **Flaticon**: https://www.flaticon.com
- **Icon8**: https://icons8.com
- **Heroicons**: https://heroicons.com

### 图片来源
- **Unsplash**: https://unsplash.com（免费高清图片）
- **Pexels**: https://pexels.com
- **Pixabay**: https://pixabay.com

### 搜索关键词
| 服务 | 英文关键词 |
|------|-----------|
| 虚拟定位 | location, gps, map, pin |
| 打卡服务 | clock, attendance, time, work |
| 涨粉 | growth, followers, social media |
| 海外权限 | globe, international, world |
| 手机分身 | phone clone, dual app, multi-instance |

---

## ✅ 完成后检查清单

- [ ] 上传 Logo 图片
- [ ] 检查首页显示是否正常
- [ ] 测试中英切换是否生效
- [ ] 测试联系表单能否提交
- [ ] 测试 WhatsApp/微信按钮能否点击

---

## 💡 提示

如果你暂时没有素材，网站完全可以正常显示和使用：
- 服务图标位置会显示 Emoji（📍⏰📈🌐📱💡）
- 详情图位置会显示彩色背景
- Logo 位置会显示文字"自由行Studio"

随时上传图片即可替换！