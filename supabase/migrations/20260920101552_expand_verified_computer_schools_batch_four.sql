-- Expand the verified 2026 Anhui computer-major learning maps from twelve to
-- fourteen schools. Only official 2026 charters and school-hosted syllabi are
-- used. Chizhou University and Wuhu University remain unpublished because
-- their public source chains are not stably accessible.

update public.academic_schools
set school_slug = 'ahjzu', theme_color = '#1c4f91'
where school_id = 'anhui-school-08' and school_slug = 'anhui-school-08';

update public.academic_schools
set school_slug = 'hfuu', theme_color = '#0b6f62'
where school_id = 'anhui-school-14' and school_slug = 'anhui-school-14';

insert into public.admission_offerings (
  offering_id, year, province_slug, major_slug, school_slug, training_site,
  eligible_major_categories, public_subjects, professional_subjects, plan_count,
  charter_url, syllabus_url, source_status, verified_at, active, status, sort_order
) values
  (
    'ahjzu-cs-2026', 2026, 'anhui', 'computer-science', 'ahjzu',
    '计算机科学与技术：安徽城市管理职业学院（安徽省合肥市新站区淮海大道300号）',
    '电子与信息大类、装备制造大类',
    array['高等数学','英语'], array['计算机专业基础','C语言程序设计'], 60,
    'https://www.ahjzu.edu.cn/zsw/2026/0204/c2390a263781/page.htm',
    'https://www.ahjzu.edu.cn/_upload/article/files/6f/84/3e9dfa6d499a97167aaece606f6b/cf2e1b8f-26d3-45d9-9296-e6356d16bf62.pdf',
    '2026正式章程与官方考纲', '2026-09-20', true, 'published', 17
  ),
  (
    'hfuu-cs-2026', 2026, 'anhui', 'computer-science', 'hfuu',
    '计算机科学与技术：合肥大学（安徽省合肥市经济技术开发区锦绣大道99号、158号）',
    '电子与信息大类',
    array['高等数学','英语'], array['计算机专业基础','C语言程序设计'], 50,
    'https://www.hfuu.edu.cn/zs/5d/08/c12151a154888/page.htm',
    'https://www.hfuu.edu.cn/zs/59/f7/c3032a154103/page.htm',
    '2026正式章程与官方考纲', '2026-09-20', true, 'published', 18
  );

