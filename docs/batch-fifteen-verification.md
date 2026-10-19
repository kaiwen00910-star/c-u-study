# 第十五批院校专业地图核验记录

核验日期：2026-10-19

## 改造前基线

- GitHub `main` / 本地 `main`：`d40e43f9b89ed0998a67b0503cc952312b507616`，工作区干净。
- Supabase 最新迁移：`20261019050302_complete_batch_fourteen_professional_maps_2026`。
- 公开快照版本：119。
- 42 所院校、41 所已开放院校专业地图、367 个 published/active 招生点。
- 1033 个 published/active 知识点、80 条 published 学习资源。
- 33 条 draft/inactive 知识点、4 条 2027 draft/inactive 招生点。
- 七所目标院校各有 1 条旧计算机专业示例记录，共 7 条。
- Netlify Production：deploy `6ad5cb6f44a3e22903a0c2a2`，commit ref `d40e43f9b89ed0998a67b0503cc952312b507616`，状态 `ready`。

## 目标院校与录入结果

本批只补齐院校、招生专业、招生计划、培养地点、报考范围和考试方案，不新增或修改知识点、学习资源。每条招生记录只对应一个专业；同校同科目复用考试方案，文理公共课不同则拆分方案。

| 院校 | 办学性质 | 招生记录 | 独立专业 | 计划合计 | 考试方案 | 培养地点 |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| 安徽建筑大学 | 公办 | 6 | 5 | 350 | 5 | 安徽城市管理职业学院、徽商职业学院 |
| 池州学院 | 公办 | 14 | 12 | 1000 | 14 | 池州学院、池州职业技术学院、安徽警官职业学院 |
| 皖西学院 | 公办 | 15 | 15 | 1200 | 14 | 皖西学院、安徽国防科技职业学院 |
| 马鞍山学院 | 民办 | 26 | 18 | 2400 | 25 | 马鞍山学院 |
| 安徽新华学院 | 民办 | 11 | 10 | 1800 | 11 | 安徽新华学院 |
| 安徽信息工程学院 | 民办 | 7 | 7 | 600 | 7 | 安徽信息工程学院 |
| 安徽文达信息工程学院 | 民办 | 22 | 16 | 2000 | 16 | 安徽文达信息工程学院 |
| 合计 |  | 101 | 83 | 9350 | 92 |  |

各专业的计划、文理科、完整培养地址、报考范围、公共课、专业课、`offering_id` 与 `exam_scheme_id` 已逐行写入 [第十五批迁移](../supabase/migrations/20261019104817_complete_batch_fifteen_professional_maps_2026.sql) 和 [offerings.csv](../content/offerings.csv)。迁移内置逐校记录数、专业数、计划数、同科目方案复用、不同科目方案隔离以及每条记录单专业断言。

## 官方资料

| 院校 | 正式招生章程 | 正式考试大纲/方案 |
| --- | --- | --- |
| 安徽建筑大学 | https://www.ahjzu.edu.cn/zsw/2026/0204/c2435a263781/page.htm | 同页正式附件 |
| 池州学院 | https://zs.czu.edu.cn/info/1008/1745.htm | https://zs.czu.edu.cn/info/1004/1711.htm |
| 皖西学院 | https://zsb.wxc.edu.cn/2026/0319/c270a211177/page.htm | https://zsb.wxc.edu.cn/2025/1208/c270a208230/page.htm |
| 马鞍山学院 | https://zs.masu.edu.cn/2026/0318/c168a75656/page.htm | https://zs.masu.edu.cn/2025/1029/c167a71330/page.htm（页面内嵌正式 PDF） |
| 安徽新华学院 | https://zhaosheng.axhu.edu.cn/contents/2685/261780.html | https://zhaosheng.axhu.edu.cn/contents/2685/257592.html |
| 安徽信息工程学院 | https://zsxx.aiit.edu.cn/info/182584 | https://zsxx.aiit.edu.cn/info/179795 |
| 安徽文达信息工程学院 | https://www.wenda.edu.cn/zs/display_34105.html | 同页附件 4 |

招生章程及本地考试大纲共核验 57 个文件。完整文件名与逐文件 SHA-256 见 [batch-fifteen-source-hashes.csv](./batch-fifteen-source-hashes.csv)，清单自身 SHA-256 为 `3A69441490551CC71811C03AD81952411A04A99593FE3FE467FB016063F11412`。马鞍山学院本地文件夹中没有单独考纲文件，但官方方案页内嵌《马鞍山学院2026年专升本招生专业课考试书目大纲》正式 PDF，资料完整，因此本批无需向用户补充询问考纲。

## 数据保护与迁移

- 迁移：`20261019104817_complete_batch_fifteen_professional_maps_2026`。
- 迁移前后均保存 4 条招生草稿、33 条知识点草稿和 0 条资源草稿的 JSONB 快照。
- [迁移前快照](./batch-fifteen-drafts-before.json) 与 [迁移后快照](./batch-fifteen-drafts-after.json) SHA-256 均为 `AB0B0764E52B63B1C1560B71CB7F663A699F9CEDC35CFFB011E0AED2BACA4400`。
- 迁移在同一事务内逐字段对比全部知识点、全部资源、全部草稿/非激活记录及所有非目标院校招生点；任一差异都会回滚。
- 迁移后公开快照版本：123。
- 迁移后：461 个 published/active 招生点、41 所开放院校地图、1033 个 published/active 知识点、80 条 published 资源。
- 33 条 draft/inactive 知识点、4 条 2027 draft/inactive 招生点原样保留。
- `syllabus.csv` 和 `resources.csv` 未发生内容变化。
- Supabase advisors：无本批新增安全或性能问题；保留既有“泄露密码保护未启用”警告与一个未使用索引提示。

## 快照、sitemap 与验证

- 快照：版本 123，42 所院校、461 个招生点、1033 个知识点、80 条资源。
- sitemap：45 个 canonical URL（41 所已开放院校页面 + 4 个公共页面）；本批七校此前已有 canonical 页面，因此 URL 数不增加。
- 内容校验：通过。
- 迁移检查：35 个迁移文件，版本唯一且顺序正确。
- lint：通过。
- 单元测试：12 个测试文件、93 项测试全部通过。
- 生产构建：通过；仅保留既有百度统计环境变量和大体积 chunk 警告。
- 链接审计：155 个唯一 URL、162 条引用；152 条可访问，2 条网络错误、4 条旧站 TLS 错误、2 条跳转、2 条反自动化限制。本批七校正式来源均已保留，未因外站访问限制改用非官方来源。

## GitHub 与 Netlify

- 第十五批实现提交：`20a9689b7c0fcae8b799e8535fbe9089d1007966`。
- GitHub Actions：https://github.com/kaiwen00910-star/c-u-study/actions/runs/39241073548，状态 `success`。
- 推送前 Netlify Production deploy：`6ad5cb6f44a3e22903a0c2a2`，commit ref `d40e43f9b89ed0998a67b0503cc952312b507616`。
- 第十五批实现 Netlify Production deploy：`6ad5f770308ad2a002e8728f`，commit ref `20a9689b7c0fcae8b799e8535fbe9089d1007966`，状态 `ready`，为 Git 关联自动部署，未进行手动部署。
- 线上抽查安徽建筑大学页面：6 个招生点、5 个考试方案、完整培养地址和“知识点与学习资源待后续整理”状态均正常；其余六校与同一已验证静态快照一并发布。

## 未完成事项

- 安徽第二医学院继续按用户要求暂停，不开放、不录入不完整资料。
- 本批七校知识点和学习资源继续冻结；后续如需扩充，应另开批次并以正式考纲逐科整理。
