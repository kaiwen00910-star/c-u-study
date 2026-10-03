# 院校主导型学习地图改造

更新时间：2026-10-03

## 改造前基线

- GitHub `main`：`dfc702f3cdba33d1b78c8290911664187136db4d`
- GitHub Actions：`36975167475`，`success`
- Netlify Production：`6abf533ad0cf30000871c321`，`commit_ref=dfc702f3cdba33d1b78c8290911664187136db4d`
- Supabase 最新迁移：`20261002062534_publish_verified_fuyang_normal_university_2026`
- 公开快照：版本 93；42 所目录院校、24 所完整学习地图、31 个 published 招生点、319 个 published 知识点、21 条 published 资源
- 数据健康：知识点无资源覆盖 0、招生点无考纲 0、重复资源 URL 0
- 草稿：4 个 2027 draft/inactive 招生点、33 个 draft/inactive 知识点；2027 非 draft 为 0
- 合肥城市学院 published 招生点为 0

开始改造前，本地 `main`、本地 `origin/main`、GitHub `main` 三者一致，工作区干净；远端迁移历史与仓库迁移文件一致。只读审计没有发现晚于版本 93 的后台手工数据或未同步草稿。

## 路由与 canonical 设计

- canonical 院校路由：`/anhui/2026/schools/:school_slug`
- 专业筛选入口继续保留：`/anhui/2026/computer-science`
- 院校对比继续保留：`/anhui/2026/computer-science/compare`
- 旧学习地图路由 `/:province/:year/:major/:school` 使用客户端 `replace` 跳转到新院校路由，并保留 query 与 hash。
- 旧路由的 SEO canonical 在跳转前也指向新院校路由，避免重复内容。
- 首页院校墙、院校卡片、对比页和搜索深链接全部使用新路由。
- sitemap 保持 28 个 canonical 页面，其中 24 个为院校主路由；旧学习地图 URL 不进入 sitemap。

## 数据模型决策

现有结构不足以可靠完成本轮目标：招生专业仅存在于 `training_site` 展示文本中，院校聚合又只复制首个招生点的科目，因此无法稳定表达“同校多专业、同/不同考试方案”。

迁移 `20261003034212_add_offering_exam_schemes` 对 `admission_offerings` 做最小、向后兼容扩展：

- `program_names text[]`：结构化保存一个招生点对应的一个或多个招生专业；
- `exam_scheme_id text`：同校且公共课、专业课组合完全相同的招生点共享同一 ID；
- 增加 published 完整性约束和按院校/方案查询的部分索引；
- 更新年度复制 RPC，使新年度草稿保留结构化专业和方案关系；
- 只回填 31 条 published 记录，不更新任何 draft；
- 不新增知识点字段，也不重新录入 319 个知识点。

没有新增 `syllabus_set_id`。原因是现有知识点已经具有年份、省份、专业范围、院校和科目维度；前端按所选考试方案声明的精确科目集合筛选公共与学校专属知识点，即可可靠隔离方案，同时保持公共课知识点复用。

## 多专业、多培养点与多方案

- 同科目组合：招生点和专业分别展示，聚合成一个考试方案，共用知识点，不重复生成数据。
- 不同科目组合：生成不同考试方案标签；知识点与资源随方案切换，仅显示方案科目。
- 公共课：继续使用 `school_slug=common` 的既有知识点，并按方案公共课过滤；进度 key 未改变，因此跨路由和跨同校方案继续共享原有公共课进度。
- 安徽财经大学：计算机科学与技术的两个培养点共享一个方案；智能科学与技术使用另一个方案。计算机方案不含“智能科学与技术专业基础”，智能方案不含“计算机专业基础”。
- 合肥师范学院：两个培养点保留为两个招生点，只形成一个共享方案。

## 院校页面与后台

院校页顶部显示院校名称、办学性质、年份和官方来源；下方逐招生点显示专业、计划、培养地点与地址、报考范围、来源状态、核验日期、正式章程和正式考纲。考试方案标签同步控制科目、知识点和资源。

