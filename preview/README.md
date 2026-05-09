# 自由行Studio预览版怎么改

这个目录是新版视觉预览，不会影响当前正式首页。

最常改的内容在：

`preview/content.js`

可以改：

- 微信号：`wechat`
- WhatsApp：`whatsapp` 和 `whatsappUrl`
- 邮箱：`email`
- 首页大标题：`hero.title`
- 服务名称、说明、价格：`services`
- 常见问题：`faq`

改的时候注意：

- 中文文字可以直接改。
- 英文逗号、引号、方括号不要删。
- 每一段文字外面都要保留引号。
- 如果不确定，先只改引号里面的内容。

页面样式在：

`preview/styles.css`

如果后面确认这个方向可以上线，再把正式首页和服务页迁移成同一套模板。
