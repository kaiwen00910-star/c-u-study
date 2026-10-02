-- Remote migration version: 20260929163216.
-- Publish three verified 2026 computer-related study maps.
-- The user-provided PDFs are official attachments whose download entries may
-- require a captcha; no captcha was bypassed and the file contents were
-- checked against the schools' official release pages.

update public.academic_schools set school_slug = 'ahstu', theme_color = '#1f6f43'
where school_id = 'anhui-school-09' and school_slug = 'anhui-school-09';
update public.academic_schools set school_slug = 'czu', theme_color = '#245b9e'
where school_id = 'anhui-school-20' and school_slug = 'anhui-school-20';
update public.academic_schools set school_slug = 'aufe', theme_color = '#8c1d40'
where school_id = 'anhui-school-39' and school_slug = 'anhui-school-39';

insert into public.admission_offerings (
  offering_id, year, province_slug, major_slug, school_slug, training_site,
  eligible_major_categories, public_subjects, professional_subjects, plan_count,
  charter_url, syllabus_url, source_status, verified_at, active, status, sort_order
) values
  ('ahstu-cs-2026', 2026, 'anhui', 'computer-science', 'ahstu', '计算机科学与技术：滁州职业技术学院（安徽省滁州市丰乐大道2188号）', array['电子与信息大类','能源动力与材料大类','装备制造大类','交通运输大类'], array['高等数学','英语'], array['计算机专业基础','C语言程序设计'], 50, 'https://www.ahstu.edu.cn/zsc/info/1056/6385.htm', 'https://www.ahstu.edu.cn/zsc/info/1042/5945.htm', '2026正式章程与官方考纲（考纲附件下载需验证码，内容依据用户提供的官方附件核验）', '2026-09-30', true, 'published', 26),
  ('czu-network-2026', 2026, 'anhui', 'computer-science', 'czu', '网络工程：安徽警官职业学院西区（安徽省合肥市蜀山区清溪路78号）', array['能源动力与材料大类','电子与信息大类','装备制造大类','交通运输大类','公安与司法大类'], array['高等数学','英语'], array['计算机基础','C语言程序设计'], 100, 'https://zs.czu.edu.cn/info/1008/1745.htm', 'https://zs.czu.edu.cn/info/1004/1711.htm', '2026正式章程与官方考纲（考纲附件下载需验证码，内容依据用户提供的官方附件核验）', '2026-09-30', true, 'published', 27),
  ('aufe-cs-acvtc-2026', 2026, 'anhui', 'computer-science', 'aufe', '计算机科学与技术：安徽财贸职业学院蜀山校区（安徽省合肥市蜀山区玉兰大道7号）', array['电子与信息大类'], array['高等数学','英语'], array['计算机专业基础','程序设计'], 100, 'https://zsjy.aufe.edu.cn/newsInfo/230', 'https://zsjy.aufe.edu.cn/newsInfo/230', '2026正式章程与官方考纲（内容依据学校官方发布页及用户提供的官方附件核验）', '2026-09-30', true, 'published', 28),
  ('aufe-intelligent-acvtc-2026', 2026, 'anhui', 'computer-science', 'aufe', '智能科学与技术：安徽财贸职业学院蜀山校区（安徽省合肥市蜀山区玉兰大道7号）', array['电子与信息大类','装备制造大类'], array['高等数学','英语'], array['智能科学与技术专业基础','程序设计'], 100, 'https://zsjy.aufe.edu.cn/newsInfo/230', 'https://zsjy.aufe.edu.cn/newsInfo/230', '2026正式章程与官方考纲（内容依据学校官方发布页及用户提供的官方附件核验）', '2026-09-30', true, 'published', 29),
  ('aufe-cs-audit-2026', 2026, 'anhui', 'computer-science', 'aufe', '计算机科学与技术：安徽审计职业学院（安徽省合肥市经济技术开发区方兴大道509号）', array['电子与信息大类'], array['高等数学','英语'], array['计算机专业基础','程序设计'], 100, 'https://zsjy.aufe.edu.cn/newsInfo/230', 'https://zsjy.aufe.edu.cn/newsInfo/230', '2026正式章程与官方考纲（内容依据学校官方发布页及用户提供的官方附件核验）', '2026-09-30', true, 'published', 30);

