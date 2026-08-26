-- Keep public and draft health checks isolated, and expose paged admin-only
-- query functions that continue to run through the caller's RLS policies.

create index if not exists resources_status_verified_at_idx
  on public.resources (status, verified_at, updated_at desc);
create index if not exists admission_offerings_status_verified_at_idx
  on public.admission_offerings (status, verified_at, year desc);
create index if not exists syllabus_points_admin_order_idx
  on public.syllabus_points (status, year desc, school_slug, subject_slug, section_order, point_order);

create or replace function public.admin_resources_page(
  p_query text default null,
  p_platform text default null,
  p_status text default null,
  p_filter text default null
)
returns setof public.resources
language plpgsql
security invoker
stable
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not exists (
    select 1 from public.admin_users where user_id = (select auth.uid())
  ) then
    raise exception '仅管理员可以查询后台资源' using errcode = '42501';
  end if;

  return query
  select resource.*
  from public.resources resource
  where (p_query is null or concat_ws(' ', resource.title, resource.creator, resource.resource_id) ilike '%' || p_query || '%')
    and (p_platform is null or resource.platform = p_platform)
    and (p_status is null or resource.status = p_status)
    and (
      p_filter is null
      or (p_filter = 'stale' and (resource.verified_at is null or resource.verified_at < current_date - 90))
      or (p_filter = 'duplicate-url' and exists (
        select 1 from public.resources duplicate
        where duplicate.url = resource.url and duplicate.resource_id <> resource.resource_id
      ))
      or (p_filter = 'invalid-topic' and exists (
        select 1 from unnest(resource.topic_tags) tag
        where not exists (
          select 1 from public.syllabus_points point where point.canonical_topic = tag
        )
      ))
    )
  order by resource.updated_at desc, resource.resource_id;
end;
$$;

create or replace function public.admin_syllabus_page(
  p_query text default null,
  p_status text default null,
  p_filter text default null
)
returns setof public.syllabus_points
language plpgsql
security invoker
stable
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not exists (
    select 1 from public.admin_users where user_id = (select auth.uid())
  ) then
    raise exception '仅管理员可以查询后台考纲' using errcode = '42501';
  end if;

  return query
  select point.*
  from public.syllabus_points point
  where (p_query is null or concat_ws(' ', point.point_title, point.subject_name, point.canonical_topic) ilike '%' || p_query || '%')
    and (p_status is null or point.status = p_status)
    and (
      p_filter is null
      or (p_filter = 'no-resource'
        and point.status = 'published'
        and not exists (
          select 1 from public.resources resource
          where resource.status = 'published' and resource.topic_tags @> array[point.canonical_topic]
        ))
      or (p_filter = 'no-offering'
        and point.status = 'published'
        and point.school_slug <> 'common'
        and not exists (
          select 1 from public.admission_offerings offering
          where offering.year = point.year
            and offering.province_slug = point.province_slug
            and offering.major_slug = point.major_slug
            and offering.school_slug = point.school_slug
            and offering.status = 'published'
        ))
      or (p_filter = 'draft-no-resource'
        and point.status = 'draft'
        and not exists (
          select 1 from public.resources resource
          where resource.status in ('draft', 'published') and resource.topic_tags @> array[point.canonical_topic]
        ))
      or (p_filter = 'draft-no-offering'
        and point.status = 'draft'
        and point.school_slug <> 'common'
        and not exists (
          select 1 from public.admission_offerings offering
          where offering.year = point.year
            and offering.province_slug = point.province_slug
            and offering.major_slug = point.major_slug
            and offering.school_slug = point.school_slug
            and offering.status in ('draft', 'published')
        ))
    )
  order by point.year desc, point.school_slug, point.subject_slug,
    point.section_order, point.point_order, point.point_id;
end;
$$;

create or replace function public.admin_content_filter_options()
returns jsonb
language plpgsql
security invoker
stable
set search_path = ''
as $$
declare result jsonb;
begin
  if (select auth.uid()) is null or not exists (
    select 1 from public.admin_users where user_id = (select auth.uid())
  ) then
    raise exception '仅管理员可以读取后台筛选项' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'platforms', coalesce((
      select jsonb_agg(platform order by platform)
      from (select distinct platform from public.resources) values_by_platform
    ), '[]'::jsonb),
    'topics', coalesce((
      select jsonb_agg(jsonb_build_object('value', canonical_topic, 'label', label) order by canonical_topic)
      from (
        select canonical_topic, min(subject_name || ' · ' || point_title) as label
        from public.syllabus_points
        where status <> 'archived'
        group by canonical_topic
      ) values_by_topic
    ), '[]'::jsonb)
  ) into result;
  return result;
end;
$$;

