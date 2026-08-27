create table public.academic_schools (
  school_slug text primary key,
  wall_school_id text,
  school_name text not null,
  school_type text not null,
  short_name text not null,
  theme_color text not null default '#1556a6',
  logo_url text,
  active boolean not null default true,
  sort_order integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint academic_schools_slug_format check (school_slug ~ '^[a-z0-9-]+$'),
  constraint academic_schools_wall_id_format check (wall_school_id is null or wall_school_id ~ '^anhui-school-[0-9]{2}$'),
  constraint academic_schools_color_format check (theme_color ~ '^#[0-9A-Fa-f]{6}$'),
  constraint academic_schools_logo_https check (logo_url is null or logo_url ~ '^https://' or logo_url ~ '^/'),
  constraint academic_schools_sort_positive check (sort_order > 0),
  constraint academic_schools_wall_id_unique unique (wall_school_id)
);

create table public.admission_offerings (
  offering_id text primary key,
  year integer not null,
  province_slug text not null default 'anhui',
  major_slug text not null default 'computer-science',
  school_slug text not null references public.academic_schools(school_slug),
  training_site text not null,
  eligible_major_categories text not null,
  public_subjects text[] not null,
  professional_subjects text[] not null,
  plan_count integer not null,
  charter_url text not null,
  syllabus_url text not null,
  source_status text not null default '正式章程',
  verified_at date not null,
  active boolean not null default true,
  sort_order integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admission_offerings_id_format check (offering_id ~ '^[a-z0-9-]+$'),
  constraint admission_offerings_year_valid check (year between 2020 and 2100),
  constraint admission_offerings_plan_positive check (plan_count > 0),
  constraint admission_offerings_subjects_not_empty check (cardinality(public_subjects) > 0 and cardinality(professional_subjects) > 0),
  constraint admission_offerings_urls_https check (charter_url ~ '^https://' and syllabus_url ~ '^https://'),
  constraint admission_offerings_sort_positive check (sort_order > 0)
);

create table public.syllabus_points (
  point_id text primary key,
  year integer not null,
  school_slug text not null,
  subject_slug text not null,
  subject_name text not null,
  section_order integer not null,
  section_name text not null,
  point_order integer not null,
  point_title text not null,
  canonical_topic text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint syllabus_points_id_format check (point_id ~ '^[a-z0-9-]+$'),
  constraint syllabus_points_school_format check (school_slug = 'common' or school_slug ~ '^[a-z0-9-]+$'),
  constraint syllabus_points_subject_format check (subject_slug ~ '^[a-z0-9-]+$'),
  constraint syllabus_points_topic_format check (canonical_topic ~ '^[a-z0-9-]+$'),
  constraint syllabus_points_year_valid check (year between 2020 and 2100),
  constraint syllabus_points_orders_positive check (section_order > 0 and point_order > 0)
);

create trigger academic_schools_set_updated_at before update on public.academic_schools
for each row execute function public.set_updated_at();
create trigger admission_offerings_set_updated_at before update on public.admission_offerings
for each row execute function public.set_updated_at();
create trigger syllabus_points_set_updated_at before update on public.syllabus_points
for each row execute function public.set_updated_at();

alter table public.academic_schools enable row level security;
alter table public.admission_offerings enable row level security;
alter table public.syllabus_points enable row level security;

create policy "public can read active academic schools" on public.academic_schools
for select to anon, authenticated using (active);
create policy "admins can read all academic schools" on public.academic_schools
for select to authenticated using (exists (select 1 from public.admin_users where admin_users.user_id = (select auth.uid())));
create policy "admins can insert academic schools" on public.academic_schools
for insert to authenticated with check (exists (select 1 from public.admin_users where admin_users.user_id = (select auth.uid())));
create policy "admins can update academic schools" on public.academic_schools
for update to authenticated
using (exists (select 1 from public.admin_users where admin_users.user_id = (select auth.uid())))
with check (exists (select 1 from public.admin_users where admin_users.user_id = (select auth.uid())));

create policy "public can read active admission offerings" on public.admission_offerings
for select to anon, authenticated using (active);
create policy "admins can read all admission offerings" on public.admission_offerings
for select to authenticated using (exists (select 1 from public.admin_users where admin_users.user_id = (select auth.uid())));
create policy "admins can insert admission offerings" on public.admission_offerings
for insert to authenticated with check (exists (select 1 from public.admin_users where admin_users.user_id = (select auth.uid())));
create policy "admins can update admission offerings" on public.admission_offerings
for update to authenticated
using (exists (select 1 from public.admin_users where admin_users.user_id = (select auth.uid())))
with check (exists (select 1 from public.admin_users where admin_users.user_id = (select auth.uid())));

