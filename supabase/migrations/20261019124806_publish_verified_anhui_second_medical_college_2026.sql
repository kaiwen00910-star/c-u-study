-- Publish the verified 2026 professional map for Anhui Second Medical College.
-- Existing syllabus points, resources, drafts, and all non-target offerings are frozen.

create temporary table second_medical_protected_offering_drafts on commit drop as
select to_jsonb(o) as row_data from public.admission_offerings o where o.status <> 'published' or o.active = false;

create temporary table second_medical_protected_points on commit drop as
select to_jsonb(p) as row_data from public.syllabus_points p;

create temporary table second_medical_protected_resources on commit drop as
select to_jsonb(r) as row_data from public.resources r;

create temporary table second_medical_protected_other_offerings on commit drop as
select to_jsonb(o) as row_data from public.admission_offerings o
where o.school_slug <> 'anhui-school-40';

do $$
begin
  if (select version from public.content_versions where id = 'public-content') <> 123
     or (select count(*) from public.academic_schools where school_name = '安徽第二医学院' and school_slug = 'anhui-school-40' and has_study_map = false) <> 1
     or (select count(*) from public.admission_offerings where school_slug = 'anhui-school-40') <> 0
     or (select count(*) from public.admission_offerings where status = 'published' and active = true) <> 461
     or (select count(*) from public.syllabus_points where status = 'published' and active = true) <> 1033
     or (select count(*) from public.resources where status = 'published') <> 80
     or (select count(*) from public.syllabus_points where status = 'draft' and active = false) <> 33
     or (select count(*) from public.admission_offerings where year = 2027 and status = 'draft' and active = false) <> 4 then
    raise exception 'Second medical college publication stopped: production baseline changed';
  end if;
end $$;

update public.academic_schools
set school_slug = 'ahyz', theme_color = '#1556a6'
where school_id = 'anhui-school-40' and school_slug = 'anhui-school-40';

insert into public.admission_offerings (
  offering_id, year, province_slug, major_slug, school_slug, program_names, exam_scheme_id,
  training_site, eligible_major_categories, public_subjects, professional_subjects, plan_count,
  charter_url, syllabus_url, source_status, verified_at, active, status, sort_order
)
values
  (
    'ahyz-2026-medical-laboratory-technology', 2026, 'anhui', 'all-programs', 'ahyz', array['医学检验技术'],
    'ahyz-medical-laboratory-technology',
    '安徽第二医学院校本部（新桥校区：新桥国际产业园迎宾大道与寿州大道交口；芙蓉路校区：合肥市芙蓉路632号）',
    '临床医学、护理、药学、医学检验技术、医学影像技术、卫生检验与检疫技术、医学生物技术、眼视光技术、口腔医学技术、康复治疗技术',
    array['高等数学','英语'], array['人体解剖生理学','诊断学'], 100,
    'https://mp.weixin.qq.com/s/sYFFPRME1j-r4rxdI6-y0w', 'https://mp.weixin.qq.com/s/sYFFPRME1j-r4rxdI6-y0w',
    '2026正式招生章程、官方招生计划及专业课考试大纲已核验', date '2026-10-19', true, 'published', 1
  ),
  (
    'ahyz-2026-elderly-service-management', 2026, 'anhui', 'all-programs', 'ahyz', array['养老服务管理'],
    'ahyz-elderly-service-management',
    '安徽第二医学院校本部（新桥校区：新桥国际产业园迎宾大道与寿州大道交口；芙蓉路校区：合肥市芙蓉路632号）',
    '医药卫生大类、公共管理与服务大类、食品药品与粮食大类',
    array['大学语文','英语'], array['管理学基础','老年学概论'], 50,
    'https://mp.weixin.qq.com/s/sYFFPRME1j-r4rxdI6-y0w', 'https://mp.weixin.qq.com/s/sYFFPRME1j-r4rxdI6-y0w',
    '2026正式招生章程、官方招生计划及专业课考试大纲已核验', date '2026-10-19', true, 'published', 2
  ),
  (
    'ahyz-2026-nursing-ahwhvc', 2026, 'anhui', 'all-programs', 'ahyz', array['护理学'],
    'ahyz-nursing',
    '安徽卫生健康职业学院（安徽省池州市教育园区学院路9号）',
    '护理、助产',
    array['大学语文','英语'], array['人体解剖生理学','护理学基础'], 90,
    'https://mp.weixin.qq.com/s/sYFFPRME1j-r4rxdI6-y0w', 'https://mp.weixin.qq.com/s/sYFFPRME1j-r4rxdI6-y0w',
    '2026正式招生章程、官方招生计划及专业课考试大纲已核验', date '2026-10-19', true, 'published', 3
  ),
  (
    'ahyz-2026-pharmacy-ahwhvc', 2026, 'anhui', 'all-programs', 'ahyz', array['药学'],
    'ahyz-pharmacy',
    '安徽卫生健康职业学院（安徽省池州市教育园区学院路9号）',
    '药学、中药学、药品生产技术、药品质量与安全、生物制药技术、化学制药技术、药物制剂技术、中药制药、药品经营与管理、药品生物技术',
    array['高等数学','英语'], array['药理学','药剂学'], 30,
    'https://mp.weixin.qq.com/s/sYFFPRME1j-r4rxdI6-y0w', 'https://mp.weixin.qq.com/s/sYFFPRME1j-r4rxdI6-y0w',
    '2026正式招生章程、官方招生计划及专业课考试大纲已核验', date '2026-10-19', true, 'published', 4
  );

