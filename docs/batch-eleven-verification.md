# 第十一批院校资料与学习地图上线核验

核验日期：2026-10-04

## 本批范围

本批发布亳州学院、滁州学院、宿州学院、黄山学院、安徽艺术学院、安徽医科大学临床医学院、安徽外国语学院，共 7 所。合肥城市学院继续保持未发布；蚌埠工商学院、安徽第二医学院、芜湖职业技术大学留待后续批次。

| 院校 | 招生点 | 考试方案 | 计划数 | 正式章程 | 官方考纲入口 |
| --- | ---: | ---: | ---: | --- | --- |
| 亳州学院 | 6 | 5 | 600 | https://www.bzuu.edu.cn/zzxx/2026/0318/c130a102034/page.htm | https://www.bzuu.edu.cn/zzxx/2025/0928/c130a97083/page.htm |
| 滁州学院 | 4 | 4 | 320 | https://www.ahzsks.cn/pic/file/20260318/20260318165531_767.pdf | https://zsw.chzu.edu.cn/2025/1215/c5395a337385/page.htm |
| 宿州学院 | 9 | 9 | 480 | https://www.ahszu.edu.cn/zs/info/1107/8519.htm | https://www.ahszu.edu.cn/zs/info/1039/8239.htm |
| 黄山学院 | 8 | 8 | 400 | https://zsb.hsu.edu.cn/32/37/c1172a209463/page.htm | https://zsb.hsu.edu.cn/23/06/c1166a205574/page.htm |
| 安徽艺术学院 | 8 | 6 | 520 | https://www.ahua.edu.cn/zsw/2026/0318/c201a46012/page.htm | https://www.ahua.edu.cn/zsw/2026/0318/c201a46013/page.htm |
| 安徽医科大学临床医学院 | 8 | 8 | 1100 | https://www.aycc.edu.cn/zhaosheng/contents/39/22206.html | https://www.aycc.edu.cn/zhaosheng/contents/45/22039.html |
| 安徽外国语学院 | 22 | 13 | 2400 | https://www.aisu.edu.cn/zsb/info/1097/5199.htm | https://www.aisu.edu.cn/zsb/info/1098/5178.htm |

安徽艺术学院没有独立考纲 PDF，按用户提供的学校官方 2026 招生方案页面整理考试内容；其余学校使用用户提供的本地考纲文件，并以表中学校官方入口作为线上来源。

## 本地章程文件校验

来源目录：`D:\作业\专升本网站\专升本招生章程`

| 文件 | 字节 | SHA-256 |
| --- | ---: | --- |
| 亳州学院.pdf | 231674 | `CAACA3215B5FD0F563263345520218CF3E2B298AFDFCA275C1F30463986C33EF` |
| 滁州学院.pdf | 251074 | `B1FB0B12D88D7CB3792F944ECC7D8FDC21ABCE50BBB4E3B568D2626DBABF65A5` |
| 宿州学院.pdf | 270087 | `F74885C13C485D04CDFE000A018BA48F079BAC84A0080DAED7F727C5052C3894` |
| 黄山学院.pdf | 327622 | `D2E76671829A3AA93392F8BF45A382738EA46612EC6E73790A837FB5E4C6752A` |
| 安徽艺术学院.pdf | 205590 | `3EB40AB345D2165C158896AE8D904746E0831A36FC7BE74D4B8B9D5948C40FF9` |
| 安徽医科大学临床医学院.pdf | 237473 | `F0ED622CC732E9A5F369DF89226727C8A8903C32F946525FC496D564FDF31926` |
| 安徽外国语学院.pdf | 273634 | `A52BDFB62275A38B9FC45C8A7D3F2E375FB79C058AB70085BAB7F5D15839096F` |

## 数据模型与方案复用

