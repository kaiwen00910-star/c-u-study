-- Publish Anhui University of Technology only after its formal 2026 charter
-- and school-hosted syllabus PDF were both verified. The school has two
-- computer-related offerings that share the same professional syllabus.

update public.academic_schools
set school_slug = 'ahut', theme_color = '#004a99'
where school_id = 'anhui-school-01' and school_slug = 'anhui-school-01';

insert into public.admission_offerings (
  offering_id, year, province_slug, major_slug, school_slug, training_site,
  eligible_major_categories, public_subjects, professional_subjects, plan_count,
  charter_url, syllabus_url, source_status, verified_at, active, status, sort_order
) values
  (
    'ahut-cs-2026', 2026, 'anhui', 'computer-science', 'ahut',
    '计算机科学与技术：安徽机电职业技术学院（安徽省芜湖市弋江区高教园区文津西路16号）',
    '装备制造大类、电子与信息大类',
    array['高等数学','英语'], array['计算机科学导论','C程序设计'], 50,
    'https://zs.ahut.edu.cn/info/6056/3024.htm',
    'https://zs.ahut.edu.cn/__local/A/6F/9B/CAB8096D8BC7B704234C98ECD94_F6716DD8_B8464.pdf',
    '2026正式章程与官方考纲', '2026-09-22', true, 'published', 20
  ),
  (
    'ahut-iot-2026', 2026, 'anhui', 'computer-science', 'ahut',
    '物联网工程：合肥职业技术学院汇心湖校区（安徽省合肥市新站区岱河路2号）',
    '装备制造大类、交通运输大类、电子与信息大类',
    array['高等数学','英语'], array['计算机科学导论','C程序设计'], 40,
    'https://zs.ahut.edu.cn/info/6056/3024.htm',
    'https://zs.ahut.edu.cn/__local/A/6F/9B/CAB8096D8BC7B704234C98ECD94_F6716DD8_B8464.pdf',
    '2026正式章程与官方考纲', '2026-09-22', true, 'published', 21
  );

insert into public.syllabus_points (
  point_id, year, province_slug, major_slug, school_slug, subject_slug, subject_name,
  section_order, section_name, point_order, point_title, canonical_topic, active, status
) values
  ('ahut-ci-overview', 2026, 'anhui', 'computer-science', 'ahut', 'computer-intro', '计算机科学导论', 1, '计算机基础与系统', 1, '计算机发展、分类、信息编码、数制换算与存储单位', 'computer-basics', true, 'published'),
  ('ahut-ci-system', 2026, 'anhui', 'computer-science', 'ahut', 'computer-intro', '计算机科学导论', 1, '计算机基础与系统', 2, '硬件系统、软件系统、微型计算机结构与性能指标', 'computer-basics', true, 'published'),
  ('ahut-ci-os', 2026, 'anhui', 'computer-science', 'ahut', 'computer-intro', '计算机科学导论', 2, '系统与应用软件', 1, '操作系统功能、主流系统特点及安装维护使用', 'computer-basics', true, 'published'),
  ('ahut-ci-office', 2026, 'anhui', 'computer-science', 'ahut', 'computer-intro', '计算机科学导论', 2, '系统与应用软件', 2, '字处理、电子表格与演示文稿软件应用', 'computer-office', true, 'published'),
  ('ahut-ci-network', 2026, 'anhui', 'computer-science', 'ahut', 'computer-intro', '计算机科学导论', 3, '网络与多媒体', 1, '网络拓扑、OSI与TCP/IP模型、常用协议、局域网及网络设备', 'network-basic', true, 'published'),
  ('ahut-ci-multimedia', 2026, 'anhui', 'computer-science', 'ahut', 'computer-intro', '计算机科学导论', 3, '网络与多媒体', 2, '多媒体、Web基础及信息表示方法', 'multimedia-basic', true, 'published'),
  ('ahut-ci-programming', 2026, 'anhui', 'computer-science', 'ahut', 'computer-intro', '计算机科学导论', 4, '编程、安全与新技术', 1, '程序设计语言、结构化程序设计与面向对象思想', 'computer-basics', true, 'published'),
  ('ahut-ci-security', 2026, 'anhui', 'computer-science', 'ahut', 'computer-intro', '计算机科学导论', 4, '编程、安全与新技术', 2, '计算机安全防护、隐私保护、数据备份与信息安全法规', 'computer-basics', true, 'published'),
  ('ahut-ci-emerging', 2026, 'anhui', 'computer-science', 'ahut', 'computer-intro', '计算机科学导论', 4, '编程、安全与新技术', 3, '物联网、大数据、云计算、移动网络、人工智能与虚拟现实', 'computer-basics', true, 'published'),
  ('ahut-c-basic', 2026, 'anhui', 'computer-science', 'ahut', 'c-language', 'C程序设计', 1, 'C语言基础', 1, '程序结构、开发调试、数据类型、运算与输入输出', 'c-language-basic', true, 'published'),
  ('ahut-c-control', 2026, 'anhui', 'computer-science', 'ahut', 'c-language', 'C程序设计', 1, 'C语言基础', 2, '顺序、选择、循环与嵌套控制结构', 'c-language-control', true, 'published'),
  ('ahut-c-array', 2026, 'anhui', 'computer-science', 'ahut', 'c-language', 'C程序设计', 2, '数组与函数', 1, '数组、字符串、函数、参数传递与递归', 'c-language-array', true, 'published'),
  ('ahut-c-preprocessor', 2026, 'anhui', 'computer-science', 'ahut', 'c-language', 'C程序设计', 2, '数组与函数', 2, '宏定义与文件包含预处理命令', 'c-language-basic', true, 'published'),
  ('ahut-c-pointer', 2026, 'anhui', 'computer-science', 'ahut', 'c-language', 'C程序设计', 3, '指针与复合类型', 1, '指针、数组指针、函数参数与字符串指针', 'c-language-pointer', true, 'published'),
  ('ahut-c-struct-file', 2026, 'anhui', 'computer-science', 'ahut', 'c-language', 'C程序设计', 3, '指针与复合类型', 2, '结构体、共用体、枚举、typedef与文件操作', 'c-language-pointer', true, 'published');

update public.resources
set verified_at = '2026-09-22'
where status = 'published';
