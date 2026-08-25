-- Draft / preview / publish workflow and transactional academic-year maintenance.
-- Existing public rows are preserved as published; every new row defaults to draft.

alter table public.resources drop constraint if exists resources_status_valid;
update public.resources set status = case status when 'active' then 'published' else 'archived' end
where status in ('active', 'inactive');
alter table public.resources alter column status set default 'draft';
alter table public.resources add constraint resources_status_valid
  check (status in ('draft', 'published', 'archived'));

alter table public.admission_offerings add column if not exists status text;
update public.admission_offerings set status = case when active then 'published' else 'archived' end where status is null;
alter table public.admission_offerings alter column status set default 'draft';
alter table public.admission_offerings alter column status set not null;
alter table public.admission_offerings add constraint admission_offerings_status_valid
  check (status in ('draft', 'published', 'archived'));
alter table public.admission_offerings alter column active set default false;
alter table public.admission_offerings alter column charter_url drop not null;
alter table public.admission_offerings alter column syllabus_url drop not null;
alter table public.admission_offerings alter column verified_at drop not null;
alter table public.admission_offerings drop constraint if exists admission_offerings_urls_https;
alter table public.admission_offerings add constraint admission_offerings_published_complete check (
  status <> 'published' or (
    charter_url ~ '^https://' and syllabus_url ~ '^https://' and verified_at is not null
    and btrim(source_status) <> '' and source_status <> '等待新年度官方文件核验'
  )
);

alter table public.syllabus_points add column if not exists status text;
update public.syllabus_points set status = case when active then 'published' else 'archived' end where status is null;
alter table public.syllabus_points alter column status set default 'draft';
alter table public.syllabus_points alter column status set not null;
alter table public.syllabus_points add constraint syllabus_points_status_valid
  check (status in ('draft', 'published', 'archived'));
alter table public.syllabus_points alter column active set default false;

create or replace function public.sync_academic_publication_status()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.active := new.status = 'published';
  if tg_table_name = 'syllabus_points' and new.status = 'published' and not exists (
    select 1 from public.admission_offerings o
    where o.year = new.year
      and o.province_slug = new.province_slug
      and o.major_slug = new.major_slug
      and o.status = 'published'
      and (new.school_slug = 'common' or o.school_slug = new.school_slug)
  ) then
    raise exception '考纲发布前必须存在同范围的已发布招生计划';
  end if;
  return new;
end;
$$;

drop trigger if exists admission_offerings_sync_publication on public.admission_offerings;
create trigger admission_offerings_sync_publication
before insert or update of status on public.admission_offerings
for each row execute function public.sync_academic_publication_status();

drop trigger if exists syllabus_points_sync_publication on public.syllabus_points;
create trigger syllabus_points_sync_publication
before insert or update of status on public.syllabus_points
for each row execute function public.sync_academic_publication_status();

drop policy if exists "anonymous users can read active resources" on public.resources;
drop policy if exists "authenticated users read permitted resources" on public.resources;
create policy "anonymous users can read published resources" on public.resources
for select to anon using (status = 'published');
create policy "authenticated users read permitted resources" on public.resources
for select to authenticated using (
  status = 'published' or exists (
    select 1 from public.admin_users where admin_users.user_id = (select auth.uid())
  )
);

drop policy if exists "anonymous can read active admission offerings" on public.admission_offerings;
drop policy if exists "authenticated can read admission offerings" on public.admission_offerings;
create policy "anonymous can read published admission offerings" on public.admission_offerings
for select to anon using (status = 'published');
create policy "authenticated can read admission offerings" on public.admission_offerings
for select to authenticated using (
  status = 'published' or exists (
    select 1 from public.admin_users where admin_users.user_id = (select auth.uid())
  )
);

drop policy if exists "anonymous can read active syllabus points" on public.syllabus_points;
drop policy if exists "authenticated can read syllabus points" on public.syllabus_points;
create policy "anonymous can read published syllabus points" on public.syllabus_points
for select to anon using (status = 'published');
create policy "authenticated can read syllabus points" on public.syllabus_points
for select to authenticated using (
  status = 'published' or exists (
    select 1 from public.admin_users where admin_users.user_id = (select auth.uid())
  )
);

create index if not exists resources_status_priority_idx on public.resources (status, priority, title);
create index if not exists admission_offerings_published_scope_idx
  on public.admission_offerings (year desc, province_slug, major_slug, school_slug)
  where status = 'published';
create index if not exists syllabus_points_published_scope_idx
  on public.syllabus_points (year desc, province_slug, major_slug, school_slug, subject_slug)
  where status = 'published';