create policy "public can read active syllabus points" on public.syllabus_points
for select to anon, authenticated using (active);
create policy "admins can read all syllabus points" on public.syllabus_points
for select to authenticated using (exists (select 1 from public.admin_users where admin_users.user_id = (select auth.uid())));
create policy "admins can insert syllabus points" on public.syllabus_points
for insert to authenticated with check (exists (select 1 from public.admin_users where admin_users.user_id = (select auth.uid())));
create policy "admins can update syllabus points" on public.syllabus_points
for update to authenticated
using (exists (select 1 from public.admin_users where admin_users.user_id = (select auth.uid())))
with check (exists (select 1 from public.admin_users where admin_users.user_id = (select auth.uid())));

grant select on public.academic_schools, public.admission_offerings, public.syllabus_points to anon;
grant select, insert, update on public.academic_schools, public.admission_offerings, public.syllabus_points to authenticated;
revoke delete on public.academic_schools, public.admission_offerings, public.syllabus_points from anon, authenticated;

insert into public.academic_schools
  (school_slug, wall_school_id, school_name, school_type, short_name, theme_color, logo_url, active, sort_order)
values
  ('hfnu', 'anhui-school-23', '合肥师范学院', '公办', '合师', '#0869a6', '/schools/school-hfnu.jpg', true, 1),
  ('aiit', 'anhui-school-33', '安徽信息工程学院', '民办', '安信', '#164d89', '/schools/school-aiit.png', true, 2),
  ('wenda', 'anhui-school-36', '安徽文达信息工程学院', '民办', '文达', '#173d78', '/schools/school-wenda.jpg', true, 3);

insert into public.admission_offerings
  (offering_id, year, province_slug, major_slug, school_slug, training_site, eligible_major_categories, public_subjects, professional_subjects, plan_count, charter_url, syllabus_url, source_status, verified_at, active, sort_order)
values
  ('hfnu-aiec-2026', 2026, 'anhui', 'computer-science', 'hfnu', '安徽工业经济职业技术学院', '电子与信息大类', array['高等数学','英语'], array['C语言程序设计','数据结构'], 50, 'https://zsb.hfnu.edu.cn/info/1003/3665.htm', 'https://zsb.hfnu.edu.cn/__local/7/D9/69/9D7365B29678864C75F6353DB89_9B196186_22CB2.pdf', '正式章程', '2026-08-13', true, 1),
  ('hfnu-mtc-2026', 2026, 'anhui', 'computer-science', 'hfnu', '马鞍山师范高等专科学校', '电子与信息大类', array['高等数学','英语'], array['C语言程序设计','数据结构'], 50, 'https://zsb.hfnu.edu.cn/info/1003/3665.htm', 'https://zsb.hfnu.edu.cn/__local/7/D9/69/9D7365B29678864C75F6353DB89_9B196186_22CB2.pdf', '正式章程', '2026-08-13', true, 2),
  ('aiit-2026', 2026, 'anhui', 'computer-science', 'aiit', '安徽信息工程学院校本部', '电子与信息大类等（详见章程）', array['高等数学','英语'], array['计算机专业基础','C语言程序设计'], 100, 'https://zsxx.aiit.edu.cn/info/182584', 'https://zsxx.aiit.edu.cn/uploads/585/file/public/202511/20251112103625_de4bo7quiq.pdf', '正式章程', '2026-08-13', true, 3),
  ('wenda-2026', 2026, 'anhui', 'computer-science', 'wenda', '安徽文达信息工程学院校本部', '多个专业大类（详见章程）', array['高等数学','英语'], array['C语言程序设计','计算机网络基础'], 180, 'https://www.wenda.edu.cn/zs/m/display_34104.html', 'https://www.wenda.edu.cn/zs/display_34105.html', '正式章程', '2026-08-13', true, 4);

insert into public.syllabus_points
  (point_id, year, school_slug, subject_slug, subject_name, section_order, section_name, point_order, point_title, canonical_topic, active)
