-- P0/P1 data-scope, announcement-state and snapshot-version integrity.
-- This migration is additive and performs preflight checks before adding constraints.

alter table public.syllabus_points
  add column province_slug text not null default 'anhui',
  add column major_slug text not null default 'computer-science';

do $$
begin
  if exists (
    select 1
    from public.admission_offerings
    group by year, province_slug, major_slug, school_slug, lower(btrim(training_site))
    having count(*) > 1
  ) then
    raise exception 'admission_offerings contains duplicate year/province/major/school/training_site rows';
  end if;

  if exists (
    select 1
    from public.syllabus_points as point
    where point.school_slug <> 'common'
      and not exists (
        select 1 from public.academic_schools as school
        where school.school_slug = point.school_slug
      )
  ) then
    raise exception 'syllabus_points contains a non-common row that references an unknown school';
  end if;

  if exists (
    select 1
    from public.resources as resource,
      unnest(resource.topic_tags) as tag(value)
    where resource.status = 'active'
      and not exists (
        select 1 from public.syllabus_points as point
        where point.active and point.canonical_topic = tag.value
      )
  ) then
    raise exception 'resources contains an active topic tag with no active syllabus topic';
  end if;

  if exists (
    select 1
    from public.announcements as left_item
    join public.announcements as right_item on left_item.id < right_item.id
    where left_item.enabled and right_item.enabled
      and tstzrange(
        coalesce(left_item.starts_at, '-infinity'::timestamptz),
        coalesce(left_item.ends_at, 'infinity'::timestamptz), '[)'
      ) && tstzrange(
        coalesce(right_item.starts_at, '-infinity'::timestamptz),
        coalesce(right_item.ends_at, 'infinity'::timestamptz), '[)'
      )
  ) then
    raise exception 'enabled announcements currently have overlapping time ranges';
  end if;
end;
$$;

alter table public.admission_offerings
  add constraint admission_offerings_province_slug_format check (province_slug ~ '^[a-z0-9-]+$'),
  add constraint admission_offerings_major_slug_format check (major_slug ~ '^[a-z0-9-]+$');

create unique index admission_offerings_scope_school_site_unique
on public.admission_offerings (
  year, province_slug, major_slug, school_slug, lower(btrim(training_site))
);

alter table public.syllabus_points
  drop constraint syllabus_points_pkey,
  add constraint syllabus_points_pkey primary key (year, province_slug, major_slug, point_id),
  add constraint syllabus_points_province_slug_format check (province_slug ~ '^[a-z0-9-]+$'),
  add constraint syllabus_points_major_slug_format check (major_slug ~ '^[a-z0-9-]+$'),
  add constraint syllabus_points_scope_position_unique unique (
    year, province_slug, major_slug, school_slug, subject_slug, section_order, point_order
  );

create index admission_offerings_scope_active_idx
on public.admission_offerings (year, province_slug, major_slug, sort_order)
where active;

create index syllabus_points_scope_active_idx
on public.syllabus_points (year, province_slug, major_slug, school_slug, subject_slug, section_order, point_order)
where active;

create or replace function public.validate_syllabus_school_reference()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.school_slug <> 'common' and not exists (
    select 1 from public.academic_schools as school
    where school.school_slug = new.school_slug
  ) then
    raise foreign_key_violation using message = 'non-common syllabus point must reference an existing academic school';
  end if;
  return new;
end;
$$;

revoke execute on function public.validate_syllabus_school_reference() from public, anon, authenticated;

create trigger syllabus_points_validate_school
before insert or update of school_slug on public.syllabus_points
for each row execute function public.validate_syllabus_school_reference();

create or replace function public.validate_resource_topic_tags()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'active' and exists (
    select 1
    from unnest(new.topic_tags) as tag(value)
    where not exists (
      select 1 from public.syllabus_points as point
      where point.active and point.canonical_topic = tag.value
    )
  ) then
    raise foreign_key_violation using message = 'active resource topic_tags must reference active syllabus topics';
  end if;
  return new;
end;
$$;

revoke execute on function public.validate_resource_topic_tags() from public, anon, authenticated;

create trigger resources_validate_topic_tags
before insert or update of topic_tags, status on public.resources
for each row execute function public.validate_resource_topic_tags();

