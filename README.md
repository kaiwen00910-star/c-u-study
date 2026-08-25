# 升本导航

专注安徽省的专升本考纲学习资源导航站。当前覆盖 2026 年计算机科学与技术专业，以及合肥师范学院、安徽信息工程学院、安徽文达信息工程学院；不计划扩展其他省份。

## 本地运行

```powershell
npm install
npm run dev
```

## 内容维护

所有内容位于 `content`：

- `offerings.csv`：招生院校、培养点、科目与官方来源
- `syllabus.csv`：考纲章节和知识点
- `resources.csv`：学习资源的校验/种子参考
- `public-content.snapshot.json`：由 Supabase 公开 REST 数据自动导出的版本化离线快照

42 所院校以 Supabase `academic_schools` 为线上统一数据源。运行时读取失败会显示明确的“离线快照”提示、快照版本和生成时间；不会静默把旧数据当成在线数据。院校名称、简称、校徽、排序、启用状态以及招生计划、考纲、学习资源和首页公告均由 `/admin` 后台维护。校徽支持 PNG、JPG、WebP，单张不超过 2MB。

### 同步离线快照

快照不允许手工复制。数据库内容变更并通过审核后，使用公开的 Publishable Key 执行：

```powershell
$env:SNAPSHOT_SUPABASE_URL='https://YOUR_PROJECT_REF.supabase.co'
$env:SNAPSHOT_SUPABASE_PUBLISHABLE_KEY='YOUR_PUBLISHABLE_KEY'
npm run snapshot:export
```

脚本通过现有 RLS 读取公开有效数据，写入 `content/public-content.snapshot.json`，并记录 `content_versions` 的单调版本号、数据库更新时间和快照生成时间。发布前必须执行该命令、运行数据校验并提交生成的快照。Netlify 使用 `npm run build` 验证并构建已提交快照，因此生产构建不依赖 Supabase 当时是否可用；快照同步失败时，发布流程应在提交前停止。

修改后先执行：

```powershell
npm run validate:data
npm test
npm run build
```

数据校验会检查必填字段、范围维度、重复 ID/招生组合、日期、HTTPS 链接、院校引用、主题引用和快照 metadata。

## Supabase 后台

1. 将 `supabase/migrations` 中的迁移应用到 Supabase 项目；校徽迁移会创建公开读取、仅管理员可上传的 `school-logos` Storage bucket。
2. 运行 `supabase/seed.sql`，可重复导入内置资源而不产生重复记录。
3. 在 Supabase Auth 预先创建管理员 `3130708522@qq.com`，再将其 `auth.users.id` 写入 `public.admin_users`。
4. 复制 `.env.example` 为 `.env.local`，填写项目 URL 和 Publishable Key。
5. 在 Supabase URL Configuration 中加入本地与线上 `/admin/reset-password` 跳转地址。

浏览器端和快照脚本只使用 Publishable Key，不得填写或提交 `service_role` / secret key。登录页可以预填常用管理员邮箱，但授权最终只由 `public.admin_users` 成员表及其 RLS policy 决定；不在成员表的已认证账号会立即退出。

### Supabase 控制台安全清单

- Auth → Password Security：开启 leaked-password protection（Pro 及以上可用），最低密码长度至少 8，建议更高。
- 管理员账号：启用 TOTP MFA；如后续要求强制 MFA，再将 AAL2 要求加入管理员 RLS 与登录挑战流程。
- Auth → URL Configuration：生产 `Site URL` 使用正式站精确地址；生产 Redirect URL 精确允许 `https://splendid-duckanoo-926f44.netlify.app/admin/reset-password`，仅为本地/Netlify Preview 使用受限通配符。
- Auth → Users / Sessions：管理员离职或疑似泄露时先撤销会话，再移出 `admin_users`；不要只删除前端邮箱。

## Netlify

项目已提供 `netlify.toml`：

- Build command：`npm run build`
- Publish directory：`dist`
- `/assets/*` 的 hash 资源使用一年 `immutable` 缓存
- HTML 与 SPA 深层路由保持 `max-age=0, must-revalidate`
- 所有深层路由回退至 `index.html`

连接 GitHub 仓库后，Netlify 可以在每次推送时自动发布。

## 本地数据

学习进度、收藏和最后一次选择保存在浏览器：

- `zsb:v1:progress`
- `zsb:v1:favorites`
- `zsb:v1:lastSelection`

普通访客无需账号；清除浏览器数据或更换设备后，学习进度与收藏不会同步。管理员登录仅用于维护资源、公告和院校资料（含校徽）。
