-- Publish Anhui University of Applied Technology only after its formal 2026
-- admissions charter and school-hosted professional syllabus were verified.

update public.academic_schools
set school_slug = 'auta', theme_color = '#0068b7'
where school_id = 'anhui-school-41' and school_slug = 'anhui-school-41';

insert into public.admission_offerings (
  offering_id, year, province_slug, major_slug, school_slug, training_site,
  eligible_major_categories, public_subjects, professional_subjects, plan_count,
  charter_url, syllabus_url, source_status, verified_at, active, status, sort_order
) values (
  'auta-network-engineering-2026', 2026, 'anhui', 'computer-science', 'auta',
  '网络工程技术：校本部（安徽省合肥市新站区文忠路2600号）',
  '装备制造大类、电子与信息大类',
  array['高等数学','英语'], array['计算机基础','C语言'], 100,
  'https://www.uta.edu.cn/zsw/2026/0319/c3241a168582/page.htm',
  'https://www.uta.edu.cn/_upload/article/files/11/31/f81ff640420fbcd3c42313f10970/1f7e4553-78c3-459b-9057-e94bfcc905f8.pdf',
  '2026正式章程与官方考纲', '2026-09-23', true, 'published', 22
);

insert into public.syllabus_points (
  point_id, year, province_slug, major_slug, school_slug, subject_slug, subject_name,
  section_order, section_name, point_order, point_title, canonical_topic, active, status
) values
  ('auta-basic-data', 2026, 'anhui', 'computer-science', 'auta', 'computer-basics', '计算机基础', 1, '计算机与数据', 1, '计算机基础、数制转换与数据表示', 'computer-basics', true, 'published'),
  ('auta-basic-hardware', 2026, 'anhui', 'computer-science', 'auta', 'computer-basics', '计算机基础', 1, '计算机与数据', 2, '硬件系统、工作原理与输入输出设备', 'computer-basics', true, 'published'),
  ('auta-basic-os', 2026, 'anhui', 'computer-science', 'auta', 'computer-basics', '计算机基础', 2, '系统与办公', 1, '操作系统基础与 Windows 10 基本使用', 'computer-basics', true, 'published'),
  ('auta-basic-office', 2026, 'anhui', 'computer-science', 'auta', 'computer-basics', '计算机基础', 2, '系统与办公', 2, 'Office 与 WPS 文档、表格和演示文稿', 'computer-office', true, 'published'),
  ('auta-c-program-algorithm', 2026, 'anhui', 'computer-science', 'auta', 'c-language', 'C语言', 1, '程序设计基础', 1, 'C程序构成、预处理、执行过程与算法描述', 'c-language-basic', true, 'published'),
  ('auta-c-basic', 2026, 'anhui', 'computer-science', 'auta', 'c-language', 'C语言', 1, '程序设计基础', 2, '数据类型、变量、运算符、表达式与输入输出', 'c-language-basic', true, 'published'),
  ('auta-c-control', 2026, 'anhui', 'computer-science', 'auta', 'c-language', 'C语言', 1, '程序设计基础', 3, '分支、循环、跳转与嵌套控制结构', 'c-language-control', true, 'published'),
  ('auta-c-array-sort', 2026, 'anhui', 'computer-science', 'auta', 'c-language', 'C语言', 2, '数组与函数', 1, '一维、二维和字符数组与简单排序', 'c-language-array', true, 'published'),
  ('auta-c-function', 2026, 'anhui', 'computer-science', 'auta', 'c-language', 'C语言', 2, '数组与函数', 2, '函数、递归、变量作用域与存储方式', 'c-language-array', true, 'published'),
  ('auta-c-pointer-types', 2026, 'anhui', 'computer-science', 'auta', 'c-language', 'C语言', 3, '指针与复合类型', 1, '指针、字符串指针、结构体、共用体、枚举与单链表', 'c-language-pointer', true, 'published'),
  ('auta-c-file', 2026, 'anhui', 'computer-science', 'auta', 'c-language', 'C语言', 3, '指针与复合类型', 2, '文件指针、文件读写与文件操作库函数', 'c-language-pointer', true, 'published');
