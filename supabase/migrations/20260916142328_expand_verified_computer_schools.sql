-- Remote migration version: 20260916142328.
-- Expand the verified 2026 Anhui computer-major pilot from three to six schools.
-- Every published offering below is backed by a 2026 official charter and official syllabus.

update public.academic_schools set school_slug = 'bbc', theme_color = '#0b5794'
where school_id = 'anhui-school-11' and school_slug = 'anhui-school-11';
update public.academic_schools set school_slug = 'axhu', theme_color = '#176a9d'
where school_id = 'anhui-school-27' and school_slug = 'anhui-school-27';
update public.academic_schools set school_slug = 'slu', theme_color = '#a5242c'
where school_id = 'anhui-school-31' and school_slug = 'anhui-school-31';

insert into public.admission_offerings (
  offering_id, year, province_slug, major_slug, school_slug, training_site,
  eligible_major_categories, public_subjects, professional_subjects, plan_count,
  charter_url, syllabus_url, source_status, verified_at, active, status, sort_order
) values
  (
    'bbc-2026', 2026, 'anhui', 'computer-science', 'bbc',
    '安徽电子信息职业技术学院（安徽省蚌埠市龙子湖区曹山路1000号）',
    '电子与信息大类、装备制造大类', array['高等数学','英语'],
    array['计算机专业基础','C语言程序设计'], 40,
    'https://zhaoban.bbc.edu.cn/2026/0318/c1269a125714/page.htm',
    'https://zhaoban.bbc.edu.cn/_upload/article/files/54/14/5f899cd247438281d1ff2c2ba381/143ba54a-3ca6-4163-8596-6bd7117ec2b8.pdf',
    '正式章程与官方考纲', '2026-09-15', true, 'published', 5
  ),
  (
    'axhu-2026', 2026, 'anhui', 'computer-science', 'axhu',
    '安徽新华学院校本部（安徽省合肥市高新区望江西路555号）',
    '财经商贸大类、医药卫生大类、电子与信息大类、教育与体育大类、装备制造大类、土木建筑大类、交通运输大类、文化艺术大类、旅游大类、公安与司法大类、公共管理与服务大类、食品药品与粮食大类、新闻传播大类、农林牧渔大类、水利大类、能源动力与材料大类、轻工纺织大类、资源环境与安全大类、生物与化工大类',
    array['高等数学','英语'], array['计算机专业基础','C语言程序设计'], 320,
    'https://zhaosheng.axhu.edu.cn/upload/2026/3/1818192298.pdf',
    'https://zhaosheng.axhu.edu.cn/contents/2685/257592.html',
    '正式章程与官方考纲', '2026-09-15', true, 'published', 6
  ),
  (
    'slu-2026', 2026, 'anhui', 'computer-science', 'slu',
    '安徽三联学院校本部（安徽省合肥市经济技术开发区合安路47号）',
    '财经商贸大类、医药卫生大类、电子与信息大类、教育与体育大类、装备制造大类、土木建筑大类、交通运输大类、文化艺术大类、旅游大类、公安与司法大类、公共管理与服务大类、食品药品与粮食大类、新闻传播大类、农林牧渔大类、水利大类、能源动力与材料大类、轻工纺织大类、资源环境与安全大类、生物与化工大类',
    array['高等数学','英语'], array['计算机专业基础','C语言程序设计'], 360,
    'https://zsb.slu.edu.cn/2026/0312/c462a56211/page.htm',
    'https://zsb.slu.edu.cn/2025/1104/c462a54468/page.htm',
    '正式章程与官方考纲', '2026-09-15', true, 'published', 7
  );

