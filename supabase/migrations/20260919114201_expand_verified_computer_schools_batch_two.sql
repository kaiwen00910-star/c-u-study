-- Expand the verified 2026 Anhui computer-major learning maps from six to nine schools.
-- Sources were rechecked on 2026-09-19 against each school's official charter and syllabus.

update public.academic_schools
set school_slug = 'hnnu', theme_color = '#0d5b9d'
where school_id = 'anhui-school-22' and school_slug = 'anhui-school-22';

update public.academic_schools
set school_slug = 'masu', theme_color = '#176340'
where school_id = 'anhui-school-26' and school_slug = 'anhui-school-26';

update public.academic_schools
set school_slug = 'hfue', theme_color = '#8b2732'
where school_id = 'anhui-school-28' and school_slug = 'anhui-school-28';

insert into public.admission_offerings (
  offering_id, year, province_slug, major_slug, school_slug, training_site,
  eligible_major_categories, public_subjects, professional_subjects, plan_count,
  charter_url, syllabus_url, source_status, verified_at, active, status, sort_order
) values
  (
    'hfue-computer-2026', 2026, 'anhui', 'computer-science', 'hfue',
    '软件工程、计算机科学与技术：合肥经济学院（章程列示高教基地校区、新桥校区，具体培养校区以学校安排为准）',
    '电子与信息大类、农林牧渔大类、资源环境与安全大类、能源动力与材料大类、土木建筑大类、水利大类、装备制造大类、生物与化工大类、轻工纺织大类、食品药品与粮食大类、交通运输大类、医药卫生大类、财经商贸大类、旅游大类、新闻传播大类、教育与体育大类、公安与司法大类、公共管理与服务大类、文化艺术大类',
    array['高等数学','英语'], array['计算机专业基础','C语言程序设计'], 450,
    'https://www.hfue.edu.cn/zsw/col285/62114',
    'https://www.hfue.edu.cn/zsw/col295/56469',
    '2026正式章程与官方考纲', '2026-09-19', true, 'published', 8
  ),
  (
    'masu-computer-2026', 2026, 'anhui', 'computer-science', 'masu',
    '计算机科学与技术、软件工程：马鞍山学院校本部（安徽省马鞍山市当涂县姑孰镇黄池路8号）',
    '电子与信息大类',
    array['高等数学','英语'], array['C语言程序设计','计算机专业基础'], 320,
    'https://zs.masu.edu.cn/2026/0318/c168a75656/page.htm',
    'https://zs.masu.edu.cn/2025/1029/c167a71330/page.htm',
    '2026正式章程与官方考纲', '2026-09-19', true, 'published', 9
  ),
  (
    'hnnu-network-2026', 2026, 'anhui', 'computer-science', 'hnnu',
    '网络工程：淮南师范学院（泉山校区/朝阳校区，具体培养校区以学校安排为准）',
    '电子与信息大类、交通运输大类、能源动力与材料大类、生物与化工大类、食品药品与粮食大类、水利大类、土木建筑大类、装备制造大类、资源环境与安全大类',
    array['高等数学','英语'], array['计算机专业基础','C程序设计'], 100,
    'https://zsb.hnnu.edu.cn/2026/0319/c4552a166809/page.htm',
    'https://zsb.hnnu.edu.cn/2026/0319/c4552a166809/page.htm',
    '2026正式章程与官方考纲', '2026-09-19', true, 'published', 10
  ),
  (
    'hnnu-cs-huuc-2026', 2026, 'anhui', 'computer-science', 'hnnu',
    '计算机科学与技术：淮南联合大学（安徽省淮南市田家庵区洞山西路）',
    '电子与信息大类、交通运输大类、能源动力与材料大类、生物与化工大类、食品药品与粮食大类、水利大类、土木建筑大类、装备制造大类、资源环境与安全大类',
    array['高等数学','英语'], array['计算机专业基础','C程序设计'], 50,
    'https://zsb.hnnu.edu.cn/2026/0319/c4552a166809/page.htm',
    'https://zsb.hnnu.edu.cn/2026/0319/c4552a166809/page.htm',
    '2026正式章程与官方考纲', '2026-09-19', true, 'published', 11
  );

