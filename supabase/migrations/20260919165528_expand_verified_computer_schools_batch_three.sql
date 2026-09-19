-- Remote migration version: 20260919165528.
-- Expand the verified 2026 Anhui computer-major learning maps from nine to twelve schools.
-- Sources were rechecked on 2026-09-20 against each school's official charter and syllabus.

update public.academic_schools
set school_slug = 'hblg', theme_color = '#1f4f8c'
where school_id = 'anhui-school-34' and school_slug = 'anhui-school-34';

update public.academic_schools
set school_slug = 'wjut', theme_color = '#176d67'
where school_id = 'anhui-school-35' and school_slug = 'anhui-school-35';

update public.academic_schools
set school_slug = 'fyut', theme_color = '#8b1e2d'
where school_id = 'anhui-school-38' and school_slug = 'anhui-school-38';

insert into public.admission_offerings (
  offering_id, year, province_slug, major_slug, school_slug, training_site,
  eligible_major_categories, public_subjects, professional_subjects, plan_count,
  charter_url, syllabus_url, source_status, verified_at, active, status, sort_order
) values
  (
    'hblg-cs-2026', 2026, 'anhui', 'computer-science', 'hblg',
    '计算机科学与技术：淮北理工学院校本部（安徽省淮北市杜集区高岳街道青年路8号）',
    '农林牧渔大类、资源环境与安全大类、能源动力与材料大类、土木建筑大类、水利大类、装备制造大类、生物与化工大类、轻工纺织大类、食品药品与粮食大类、交通运输大类、电子与信息大类、医药卫生大类、财经商贸大类、旅游大类、文化艺术大类、新闻传播大类、教育与体育大类、公安与司法大类、公共管理与服务大类',
    array['高等数学','英语'], array['计算机专业基础','C语言程序设计'], 120,
    'https://zsb.hblgxy.edu.cn/info/1020/2361.htm',
    'https://zsb.hblgxy.edu.cn/system/_content/download.jsp?urltype=news.DownloadAttachUrl&owner=1817671833&wbfileid=12097151',
    '2026正式章程与官方考纲', '2026-09-20', true, 'published', 12
  ),
  (
    'hblg-ai-2026', 2026, 'anhui', 'computer-science', 'hblg',
    '人工智能：淮北理工学院校本部（安徽省淮北市杜集区高岳街道青年路8号）',
    '农林牧渔大类、资源环境与安全大类、能源动力与材料大类、土木建筑大类、水利大类、装备制造大类、生物与化工大类、轻工纺织大类、食品药品与粮食大类、交通运输大类、电子与信息大类、医药卫生大类、财经商贸大类、旅游大类、文化艺术大类、新闻传播大类、教育与体育大类、公安与司法大类、公共管理与服务大类',
    array['高等数学','英语'], array['计算机专业基础','C语言程序设计'], 120,
    'https://zsb.hblgxy.edu.cn/info/1020/2361.htm',
    'https://zsb.hblgxy.edu.cn/system/_content/download.jsp?urltype=news.DownloadAttachUrl&owner=1817671833&wbfileid=12097151',
    '2026正式章程与官方考纲', '2026-09-20', true, 'published', 13
  ),
  (
    'hblg-data-2026', 2026, 'anhui', 'computer-science', 'hblg',
    '数据科学与大数据技术：淮北理工学院校本部（安徽省淮北市杜集区高岳街道青年路8号）',
    '农林牧渔大类、资源环境与安全大类、能源动力与材料大类、土木建筑大类、水利大类、装备制造大类、生物与化工大类、轻工纺织大类、食品药品与粮食大类、交通运输大类、电子与信息大类、医药卫生大类、财经商贸大类、旅游大类、文化艺术大类、新闻传播大类、教育与体育大类、公安与司法大类、公共管理与服务大类',
    array['高等数学','英语'], array['计算机专业基础','C语言程序设计'], 120,
    'https://zsb.hblgxy.edu.cn/info/1020/2361.htm',
    'https://zsb.hblgxy.edu.cn/system/_content/download.jsp?urltype=news.DownloadAttachUrl&owner=1817671833&wbfileid=12097151',
    '2026正式章程与官方考纲', '2026-09-20', true, 'published', 14
  ),
  (
    'wjut-cs-2026', 2026, 'anhui', 'computer-science', 'wjut',
    '计算机科学与技术：皖江工学院（霍里山大道333号、郑蒲港新区河海中路666号；具体培养校区以学校安排为准）',
    '电子与信息大类、财经商贸大类、土木建筑大类、装备制造大类、交通运输大类、生物与化工大类、教育与体育大类、公共管理与服务大类、文化艺术大类、旅游大类、新闻传播大类、农林牧渔大类、食品药品与粮食大类、公安与司法大类',
    array['高等数学','英语'], array['C语言程序设计','数据库技术与应用'], 80,
    'https://www.wjut.edu.cn/zhao-sheng-zhuan-ti/zhao-sheng-zhang-cheng/pageinfo1000010000026232.html',
    'https://www.wjut.edu.cn/zhao-sheng-zhuan-ti/zhao-sheng-kuai-xun/pageinfo1000010000025763.html',
    '2026正式章程与官方考纲', '2026-09-20', true, 'published', 15
  ),
  (
    'fyut-cs-2026', 2026, 'anhui', 'computer-science', 'fyut',
    '计算机科学与技术：阜阳理工学院校本部（安徽省阜阳市颍州区阜临路169号）',
    '电子与信息大类', array['高等数学','英语'],
    array['计算机专业基础','C语言程序设计'], 90,
    'https://fyut.edu.cn/c/zsw/ZSJZ/41558.jhtml',
    'https://fyut.edu.cn/u/cms/zsw/202603/18181621okxh.zip',
    '2026正式章程与官方考纲', '2026-09-20', true, 'published', 16
  );

