# 升本导航

专注安徽省普通专升本的院校、专业、培养地点、考试方案和官方来源导航站。当前公开快照覆盖 2026 年安徽 42 所院校、465 条招生方案，并提供院校专业地图、报考范围检索、院校对比、分数参考和静态快照回退。

本站不是安徽省教育招生考试院或招生院校的官方网站，不提供报名、录取或成绩查询服务。报考前请回到页面标注的官方来源复核。

## 在线访问

- 正式站点：[安徽升本导航](https://ahzsb.work/)
- 项目源码：[kaiwen00910-star/c-u-study](https://github.com/kaiwen00910-star/c-u-study)

## 核心功能

- 按院校查看招生专业、培养地点、考试科目、计划数和报考范围；
- 根据高职专业反查可报考的本科专业；
- 对比不同院校和招生方案，并提供第三方地图导航入口；
- 展示可核验的普通考生录取最低分与官方来源；
- 在线数据不可用时回退到版本化公开快照，并明确显示快照状态；
- 学习进度、收藏和最近选择仅保存在当前浏览器，不要求普通访客注册。

## 开源与贡献

原创程序代码以 [MIT License](LICENSE) 发布。院校名称、校徽、照片、官方招生文件及外部第三方内容不因收录在仓库中而获得 MIT 授权，具体边界见 [NOTICE.md](NOTICE.md)。

欢迎提交 Issue 和 Pull Request。涉及招生事实的改动必须提供可核验的官方来源，并遵守 [贡献指南](CONTRIBUTING.md)。安全问题请不要公开披露利用细节，按 [安全政策](SECURITY.md) 私下报告。

首次以“开源项目”名义公开推广前，请逐项完成 [开源发布清单](docs/open-source-release-checklist.md)。

## 本地运行

```powershell
npm ci
npm run dev
```

普通公开页面可直接使用仓库内的版本化快照。需要连接自己的 Supabase 项目时，将 `.env.example` 复制为 `.env.local`，只填写项目 URL 与 Publishable Key；`.env.local` 已被 Git 忽略，不得提交。

## 内容维护

所有内容位于 `content`：

- `offerings.csv`：招生院校、培养点、科目与官方来源
- `syllabus.csv`：考纲章节和知识点
- `resources.csv`：学习资源的校验/种子参考
- `public-content.snapshot.json`：由 Supabase 公开 REST 数据自动导出的版本化离线快照

42 所院校以 Supabase `academic_schools` 为线上统一数据源。运行时读取失败会显示明确的“离线快照”提示、快照版本和生成时间；不会静默把旧数据当成在线数据。院校名称、简称、校徽、排序、启用状态以及招生计划、考纲、学习资源和首页公告均由 `/admin` 后台维护。校徽支持 PNG、JPG、WebP，单张不超过 2MB。

### 同步离线快照

数据库内容变更并通过审核后，使用公开的 Publishable Key 重新生成快照：

```powershell
$env:SNAPSHOT_SUPABASE_URL='https://YOUR_PROJECT_REF.supabase.co'
$env:SNAPSHOT_SUPABASE_PUBLISHABLE_KEY='YOUR_PUBLISHABLE_KEY'
npm run snapshot:export
```

脚本通过现有 RLS 读取公开有效数据，写入 `content/public-content.snapshot.json`，并记录 `content_versions` 的单调版本号、数据库更新时间和快照生成时间。发布前必须执行该命令、运行数据校验并提交生成的快照。Netlify 使用 `npm run build` 验证并构建已提交快照，因此生产构建不依赖 Supabase 当时是否可用；快照同步失败时，发布流程应在提交前停止。

修改后先执行：

```powershell
npm run lint
npm run check:migrations
npm run validate:data
npm test
npm run build
```

数据校验会检查必填字段、范围维度、重复 ID/招生组合、日期、HTTPS 链接、院校引用、主题引用和快照 metadata。

### 只读链接巡检

使用已提交的公开快照检查招生章程、专业课考纲和学习资源链接：

    npm run audit:links
    npm run audit:links -- --timeout=20000 --concurrency=3 --output work/link-audit.json

巡检默认只读，不提交表单，也不会自动修改、下架或删除数据。结果会记录关联 ID、原始/最终 URL、HTTP 状态、内容类型、跳转链、页面标题和结论。结论区分 accessible、redirect、automated-request-blocked、verification-page、login-required、not-found、tls-error 与 network-error；自动化请求被拦截或高校站点 TLS 链异常不等同于真实链接失效。

在线巡检不进入 GitHub Actions，避免第三方高校网站或课程平台的偶发超时影响持续集成。需要定期人工运行并复核 automated-request-blocked、verification-page 和 tls-error 结果。

## Supabase 后台

1. 将 `supabase/migrations` 中的迁移应用到 Supabase 项目；校徽迁移会创建公开读取、仅管理员可上传的 `school-logos` Storage bucket。
2. 运行 `supabase/seed.sql`，可重复导入内置资源而不产生重复记录。
3. 在 Supabase Auth 预先创建专用管理员账号，再将其 `auth.users.id` 写入 `public.admin_users`；不要在仓库或登录页公开管理员邮箱。
4. 复制 `.env.example` 为 `.env.local`，填写项目 URL 和 Publishable Key。
5. 在 Supabase URL Configuration 中加入本地与线上 `/admin/reset-password` 跳转地址。

浏览器端和快照脚本只使用 Publishable Key，不得填写或提交 `service_role` / secret key。授权只由 `public.admin_users` 成员表及其 RLS policy 决定；不在成员表的已认证账号会立即退出。

### Supabase 控制台安全清单

- Auth → General Configuration：如果站点只允许管理员登录，关闭 **Allow new users to sign up** 和匿名注册。
- Auth → Bot and Abuse Protection：为登录和密码重置配置 CAPTCHA，并复核 Auth Rate Limits。
- Auth → Password Security：使用足够长且唯一的密码；管理员启用 TOTP MFA。当前代码尚未强制 AAL2，启用强制 MFA 前还需补充登录挑战和限制性 RLS policy。
- Auth → URL Configuration：生产 `Site URL` 使用正式站精确地址；Redirect URL 只允许正式域名的 `/admin/reset-password`，仅为本地或 Netlify Preview 使用受限通配符。
- Auth → Users / Sessions：管理员离职或疑似泄露时先撤销会话，再移出 `admin_users`；不要只删除前端邮箱。
- Database → Advisors：发布涉及表、RLS、函数或 Storage 的迁移前后均检查 Security Advisor；公开 schema 的每张表都必须同时配置最小权限 GRANT 和 RLS。

## Netlify

项目已提供 `netlify.toml`：

- Build command：`npm run build`
- Publish directory：`dist`
- `/assets/*` 的 hash 资源使用一年 `immutable` 缓存
- HTML 与 SPA 深层路由保持 `max-age=0, must-revalidate`
- 全站配置 CSP、点击劫持防护、MIME 嗅探防护、权限策略和跨域来源隔离等安全响应头
- 所有深层路由回退至 `index.html`

连接 GitHub 仓库后，Netlify 可以在每次推送时自动发布。

### 百度统计

代码只会在 Vite Production 构建、公开页面且站点 ID 格式有效时加载百度统计；`/admin`、本地开发和测试环境不加载。统计脚本使用 `async`，加载失败不会阻塞页面。React 路由由代码手动调用 `_trackPageview`，因此不要同时在百度统计后台开启“单页应用数据统计”，否则会重复记录 PV。

1. 在百度统计创建本站，取得真实站点 ID。
2. 在 Netlify：Site configuration → Environment variables 新建 `VITE_BAIDU_TONGJI_ID`，Scope 仅选择 Production，值填写真实站点 ID。
3. 触发一次 Production 部署；在浏览器网络面板确认公开页请求 `hm.baidu.com/hm.js?...`，再检查路由切换只产生一次 PV。
4. 未提供真实 ID 时不要填写占位值；构建仍可正常完成，但统计保持关闭。

事件只包含固定事件名和院校/资源/知识点等受控 ID，不发送搜索框自由文本、反馈内容、姓名或联系方式，也不在事件参数中主动采集 IP。浏览器请求第三方统计服务时产生的网络技术信息仍以百度统计隐私政策为准。

### 百度搜索资源平台验证

平台目前支持文件验证和 HTML 标签验证，CNAME 新验证已暂停。推荐文件验证：在平台添加正式 HTTPS 地址，下载平台生成的唯一验证文件，将原文件放入 `public/` 根目录，部署后先确认 `https://ahzsb.work/验证文件名` 可直接访问，再点击完成验证。也可将平台给出的完整 meta 标签原样放进 `index.html` 的 `<head>`。验证成功后必须保留文件或标签；仓库没有验证码时不会生成伪造文件或标签。

## 第二专业扩展评估

详见 [`docs/major-expansion-assessment.md`](docs/major-expansion-assessment.md)。结论是数据层和公开路由已基本按 `year + province_slug + major_slug + school_slug` 隔离，资源也能通过全局 `canonical_topic` 复用；但专业切换入口、后台按专业筛选、年度复制参数化和可抓取的静态 SEO 页面尚未完成。下一阶段应先补这些窄范围能力，再试录一个专业，不需要现在重构表结构。

## 本地数据

学习进度、收藏和最后一次选择保存在浏览器：

- `zsb:v1:progress`
- `zsb:v1:favorites`
- `zsb:v1:lastSelection`

普通访客无需账号；清除浏览器数据或更换设备后，学习进度与收藏不会同步。管理员登录仅用于维护资源、公告和院校资料（含校徽）。
