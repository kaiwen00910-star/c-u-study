# 第十批：七所院校全专业学习地图上线记录

核验与上线日期：2026-10-04

## 上线范围

本批按“每所院校的每个 2026 招生专业”上线，共 7 所院校、36 个招生专业/培养点、28 套考试方案：

- 安徽农业大学：7 个招生点、4 套方案、计划 590 人。农业水利工程、环境工程、电气工程及其自动化、机械设计制造及其自动化、电子商务、园艺、动物科学。
- 安徽医科大学：7 个招生点、4 套方案、计划 480 人。护理学（3 个培养点）、药学（2 个培养点）、中药学、康复治疗学。
- 安徽中医药大学：7 个招生点、5 套方案、计划 500 人。针灸推拿学、康复治疗学、药学、中药学（2 个培养点）、护理学（2 个培养点）。
- 安庆师范大学：2 个招生点、2 套方案、计划 50 人。化学工程与工艺、学前教育。
- 蚌埠医科大学：6 个招生点、6 套方案、计划 300 人。护理学、医学检验技术、预防医学、医学影像技术、药学、康复治疗学。
- 皖南医科大学：2 个招生点、2 套方案、计划 90 人。医学检验技术、护理学。
- 巢湖学院：5 个招生点、5 套方案、计划 400 人。学前教育、汉语言文学、电子商务、酒店管理、商务英语。

相同院校、相同考试科目的专业或培养点共用 `exam_scheme_id` 和知识点；专业课不同的专业使用独立考试方案。招生专业通过 `program_names` 结构化保存，不从培养地点文本推断。

## 官方来源

- 安徽农业大学：[招生章程](https://zsb.ahau.edu.cn/info/1036/12394.htm)；[考纲页面](https://zsb.ahau.edu.cn/info/1028/11704.htm)。
- 安徽医科大学：[招生章程](https://zs.ahmu.edu.cn/2026/0319/c7123a197585/page.htm)；[考纲页面](https://zs.ahmu.edu.cn/2025/1114/c7123a193486/page.htm)。
- 安徽中医药大学：[招生章程](https://bkzs.ahtcm.edu.cn/info/1233/4776.htm)；[考纲页面](https://bkzs.ahtcm.edu.cn/info/1213/4736.htm)。
- 安庆师范大学：[招生章程](https://zsw.aqnu.edu.cn/info/1311/23659.htm)；[考纲页面](https://zsw.aqnu.edu.cn/info/1361/23679.htm)。
- 蚌埠医科大学：[招生章程](https://zsw.bbmu.edu.cn/info/1006/3342.htm)；[考纲页面](https://zsw.bbmu.edu.cn/info/1006/3282.htm)。
- 皖南医科大学：[招生章程 PDF](https://zsb.wnmc.edu.cn/__local/3/7E/D5/041BB95CFAB5989C5AD88A7B7E4_182A5F2D_3179F.pdf)；[考纲页面](https://zsb.wnmc.edu.cn/info/1021/8341.htm)。
- 巢湖学院：[招生章程](https://www.chu.edu.cn/zsw/2026/0319/c1511a204968/page.htm)；[考纲页面](https://www.chu.edu.cn/zsw/2025/1112/c1529a200312/page.htm)。

招生章程与考纲同时使用用户提供的本地官方文件进行逐项核对。链接只读审计覆盖 116 个唯一 URL：115 次访问成功，4 次为 TLS 握手兼容问题，1 次被站点拦截自动请求；未发现内容 404。安庆师范大学的两个官方页面属于 TLS 握手兼容项，原 URL 保持不变。

## 数据模型与路由

- canonical 院校页：`/anhui/2026/schools/:school_slug`。
- 本批 slug：`ahau`、`ahmu`、`ahtcm`、`aqnu`、`bbmu`、`wnmc`、`chu`。
- 旧专业路由继续 302 式前端跳转到院校主路由，并保留查询参数和锚点。
- 默认院校目录使用 `all-programs` 聚合范围；`computer-science` 等具体专业范围仍可访问和筛选。
- 用户学习进度继续用知识点真实 `major_slug` 生成 localStorage key，已有计算机专业进度不因 canonical 路由改变而丢失。
- sitemap 只收录 canonical 页面：35 个页面，其中 31 个院校页；不收录旧院校路由。

现有 `program_names` 与 `exam_scheme_id` 足以表达本批关系，未新增业务字段。唯一约束由“年份、省份、专业范围、院校、培养点”最小调整为再包含 `program_names`，以允许同一校本部的不同招生专业分别记录。

## 草稿与发布保护

迁移前后均逐行比较所有 draft 数据，并在同一事务中设置硬性断言：

- 2027 draft/inactive 招生点：4 条，未修改。
- draft/inactive 知识点：33 条，未修改。
- 2027 非 draft 招生点：0。
- 合肥城市学院 published 招生点：0。
- 未对其他未开放院校自动发布内容。

## 迁移、快照与统计

- Supabase 项目：`vyioqbyyecueuydckrnq`。
- 最新迁移：`20261004030846_publish_verified_schools_batch_ten_2026`。
- 公开快照版本：101。
- 安徽院校目录：42 所。
- 完整学习地图：31 所。
- published 招生点：67 个。
- published 知识点：568 个。
- published 学习资源：58 条。
- published 知识点无资源覆盖：0。
- published 招生点无考纲：0。
- 重复资源 URL：0。
- sitemap：35 个 canonical 页面。

## 校验与构建

- `npm run validate:data`：通过（42 / 67 / 568 / 58）。
- `npm run check:migrations`：通过（29 个迁移文件，版本唯一且递增）。
- `npm run lint`：通过。
- `npm run test`：通过（12 个测试文件，81 项测试）。
- `npm run build`：通过（Vite 8.2.1，102 个模块）。
- `npm run audit:links`：通过，只读审计 116 个唯一 URL。
- Supabase 安全顾问：仅保留项目级“泄露密码保护未启用”警告，与本批数据库对象无关。
- Supabase 性能顾问：两个既有索引当前未记录使用；新约束、RLS 和本批查询未出现错误。

## 上线结果

- GitHub main SHA：上线提交后回填。
- GitHub Actions：上线提交后回填。
- Netlify Production deploy ID：上线提交后回填。
- Netlify Production commit_ref：上线提交后回填。

## 已知限制与建议

- 部分高校网站对 Node.js 自动请求存在 TLS 或反爬限制，不能据此判断官方页面失效；浏览器访问和本地官方文件仍作为人工核验依据。
- 当前知识点按官方考纲章节压缩为可学习的核心节点，没有复制整份考纲原文；后续可按用户反馈逐科细化，但不得改变官方考试科目和招生事实。
- 建议在后续批次继续保持每轮 7 所、每校全专业的发布粒度，并复用本批考试方案分组和草稿保护模板。
