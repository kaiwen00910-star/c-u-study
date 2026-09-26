-- Publish Wuhu College only after the formal 2026 charter supplied from the
-- official admissions release and the school-hosted computer syllabus were
-- checked together. Two additional public courses cover syllabus topics that
-- were not covered by the existing resource set.

update public.academic_schools
set school_slug = 'uwh', theme_color = '#1556a6'
where school_id = 'anhui-school-37' and school_slug = 'anhui-school-37';

insert into public.admission_offerings (
  offering_id, year, province_slug, major_slug, school_slug, training_site,
  eligible_major_categories, public_subjects, professional_subjects, plan_count,
  charter_url, syllabus_url, source_status, verified_at, active, status, sort_order
) values (
  'uwh-cs-2026', 2026, 'anhui', 'computer-science', 'uwh',
  '计算机科学与技术：芜湖学院校本部（安徽省芜湖市鸠江区苏州路66号）',
  '农林牧渔大类、资源环境与安全大类、能源动力与材料大类、土木建筑大类、水利大类、装备制造大类、生物与化工大类、轻工纺织大类、食品药品与粮食大类、交通运输大类、电子与信息大类、医药卫生大类、财经商贸大类、旅游大类、文化艺术大类、新闻传播大类、教育与体育大类、公安与司法大类、公共管理与服务大类',
  array['高等数学','英语'], array['计算机专业基础','C语言程序设计'], 100,
  'https://www.uwh.edu.cn/zsw/detail/434/15349.html',
  'https://www.uwh.edu.cn/uploads/article/20251122/640a1d9bf2ac5aeec239bd28a3dd5a2d.pdf',
  '2026正式章程与官方考纲', '2026-09-26', true, 'published', 23
);

