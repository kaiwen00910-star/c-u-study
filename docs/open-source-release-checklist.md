# 开源发布清单

在视频、社交媒体或社群中正式宣传“项目已开源”前，逐项确认以下内容。

## 仓库

- [x] 根目录包含 MIT `LICENSE`；
- [x] `NOTICE.md` 明确排除院校校徽、官方文件和第三方内容；
- [x] 提供 `CONTRIBUTING.md`、`SECURITY.md` 和 Pull Request 模板；
- [x] 当前工作区未发现管理员邮箱、真实 `.env` 或常见密钥模式；
- [x] 生产与开发依赖的 `npm audit` 结果为 0 个已知漏洞；
- [ ] 确认是否接受历史提交中曾出现的管理员邮箱和提交者邮箱；如不接受，先轮换管理员账号，再评估历史重写；
- [ ] 在 GitHub 启用 Private vulnerability reporting、Secret scanning、Push protection 和默认分支保护；
- [ ] 合并并推送本次本地整理后，确认 GitHub 正确识别 MIT License。

## Supabase

- [ ] 仅保留专用管理员账号，不在公开代码、文档或登录页显示管理员邮箱；
- [ ] 如果没有普通用户体系，关闭 **Allow new users to sign up** 和匿名注册；
- [ ] 为登录及密码重置启用 CAPTCHA，检查 Auth Rate Limits；
- [ ] 管理员启用 TOTP MFA；需要强制 MFA 时，先完成挑战页面与 AAL2 限制性 RLS policy；
- [ ] 确认生产 Site URL 与 Redirect URL 只允许正式域名和必要的受限预览地址；
- [ ] 运行 Security Advisor，并复核公开 schema 的 GRANT、RLS、函数执行权限和 Storage policy。

## Netlify 与域名

- [x] `netlify.toml` 已声明 CSP、防点击劫持、MIME 嗅探防护、Referrer Policy 和 Permissions Policy；
- [ ] 部署后检查实际响应头，确认 CSP 没有阻止 Supabase、校徽或百度统计的必要请求；
- [ ] 绑定正式域名后，更新 `index.html`、`package.json`、README、sitemap、Supabase Site URL 和重置密码 Redirect URL；
- [ ] 将正式域名设为主域名，确认 HTTPS 证书和 `www`/根域跳转；
- [ ] 检查生产首页、院校专业地图、院校对比、管理员登录和密码重置页面。

## 对外表述

- [ ] 明确说明网站不是考试院或招生院校官方网站；
- [ ] 不把第三方地图结果、整理数据或历史分数描述成官方实时结论；
- [ ] 视频简介同时提供正式站点、GitHub 仓库、官方信息复核提醒和问题反馈入口；
- [ ] 只有在许可证已推送并可见后，才使用“已在 GitHub 开源”的表述。
