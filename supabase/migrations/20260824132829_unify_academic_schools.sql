alter table public.academic_schools
  add column school_id text,
  add column has_study_map boolean not null default false;

update public.academic_schools
set school_id = wall_school_id
where school_id is null and wall_school_id is not null;

insert into public.academic_schools (
  school_id,
  school_slug,
  wall_school_id,
  school_name,
  school_type,
  short_name,
  theme_color,
  logo_url,
  active,
  sort_order
)
select
  source.school_id,
  source.school_slug,
  source.school_id,
  coalesce(nullif(btrim(legacy.display_name), ''), source.school_name),
  source.school_type,
  source.short_name,
  source.theme_color,
  coalesce(legacy.logo_url, source.logo_url),
  true,
  source.sort_order
from (values
  ('anhui-school-01', 'anhui-school-01', '安徽工业大学', '公办', '工业', '#1556a6', '/school-wall/anhui-university-of-technology.webp', 1),
  ('anhui-school-02', 'anhui-school-02', '安徽农业大学', '公办', '农业', '#1556a6', '/school-wall/anhui-agricultural-university.webp', 2),
  ('anhui-school-03', 'anhui-school-03', '安徽医科大学', '公办', '医科', '#1556a6', '/school-wall/anhui-medical-university.webp', 3),
  ('anhui-school-04', 'anhui-school-04', '安徽师范大学', '公办', '师范', '#1556a6', '/school-wall/anhui-normal-university.webp', 4),
  ('anhui-school-05', 'anhui-school-05', '安徽中医药大学', '公办', '中医', '#1556a6', '/school-wall/anhui-university-of-chinese-medicine.webp', 5),
  ('anhui-school-06', 'anhui-school-06', '阜阳师范大学', '公办', '阜阳', '#1556a6', '/school-wall/fuyang-normal-university.webp', 6),
  ('anhui-school-07', 'anhui-school-07', '安庆师范大学', '公办', '安庆', '#1556a6', '/school-wall/anqing-normal-university.webp', 7),
  ('anhui-school-08', 'anhui-school-08', '安徽建筑大学', '公办', '建筑', '#1556a6', '/school-wall/anhui-jianzhu-university.webp', 8),
  ('anhui-school-09', 'anhui-school-09', '安徽科技学院', '公办', '科技', '#1556a6', null, 9),
  ('anhui-school-10', 'anhui-school-10', '铜陵学院', '公办', '铜陵', '#1556a6', null, 10),
  ('anhui-school-11', 'anhui-school-11', '蚌埠学院', '公办', '蚌埠', '#1556a6', '/school-wall/bengbu-university.webp', 11),
  ('anhui-school-12', 'anhui-school-12', '蚌埠医科大学', '公办', '蚌医', '#1556a6', '/school-wall/bengbu-medical-university.webp', 12),
  ('anhui-school-13', 'anhui-school-13', '皖南医科大学', '公办', '皖医', '#1556a6', null, 13),
  ('anhui-school-14', 'anhui-school-14', '合肥大学', '公办', '合大', '#1556a6', '/school-wall/hefei-university.webp', 14),
  ('anhui-school-15', 'anhui-school-15', '巢湖学院', '公办', '巢湖', '#1556a6', '/school-wall/chaohu-university.webp', 15),
  ('anhui-school-16', 'anhui-school-16', '亳州学院', '公办', '亳州', '#1556a6', '/school-wall/bozhou-university.webp', 16),
  ('anhui-school-17', 'anhui-school-17', '滁州学院', '公办', '滁州', '#1556a6', '/school-wall/chuzhou-university.webp', 17),
  ('anhui-school-18', 'anhui-school-18', '宿州学院', '公办', '宿州', '#1556a6', '/school-wall/suzhou-university.webp', 18),
  ('anhui-school-19', 'anhui-school-19', '黄山学院', '公办', '黄山', '#1556a6', '/school-wall/huangshan-university.webp', 19),
  ('anhui-school-20', 'anhui-school-20', '池州学院', '公办', '池州', '#1556a6', '/school-wall/chizhou-university.webp', 20),
  ('anhui-school-21', 'anhui-school-21', '皖西学院', '公办', '皖西', '#1556a6', '/school-wall/west-anhui-university.webp', 21),
  ('anhui-school-22', 'anhui-school-22', '淮南师范学院', '公办', '淮南', '#1556a6', '/school-wall/huainan-normal-university.webp', 22),
  ('anhui-school-23', 'hfnu', '合肥师范学院', '公办', '合师', '#0869a6', '/schools/school-hfnu.jpg', 23),
  ('anhui-school-24', 'anhui-school-24', '安徽艺术学院', '公办', '艺术', '#1556a6', '/school-wall/anhui-university-of-arts.webp', 24),
  ('anhui-school-25', 'anhui-school-25', '安徽医科大学临床医学院', '民办', '临床', '#1556a6', null, 25),
  ('anhui-school-26', 'anhui-school-26', '马鞍山学院', '民办', '马鞍', '#1556a6', null, 26),
  ('anhui-school-27', 'anhui-school-27', '安徽新华学院', '民办', '新华', '#1556a6', null, 27),
  ('anhui-school-28', 'anhui-school-28', '合肥经济学院', '民办', '经济', '#1556a6', null, 28),
  ('anhui-school-29', 'anhui-school-29', '合肥城市学院', '民办', '城市', '#1556a6', null, 29),
  ('anhui-school-30', 'anhui-school-30', '安徽外国语学院', '民办', '外语', '#1556a6', null, 30),
  ('anhui-school-31', 'anhui-school-31', '安徽三联学院', '民办', '三联', '#1556a6', '/school-wall/anhui-sanlian-college.webp', 31),
  ('anhui-school-32', 'anhui-school-32', '蚌埠工商学院', '民办', '工商', '#1556a6', null, 32),
  ('anhui-school-33', 'aiit', '安徽信息工程学院', '民办', '安信', '#164d89', '/schools/school-aiit.png', 33),
  ('anhui-school-34', 'anhui-school-34', '淮北理工学院', '民办', '淮北', '#1556a6', null, 34),
  ('anhui-school-35', 'anhui-school-35', '皖江工学院', '民办', '皖江', '#1556a6', null, 35),
  ('anhui-school-36', 'wenda', '安徽文达信息工程学院', '民办', '文达', '#173d78', '/schools/school-wenda.jpg', 36),
  ('anhui-school-37', 'anhui-school-37', '芜湖学院', '民办', '芜湖', '#1556a6', '/school-wall/wuhu-university.webp', 37),
  ('anhui-school-38', 'anhui-school-38', '阜阳理工学院', '民办', '阜阳', '#1556a6', null, 38),
  ('anhui-school-39', 'anhui-school-39', '安徽财经大学', '公办', '财经', '#1556a6', '/school-wall/anhui-university-of-finance--economics.webp', 39),
  ('anhui-school-40', 'anhui-school-40', '安徽第二医学院', '公办', '二医', '#1556a6', null, 40),
  ('anhui-school-41', 'anhui-school-41', '安徽职业技术大学', '公办', '安职', '#1556a6', '/school-wall/anhui-vocational-and-technical-college.webp', 41),
  ('anhui-school-42', 'anhui-school-42', '芜湖职业技术大学', '公办', '芜职', '#1556a6', null, 42)
) as source(school_id, school_slug, school_name, school_type, short_name, theme_color, logo_url, sort_order)
left join public.school_logos legacy on legacy.school_id = source.school_id
on conflict (school_slug) do update set
  school_id = excluded.school_id,
  wall_school_id = excluded.school_id,
  school_name = coalesce(
    (select nullif(btrim(legacy_name.display_name), '') from public.school_logos legacy_name where legacy_name.school_id = excluded.school_id),
    academic_schools.school_name
  ),
  school_type = academic_schools.school_type,
  short_name = academic_schools.short_name,
  theme_color = academic_schools.theme_color,
  logo_url = coalesce(
    (select legacy_logo.logo_url from public.school_logos legacy_logo where legacy_logo.school_id = excluded.school_id),
    academic_schools.logo_url,
    excluded.logo_url
  ),
  sort_order = excluded.sort_order;