create or replace function public.admin_data_health()
returns jsonb
language plpgsql
security invoker
stable
set search_path = ''
as $$
declare result jsonb;
begin
  if (select auth.uid()) is null or not exists (
    select 1 from public.admin_users where user_id = (select auth.uid())
  ) then
    raise exception '仅管理员可以查看数据体检' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'issues', jsonb_build_array(
      jsonb_build_object('key','missing-charter','label','缺少招生章程链接的计划','count',(select count(*) from public.admission_offerings where status <> 'archived' and coalesce(charter_url,'') !~ '^https://'),'href','/admin/offerings?filter=missing-charter'),
      jsonb_build_object('key','missing-syllabus','label','缺少考纲链接的计划','count',(select count(*) from public.admission_offerings where status <> 'archived' and coalesce(syllabus_url,'') !~ '^https://'),'href','/admin/offerings?filter=missing-syllabus'),
      jsonb_build_object('key','stale-offerings','label','待复核招生计划','count',(select count(*) from public.admission_offerings where status <> 'archived' and (verified_at is null or verified_at < current_date - 90)),'href','/admin/offerings?filter=stale'),
      jsonb_build_object('key','stale-resources','label','待复核学习资源','count',(select count(*) from public.resources where status <> 'archived' and (verified_at is null or verified_at < current_date - 90)),'href','/admin/resources?filter=stale'),
      jsonb_build_object('key','duplicate-url','label','重复资源链接','count',(select coalesce(sum(c - 1),0) from (select count(*) c from public.resources where status <> 'archived' group by url having count(*) > 1) duplicates),'href','/admin/resources?filter=duplicate-url'),
      jsonb_build_object('key','invalid-topic','label','无效 canonical_topic','count',(select count(*) from public.resources resource cross join unnest(resource.topic_tags) tag where resource.status <> 'archived' and not exists (select 1 from public.syllabus_points point where point.status <> 'archived' and point.canonical_topic = tag)),'href','/admin/resources?filter=invalid-topic')
    ),
    'publishedIssues', jsonb_build_array(
      jsonb_build_object('key','no-resource','label','已发布知识点没有已发布学习资源','count',(select count(*) from public.syllabus_points point where point.status = 'published' and not exists (select 1 from public.resources resource where resource.status = 'published' and resource.topic_tags @> array[point.canonical_topic])),'href','/admin/syllabus?filter=no-resource'),
      jsonb_build_object('key','offering-no-syllabus','label','已发布招生计划没有已发布考纲','count',(select count(distinct (offering.year, offering.province_slug, offering.major_slug, offering.school_slug)) from public.admission_offerings offering where offering.status = 'published' and not exists (select 1 from public.syllabus_points point where point.year=offering.year and point.province_slug=offering.province_slug and point.major_slug=offering.major_slug and point.school_slug=offering.school_slug and point.status = 'published')),'href','/admin/offerings?filter=no-syllabus'),
      jsonb_build_object('key','syllabus-no-offering','label','已发布考纲没有已发布招生计划','count',(select count(distinct (point.year, point.province_slug, point.major_slug, point.school_slug)) from public.syllabus_points point where point.school_slug <> 'common' and point.status = 'published' and not exists (select 1 from public.admission_offerings offering where offering.year=point.year and offering.province_slug=point.province_slug and offering.major_slug=point.major_slug and offering.school_slug=point.school_slug and offering.status = 'published')),'href','/admin/syllabus?filter=no-offering')
    ),
    'draftIssues', jsonb_build_array(
      jsonb_build_object('key','draft-no-resource','label','草稿知识点没有可用资源','count',(select count(*) from public.syllabus_points point where point.status = 'draft' and not exists (select 1 from public.resources resource where resource.status in ('draft','published') and resource.topic_tags @> array[point.canonical_topic])),'href','/admin/syllabus?filter=draft-no-resource'),
      jsonb_build_object('key','draft-offering-no-syllabus','label','草稿招生计划没有可用考纲','count',(select count(distinct (offering.year, offering.province_slug, offering.major_slug, offering.school_slug)) from public.admission_offerings offering where offering.status = 'draft' and not exists (select 1 from public.syllabus_points point where point.year=offering.year and point.province_slug=offering.province_slug and point.major_slug=offering.major_slug and point.school_slug=offering.school_slug and point.status in ('draft','published'))),'href','/admin/offerings?filter=draft-no-syllabus'),
      jsonb_build_object('key','draft-syllabus-no-offering','label','草稿考纲没有可用招生计划','count',(select count(distinct (point.year, point.province_slug, point.major_slug, point.school_slug)) from public.syllabus_points point where point.school_slug <> 'common' and point.status = 'draft' and not exists (select 1 from public.admission_offerings offering where offering.year=point.year and offering.province_slug=point.province_slug and offering.major_slug=point.major_slug and offering.school_slug=point.school_slug and offering.status in ('draft','published'))),'href','/admin/syllabus?filter=draft-no-offering')
    ),
    'statuses', (select jsonb_object_agg(status, total) from (
      select status, count(*) total from (
        select status from public.resources
        union all select status from public.admission_offerings
        union all select status from public.syllabus_points
      ) rows group by status
    ) counts)
  ) into result;
  return result;
end;
$$;

revoke all on function public.admin_resources_page(text, text, text, text) from public, anon, authenticated;
revoke all on function public.admin_syllabus_page(text, text, text) from public, anon, authenticated;
revoke all on function public.admin_content_filter_options() from public, anon, authenticated;
revoke all on function public.admin_data_health() from public, anon, authenticated;

grant execute on function public.admin_resources_page(text, text, text, text) to authenticated;
grant execute on function public.admin_syllabus_page(text, text, text) to authenticated;
grant execute on function public.admin_content_filter_options() to authenticated;
grant execute on function public.admin_data_health() to authenticated;