create or replace function public.preview_academic_year_copy(
  p_source_year integer,
  p_target_year integer,
  p_province_slug text default 'anhui',
  p_major_slug text default 'computer-science'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare result jsonb;
begin
  if (select auth.uid()) is null or not exists (
    select 1 from public.admin_users where user_id = (select auth.uid())
  ) then raise exception '仅管理员可以预检年度复制'; end if;
  if p_target_year <> p_source_year + 1 then raise exception '目标年份必须是源年份的下一年'; end if;

  with source_offerings as (
    select o.*,
      case when o.offering_id ~ ('-' || p_source_year || '$')
        then regexp_replace(o.offering_id, '-' || p_source_year || '$', '-' || p_target_year)
        else o.offering_id || '-' || p_target_year end as target_id
    from public.admission_offerings o
    where o.year = p_source_year and o.province_slug = p_province_slug and o.major_slug = p_major_slug
  ), offering_counts as (
    select
      count(*) filter (where existing_scope.offering_id is null and existing_id.offering_id is null) as add_count,
      count(*) filter (where existing_scope.offering_id is not null) as skip_count,
      count(*) filter (where existing_scope.offering_id is null and existing_id.offering_id is not null) as conflict_count
    from source_offerings source
    left join public.admission_offerings existing_scope on existing_scope.year = p_target_year
      and existing_scope.province_slug = p_province_slug and existing_scope.major_slug = p_major_slug
      and existing_scope.school_slug = source.school_slug and existing_scope.training_site = source.training_site
    left join public.admission_offerings existing_id on existing_id.offering_id = source.target_id
  ), point_counts as (
    select
      count(*) filter (where target.point_id is null) as add_count,
      count(*) filter (where target.point_id is not null) as skip_count,
      0::bigint as conflict_count
    from public.syllabus_points source
    left join public.syllabus_points target on target.year = p_target_year
      and target.province_slug = p_province_slug and target.major_slug = p_major_slug
      and target.point_id = source.point_id
    where source.year = p_source_year and source.province_slug = p_province_slug and source.major_slug = p_major_slug
  )
  select jsonb_build_object(
    'sourceYear', p_source_year, 'targetYear', p_target_year,
    'offerings', jsonb_build_object('add', o.add_count, 'skip', o.skip_count, 'conflict', o.conflict_count),
    'syllabus', jsonb_build_object('add', p.add_count, 'skip', p.skip_count, 'conflict', p.conflict_count)
  ) into result from offering_counts o cross join point_counts p;
  return result;
end;
$$;

create or replace function public.copy_academic_year(
  p_source_year integer,
  p_target_year integer,
  p_province_slug text default 'anhui',
  p_major_slug text default 'computer-science'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare offering_inserted integer := 0; point_inserted integer := 0; preview jsonb;
begin
  if (select auth.uid()) is null or not exists (
    select 1 from public.admin_users where user_id = (select auth.uid())
  ) then raise exception '仅管理员可以执行年度复制'; end if;
  if p_target_year <> p_source_year + 1 then raise exception '目标年份必须是源年份的下一年'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_province_slug || ':' || p_major_slug || ':' || p_target_year, 0));
  preview := public.preview_academic_year_copy(p_source_year, p_target_year, p_province_slug, p_major_slug);
  if ((preview->'offerings'->>'conflict')::integer + (preview->'syllabus'->>'conflict')::integer) > 0 then
    raise exception '目标范围存在冲突，请先处理后再复制';
  end if;

  insert into public.admission_offerings (
    offering_id, year, province_slug, major_slug, school_slug, training_site,
    eligible_major_categories, public_subjects, professional_subjects, plan_count,
    charter_url, syllabus_url, source_status, verified_at, active, status, sort_order
  )
  select case when source.offering_id ~ ('-' || p_source_year || '$')
      then regexp_replace(source.offering_id, '-' || p_source_year || '$', '-' || p_target_year)
      else source.offering_id || '-' || p_target_year end,
    p_target_year, p_province_slug, p_major_slug, source.school_slug, source.training_site,
    source.eligible_major_categories, source.public_subjects, source.professional_subjects, source.plan_count,
    null, null, '等待新年度官方文件核验', null, false, 'draft', source.sort_order
  from public.admission_offerings source
  where source.year = p_source_year and source.province_slug = p_province_slug and source.major_slug = p_major_slug
    and not exists (
      select 1 from public.admission_offerings target
      where target.year = p_target_year and target.province_slug = p_province_slug
        and target.major_slug = p_major_slug and target.school_slug = source.school_slug
        and target.training_site = source.training_site
    )
  on conflict do nothing;
  get diagnostics offering_inserted = row_count;

  insert into public.syllabus_points (
    point_id, year, province_slug, major_slug, school_slug, subject_slug, subject_name,
    section_order, section_name, point_order, point_title, canonical_topic, active, status
  )
  select source.point_id, p_target_year, p_province_slug, p_major_slug, source.school_slug,
    source.subject_slug, source.subject_name, source.section_order, source.section_name,
    source.point_order, source.point_title, source.canonical_topic, false, 'draft'
  from public.syllabus_points source
  where source.year = p_source_year and source.province_slug = p_province_slug and source.major_slug = p_major_slug
  on conflict do nothing;
  get diagnostics point_inserted = row_count;

  return preview || jsonb_build_object('inserted', jsonb_build_object('offerings', offering_inserted, 'syllabus', point_inserted));