create or replace function public.protect_referenced_syllabus_topic()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  removes_last_active_topic boolean;
begin
  if tg_op = 'DELETE' then
    removes_last_active_topic := old.active;
  else
    removes_last_active_topic := old.active and (
      not new.active or new.canonical_topic <> old.canonical_topic
    );
  end if;
  if removes_last_active_topic
    and not exists (
      select 1 from public.syllabus_points as point
      where point.active
        and point.canonical_topic = old.canonical_topic
        and (point.year, point.province_slug, point.major_slug, point.point_id)
          <> (old.year, old.province_slug, old.major_slug, old.point_id)
    )
    and exists (
      select 1 from public.resources as resource
      where resource.status = 'active' and old.canonical_topic = any(resource.topic_tags)
    )
  then
    raise foreign_key_violation using message = 'cannot remove the last active syllabus topic referenced by an active resource';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

revoke execute on function public.protect_referenced_syllabus_topic() from public, anon, authenticated;

create trigger syllabus_points_protect_resource_topics
before update of canonical_topic, active or delete on public.syllabus_points
for each row execute function public.protect_referenced_syllabus_topic();

create or replace function public.prevent_overlapping_announcements()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not new.enabled then return new; end if;
  perform pg_catalog.pg_advisory_xact_lock(7320260825::bigint);
  if exists (
    select 1 from public.announcements as existing
    where existing.enabled
      and existing.id <> new.id
      and pg_catalog.tstzrange(
        coalesce(existing.starts_at, '-infinity'::timestamptz),
        coalesce(existing.ends_at, 'infinity'::timestamptz), '[)'
      ) && pg_catalog.tstzrange(
        coalesce(new.starts_at, '-infinity'::timestamptz),
        coalesce(new.ends_at, 'infinity'::timestamptz), '[)'
      )
  ) then
    raise exclusion_violation using message = 'enabled announcement time range overlaps another enabled announcement';
  end if;
  return new;
end;
$$;

revoke execute on function public.prevent_overlapping_announcements() from public, anon, authenticated;

create trigger announcements_prevent_overlap
before insert or update of enabled, starts_at, ends_at on public.announcements
for each row execute function public.prevent_overlapping_announcements();

create table public.content_versions (
  id text primary key,
  version bigint not null default 1,
  updated_at timestamptz not null default now(),
  constraint content_versions_singleton check (id = 'public-content'),
  constraint content_versions_positive check (version > 0)
);

insert into public.content_versions (id, version) values ('public-content', 1);

alter table public.content_versions enable row level security;

create policy "anonymous can read content version"
on public.content_versions for select to anon using (true);

create policy "authenticated can read content version"
on public.content_versions for select to authenticated using (true);

create policy "admins can update content version"
on public.content_versions for update to authenticated
using (exists (
  select 1 from public.admin_users
  where admin_users.user_id = (select auth.uid())
))
with check (exists (
  select 1 from public.admin_users
  where admin_users.user_id = (select auth.uid())
));

grant select on public.content_versions to anon, authenticated;
grant update on public.content_versions to authenticated;
revoke insert, delete on public.content_versions from anon, authenticated;

create or replace function public.bump_public_content_version()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.content_versions
  set version = version + 1, updated_at = now()
  where id = 'public-content';
  return null;
end;
$$;

revoke execute on function public.bump_public_content_version() from public, anon, authenticated;

create trigger academic_schools_bump_content_version after insert or update or delete on public.academic_schools
for each statement execute function public.bump_public_content_version();
create trigger admission_offerings_bump_content_version after insert or update or delete on public.admission_offerings
for each statement execute function public.bump_public_content_version();
create trigger syllabus_points_bump_content_version after insert or update or delete on public.syllabus_points
for each statement execute function public.bump_public_content_version();
create trigger resources_bump_content_version after insert or update or delete on public.resources
for each statement execute function public.bump_public_content_version();
create trigger announcements_bump_content_version after insert or update or delete on public.announcements
for each statement execute function public.bump_public_content_version();

comment on column public.syllabus_points.province_slug is '考纲适用省份；所有查询必须与 year、major_slug 同时过滤';
comment on column public.syllabus_points.major_slug is '考纲适用专业；所有查询必须与 year、province_slug 同时过滤';
comment on table public.content_versions is '公开内容单调版本号；构建时快照和运行时在线数据用此标识新旧';
