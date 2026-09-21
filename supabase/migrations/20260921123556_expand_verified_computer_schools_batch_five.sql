-- Expand the verified 2026 Anhui computer-major learning maps from fourteen
-- to fifteen schools. Tongling University is published only after its formal
-- 2026 charter and school-hosted syllabus attachment were both verified.

update public.academic_schools
set school_slug = 'tlu', theme_color = '#1556a6'
where school_id = 'anhui-school-10' and school_slug = 'anhui-school-10';

insert into public.admission_offerings (
  offering_id, year, province_slug, major_slug, school_slug, training_site,
  eligible_major_categories, public_subjects, professional_subjects, plan_count,
  charter_url, syllabus_url, source_status, verified_at, active, status, sort_order
) values (
  'tlu-digital-media-2026', 2026, 'anhui', 'computer-science', 'tlu',
  '数字媒体技术：铜陵职业技术学院（安徽省铜陵市铜官区翠湖四路2689号）',
  '电子与信息大类、文化艺术大类、新闻传播大类',
  array['高等数学','英语'], array['多媒体技术基础','C语言程序设计'], 30,
  'https://zsb.tlu.edu.cn/2026/0319/c1751a126213/page.htm',
  'https://zsb.tlu.edu.cn/_upload/article/files/27/af/27d9464d4a5986457707170fa3ec/94f5c5a3-fc1c-4051-bbc9-511012319951.pdf',
  '2026正式章程与官方考纲', '2026-09-21', true, 'published', 19
);

insert into public.syllabus_points (
  point_id, year, province_slug, major_slug, school_slug, subject_slug, subject_name,
  section_order, section_name, point_order, point_title, canonical_topic, active, status
) values
  ('tlu-mm-concepts', 2026, 'anhui', 'computer-science', 'tlu', 'multimedia', '多媒体技术基础', 1, '多媒体基础', 1, '媒体与多媒体概念、主要特征、相关技术与素材分类', 'multimedia-basic', true, 'published'),
  ('tlu-mm-audio', 2026, 'anhui', 'computer-science', 'tlu', 'multimedia', '多媒体技术基础', 1, '多媒体基础', 2, '声音三要素、采样参数与常见音频文件格式', 'multimedia-basic', true, 'published'),
  ('tlu-mm-image', 2026, 'anhui', 'computer-science', 'tlu', 'multimedia', '多媒体技术基础', 2, '图形图像', 1, '色彩模式、图像分辨率、文件格式、矢量图与位图', 'multimedia-basic', true, 'published'),
  ('tlu-mm-animation', 2026, 'anhui', 'computer-science', 'tlu', 'multimedia', '多媒体技术基础', 3, '动画与视频', 1, '动画原理、分类、制作流程、帧类型与文件格式', 'multimedia-basic', true, 'published'),
  ('tlu-mm-video', 2026, 'anhui', 'computer-science', 'tlu', 'multimedia', '多媒体技术基础', 3, '动画与视频', 2, '视频信号源、分类、文件格式、拍摄技巧与制式', 'multimedia-basic', true, 'published'),
  ('tlu-c-basic', 2026, 'anhui', 'computer-science', 'tlu', 'c-language', 'C语言程序设计', 1, 'C语言基础', 1, '程序结构、数据类型、运算与输入输出', 'c-language-basic', true, 'published'),
  ('tlu-c-control', 2026, 'anhui', 'computer-science', 'tlu', 'c-language', 'C语言程序设计', 1, 'C语言基础', 2, '顺序、选择与循环结构', 'c-language-control', true, 'published'),
  ('tlu-c-array', 2026, 'anhui', 'computer-science', 'tlu', 'c-language', 'C语言程序设计', 2, '复合程序设计', 1, '数组、字符串与函数', 'c-language-array', true, 'published'),
  ('tlu-c-pointer', 2026, 'anhui', 'computer-science', 'tlu', 'c-language', 'C语言程序设计', 2, '复合程序设计', 2, '指针、结构体、链表与文件', 'c-language-pointer', true, 'published');

insert into public.resources (
  resource_id, topic_tags, title, platform, creator, url, resource_type,
  difficulty, duration_text, recommendation_reason, priority, verified_at, status
) values (
  'res-multimedia-1', array['multimedia-basic'],
  '多媒体技术与应用', '中国大学MOOC', '同济大学',
  'https://www.icourse163.org/course/TONGJI-1002215007',
  '系统课程', '入门', '7单元',
  '具体课程页覆盖多媒体基础、音频、图像、动画、视频与压缩编码，和铜陵学院多媒体技术基础考纲直接匹配',
  1, '2026-09-21', 'published'
);

update public.resources
set verified_at = '2026-09-21'
where status = 'published';
