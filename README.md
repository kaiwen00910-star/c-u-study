# 升本导航

安徽专升本考纲驱动的学习资源导航站。首版覆盖 2026 年计算机科学与技术专业，以及合肥师范学院、安徽信息工程学院、安徽文达信息工程学院。

## 本地运行

```powershell
npm install
npm run dev
```

## 内容维护

所有内容位于 `content`：

- `offerings.csv`：招生院校、培养点、科目与官方来源
- `syllabus.csv`：考纲章节和知识点
- `resources.csv`：知识点对应的推荐课程

修改后先执行：

```powershell
npm run validate:data
npm test
npm run build
```

数据校验会检查必填字段、重复 ID、日期、HTTPS 链接、院校引用和主题引用。

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

首版无账号系统，清除浏览器数据或更换设备后不会同步。