insert into public.syllabus_points (
  point_id, year, province_slug, major_slug, school_slug, subject_slug, subject_name,
  section_order, section_name, point_order, point_title, canonical_topic, active, status
) values
  ('uwh-ci-overview', 2026, 'anhui', 'computer-science', 'uwh', 'computer-intro', '计算机专业基础', 1, '计算机基础与系统', 1, '计算机概念、发展、分类、用途及学科知识体系', 'computer-basics', true, 'published'),
  ('uwh-ci-data', 2026, 'anhui', 'computer-science', 'uwh', 'computer-intro', '计算机专业基础', 1, '计算机基础与系统', 2, '数制转换、逻辑代数、码制、定点浮点数与信息编码', 'computer-basics', true, 'published'),
  ('uwh-ci-hardware', 2026, 'anhui', 'computer-science', 'uwh', 'computer-intro', '计算机专业基础', 1, '计算机基础与系统', 3, '冯·诺依曼体系结构、微型计算机硬件与输入输出系统', 'computer-basics', true, 'published'),
  ('uwh-ci-system-tools', 2026, 'anhui', 'computer-science', 'uwh', 'computer-intro', '计算机专业基础', 2, '软件与应用', 1, '操作系统、语言翻译系统与常用工具软件', 'computer-basics', true, 'published'),
  ('uwh-ci-office', 2026, 'anhui', 'computer-science', 'uwh', 'computer-intro', '计算机专业基础', 2, '软件与应用', 2, '文字处理、电子表格与演示文稿软件', 'computer-office', true, 'published'),
  ('uwh-ci-database', 2026, 'anhui', 'computer-science', 'uwh', 'computer-intro', '计算机专业基础', 2, '软件与应用', 3, '数据库系统概念与SQL定义、查询、更新及应用', 'database-sql', true, 'published'),
  ('uwh-ci-multimedia', 2026, 'anhui', 'computer-science', 'uwh', 'computer-intro', '计算机专业基础', 3, '网络、多媒体与工程', 1, '多媒体技术、通信系统、创作工具与编辑语言', 'multimedia-basic', true, 'published'),
  ('uwh-ci-network', 2026, 'anhui', 'computer-science', 'uwh', 'computer-intro', '计算机专业基础', 3, '网络、多媒体与工程', 2, '网络体系结构、局域网、Internet服务与TCP/IP协议', 'network-basic', true, 'published'),
  ('uwh-ci-software-engineering', 2026, 'anhui', 'computer-science', 'uwh', 'computer-intro', '计算机专业基础', 3, '网络、多媒体与工程', 3, '软件工程、软件过程、开发方法与开发模型', 'software-engineering', true, 'published'),
  ('uwh-ci-security', 2026, 'anhui', 'computer-science', 'uwh', 'computer-intro', '计算机专业基础', 4, '安全、应用与职业', 1, '信息安全威胁、病毒、保密审计、防御技术与虚拟专用网', 'information-security', true, 'published'),
  ('uwh-ci-application-ethics', 2026, 'anhui', 'computer-science', 'uwh', 'computer-intro', '计算机专业基础', 4, '安全、应用与职业', 2, '计算机应用领域、信息产业法规、职业道德与终身学习', 'information-security', true, 'published'),
  ('uwh-c-overview-algorithm', 2026, 'anhui', 'computer-science', 'uwh', 'c-language', 'C语言程序设计', 1, '程序设计基础', 1, 'C语言特点、程序结构、运行步骤、算法与结构化程序设计', 'c-language-basic', true, 'published'),
  ('uwh-c-basic-io', 2026, 'anhui', 'computer-science', 'uwh', 'c-language', 'C语言程序设计', 1, '程序设计基础', 2, '数据类型、变量、运算符、表达式与输入输出', 'c-language-basic', true, 'published'),
  ('uwh-c-control', 2026, 'anhui', 'computer-science', 'uwh', 'c-language', 'C语言程序设计', 1, '程序设计基础', 3, '选择结构与while、do-while、for循环程序设计', 'c-language-control', true, 'published'),
  ('uwh-c-array', 2026, 'anhui', 'computer-science', 'uwh', 'c-language', 'C语言程序设计', 2, '数组与函数', 1, '一维数组、二维数组与字符数组', 'c-language-array', true, 'published'),
  ('uwh-c-function', 2026, 'anhui', 'computer-science', 'uwh', 'c-language', 'C语言程序设计', 2, '数组与函数', 2, '函数定义调用、模块化设计及局部与全局变量', 'c-language-array', true, 'published'),
  ('uwh-c-pointer', 2026, 'anhui', 'computer-science', 'uwh', 'c-language', 'C语言程序设计', 3, '指针与复合类型', 1, '指针、数组指针、函数参数、动态内存与链表', 'c-language-pointer', true, 'published'),
  ('uwh-c-struct', 2026, 'anhui', 'computer-science', 'uwh', 'c-language', 'C语言程序设计', 3, '指针与复合类型', 2, '结构体、结构体数组、共用体与枚举类型', 'c-language-pointer', true, 'published'),
  ('uwh-c-file', 2026, 'anhui', 'computer-science', 'uwh', 'c-language', 'C语言程序设计', 3, '指针与复合类型', 3, '文件类型指针、文件开关与顺序和随机读写', 'c-language-pointer', true, 'published');

insert into public.resources (
  resource_id, topic_tags, title, platform, creator, url, resource_type,
  difficulty, duration_text, recommendation_reason, priority, verified_at, status
) values
  (
    'res-software-engineering-1', array['software-engineering'], '软件工程', '中国大学MOOC',
    '国家级一流线上课程团队', 'https://www.icourse163.org/course/detail.htm?cid=1001812013',
    '系统课程', '入门', '10章',
    '课程页公开列出软件过程、生命周期模型、需求、面向对象分析设计、测试与维护，覆盖芜湖学院软件工程章节。',
    1, '2026-09-26', 'published'
  ),
  (
    'res-information-security-1', array['information-security'], '移动互联网时代的信息安全防护', '中国大学MOOC',
    '南京师范大学', 'https://www.icourse163.org/course/detail.htm?cid=1206031809',
    '系统课程', '入门', '10章',
    '课程页公开覆盖设备、数据、身份、操作系统、网络、应用软件和信息内容安全，并兼顾法律与安全管理。',
    1, '2026-09-26', 'published'
  );