insert into public.syllabus_points (
  point_id, year, province_slug, major_slug, school_slug, subject_slug, subject_name,
  section_order, section_name, point_order, point_title, canonical_topic, active, status
) values
  ('ahjzu-cs-system', 2026, 'anhui', 'computer-science', 'ahjzu', 'computer-basics', '计算机专业基础', 1, '计算机与数据表示', 1, '计算机基础、数制转换与数据表示', 'computer-basics', true, 'published'),
  ('ahjzu-cs-hardware', 2026, 'anhui', 'computer-science', 'ahjzu', 'computer-basics', '计算机专业基础', 1, '计算机与数据表示', 2, '硬件系统、处理器、存储与输入输出设备', 'computer-basics', true, 'published'),
  ('ahjzu-cs-os', 2026, 'anhui', 'computer-science', 'ahjzu', 'computer-basics', '计算机专业基础', 2, '操作系统与网络', 1, '操作系统基础与Windows基本使用', 'computer-basics', true, 'published'),
  ('ahjzu-cs-network', 2026, 'anhui', 'computer-science', 'ahjzu', 'computer-basics', '计算机专业基础', 2, '操作系统与网络', 2, '网络体系、局域网、IP地址与网络安全', 'network-basic', true, 'published'),
  ('ahjzu-cs-web', 2026, 'anhui', 'computer-science', 'ahjzu', 'computer-basics', '计算机专业基础', 3, 'Web与数据库', 1, '万维网、HTML、HTTP与网页设计基础', 'network-basic', true, 'published'),
  ('ahjzu-cs-database', 2026, 'anhui', 'computer-science', 'ahjzu', 'computer-basics', '计算机专业基础', 3, 'Web与数据库', 2, '数据库系统、数据模型与关系数据库基础', 'database-basic', true, 'published'),
  ('ahjzu-cs-sql', 2026, 'anhui', 'computer-science', 'ahjzu', 'computer-basics', '计算机专业基础', 3, 'Web与数据库', 3, '关系数据库与SQL查询语句基本使用', 'database-sql', true, 'published'),
  ('ahjzu-c-basic', 2026, 'anhui', 'computer-science', 'ahjzu', 'c-language', 'C语言程序设计', 1, '程序设计基础', 1, 'C程序结构、算法、数据类型与输入输出', 'c-language-basic', true, 'published'),
  ('ahjzu-c-control', 2026, 'anhui', 'computer-science', 'ahjzu', 'c-language', 'C语言程序设计', 1, '程序设计基础', 2, '顺序、分支、循环与结构化程序设计', 'c-language-control', true, 'published'),
  ('ahjzu-c-array', 2026, 'anhui', 'computer-science', 'ahjzu', 'c-language', 'C语言程序设计', 2, '复合程序设计', 1, '数组、排序算法、函数与递归', 'c-language-array', true, 'published'),
  ('ahjzu-c-pointer', 2026, 'anhui', 'computer-science', 'ahjzu', 'c-language', 'C语言程序设计', 2, '复合程序设计', 2, '指针、自定义类型、单链表与文件操作', 'c-language-pointer', true, 'published'),

  ('hfuu-cs-system', 2026, 'anhui', 'computer-science', 'hfuu', 'computer-basics', '计算机专业基础', 1, '计算机基础知识', 1, '计算机系统、数据表示、病毒防治与信息安全', 'computer-basics', true, 'published'),
  ('hfuu-cs-os', 2026, 'anhui', 'computer-science', 'hfuu', 'computer-basics', '计算机专业基础', 2, '操作系统与办公应用', 1, 'Windows操作系统、资源管理器与文件管理', 'computer-basics', true, 'published'),
  ('hfuu-cs-word', 2026, 'anhui', 'computer-science', 'hfuu', 'computer-basics', '计算机专业基础', 2, '操作系统与办公应用', 2, 'Word文档编辑、排版与打印', 'computer-office', true, 'published'),
  ('hfuu-cs-excel', 2026, 'anhui', 'computer-science', 'hfuu', 'computer-basics', '计算机专业基础', 2, '操作系统与办公应用', 3, 'Excel公式函数、数据处理与图表', 'computer-office', true, 'published'),
  ('hfuu-cs-powerpoint', 2026, 'anhui', 'computer-science', 'hfuu', 'computer-basics', '计算机专业基础', 2, '操作系统与办公应用', 4, 'PowerPoint编辑、设计、动画与放映', 'computer-office', true, 'published'),
  ('hfuu-cs-network', 2026, 'anhui', 'computer-science', 'hfuu', 'computer-basics', '计算机专业基础', 3, '网络与Internet', 1, '计算机网络、Internet服务与电子邮件', 'network-basic', true, 'published'),
  ('hfuu-c-basic', 2026, 'anhui', 'computer-science', 'hfuu', 'c-language', 'C语言程序设计', 1, 'C语言基础', 1, '数据类型、运算、输入输出与文件读写', 'c-language-basic', true, 'published'),
  ('hfuu-c-control', 2026, 'anhui', 'computer-science', 'hfuu', 'c-language', 'C语言程序设计', 1, 'C语言基础', 2, '顺序、选择、循环与嵌套结构', 'c-language-control', true, 'published'),
  ('hfuu-c-array', 2026, 'anhui', 'computer-science', 'hfuu', 'c-language', 'C语言程序设计', 2, '复合程序设计', 1, '数组、字符串、函数与递归调用', 'c-language-array', true, 'published'),
  ('hfuu-c-pointer', 2026, 'anhui', 'computer-science', 'hfuu', 'c-language', 'C语言程序设计', 2, '复合程序设计', 2, '指针、结构体、共用体、枚举与链表', 'c-language-pointer', true, 'published'),
  ('hfuu-c-linear', 2026, 'anhui', 'computer-science', 'hfuu', 'c-language', 'C语言程序设计', 3, '数据结构与算法', 1, '线性表、链式存储、栈与队列', 'data-structure-linear', true, 'published'),
  ('hfuu-c-sort', 2026, 'anhui', 'computer-science', 'hfuu', 'c-language', 'C语言程序设计', 3, '数据结构与算法', 2, '二叉树、图、查找与排序基础', 'data-structure-sort', true, 'published');

insert into public.resources (
  resource_id, topic_tags, title, platform, creator, url, resource_type,
  difficulty, duration_text, recommendation_reason, priority, verified_at, status
) values
  (
    'res-english-vocabulary-1', array['english-vocabulary'],
    '大学英语词汇', '中国大学MOOC', '北京交通大学',
    'https://www.icourse163.org/course/NJTU-1002528009',
    '专项课程', '入门', '12单元',
    '具体课程页系统讲解大学英语高频词汇、词组、记忆方法与语境应用，适合补强专升本英语词汇基础',
    1, '2026-09-20', 'published'
  ),
  (
    'res-english-writing-1', array['english-writing'],
    '实用英语写作', '中国大学MOOC', '郑州工程技术学院',
    'https://www.icourse163.org/course/ZHZHU-1206695856',
    '专项课程', '入门', '4章',
    '具体课程页覆盖句子与段落组织、常用文体、应用文和应试写作，能直接补强英语写作知识点',
    1, '2026-09-20', 'published'
  );

update public.resources
set verified_at = '2026-09-20'
where status = 'published';