values
  ('math-function', 2026, 'common', 'advanced-math', '高等数学', 1, '函数与极限', 1, '函数、定义域与基本性质', 'math-function', true),
  ('math-limit', 2026, 'common', 'advanced-math', '高等数学', 1, '函数与极限', 2, '数列极限与函数极限', 'math-limit', true),
  ('math-derivative', 2026, 'common', 'advanced-math', '高等数学', 2, '一元函数微分学', 1, '导数与微分', 'math-derivative', true),
  ('math-derivative-app', 2026, 'common', 'advanced-math', '高等数学', 2, '一元函数微分学', 2, '导数的应用', 'math-derivative', true),
  ('math-integral', 2026, 'common', 'advanced-math', '高等数学', 3, '一元函数积分学', 1, '不定积分与定积分', 'math-integral', true),
  ('english-vocab', 2026, 'common', 'english', '英语', 1, '词汇与语法', 1, '高频词汇与固定搭配', 'english-vocabulary', true),
  ('english-grammar', 2026, 'common', 'english', '英语', 1, '词汇与语法', 2, '时态、从句与非谓语', 'english-grammar', true),
  ('english-reading', 2026, 'common', 'english', '英语', 2, '阅读与写作', 1, '阅读理解方法', 'english-reading', true),
  ('english-writing', 2026, 'common', 'english', '英语', 2, '阅读与写作', 2, '应用文与短文写作', 'english-writing', true),
  ('hfnu-c-basic', 2026, 'hfnu', 'c-language', 'C语言程序设计', 1, 'C语言基础', 1, '数据类型、变量与表达式', 'c-language-basic', true),
  ('hfnu-c-control', 2026, 'hfnu', 'c-language', 'C语言程序设计', 1, 'C语言基础', 2, '分支与循环结构', 'c-language-control', true),
  ('hfnu-c-array', 2026, 'hfnu', 'c-language', 'C语言程序设计', 2, '复合程序设计', 1, '数组与字符串', 'c-language-array', true),
  ('hfnu-c-pointer', 2026, 'hfnu', 'c-language', 'C语言程序设计', 2, '复合程序设计', 2, '函数、指针与结构体', 'c-language-pointer', true),
  ('hfnu-ds-linear', 2026, 'hfnu', 'data-structure', '数据结构', 1, '线性结构', 1, '线性表、栈与队列', 'data-structure-linear', true),
  ('hfnu-ds-tree', 2026, 'hfnu', 'data-structure', '数据结构', 2, '树与图', 1, '树、二叉树与遍历', 'data-structure-tree', true),
  ('hfnu-ds-graph', 2026, 'hfnu', 'data-structure', '数据结构', 2, '树与图', 2, '图与图的遍历', 'data-structure-graph', true),
  ('hfnu-ds-search', 2026, 'hfnu', 'data-structure', '数据结构', 3, '查找与排序', 1, '查找和内部排序', 'data-structure-sort', true),
  ('aiit-cs-system', 2026, 'aiit', 'computer-basics', '计算机专业基础', 1, '计算机基础知识', 1, '计算机系统组成与信息表示', 'computer-basics', true),
  ('aiit-cs-os', 2026, 'aiit', 'computer-basics', '计算机专业基础', 2, '操作系统与办公应用', 1, 'Windows与文件管理', 'computer-basics', true),
  ('aiit-cs-office', 2026, 'aiit', 'computer-basics', '计算机专业基础', 2, '操作系统与办公应用', 2, 'Word、Excel与PowerPoint', 'computer-office', true),
  ('aiit-cs-network', 2026, 'aiit', 'computer-basics', '计算机专业基础', 3, '网络基础', 1, '局域网与Internet基础', 'network-basic', true),
  ('aiit-c-basic', 2026, 'aiit', 'c-language', 'C语言程序设计', 1, 'C语言基础', 1, '数据类型、变量与表达式', 'c-language-basic', true),
  ('aiit-c-control', 2026, 'aiit', 'c-language', 'C语言程序设计', 1, 'C语言基础', 2, '分支与循环结构', 'c-language-control', true),
  ('aiit-c-array', 2026, 'aiit', 'c-language', 'C语言程序设计', 2, '数组与函数', 1, '数组、函数与字符串', 'c-language-array', true),
  ('aiit-c-pointer', 2026, 'aiit', 'c-language', 'C语言程序设计', 2, '数组与函数', 2, '指针与结构体', 'c-language-pointer', true),
  ('wenda-c-basic', 2026, 'wenda', 'c-language', 'C语言程序设计', 1, 'C语言基础', 1, '数据类型、变量与表达式', 'c-language-basic', true),
  ('wenda-c-control', 2026, 'wenda', 'c-language', 'C语言程序设计', 1, 'C语言基础', 2, '分支与循环结构', 'c-language-control', true),
  ('wenda-c-array', 2026, 'wenda', 'c-language', 'C语言程序设计', 2, '复合程序设计', 1, '数组、函数与字符串', 'c-language-array', true),
  ('wenda-c-pointer', 2026, 'wenda', 'c-language', 'C语言程序设计', 2, '复合程序设计', 2, '指针与结构体', 'c-language-pointer', true),
  ('wenda-net-model', 2026, 'wenda', 'computer-network', '计算机网络基础', 1, '计算机网络概述', 1, '网络体系结构与协议', 'network-basic', true),
  ('wenda-net-data', 2026, 'wenda', 'computer-network', '计算机网络基础', 2, '数据通信与局域网', 1, '数据通信与介质访问', 'network-data', true),
  ('wenda-net-ip', 2026, 'wenda', 'computer-network', '计算机网络基础', 3, '网络层与传输层', 1, 'IP地址与路由', 'network-ip', true),
  ('wenda-net-tcp', 2026, 'wenda', 'computer-network', '计算机网络基础', 3, '网络层与传输层', 2, 'TCP与UDP', 'network-transport', true);