insert into public.syllabus_points (
  point_id, year, province_slug, major_slug, school_slug, subject_slug, subject_name,
  section_order, section_name, point_order, point_title, canonical_topic, active, status
) values
  ('bbc-cs-system', 2026, 'anhui', 'computer-science', 'bbc', 'computer-basics', '计算机专业基础', 1, '计算机基础', 1, '计算机系统组成、信息表示与安全', 'computer-basics', true, 'published'),
  ('bbc-cs-office', 2026, 'anhui', 'computer-science', 'bbc', 'computer-basics', '计算机专业基础', 2, '操作系统与办公软件', 1, 'Windows、Word、Excel与PowerPoint', 'computer-office', true, 'published'),
  ('bbc-cs-network', 2026, 'anhui', 'computer-science', 'bbc', 'computer-basics', '计算机专业基础', 3, '网络基础', 1, '局域网与Internet基础应用', 'network-basic', true, 'published'),
  ('bbc-c-basic', 2026, 'anhui', 'computer-science', 'bbc', 'c-language', 'C语言程序设计', 1, 'C语言基础', 1, '程序结构、数据类型与输入输出', 'c-language-basic', true, 'published'),
  ('bbc-c-control', 2026, 'anhui', 'computer-science', 'bbc', 'c-language', 'C语言程序设计', 1, 'C语言基础', 2, '选择、循环与结构化程序设计', 'c-language-control', true, 'published'),
  ('bbc-c-array', 2026, 'anhui', 'computer-science', 'bbc', 'c-language', 'C语言程序设计', 2, '复合程序设计', 1, '一维数组、二维数组与字符数组', 'c-language-array', true, 'published'),
  ('bbc-c-pointer', 2026, 'anhui', 'computer-science', 'bbc', 'c-language', 'C语言程序设计', 2, '复合程序设计', 2, '函数、指针与结构体', 'c-language-pointer', true, 'published'),

  ('axhu-cs-system', 2026, 'anhui', 'computer-science', 'axhu', 'computer-basics', '计算机专业基础', 1, '计算机基础', 1, '计算机系统组成、信息表示与安全', 'computer-basics', true, 'published'),
  ('axhu-cs-office', 2026, 'anhui', 'computer-science', 'axhu', 'computer-basics', '计算机专业基础', 2, '操作系统与办公软件', 1, 'Windows 10、Word、Excel与PowerPoint', 'computer-office', true, 'published'),
  ('axhu-cs-network', 2026, 'anhui', 'computer-science', 'axhu', 'computer-basics', '计算机专业基础', 3, '网络与数据库', 1, '计算机网络与Internet基础', 'network-basic', true, 'published'),
  ('axhu-c-basic', 2026, 'anhui', 'computer-science', 'axhu', 'c-language', 'C语言程序设计', 1, 'C语言基础', 1, '程序结构、数据类型与输入输出', 'c-language-basic', true, 'published'),
  ('axhu-c-control', 2026, 'anhui', 'computer-science', 'axhu', 'c-language', 'C语言程序设计', 1, 'C语言基础', 2, '顺序、选择与循环结构', 'c-language-control', true, 'published'),
  ('axhu-c-array', 2026, 'anhui', 'computer-science', 'axhu', 'c-language', 'C语言程序设计', 2, '复合程序设计', 1, '数组与字符串', 'c-language-array', true, 'published'),
  ('axhu-c-pointer', 2026, 'anhui', 'computer-science', 'axhu', 'c-language', 'C语言程序设计', 2, '复合程序设计', 2, '函数、指针与结构体', 'c-language-pointer', true, 'published'),

  ('slu-cs-system', 2026, 'anhui', 'computer-science', 'slu', 'computer-basics', '计算机专业基础', 1, '计算机基础', 1, '计算机系统、数制编码与安全', 'computer-basics', true, 'published'),
  ('slu-cs-office', 2026, 'anhui', 'computer-science', 'slu', 'computer-basics', '计算机专业基础', 2, '操作系统与办公软件', 1, '操作系统、Word、Excel与PowerPoint', 'computer-office', true, 'published'),
  ('slu-cs-network', 2026, 'anhui', 'computer-science', 'slu', 'computer-basics', '计算机专业基础', 3, '网络基础', 1, '计算机网络与Internet基础', 'network-basic', true, 'published'),
  ('slu-c-basic', 2026, 'anhui', 'computer-science', 'slu', 'c-language', 'C语言程序设计', 1, 'C语言基础', 1, '数据类型、运算与输入输出', 'c-language-basic', true, 'published'),
  ('slu-c-control', 2026, 'anhui', 'computer-science', 'slu', 'c-language', 'C语言程序设计', 1, 'C语言基础', 2, '顺序、选择与循环结构', 'c-language-control', true, 'published'),
  ('slu-c-array', 2026, 'anhui', 'computer-science', 'slu', 'c-language', 'C语言程序设计', 2, '复合程序设计', 1, '数组与字符串', 'c-language-array', true, 'published'),
  ('slu-c-pointer', 2026, 'anhui', 'computer-science', 'slu', 'c-language', 'C语言程序设计', 2, '复合程序设计', 2, '函数、指针与复合类型', 'c-language-pointer', true, 'published');