后台招生计划编辑器新增结构化专业和考试方案 ID 字段；发布检查要求两者完整。既有后台登录、资源、考纲和院校管理流程未改变。

## 草稿与发布范围保护

迁移前后只读核验结果一致：

- 4 个 2027 招生点仍为 draft/inactive，`updated_at` 仍为 `2026-08-25T11:44:16.19573+00:00`；新增字段保持空值；
- 33 个 draft/inactive 知识点未修改；
- 2027 非 draft 为 0；
- 合肥城市学院 published 招生点为 0；
- 未开放院校不会生成学习地图链接或 canonical 页面。

## 兼容策略

- `localStorage` 的进度 key 继续使用 `year:province:major:school:point`，路由变化不会清空或迁移用户进度。
- Supabase 在线内容仍按 content version 与内置快照比较；较旧在线数据不能覆盖较新快照。
- 快照通过匿名公开 RLS 接口导出，Supabase 不可用时仍提供 42 所目录和 24 所完整地图。
- 官方章程、考纲和学习资源 URL 未改变。
- 专业筛选、年份、省份、招生点、考试科目和院校比较维度全部保留。

## 测试与构建

- `npm run validate:data`：通过（42 / 31 / 319 / 21）
- `npm run check:migrations`：通过（28 个迁移文件，版本唯一且递增）
- `npm run lint`：通过
- `npm test`：通过（12 个测试文件，79 个测试）
- `npm run build`：通过（Vite 8.2.1，102 个模块）
- sitemap：28 个 canonical 页面，24 个院校主路由，0 个旧学习地图路由

新增回归覆盖 24 所新路由、首页院校墙、旧路由跳转、未开放院校、共享方案去重、不同方案隔离、安徽财经大学、阜阳师范大学、合肥城市学院、静态回退、焦点数量和 sitemap canonical。

## 改造后统计

- 院校目录：42 所
- 完整学习地图：24 所
- published 招生点：31 个
- published 知识点：319 个
- published 学习资源：21 条
- published 知识点无资源覆盖：0
- published 招生点无考纲：0
- 重复资源 URL：0
- 2027 draft/inactive 招生点：4 条
- 2027 非 draft：0
- draft/inactive 知识点：33 条
- 合肥城市学院 published 招生点：0
- 公开快照：版本 95

## 上线记录

- 功能上线 GitHub SHA：`a3442c829ba615d3c54525dd5e749f9fc02deb67`
- GitHub Actions：[37094901748](https://github.com/kaiwen00910-star/c-u-study/actions/runs/37094901748)，`success`
- Netlify Production deploy ID：`6ac07d1cf893d700088c6881`，`ready`，`commit_ref=a3442c829ba615d3c54525dd5e749f9fc02deb67`
- Supabase 迁移：`20261003034212_add_offering_exam_schemes`

## 已知限制与后续建议

- canonical 院校 URL 不包含专业 slug；当前发布范围只有 `computer-science`。数据库和进度 key 仍保留专业维度。未来同一院校发布第二个专业范围时，应让院校页按年份/省份加载该校全部 published 范围，再在页内增加专业层切换，而不是恢复多套院校 URL。
- 考试方案 ID 在本次迁移中按“院校 + 完整科目组合”生成。后台后续新增招生点时，应复用同科目组合的既有方案 ID，或在正式发布前由校验工具提示可复用方案。
- 4 条早期招生点（合肥师范学院 2 条、安徽信息工程学院、安徽文达信息工程学院）的既有 `training_site` 只有培养院校/校本部名称，没有街道门牌。本轮不新增或猜测官方事实，页面完整展示现有字段；后续应在重新核验官方文件时补结构化地址。
- Supabase 安全顾问在迁移后没有发现新表/RLS 风险，但项目级[泄露密码保护](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)仍处于关闭状态；建议在 Auth 设置中评估启用。性能顾问将本次新索引标为刚创建且尚未使用，这是上线前的预期状态，应在产生真实查询统计后再判断，不能现在删除。
