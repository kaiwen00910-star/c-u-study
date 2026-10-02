-- Remote migration version: 20261002062534.
-- Publish the verified 2026 Fuyang Normal University software engineering study map.
-- The official syllabus download is captcha-protected. No captcha was bypassed;
-- the syllabus content comes from the official PDF supplied by the user.

update public.academic_schools
set school_slug = 'fynu', theme_color = '#245b9e'
where school_id = 'anhui-school-06' and school_slug = 'anhui-school-06';

insert into public.admission_offerings (
  offering_id, year, province_slug, major_slug, school_slug, training_site,
  eligible_major_categories, public_subjects, professional_subjects, plan_count,
  charter_url, syllabus_url, source_status, verified_at, active, status, sort_order
) values (
  'fynu-software-2026', 2026, 'anhui', 'computer-science', 'fynu',
  '软件工程：安徽工商职业学院双凤校区（安徽省合肥市双凤经济开发区金宁路北16号）',
  array['能源动力与材料大类','装备制造大类','电子与信息大类','交通运输大类'],
  array['高等数学','英语'], array['计算机专业基础','C语言程序设计'], 100,
  'https://www.fynu.edu.cn/bkzsxxw/info/1010/5876.htm',
  'https://www.fynu.edu.cn/bkzsxxw/info/1010/5675.htm',
  '2026正式章程与官方考纲（考纲ZIP下载需验证码，内容依据用户提供的官方软件工程考纲PDF核验）',
  '2026-10-02', true, 'published', 31
);