alter table public.academic_schools
  alter column school_id set not null,
  add constraint academic_schools_school_id_format check (school_id ~ '^anhui-school-[0-9]{2}$'),
  add constraint academic_schools_school_id_unique unique (school_id),
  add constraint academic_schools_name_length check (char_length(btrim(school_name)) between 1 and 40),
  add constraint academic_schools_short_name_length check (char_length(btrim(short_name)) between 1 and 12);

comment on column public.academic_schools.school_id is '首页院校墙与后台共用的固定院校 ID';
comment on column public.academic_schools.wall_school_id is '兼容旧版本的院校墙 ID；新代码只使用 school_id';
comment on column public.academic_schools.has_study_map is '由招生计划和学校专属考纲自动计算，禁止前端手工维护';
comment on table public.school_logos is '已迁移到 academic_schools，仅保留为旧版兼容与迁移核对，不再作为运行时数据源';

create index academic_schools_active_sort_idx
on public.academic_schools (sort_order, school_id)
where active;

create or replace function public.refresh_academic_school_map_flags()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.academic_schools as school
  set has_study_map =
    exists (
      select 1
      from public.admission_offerings as offering
      where offering.school_slug = school.school_slug
        and offering.active
    )
    and exists (
      select 1
      from public.syllabus_points as point
      where point.school_slug = school.school_slug
        and point.active
    );
  return null;
end;
$$;

revoke execute on function public.refresh_academic_school_map_flags() from public, anon, authenticated;

create trigger refresh_school_maps_after_offering_changes
after insert or update or delete on public.admission_offerings
for each statement execute function public.refresh_academic_school_map_flags();

create trigger refresh_school_maps_after_syllabus_changes
after insert or update or delete on public.syllabus_points
for each statement execute function public.refresh_academic_school_map_flags();

update public.academic_schools as school
set has_study_map =
  exists (
    select 1
    from public.admission_offerings as offering
    where offering.school_slug = school.school_slug
      and offering.active
  )
  and exists (
    select 1
    from public.syllabus_points as point
    where point.school_slug = school.school_slug
      and point.active
  );

grant select on public.academic_schools to anon;
grant select, insert, update on public.academic_schools to authenticated;
revoke delete on public.academic_schools from anon, authenticated;