insert into public.syllabus_points (
  point_id, year, province_slug, major_slug, school_slug, subject_slug, subject_name,
  section_order, section_name, point_order, point_title, canonical_topic, active, status
) values
  ('hfue-cs-system', 2026, 'anhui', 'computer-science', 'hfue', 'computer-basics', '计算机专业基础', 1, '计算机系统', 1, '数制、信息表示、硬件与软件系统', 'computer-basics', true, 'published'),
  ('hfue-cs-office', 2026, 'anhui', 'computer-science', 'hfue', 'computer-basics', '计算机专业基础', 2, '操作系统与办公应用', 1, '操作系统、文件管理与办公套件', 'computer-office', true, 'published'),
  ('hfue-cs-network', 2026, 'anhui', 'computer-science', 'hfue', 'computer-basics', '计算机专业基础', 3, '网络与Web', 1, '局域网、Internet、Web与社交媒体', 'network-basic', true, 'published'),
  ('hfue-cs-data-security', 2026, 'anhui', 'computer-science', 'hfue', 'computer-basics', '计算机专业基础', 4, '数据与新技术', 1, '数据库、信息系统、新技术与计算机安全', 'computer-basics', true, 'published'),
  ('hfue-c-basic', 2026, 'anhui', 'computer-science', 'hfue', 'c-language', 'C语言程序设计', 1, 'C语言基础', 1, '程序结构、算法、数据类型与输入输出', 'c-language-basic', true, 'published'),
  ('hfue-c-control', 2026, 'anhui', 'computer-science', 'hfue', 'c-language', 'C语言程序设计', 1, 'C语言基础', 2, '选择、循环与结构化程序设计', 'c-language-control', true, 'published'),
  ('hfue-c-array', 2026, 'anhui', 'computer-science', 'hfue', 'c-language', 'C语言程序设计', 2, '复合程序设计', 1, '数组、字符串与函数', 'c-language-array', true, 'published'),
  ('hfue-c-pointer', 2026, 'anhui', 'computer-science', 'hfue', 'c-language', 'C语言程序设计', 2, '复合程序设计', 2, '指针、结构体、链表与编译预处理', 'c-language-pointer', true, 'published'),

  ('masu-cs-system', 2026, 'anhui', 'computer-science', 'masu', 'computer-basics', '计算机专业基础', 1, '计算机基础', 1, '信息表示、计算机系统组成与信息安全', 'computer-basics', true, 'published'),
  ('masu-cs-os', 2026, 'anhui', 'computer-science', 'masu', 'computer-basics', '计算机专业基础', 2, '操作系统与文件', 1, 'Windows 7、文件与文件夹管理', 'computer-basics', true, 'published'),
  ('masu-cs-office', 2026, 'anhui', 'computer-science', 'masu', 'computer-basics', '计算机专业基础', 3, '办公应用', 1, 'Word 2010与Excel 2010', 'computer-office', true, 'published'),
  ('masu-cs-data-network', 2026, 'anhui', 'computer-science', 'masu', 'computer-basics', '计算机专业基础', 4, '数据与网络', 1, '数据库基础与计算机网络组成', 'network-basic', true, 'published'),
  ('masu-c-basic', 2026, 'anhui', 'computer-science', 'masu', 'c-language', 'C语言程序设计', 1, 'C语言基础', 1, '程序结构、数据类型与输入输出', 'c-language-basic', true, 'published'),
  ('masu-c-control', 2026, 'anhui', 'computer-science', 'masu', 'c-language', 'C语言程序设计', 1, 'C语言基础', 2, '选择、循环与嵌套结构', 'c-language-control', true, 'published'),
  ('masu-c-array', 2026, 'anhui', 'computer-science', 'masu', 'c-language', 'C语言程序设计', 2, '复合程序设计', 1, '数组、字符串与函数', 'c-language-array', true, 'published'),
  ('masu-c-pointer', 2026, 'anhui', 'computer-science', 'masu', 'c-language', 'C语言程序设计', 2, '复合程序设计', 2, '指针、结构体、文件与编译预处理', 'c-language-pointer', true, 'published'),

  ('hnnu-cs-system', 2026, 'anhui', 'computer-science', 'hnnu', 'computer-basics', '计算机专业基础', 1, '计算机基础', 1, '信息表示、系统组成与计算机安全', 'computer-basics', true, 'published'),
  ('hnnu-cs-office', 2026, 'anhui', 'computer-science', 'hnnu', 'computer-basics', '计算机专业基础', 2, '操作系统与办公应用', 1, 'Windows 10、Word、Excel与PowerPoint', 'computer-office', true, 'published'),
  ('hnnu-cs-network', 2026, 'anhui', 'computer-science', 'hnnu', 'computer-basics', '计算机专业基础', 3, '计算机网络', 1, 'OSI/TCP-IP、传输介质、IP与Internet服务', 'network-basic', true, 'published'),
  ('hnnu-cs-database', 2026, 'anhui', 'computer-science', 'hnnu', 'computer-basics', '计算机专业基础', 4, '数据库基础', 1, '数据模型、Access对象与SQL基础', 'computer-basics', true, 'published'),
  ('hnnu-c-basic', 2026, 'anhui', 'computer-science', 'hnnu', 'c-language', 'C程序设计', 1, 'C语言基础', 1, '程序结构、算法、数据类型与输入输出', 'c-language-basic', true, 'published'),
  ('hnnu-c-control', 2026, 'anhui', 'computer-science', 'hnnu', 'c-language', 'C程序设计', 1, 'C语言基础', 2, '选择、循环与结构化程序设计', 'c-language-control', true, 'published'),
  ('hnnu-c-array', 2026, 'anhui', 'computer-science', 'hnnu', 'c-language', 'C程序设计', 2, '复合程序设计', 1, '数组、字符串、函数与递归', 'c-language-array', true, 'published'),
  ('hnnu-c-pointer', 2026, 'anhui', 'computer-science', 'hnnu', 'c-language', 'C程序设计', 2, '复合程序设计', 2, '指针、结构体、链表与自定义类型', 'c-language-pointer', true, 'published');
