-- Remote migration version: 20260929120111.
-- Publish the 2026 Anhui Normal University software engineering study map.
-- The formal official release page carries both the charter PDF and syllabus
-- DOCX. Those attachments require a captcha; after explicit user approval,
-- their contents were verified against the user-provided official copies.

update public.academic_schools
set school_slug = 'ahnu', theme_color = '#1556a6'
where school_id = 'anhui-school-04' and school_slug = 'anhui-school-04';

insert into public.admission_offerings (
  offering_id, year, province_slug, major_slug, school_slug, training_site,
  eligible_major_categories, public_subjects, professional_subjects, plan_count,
  charter_url, syllabus_url, source_status, verified_at, active, status, sort_order
) values (
  'ahnu-software-2026', 2026, 'anhui', 'computer-science', 'ahnu',
  '软件工程：安徽师范大学天门山校区（安徽省芜湖市九华北路171号）',
  '电子与信息大类',
  array['高等数学','英语'], array['计算机专业基础','C语言程序设计'], 80,
  'https://zsxx.ahnu.edu.cn/info/1042/4133.htm',
  'https://zsxx.ahnu.edu.cn/info/1042/4133.htm',
  '2026正式章程与官方考纲（附件下载需验证码，内容依据用户提供的官方附件核验）',
  '2026-09-29', true, 'published', 25
);

insert into public.syllabus_points (
  point_id, year, province_slug, major_slug, school_slug, subject_slug, subject_name,
  section_order, section_name, point_order, point_title, canonical_topic, active, status
) values
  ('ahnu-cb-overview', 2026, 'anhui', 'computer-science', 'ahnu', 'computer-basics', '计算机专业基础', 1, '计算机与系统基础', 1, '计算机发展、特点、分类、应用领域与发展趋势', 'computer-basics', true, 'published'),
  ('ahnu-cb-data', 2026, 'anhui', 'computer-science', 'ahnu', 'computer-basics', '计算机专业基础', 1, '计算机与系统基础', 2, '信息与数据的表示、存储和运算', 'computer-basics', true, 'published'),
  ('ahnu-cb-system', 2026, 'anhui', 'computer-science', 'ahnu', 'computer-basics', '计算机专业基础', 1, '计算机与系统基础', 3, '计算机硬件、软件及微型计算机系统', 'computer-basics', true, 'published'),
  ('ahnu-cb-os', 2026, 'anhui', 'computer-science', 'ahnu', 'computer-basics', '计算机专业基础', 1, '计算机与系统基础', 4, '操作系统、语言翻译系统与工具软件', 'computer-basics', true, 'published'),
  ('ahnu-cb-network', 2026, 'anhui', 'computer-science', 'ahnu', 'computer-basics', '计算机专业基础', 2, '网络与信息安全', 1, '数据通信、网络基础、拓扑结构与网络模型', 'network-basic', true, 'published'),
  ('ahnu-cb-internet', 2026, 'anhui', 'computer-science', 'ahnu', 'computer-basics', '计算机专业基础', 2, '网络与信息安全', 2, '因特网与移动互联网技术及应用', 'network-basic', true, 'published'),
  ('ahnu-cb-security', 2026, 'anhui', 'computer-science', 'ahnu', 'computer-basics', '计算机专业基础', 2, '网络与信息安全', 3, '计算机信息安全基础', 'information-security', true, 'published'),
  ('ahnu-cb-database', 2026, 'anhui', 'computer-science', 'ahnu', 'computer-basics', '计算机专业基础', 3, '数据库与数据结构', 1, '数据库系统、关系数据模型与关系基本运算', 'database-basic', true, 'published'),
  ('ahnu-cb-sql', 2026, 'anhui', 'computer-science', 'ahnu', 'computer-basics', '计算机专业基础', 3, '数据库与数据结构', 2, 'SQL语言及常用数据库管理系统', 'database-sql', true, 'published'),
  ('ahnu-cb-db-design', 2026, 'anhui', 'computer-science', 'ahnu', 'computer-basics', '计算机专业基础', 3, '数据库与数据结构', 3, '关系数据库设计方法', 'database-design', true, 'published'),
  ('ahnu-cb-algorithm-structure', 2026, 'anhui', 'computer-science', 'ahnu', 'computer-basics', '计算机专业基础', 3, '数据库与数据结构', 4, '编程范式、算法与数据结构基础', 'data-structure-linear', true, 'published'),
  ('ahnu-c-structure', 2026, 'anhui', 'computer-science', 'ahnu', 'c-language', 'C语言程序设计', 1, '程序设计基础', 1, 'C程序组成、主函数、头文件、注释与书写格式', 'c-language-basic', true, 'published'),
  ('ahnu-c-types', 2026, 'anhui', 'computer-science', 'ahnu', 'c-language', 'C语言程序设计', 1, '程序设计基础', 2, '数据类型、运算符、类型转换与表达式求值', 'c-language-basic', true, 'published'),
  ('ahnu-c-io', 2026, 'anhui', 'computer-science', 'ahnu', 'c-language', 'C语言程序设计', 1, '程序设计基础', 3, '基本语句与输入输出函数', 'c-language-basic', true, 'published'),
  ('ahnu-c-selection', 2026, 'anhui', 'computer-science', 'ahnu', 'c-language', 'C语言程序设计', 1, '程序设计基础', 4, 'if、switch选择结构及其嵌套', 'c-language-control', true, 'published'),
  ('ahnu-c-loop', 2026, 'anhui', 'computer-science', 'ahnu', 'c-language', 'C语言程序设计', 1, '程序设计基础', 5, 'for、while、do-while循环及流程控制', 'c-language-control', true, 'published'),
  ('ahnu-c-array', 2026, 'anhui', 'computer-science', 'ahnu', 'c-language', 'C语言程序设计', 2, '数组、函数与指针', 1, '一维数组、二维数组、字符串与字符数组', 'c-language-array', true, 'published'),
  ('ahnu-c-function', 2026, 'anhui', 'computer-science', 'ahnu', 'c-language', 'C语言程序设计', 2, '数组、函数与指针', 2, '函数定义调用、递归、变量作用域与生存期', 'c-language-array', true, 'published'),
  ('ahnu-c-pointer', 2026, 'anhui', 'computer-science', 'ahnu', 'c-language', 'C语言程序设计', 2, '数组、函数与指针', 3, '指针、数组与字符串指针、函数指针及多级指针', 'c-language-pointer', true, 'published');