insert into public.syllabus_points (
  point_id, year, province_slug, major_slug, school_slug, subject_slug, subject_name,
  section_order, section_name, point_order, point_title, canonical_topic, active, status
) values
  ('fynu-cb-intro-data', 2026, 'anhui', 'computer-science', 'fynu', 'computer-basics', '计算机专业基础', 1, '计算机系统与软件', 1, '计算机基础、分类、使用、数字数据表示与处理流程', 'computer-basics', true, 'published'),
  ('fynu-cb-hardware', 2026, 'anhui', 'computer-science', 'fynu', 'computer-basics', '计算机专业基础', 1, '计算机系统与软件', 2, '主板、微处理器、内存、存储设备与输入输出设备', 'computer-basics', true, 'published'),
  ('fynu-cb-software-office', 2026, 'anhui', 'computer-science', 'fynu', 'computer-basics', '计算机专业基础', 1, '计算机系统与软件', 3, '软件分类、应用程序、常用软件与办公套件', 'computer-office', true, 'published'),
  ('fynu-cb-os-files', 2026, 'anhui', 'computer-science', 'fynu', 'computer-basics', '计算机专业基础', 1, '计算机系统与软件', 4, '操作系统功能分类、文件命名目录格式与文件管理', 'computer-basics', true, 'published'),
  ('fynu-cb-programming-paradigms', 2026, 'anhui', 'computer-science', 'fynu', 'computer-basics', '计算机专业基础', 1, '计算机系统与软件', 5, '程序设计基础及过程化、面向对象和面向方面编程', 'computer-basics', true, 'published'),
  ('fynu-cb-career-ethics', 2026, 'anhui', 'computer-science', 'fynu', 'computer-basics', '计算机专业基础', 1, '计算机系统与软件', 6, '计算机职业、教育认证与IT职业道德', 'computer-basics', true, 'published'),
  ('fynu-cb-lan', 2026, 'anhui', 'computer-science', 'fynu', 'computer-basics', '计算机专业基础', 2, '网络、Web与社交媒体', 1, '局域网分类、拓扑、设备、协议及有线无线网络', 'network-basic', true, 'published'),
  ('fynu-cb-internet-ip', 2026, 'anhui', 'computer-science', 'fynu', 'computer-basics', '计算机专业基础', 2, '网络、Web与社交媒体', 2, '因特网基础设施、数据包、IP地址、域名、接入与服务', 'network-ip', true, 'published'),
  ('fynu-cb-web', 2026, 'anhui', 'computer-science', 'fynu', 'computer-basics', '计算机专业基础', 2, '网络、Web与社交媒体', 3, '万维网、HTML、HTTP、浏览器、搜索引擎与电子商务', 'network-basic', true, 'published'),
  ('fynu-cb-social-email', 2026, 'anhui', 'computer-science', 'fynu', 'computer-basics', '计算机专业基础', 2, '网络、Web与社交媒体', 4, '内容社区、社交网络、电子邮件协议、实时消息与VoIP', 'network-basic', true, 'published'),
  ('fynu-cb-web-security', 2026, 'anhui', 'computer-science', 'fynu', 'computer-basics', '计算机专业基础', 2, '网络、Web与社交媒体', 5, '电子商务安全连接、SSL、TLS与HTTPS', 'information-security', true, 'published'),
  ('fynu-cb-multimedia', 2026, 'anhui', 'computer-science', 'fynu', 'computer-basics', '计算机专业基础', 3, '多媒体、信息系统与数据库', 1, 'Web多媒体基础、多媒体元素及网站设计开发', 'multimedia-basic', true, 'published'),
  ('fynu-cb-information-system', 2026, 'anhui', 'computer-science', 'fynu', 'computer-basics', '计算机专业基础', 3, '多媒体、信息系统与数据库', 2, '信息系统分类与系统开发生命周期', 'software-engineering', true, 'published'),
  ('fynu-cb-database', 2026, 'anhui', 'computer-science', 'fynu', 'computer-basics', '计算机专业基础', 3, '多媒体、信息系统与数据库', 3, '数据库概念、层次、模型、设计与数据管理工具', 'database-basic', true, 'published'),
  ('fynu-cb-sql', 2026, 'anhui', 'computer-science', 'fynu', 'computer-basics', '计算机专业基础', 3, '多媒体、信息系统与数据库', 4, 'SQL基础语句与数据库操作', 'database-sql', true, 'published'),
  ('fynu-cb-cloud-bigdata', 2026, 'anhui', 'computer-science', 'fynu', 'computer-basics', '计算机专业基础', 3, '多媒体、信息系统与数据库', 5, '云数据库、大数据概念、分析与应用', 'big-data', true, 'published'),
  ('fynu-cb-ai', 2026, 'anhui', 'computer-science', 'fynu', 'computer-basics', '计算机专业基础', 4, '新技术与计算机安全', 1, '人工智能发展、图灵测试与深度学习概念', 'artificial-intelligence', true, 'published'),
  ('fynu-cb-emerging-tech', 2026, 'anhui', 'computer-science', 'fynu', 'computer-basics', '计算机专业基础', 4, '新技术与计算机安全', 2, '云计算、物联网、虚拟现实、元宇宙与区块链', 'computer-basics', true, 'published'),
  ('fynu-cb-security', 2026, 'anhui', 'computer-science', 'fynu', 'computer-basics', '计算机专业基础', 4, '新技术与计算机安全', 3, '加密、恶意软件、在线入侵、社交与备份安全', 'information-security', true, 'published'),
  ('fynu-c-structure', 2026, 'anhui', 'computer-science', 'fynu', 'c-language', 'C语言程序设计', 1, 'C语言与算法基础', 1, 'C程序组成、书写风格及编辑编译连接运行步骤', 'c-language-basic', true, 'published'),
  ('fynu-c-algorithm', 2026, 'anhui', 'computer-science', 'fynu', 'c-language', 'C语言程序设计', 1, 'C语言与算法基础', 2, '算法特征、流程图、N-S图与结构化程序设计', 'c-language-basic', true, 'published'),
  ('fynu-c-types', 2026, 'anhui', 'computer-science', 'fynu', 'c-language', 'C语言程序设计', 1, 'C语言与算法基础', 3, '标识符、数据类型、常量变量、类型转换与表达式', 'c-language-basic', true, 'published'),
  ('fynu-c-io', 2026, 'anhui', 'computer-science', 'fynu', 'c-language', 'C语言程序设计', 1, 'C语言与算法基础', 4, 'scanf、printf及字符和字符串输入输出函数', 'c-language-basic', true, 'published'),
  ('fynu-c-selection', 2026, 'anhui', 'computer-science', 'fynu', 'c-language', 'C语言程序设计', 2, '控制结构', 1, '关系逻辑表达式、if嵌套与switch多分支选择', 'c-language-control', true, 'published'),
  ('fynu-c-loop', 2026, 'anhui', 'computer-science', 'fynu', 'c-language', 'C语言程序设计', 2, '控制结构', 2, 'for、while、do-while循环、嵌套及break与continue', 'c-language-control', true, 'published'),
  ('fynu-c-array', 2026, 'anhui', 'computer-science', 'fynu', 'c-language', 'C语言程序设计', 3, '数组、函数与指针', 1, '一维二维数组、字符数组、字符串及常用处理函数', 'c-language-array', true, 'published'),
  ('fynu-c-function', 2026, 'anhui', 'computer-science', 'fynu', 'c-language', 'C语言程序设计', 3, '数组、函数与指针', 2, '库函数、自定义函数、参数传递、嵌套调用与变量存储类型', 'c-language-array', true, 'published'),
  ('fynu-c-pointer', 2026, 'anhui', 'computer-science', 'fynu', 'c-language', 'C语言程序设计', 3, '数组、函数与指针', 3, '指针、地址运算及变量数组字符串的指针引用', 'c-language-pointer', true, 'published'),
  ('fynu-c-struct', 2026, 'anhui', 'computer-science', 'fynu', 'c-language', 'C语言程序设计', 3, '数组、函数与指针', 4, '结构体变量、结构体数组与结构体指针', 'c-language-pointer', true, 'published'),
  ('fynu-c-file', 2026, 'anhui', 'computer-science', 'fynu', 'c-language', 'C语言程序设计', 4, '文件操作', 1, '文件类型、文件指针、打开关闭、顺序与随机读写', 'c-language-pointer', true, 'published');