insert into public.syllabus_points (
  point_id, year, province_slug, major_slug, school_slug, subject_slug, subject_name,
  section_order, section_name, point_order, point_title, canonical_topic, active, status
) values
  ('hblg-cs-system', 2026, 'anhui', 'computer-science', 'hblg', 'computer-basics', '计算机专业基础', 1, '信息与计算机系统', 1, '信息表示、数制编码与计算机安全', 'computer-basics', true, 'published'),
  ('hblg-cs-hardware', 2026, 'anhui', 'computer-science', 'hblg', 'computer-basics', '计算机专业基础', 1, '信息与计算机系统', 2, '计算机硬件、软件与程序设计语言', 'computer-basics', true, 'published'),
  ('hblg-cs-os', 2026, 'anhui', 'computer-science', 'hblg', 'computer-basics', '计算机专业基础', 2, '操作系统与办公应用', 1, '操作系统、文件与文件夹管理', 'computer-basics', true, 'published'),
  ('hblg-cs-office', 2026, 'anhui', 'computer-science', 'hblg', 'computer-basics', '计算机专业基础', 2, '操作系统与办公应用', 2, 'Word、Excel与PowerPoint', 'computer-office', true, 'published'),
  ('hblg-cs-network', 2026, 'anhui', 'computer-science', 'hblg', 'computer-basics', '计算机专业基础', 3, '网络与Internet', 1, '计算机网络、Internet与电子邮件', 'network-basic', true, 'published'),
  ('hblg-c-basic', 2026, 'anhui', 'computer-science', 'hblg', 'c-language', 'C语言程序设计', 1, 'C语言基础', 1, '数据类型、运算、输入与输出', 'c-language-basic', true, 'published'),
  ('hblg-c-control', 2026, 'anhui', 'computer-science', 'hblg', 'c-language', 'C语言程序设计', 1, 'C语言基础', 2, '顺序、选择与循环结构', 'c-language-control', true, 'published'),
  ('hblg-c-array', 2026, 'anhui', 'computer-science', 'hblg', 'c-language', 'C语言程序设计', 2, '复合程序设计', 1, '数组、字符串与函数', 'c-language-array', true, 'published'),
  ('hblg-c-pointer', 2026, 'anhui', 'computer-science', 'hblg', 'c-language', 'C语言程序设计', 2, '复合程序设计', 2, '指针、结构体、联合体与枚举', 'c-language-pointer', true, 'published'),

  ('wjut-c-basic', 2026, 'anhui', 'computer-science', 'wjut', 'c-language', 'C语言程序设计', 1, 'C语言基础', 1, '数据类型、运算与输入输出', 'c-language-basic', true, 'published'),
  ('wjut-c-control', 2026, 'anhui', 'computer-science', 'wjut', 'c-language', 'C语言程序设计', 1, 'C语言基础', 2, '顺序、选择与循环结构', 'c-language-control', true, 'published'),
  ('wjut-c-array', 2026, 'anhui', 'computer-science', 'wjut', 'c-language', 'C语言程序设计', 2, '复合程序设计', 1, '数组、字符串与函数', 'c-language-array', true, 'published'),
  ('wjut-c-pointer', 2026, 'anhui', 'computer-science', 'wjut', 'c-language', 'C语言程序设计', 2, '复合程序设计', 2, '指针、结构体与文件', 'c-language-pointer', true, 'published'),
  ('wjut-db-basic', 2026, 'anhui', 'computer-science', 'wjut', 'database', '数据库技术与应用', 1, '数据库基础', 1, '数据库概念、数据模型与关系模型', 'database-basic', true, 'published'),
  ('wjut-db-sql', 2026, 'anhui', 'computer-science', 'wjut', 'database', '数据库技术与应用', 2, 'SQL语言', 1, '数据定义、查询、更新与视图', 'database-sql', true, 'published'),
  ('wjut-db-security', 2026, 'anhui', 'computer-science', 'wjut', 'database', '数据库技术与应用', 3, '数据库保护', 1, '安全性、完整性与关系规范化', 'database-basic', true, 'published'),
  ('wjut-db-design', 2026, 'anhui', 'computer-science', 'wjut', 'database', '数据库技术与应用', 4, '数据库设计', 1, '需求分析、概念设计、逻辑设计与物理设计', 'database-design', true, 'published'),

  ('fyut-cs-system', 2026, 'anhui', 'computer-science', 'fyut', 'computer-basics', '计算机专业基础', 1, '计算机系统', 1, '硬件系统、数据表示与软件系统', 'computer-basics', true, 'published'),
  ('fyut-cs-office', 2026, 'anhui', 'computer-science', 'fyut', 'computer-basics', '计算机专业基础', 2, '操作系统与应用', 1, '操作系统、文件管理与办公应用', 'computer-office', true, 'published'),
  ('fyut-cs-network', 2026, 'anhui', 'computer-science', 'fyut', 'computer-basics', '计算机专业基础', 3, '网络与多媒体', 1, '计算机网络、Internet、Web与多媒体', 'network-basic', true, 'published'),
  ('fyut-cs-data', 2026, 'anhui', 'computer-science', 'fyut', 'computer-basics', '计算机专业基础', 4, '数据与新技术', 1, '信息系统、数据库、云计算、大数据与安全', 'computer-basics', true, 'published'),
  ('fyut-c-basic', 2026, 'anhui', 'computer-science', 'fyut', 'c-language', 'C语言程序设计', 1, 'C语言基础', 1, '程序结构、数据类型与输入输出', 'c-language-basic', true, 'published'),
  ('fyut-c-control', 2026, 'anhui', 'computer-science', 'fyut', 'c-language', 'C语言程序设计', 1, 'C语言基础', 2, '顺序、选择与循环结构', 'c-language-control', true, 'published'),
  ('fyut-c-array', 2026, 'anhui', 'computer-science', 'fyut', 'c-language', 'C语言程序设计', 2, '复合程序设计', 1, '数组、字符串与函数', 'c-language-array', true, 'published'),
  ('fyut-c-pointer', 2026, 'anhui', 'computer-science', 'fyut', 'c-language', 'C语言程序设计', 2, '复合程序设计', 2, '指针、结构体与文件', 'c-language-pointer', true, 'published');

insert into public.resources (
  resource_id, topic_tags, title, platform, creator, url, resource_type,
  difficulty, duration_text, recommendation_reason, priority, verified_at, status
) values
  (
    'res-db-1', array['database-basic','database-sql','database-design'],
    '数据库系统概论', '中国大学MOOC', '河南理工大学',
    'https://www.icourse163.org/course/detail.htm?cid=1003369002',
    '系统课程', '入门', '完整学期',
    '具体课程页覆盖数据模型、关系数据库、SQL、完整性、安全性与数据库设计，可对应皖江工学院正式考纲',
    1, '2026-09-20', 'published'
  ),
  (
    'res-db-2', array['database-basic','database-sql','database-design'],
    '数据库系统原理', '中国大学MOOC', '郑州大学',
    'https://www.icourse163.org/course/detail.htm?cid=1207193801',
    '系统课程', '系统学习', '80个知识点',
    '具体课程页覆盖ER模型、关系模型、SQL、完整性、安全性与数据库设计，适合作为第二套系统讲解',
    2, '2026-09-20', 'published'
  );