insert into public.syllabus_points (
  point_id, year, province_slug, major_slug, school_slug, subject_slug, subject_name,
  section_order, section_name, point_order, point_title, canonical_topic, active, status
) values
  ('ahstu-cb-overview', 2026, 'anhui', 'computer-science', 'ahstu', 'computer-basics', '计算机专业基础', 1, '计算机基础知识', 1, '计算机的发展、特点、分类与应用领域', 'computer-basics', true, 'published'),
  ('ahstu-cb-system', 2026, 'anhui', 'computer-science', 'ahstu', 'computer-basics', '计算机专业基础', 1, '计算机基础知识', 2, '计算机系统组成、工作原理与软硬件系统', 'computer-basics', true, 'published'),
  ('ahstu-cb-data', 2026, 'anhui', 'computer-science', 'ahstu', 'computer-basics', '计算机专业基础', 1, '计算机基础知识', 3, '数制、编码与信息在计算机中的表示', 'computer-basics', true, 'published'),
  ('ahstu-cb-windows', 2026, 'anhui', 'computer-science', 'ahstu', 'computer-basics', '计算机专业基础', 2, 'Windows与办公软件', 1, 'Windows 10基本操作与文件管理', 'computer-basics', true, 'published'),
  ('ahstu-cb-word', 2026, 'anhui', 'computer-science', 'ahstu', 'computer-basics', '计算机专业基础', 2, 'Windows与办公软件', 2, 'Word 2016文档编辑、排版与表格处理', 'computer-office', true, 'published'),
  ('ahstu-cb-excel', 2026, 'anhui', 'computer-science', 'ahstu', 'computer-basics', '计算机专业基础', 2, 'Windows与办公软件', 3, 'Excel 2016工作表、公式函数与图表', 'computer-office', true, 'published'),
  ('ahstu-cb-powerpoint', 2026, 'anhui', 'computer-science', 'ahstu', 'computer-basics', '计算机专业基础', 2, 'Windows与办公软件', 4, 'PowerPoint 2016演示文稿制作与放映', 'computer-office', true, 'published'),
  ('ahstu-cb-network', 2026, 'anhui', 'computer-science', 'ahstu', 'computer-basics', '计算机专业基础', 3, '网络与信息安全', 1, '计算机网络基础、局域网与网络连接', 'network-basic', true, 'published'),
  ('ahstu-cb-internet', 2026, 'anhui', 'computer-science', 'ahstu', 'computer-basics', '计算机专业基础', 3, '网络与信息安全', 2, 'Internet服务、浏览器、搜索与电子邮件', 'network-basic', true, 'published'),
  ('ahstu-cb-security', 2026, 'anhui', 'computer-science', 'ahstu', 'computer-basics', '计算机专业基础', 3, '网络与信息安全', 3, '计算机病毒、网络安全与常用安全工具', 'information-security', true, 'published'),
  ('ahstu-c-overview', 2026, 'anhui', 'computer-science', 'ahstu', 'c-language', 'C语言程序设计', 1, 'C语言基础', 1, 'C语言特点、程序结构与算法表示', 'c-language-basic', true, 'published'),
  ('ahstu-c-types', 2026, 'anhui', 'computer-science', 'ahstu', 'c-language', 'C语言程序设计', 1, 'C语言基础', 2, '数据类型、常量变量、运算符与表达式', 'c-language-basic', true, 'published'),
  ('ahstu-c-io', 2026, 'anhui', 'computer-science', 'ahstu', 'c-language', 'C语言程序设计', 1, 'C语言基础', 3, '格式化输入输出与字符输入输出', 'c-language-basic', true, 'published'),
  ('ahstu-c-selection', 2026, 'anhui', 'computer-science', 'ahstu', 'c-language', 'C语言程序设计', 1, 'C语言基础', 4, '关系逻辑运算与选择结构', 'c-language-control', true, 'published'),
  ('ahstu-c-loop', 2026, 'anhui', 'computer-science', 'ahstu', 'c-language', 'C语言程序设计', 1, 'C语言基础', 5, 'while、do-while、for循环与循环控制', 'c-language-control', true, 'published'),
  ('ahstu-c-array', 2026, 'anhui', 'computer-science', 'ahstu', 'c-language', 'C语言程序设计', 2, '数组、函数与指针', 1, '一维数组、二维数组与字符数组', 'c-language-array', true, 'published'),
  ('ahstu-c-function', 2026, 'anhui', 'computer-science', 'ahstu', 'c-language', 'C语言程序设计', 2, '数组、函数与指针', 2, '函数定义调用、递归、作用域与存储类别', 'c-language-array', true, 'published'),
  ('ahstu-c-preprocessor', 2026, 'anhui', 'computer-science', 'ahstu', 'c-language', 'C语言程序设计', 2, '数组、函数与指针', 3, '编译预处理、宏定义与文件包含', 'c-language-basic', true, 'published'),
  ('ahstu-c-pointer', 2026, 'anhui', 'computer-science', 'ahstu', 'c-language', 'C语言程序设计', 2, '数组、函数与指针', 4, '指针、数组指针、字符串指针与函数指针', 'c-language-pointer', true, 'published'),
  ('ahstu-c-struct', 2026, 'anhui', 'computer-science', 'ahstu', 'c-language', 'C语言程序设计', 3, '复合类型与链表', 1, '结构体及结构体数组', 'c-language-pointer', true, 'published'),
  ('ahstu-c-list', 2026, 'anhui', 'computer-science', 'ahstu', 'c-language', 'C语言程序设计', 3, '复合类型与链表', 2, '结构体指针与链表基本操作', 'c-language-pointer', true, 'published'),
  ('ahstu-c-union-enum', 2026, 'anhui', 'computer-science', 'ahstu', 'c-language', 'C语言程序设计', 3, '复合类型与链表', 3, '共用体、枚举与typedef', 'c-language-pointer', true, 'published'),
  ('czu-cb-data', 2026, 'anhui', 'computer-science', 'czu', 'computer-basics', '计算机基础', 1, '信息与计算机系统', 1, '信息、数据、数制及字符编码', 'computer-basics', true, 'published'),
  ('czu-cb-hardware', 2026, 'anhui', 'computer-science', 'czu', 'computer-basics', '计算机基础', 1, '信息与计算机系统', 2, '计算机体系结构与硬件系统组成', 'computer-basics', true, 'published'),
  ('czu-cb-cpu-memory', 2026, 'anhui', 'computer-science', 'czu', 'computer-basics', '计算机基础', 1, '信息与计算机系统', 3, 'CPU、存储器与输入输出设备', 'computer-basics', true, 'published'),
  ('czu-cb-software-os', 2026, 'anhui', 'computer-science', 'czu', 'computer-basics', '计算机基础', 2, '软件与程序设计基础', 1, '系统软件、应用软件、操作系统与文件管理', 'computer-basics', true, 'published'),
  ('czu-cb-algorithm-language', 2026, 'anhui', 'computer-science', 'czu', 'computer-basics', '计算机基础', 2, '软件与程序设计基础', 2, '算法、程序设计语言与语言处理程序', 'computer-basics', true, 'published'),
  ('czu-cb-network-lan', 2026, 'anhui', 'computer-science', 'czu', 'computer-basics', '计算机基础', 3, '计算机网络', 1, '计算机网络组成、分类、体系结构与局域网', 'network-basic', true, 'published'),
  ('czu-cb-tcpip-ip', 2026, 'anhui', 'computer-science', 'czu', 'computer-basics', '计算机基础', 3, '计算机网络', 2, 'TCP/IP体系、IP地址与子网基础', 'network-ip', true, 'published'),
  ('czu-cb-services-security', 2026, 'anhui', 'computer-science', 'czu', 'computer-basics', '计算机基础', 3, '计算机网络', 3, '网络服务、互联设备与信息安全', 'information-security', true, 'published'),
  ('czu-cb-image', 2026, 'anhui', 'computer-science', 'czu', 'computer-basics', '计算机基础', 4, '数字媒体与信息系统', 1, '数字图像表示、处理与常用格式', 'multimedia-basic', true, 'published'),
  ('czu-cb-audio-video', 2026, 'anhui', 'computer-science', 'czu', 'computer-basics', '计算机基础', 4, '数字媒体与信息系统', 2, '数字音频、视频与多媒体技术', 'multimedia-basic', true, 'published'),
  ('czu-cb-information-system', 2026, 'anhui', 'computer-science', 'czu', 'computer-basics', '计算机基础', 4, '数字媒体与信息系统', 3, '信息系统组成、功能与开发基础', 'database-basic', true, 'published'),
  ('czu-cb-database', 2026, 'anhui', 'computer-science', 'czu', 'computer-basics', '计算机基础', 4, '数字媒体与信息系统', 4, '数据库系统、数据模型与数据库应用', 'database-basic', true, 'published'),
  ('czu-c-overview', 2026, 'anhui', 'computer-science', 'czu', 'c-language', 'C语言程序设计', 1, 'C语言基础', 1, 'C语言特点、程序组成与开发过程', 'c-language-basic', true, 'published'),
  ('czu-c-types', 2026, 'anhui', 'computer-science', 'czu', 'c-language', 'C语言程序设计', 1, 'C语言基础', 2, '数据类型、运算符与表达式', 'c-language-basic', true, 'published'),
  ('czu-c-algorithm-io', 2026, 'anhui', 'computer-science', 'czu', 'c-language', 'C语言程序设计', 1, 'C语言基础', 3, '算法表示与输入输出函数', 'c-language-basic', true, 'published'),
  ('czu-c-control', 2026, 'anhui', 'computer-science', 'czu', 'c-language', 'C语言程序设计', 1, 'C语言基础', 4, '顺序、选择、循环及流程控制', 'c-language-control', true, 'published'),
  ('czu-c-function', 2026, 'anhui', 'computer-science', 'czu', 'c-language', 'C语言程序设计', 2, '函数、数组与指针', 1, '函数定义调用、参数传递与递归', 'c-language-array', true, 'published'),
  ('czu-c-array', 2026, 'anhui', 'computer-science', 'czu', 'c-language', 'C语言程序设计', 2, '函数、数组与指针', 2, '一维数组、二维数组与字符串', 'c-language-array', true, 'published'),
  ('czu-c-pointer', 2026, 'anhui', 'computer-science', 'czu', 'c-language', 'C语言程序设计', 2, '函数、数组与指针', 3, '指针、数组、函数与指针的关系', 'c-language-pointer', true, 'published'),
  ('czu-c-struct', 2026, 'anhui', 'computer-science', 'czu', 'c-language', 'C语言程序设计', 3, '复合类型与文件', 1, '结构体及结构体数组', 'c-language-pointer', true, 'published'),
  ('czu-c-list-union-enum', 2026, 'anhui', 'computer-science', 'czu', 'c-language', 'C语言程序设计', 3, '复合类型与文件', 2, '链表、共用体、枚举与typedef', 'c-language-pointer', true, 'published'),
  ('czu-c-file', 2026, 'anhui', 'computer-science', 'czu', 'c-language', 'C语言程序设计', 3, '复合类型与文件', 3, '文件指针、文件读写与定位', 'c-language-pointer', true, 'published'),
  ('aufe-cf-overview-data', 2026, 'anhui', 'computer-science', 'aufe', 'computer-foundations', '计算机专业基础', 1, '计算机系统基础', 1, '计算机概述、信息表示与数据编码', 'computer-basics', true, 'published'),
  ('aufe-cf-architecture', 2026, 'anhui', 'computer-science', 'aufe', 'computer-foundations', '计算机专业基础', 1, '计算机系统基础', 2, '计算机体系结构与工作原理', 'computer-basics', true, 'published'),
  ('aufe-cf-hardware', 2026, 'anhui', 'computer-science', 'aufe', 'computer-foundations', '计算机专业基础', 1, '计算机系统基础', 3, '微型计算机硬件系统与外部设备', 'computer-basics', true, 'published'),
  ('aufe-cf-data-structure', 2026, 'anhui', 'computer-science', 'aufe', 'computer-foundations', '计算机专业基础', 2, '软件与数据管理', 1, '数据结构与基本算法概念', 'data-structure-linear', true, 'published'),
  ('aufe-cf-languages', 2026, 'anhui', 'computer-science', 'aufe', 'computer-foundations', '计算机专业基础', 2, '软件与数据管理', 2, '程序设计语言与编译解释基础', 'computer-basics', true, 'published'),
  ('aufe-cf-os', 2026, 'anhui', 'computer-science', 'aufe', 'computer-foundations', '计算机专业基础', 2, '软件与数据管理', 3, '操作系统功能、分类与资源管理', 'computer-basics', true, 'published'),
  ('aufe-cf-database', 2026, 'anhui', 'computer-science', 'aufe', 'computer-foundations', '计算机专业基础', 2, '软件与数据管理', 4, '数据库、SQL、数据仓库与数据挖掘基础', 'database-basic', true, 'published'),
  ('aufe-cf-software-engineering', 2026, 'anhui', 'computer-science', 'aufe', 'computer-foundations', '计算机专业基础', 2, '软件与数据管理', 5, '软件工程过程、方法与质量基础', 'software-engineering', true, 'published'),
  ('aufe-cf-network-cloud', 2026, 'anhui', 'computer-science', 'aufe', 'computer-foundations', '计算机专业基础', 3, '网络安全与前沿技术', 1, '计算机网络、云计算与物联网基础', 'network-basic', true, 'published'),
  ('aufe-cf-security', 2026, 'anhui', 'computer-science', 'aufe', 'computer-foundations', '计算机专业基础', 3, '网络安全与前沿技术', 2, '信息安全威胁、防护与管理基础', 'information-security', true, 'published'),
  ('aufe-cf-frontier', 2026, 'anhui', 'computer-science', 'aufe', 'computer-foundations', '计算机专业基础', 3, '网络安全与前沿技术', 3, '移动计算、边缘计算与新兴计算技术', 'computer-basics', true, 'published'),
  ('aufe-pd-overview', 2026, 'anhui', 'computer-science', 'aufe', 'program-design', '程序设计', 1, 'C程序设计基础', 1, 'C语言程序结构与算法表示', 'c-language-basic', true, 'published'),
  ('aufe-pd-types', 2026, 'anhui', 'computer-science', 'aufe', 'program-design', '程序设计', 1, 'C程序设计基础', 2, '数据类型、运算符与表达式', 'c-language-basic', true, 'published'),
  ('aufe-pd-io', 2026, 'anhui', 'computer-science', 'aufe', 'program-design', '程序设计', 1, 'C程序设计基础', 3, '输入输出函数与格式控制', 'c-language-basic', true, 'published'),
  ('aufe-pd-selection', 2026, 'anhui', 'computer-science', 'aufe', 'program-design', '程序设计', 1, 'C程序设计基础', 4, '选择结构与逻辑表达式', 'c-language-control', true, 'published'),
  ('aufe-pd-loop', 2026, 'anhui', 'computer-science', 'aufe', 'program-design', '程序设计', 1, 'C程序设计基础', 5, '循环结构与循环控制', 'c-language-control', true, 'published'),
  ('aufe-pd-function', 2026, 'anhui', 'computer-science', 'aufe', 'program-design', '程序设计', 2, '函数、数组与指针', 1, '函数定义调用、参数传递与递归', 'c-language-array', true, 'published'),
  ('aufe-pd-array', 2026, 'anhui', 'computer-science', 'aufe', 'program-design', '程序设计', 2, '函数、数组与指针', 2, '数组与字符串程序设计', 'c-language-array', true, 'published'),
  ('aufe-pd-pointer', 2026, 'anhui', 'computer-science', 'aufe', 'program-design', '程序设计', 2, '函数、数组与指针', 3, '指针、数组指针与函数指针', 'c-language-pointer', true, 'published'),
  ('aufe-ai-cognition', 2026, 'anhui', 'computer-science', 'aufe', 'intelligent-science', '智能科学与技术专业基础', 1, '智能科学基础', 1, '智能科学、认知过程与人工智能基本问题', 'artificial-intelligence', true, 'published'),
  ('aufe-ai-perception', 2026, 'anhui', 'computer-science', 'aufe', 'intelligent-science', '智能科学与技术专业基础', 1, '智能科学基础', 2, '机器感知、特征提取与信息融合', 'artificial-intelligence', true, 'published'),
  ('aufe-ai-pattern', 2026, 'anhui', 'computer-science', 'aufe', 'intelligent-science', '智能科学与技术专业基础', 1, '智能科学基础', 3, '模式识别、贝叶斯分类、聚类与分类器', 'artificial-intelligence', true, 'published'),
  ('aufe-ai-machine-learning', 2026, 'anhui', 'computer-science', 'aufe', 'intelligent-science', '智能科学与技术专业基础', 2, '智能技术与应用', 1, '机器学习与人工神经网络基础', 'artificial-intelligence', true, 'published'),
  ('aufe-ai-robotics', 2026, 'anhui', 'computer-science', 'aufe', 'intelligent-science', '智能科学与技术专业基础', 2, '智能技术与应用', 2, '智能机器人组成、感知、规划与控制', 'artificial-intelligence', true, 'published'),
  ('aufe-ai-nlp', 2026, 'anhui', 'computer-science', 'aufe', 'intelligent-science', '智能科学与技术专业基础', 2, '智能技术与应用', 3, '自然语言处理基本任务与方法', 'artificial-intelligence', true, 'published'),
  ('aufe-ai-big-data', 2026, 'anhui', 'computer-science', 'aufe', 'intelligent-science', '智能科学与技术专业基础', 2, '智能技术与应用', 4, '大数据、MapReduce与Spark基础', 'big-data', true, 'published'),
  ('aufe-ai-system', 2026, 'anhui', 'computer-science', 'aufe', 'intelligent-science', '智能科学与技术专业基础', 2, '智能技术与应用', 5, '智能系统构成、典型应用与发展趋势', 'artificial-intelligence', true, 'published');

insert into public.resources (
  resource_id, topic_tags, title, platform, creator, url, resource_type,
  difficulty, duration_text, recommendation_reason, priority, verified_at, status
) values
  ('res-artificial-intelligence-1', array['artificial-intelligence'], '人工智能导论', '中国大学MOOC', '高校人工智能课程团队', 'https://www.icourse163.org/course/detail.htm?cid=1207042802', '系统课程', '入门', '完整学期', '课程页覆盖人工智能基础、机器学习、模式识别与典型智能应用，可对应智能科学与技术专业基础考纲', 1, '2026-09-30', 'published'),
  ('res-big-data-1', array['big-data'], '大数据技术原理与应用', '中国大学MOOC', '厦门大学', 'https://www.icourse163.org/course/XMU-1002335004', '系统课程', '入门', '完整学期', '国家精品课程覆盖大数据概念、Hadoop、HDFS、HBase、MapReduce与Spark，可对应考纲中的大数据技术章节', 1, '2026-09-30', 'published');