- 沿用 `academic_schools`、`admission_offerings`、`syllabus_points`、`resources` 与 `content_versions`。
- 安徽外国语学院同一专业、同一培养地点存在文科和理科两套公共课组合，原唯一索引无法同时保存，因此唯一关系最小扩展为“年份 + 省份 + 专业范围 + 学校 + 培养地点 + 招生专业 + `exam_scheme_id`”。
- 相同考试科目的不同专业共用同一 `exam_scheme_id` 与学校专属知识点；不同专业课组合使用不同方案。
- 安徽艺术学院的数字媒体艺术、视觉传达设计、绘画共用“速写 + 色彩”方案，不重复生成知识点。
- 安徽外国语学院会计学与财务管理的文科方案共用一套知识点，理科方案也共用同一套专业课知识点，但公共课分别保留大学语文或高等数学。
- 本批新增 65 个 published 招生点、465 个 published 学校专属知识点、22 条 published 学习资源。

## 草稿与发布保护

迁移执行前后均以 JSONB 行快照双向 `EXCEPT` 校验全部 draft 行，并附带计数与业务断言：

- 2027 draft/inactive 招生点：4；
- 2027 非 draft：0；
- draft/inactive 知识点：33；
- 合肥城市学院 published 招生点：0；
- published 知识点无资源覆盖：0；
- published 招生点无考纲：0；
- 重复 published 资源 URL：0。

## 公开快照与导出修复

迁移后 published 知识点超过 Supabase/PostgREST 单次 1000 行返回上限。首次导出只得到 1000 条，未作为最终结果接受。`scripts/export-public-snapshot.mjs` 已改为每页 1000 条、通过 `limit`/`offset` 循环读取，最终快照版本 107 完整包含 1033 条知识点。

## 测试与构建

- `npm run validate:data`：通过（42 / 132 / 1033 / 80）。
- `npm run check:migrations`：通过（30 个迁移文件，版本唯一且有序）。
- `npm test -- --run`：通过（12 个测试文件，82 项测试）。
- `npm run lint`：通过。
- `npm run build`：通过；sitemap 生成 42 个 canonical 页面，其中 38 个院校主路由。
- `npm run audit:links`：通过；152 个唯一 URL 中 149 个直接可访问，剩余 7 个为既有来源的网络、TLS 或反爬限制；本批新增章程、考纲和资源链接均可访问。

## Supabase 与 Production 状态

- Supabase 项目：`vyioqbyyecueuydckrnq`。
- 迁移：`20261004141027_publish_verified_schools_batch_eleven_2026`，已应用。
- 公开快照版本：107。
- 迁移后统计：42 所目录院校、38 所完整学习地图、132 个 published 招生点、1033 个 published 知识点、80 条 published 学习资源。
- Supabase 安全顾问仅保留既有“泄露密码检测未启用”警告；性能顾问仅提示两个既有索引尚未命中，本迁移未新增安全警告。
- 当前 Netlify Production deploy：`6ac1c57130acd90008a0758f`，`ready`，`commit_ref=b8a6f8ce7c9a378162ad873d51e2d06a483be941`。
- 7 个新院校主路由在当前 Production 均返回 HTTP 200，旧版前端可以从 Supabase 动态读取新数据。
- Netlify 额度阻塞期间不触发手动部署、不创建新站点。当前线上 sitemap 仍为上一部署的 35 个页面，尚未包含本批 7 个 canonical URL；仓库和本地生产包已是 42 个页面，须等待额度恢复后由现有 Git 集成部署，才能完成静态 sitemap/生产包同步。

## 已知限制与后续建议

- Netlify 静态生产包和 sitemap 暂未更新，不能把“Supabase 数据已上线”误报为“新生产包已部署”。
- 额度恢复后只需重试现有站点的 main 部署，核对 `commit_ref`、42 个 sitemap URL 与 7 个院校页面，无需重复执行数据库迁移。
- 建议在下一批继续保持每轮 7 所；当前剩余未开放院校包括合肥城市学院、蚌埠工商学院、安徽第二医学院、芜湖职业技术大学，其中合肥城市学院仍受明确的未发布保护。
