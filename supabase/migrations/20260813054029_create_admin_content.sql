create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  created_at timestamptz not null default now(),
  constraint admin_users_email_lowercase check (email = lower(email))
);

create table public.resources (
  resource_id text primary key,
  topic_tags text[] not null,
  title text not null,
  platform text not null,
  creator text not null,
  url text not null,
  resource_type text not null,
  difficulty text not null,
  duration_text text not null,
  recommendation_reason text not null,
  priority integer not null default 1,
  verified_at date not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint resources_topic_tags_not_empty check (cardinality(topic_tags) > 0),
  constraint resources_priority_positive check (priority > 0),
  constraint resources_status_valid check (status in ('active', 'inactive')),
  constraint resources_https_url check (url ~ '^https://')
);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  enabled boolean not null default false,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint announcements_time_order check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger resources_set_updated_at
before update on public.resources
for each row execute function public.set_updated_at();

create trigger announcements_set_updated_at
before update on public.announcements
for each row execute function public.set_updated_at();

alter table public.admin_users enable row level security;
alter table public.resources enable row level security;
alter table public.announcements enable row level security;

create policy "admin can read own membership"
on public.admin_users for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "public can read active resources"
on public.resources for select
to anon, authenticated
using (status = 'active');

create policy "admins can read all resources"
on public.resources for select
to authenticated
using (exists (
  select 1 from public.admin_users
  where admin_users.user_id = (select auth.uid())
));

create policy "admins can insert resources"
on public.resources for insert
to authenticated
with check (exists (
  select 1 from public.admin_users
  where admin_users.user_id = (select auth.uid())
));

create policy "admins can update resources"
on public.resources for update
to authenticated
using (exists (
  select 1 from public.admin_users
  where admin_users.user_id = (select auth.uid())
))
with check (exists (
  select 1 from public.admin_users
  where admin_users.user_id = (select auth.uid())
));

create policy "public can read current announcements"
on public.announcements for select
to anon, authenticated
using (
  enabled
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at > now())
);

create policy "admins can read all announcements"
on public.announcements for select
to authenticated
using (exists (
  select 1 from public.admin_users
  where admin_users.user_id = (select auth.uid())
));

create policy "admins can insert announcements"
on public.announcements for insert
to authenticated
with check (exists (
  select 1 from public.admin_users
  where admin_users.user_id = (select auth.uid())
));

create policy "admins can update announcements"
on public.announcements for update
to authenticated
using (exists (
  select 1 from public.admin_users
  where admin_users.user_id = (select auth.uid())
))
with check (exists (
  select 1 from public.admin_users
  where admin_users.user_id = (select auth.uid())
));

grant select on public.resources, public.announcements to anon;
grant select, insert, update on public.resources, public.announcements to authenticated;
grant select on public.admin_users to authenticated;
revoke insert, update, delete on public.admin_users from anon, authenticated;
revoke delete on public.resources, public.announcements from anon, authenticated;
