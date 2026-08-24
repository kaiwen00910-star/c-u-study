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
- `resources.csv`：12 条内置备用资源（Supabase 暂不可用时自动回退）

42 所院校以 Supabase `academic_schools` 为线上统一数据源，CSV/静态快照仅用于读取失败时回退；院校名称、简称、校徽、排序、启用状态以及招生计划、考纲、学习资源和首页公告均由 `/admin` 后台维护，保存后访客刷新页面即可看到。校徽支持 PNG、JPG、WebP，单张不超过 2MB，地址由系统自动保存。

修改后先执行：

```powershell
npm run validate:data
npm test
npm run build
```

数据校验会检查必填字段、重复 ID、日期、HTTPS 链接、院校引用和主题引用。

## Supabase 后台

1. 将 `supabase/migrations` 中的迁移应用到 Supabase 项目；校徽迁移会创建公开读取、仅管理员可上传的 `school-logos` Storage bucket。
2. 运行 `supabase/seed.sql`，可重复导入内置资源而不产生重复记录。
3. 在 Supabase Auth 预先创建管理员 `3130708522@qq.com`，再将其 `auth.users.id` 写入 `public.admin_users`。
4. 复制 `.env.example` 为 `.env.local`，填写项目 URL 和 Publishable Key。
5. 在 Supabase URL Configuration 中加入本地与线上 `/admin` 跳转地址。

浏览器端只使用 Publishable Key，不得填写或提交 `service_role` 密钥。后台使用固定管理员邮箱和密码登录，不开放注册；首次使用或忘记密码时通过管理员邮箱设置新密码。

## Netlify

项目已提供 `netlify.toml`：

- Build command：`npm run build`
- Publish directory：`dist`
- 所有深层路由回退至 `index.html`

连接 GitHub 仓库后，Netlify 可以在每次推送时自动发布。

## 本地数据

学习进度、收藏和最后一次选择保存在浏览器：

- `zsb:v1:progress`
- `zsb:v1:favorites`
- `zsb:v1:lastSelection`

普通访客无需账号；清除浏览器数据或更换设备后，学习进度与收藏不会同步。管理员登录仅用于维护资源、公告和院校资料（含校徽）。