do $$
begin
  if (select count(*) from public.admission_offerings where school_slug = 'ahyz' and year = 2026 and status = 'published' and active = true) <> 4
     or (select count(distinct program_name) from public.admission_offerings o cross join lateral unnest(o.program_names) program_name where o.school_slug = 'ahyz' and o.year = 2026 and o.status = 'published' and o.active = true) <> 4
     or (select sum(plan_count) from public.admission_offerings where school_slug = 'ahyz' and year = 2026 and status = 'published' and active = true) <> 270
     or (select count(distinct exam_scheme_id) from public.admission_offerings where school_slug = 'ahyz' and year = 2026 and status = 'published' and active = true) <> 4
     or (select count(*) from public.academic_schools where school_id = 'anhui-school-40' and school_slug = 'ahyz' and has_study_map = true) <> 1 then
    raise exception 'Second medical college publication stopped: map totals are incorrect';
  end if;

  if exists (
    select 1 from public.admission_offerings o
    where o.school_slug = 'ahyz' and o.year = 2026 and o.status = 'published' and o.active = true
      and (cardinality(o.program_names) <> 1 or cardinality(o.public_subjects) <> 2 or cardinality(o.professional_subjects) <> 2
        or o.exam_scheme_id is null or o.plan_count is null or o.training_site is null or o.eligible_major_categories is null
        or o.charter_url is null or o.syllabus_url is null)
  ) then raise exception 'Second medical college publication stopped: an offering is incomplete'; end if;

  if exists (
    (select row_data from second_medical_protected_offering_drafts except select to_jsonb(o) from public.admission_offerings o where o.status <> 'published' or o.active = false)
    union all
    (select to_jsonb(o) from public.admission_offerings o where o.status <> 'published' or o.active = false except select row_data from second_medical_protected_offering_drafts)
  ) then raise exception 'Second medical college publication stopped: draft/inactive offerings changed'; end if;

  if exists (
    (select row_data from second_medical_protected_points except select to_jsonb(p) from public.syllabus_points p)
    union all
    (select to_jsonb(p) from public.syllabus_points p except select row_data from second_medical_protected_points)
  ) then raise exception 'Second medical college publication stopped: syllabus points changed'; end if;

  if exists (
    (select row_data from second_medical_protected_resources except select to_jsonb(r) from public.resources r)
    union all
    (select to_jsonb(r) from public.resources r except select row_data from second_medical_protected_resources)
  ) then raise exception 'Second medical college publication stopped: resources changed'; end if;

  if exists (
    (select row_data from second_medical_protected_other_offerings except select to_jsonb(o) from public.admission_offerings o where o.school_slug <> 'ahyz')
    union all
    (select to_jsonb(o) from public.admission_offerings o where o.school_slug <> 'ahyz' except select row_data from second_medical_protected_other_offerings)
  ) then raise exception 'Second medical college publication stopped: non-target offerings changed'; end if;

  if (select count(*) from public.admission_offerings where status = 'published' and active = true) <> 465
     or (select count(distinct school_slug) from public.admission_offerings where status = 'published' and active = true) <> 42
     or (select count(*) from public.syllabus_points where status = 'published' and active = true) <> 1033
     or (select count(*) from public.resources where status = 'published') <> 80
     or (select count(*) from public.syllabus_points where status = 'draft' and active = false) <> 33
     or (select count(*) from public.admission_offerings where year = 2027 and status = 'draft' and active = false) <> 4
     or (select version from public.content_versions where id = 'public-content') <= 123 then
    raise exception 'Second medical college publication stopped: frozen content or version changed unexpectedly';
  end if;
end $$;