end;
$$;

create or replace function public.admin_data_health()
returns jsonb
language plpgsql
security definer
stable
set search_path = ''
as $$
declare result jsonb;
begin
  if (select auth.uid()) is null or not exists (
    select 1 from public.admin_users where user_id = (select auth.uid())
  ) then raise exception '仅管理员可以查看数据体检'; end if;
  select jsonb_build_object(
    'issues', jsonb_build_array(
      jsonb_build_object('key','missing-charter','label','缺少招生章程链接的计划','count',(select count(*) from public.admission_offerings where coalesce(charter_url,'') !~ '^https://'),'href','/admin/offerings?filter=missing-charter'),
      jsonb_build_object('key','missing-syllabus','label','缺少考纲链接的计划','count',(select count(*) from public.admission_offerings where coalesce(syllabus_url,'') !~ '^https://'),'href','/admin/offerings?filter=missing-syllabus'),
      jsonb_build_object('key','stale','label','超过 90 天未核验的记录','count',((select count(*) from public.admission_offerings where verified_at is null or verified_at < current_date - 90) + (select count(*) from public.resources where verified_at < current_date - 90)),'href','/admin/overview?filter=stale'),
      jsonb_build_object('key','no-resource','label','没有学习资源的知识点','count',(select count(*) from public.syllabus_points p where p.status <> 'archived' and not exists (select 1 from public.resources r where r.status <> 'archived' and r.topic_tags @> array[p.canonical_topic])),'href','/admin/syllabus?filter=no-resource'),
      jsonb_build_object('key','duplicate-url','label','重复资源链接','count',(select coalesce(sum(c - 1),0) from (select count(*) c from public.resources group by url having count(*) > 1) d),'href','/admin/resources?filter=duplicate-url'),
      jsonb_build_object('key','invalid-topic','label','无效 canonical_topic','count',(select count(*) from public.resources r cross join unnest(r.topic_tags) tag where not exists (select 1 from public.syllabus_points p where p.canonical_topic = tag)),'href','/admin/resources?filter=invalid-topic'),
      jsonb_build_object('key','offering-no-syllabus','label','有招生计划但没有考纲的院校','count',(select count(distinct o.school_slug) from public.admission_offerings o where o.status <> 'archived' and not exists (select 1 from public.syllabus_points p where p.year=o.year and p.province_slug=o.province_slug and p.major_slug=o.major_slug and p.school_slug=o.school_slug and p.status <> 'archived')),'href','/admin/offerings?filter=no-syllabus'),
      jsonb_build_object('key','syllabus-no-offering','label','有考纲但没有有效招生计划的院校','count',(select count(distinct p.school_slug) from public.syllabus_points p where p.school_slug <> 'common' and p.status <> 'archived' and not exists (select 1 from public.admission_offerings o where o.year=p.year and o.province_slug=p.province_slug and o.major_slug=p.major_slug and o.school_slug=p.school_slug and o.status <> 'archived')),'href','/admin/syllabus?filter=no-offering')
    ),
    'statuses', (select jsonb_object_agg(status, total) from (
      select status, count(*) total from (
        select status from public.resources union all select status from public.admission_offerings union all select status from public.syllabus_points
      ) rows group by status
    ) counts)
  ) into result;
  return result;
end;
$$;

revoke all on function public.preview_academic_year_copy(integer, integer, text, text) from public, anon;
revoke all on function public.copy_academic_year(integer, integer, text, text) from public, anon;
revoke all on function public.admin_data_health() from public, anon;
grant execute on function public.preview_academic_year_copy(integer, integer, text, text) to authenticated;
grant execute on function public.copy_academic_year(integer, integer, text, text) to authenticated;
grant execute on function public.admin_data_health() to authenticated;
revoke execute on function public.sync_academic_publication_status() from public, anon, authenticated;

grant select on public.resources, public.admission_offerings, public.syllabus_points to anon;
grant select, insert, update on public.resources, public.admission_offerings, public.syllabus_points to authenticated;
