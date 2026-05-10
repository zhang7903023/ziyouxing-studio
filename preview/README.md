# 自由行Studio Paperfolio 预览版怎么改

这个目录是新版视觉预览，不会影响当前正式首页。

预览地址上线后是：

`https://zyxstudio.net/preview/`

最常改的内容在：

`preview/content.js`

可以改：

- 品牌名：`brand`
- 微信号：`wechat`
- WhatsApp：`whatsapp` 和 `whatsappUrl`
- 邮箱：`email`
- 首页大标题：`hero.name`、`hero.role`、`hero.focus`
- 首页介绍：`hero.lead`
- 服务名称、说明、价格：`services`
- 流程：`process`
- 常见问题：`faq`

改的时候注意：

- 中文文字可以直接改。
- 英文逗号、引号、方括号不要删。
- 每一段文字外面都要保留引号。
- 如果不确定，先只改引号里面的内容。

页面样式在：

`preview/styles.css`

这个版本按 v0 的 Paperfolio 模板方向重做：白色背景、粗黑边框、彩色高亮、大标题、作品集卡片和右侧插画头像。确认方向后，再决定要不要把正式首页和服务页迁移成同一套模板。
