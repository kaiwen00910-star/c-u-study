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
      or (p_filter = 'stale'
        and resource.status <> 'archived'
        and (resource.verified_at is null or resource.verified_at < current_date - 90))
      or (p_filter = 'duplicate-url'
        and resource.status <> 'archived'
        and exists (
          select 1 from public.resources duplicate
          where duplicate.status <> 'archived'
            and duplicate.url = resource.url
            and duplicate.resource_id <> resource.resource_id
        ))
      or (p_filter = 'invalid-topic'
        and resource.status <> 'archived'
        and exists (
          select 1 from unnest(resource.topic_tags) tag
          where not exists (
            select 1 from public.syllabus_points point
            where point.status <> 'archived' and point.canonical_topic = tag
          )
        ))
    )
  order by resource.updated_at desc, resource.resource_id;
end;
$$;

revoke all on function public.admin_resources_page(text, text, text, text) from public, anon, authenticated;
grant execute on function public.admin_resources_page(text, text, text, text) to authenticated;
