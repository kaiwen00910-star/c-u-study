create table public.school_logos (
  school_id text primary key,
  logo_url text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint school_logos_id_format check (school_id ~ '^anhui-school-[0-9]{2}$'),
  constraint school_logos_https_url check (logo_url ~ '^https://')
);

create trigger school_logos_set_updated_at
before update on public.school_logos
for each row execute function public.set_updated_at();

alter table public.school_logos enable row level security;

create policy "everyone can read school logos"
on public.school_logos for select
to anon, authenticated
using (true);

create policy "admins can insert school logos"
on public.school_logos for insert
to authenticated
with check (exists (
  select 1 from public.admin_users
  where admin_users.user_id = (select auth.uid())
));

create policy "admins can update school logos"
on public.school_logos for update
to authenticated
using (exists (
  select 1 from public.admin_users
  where admin_users.user_id = (select auth.uid())
))
with check (exists (
  select 1 from public.admin_users
  where admin_users.user_id = (select auth.uid())
));

grant select on public.school_logos to anon;
grant select, insert, update on public.school_logos to authenticated;
revoke delete on public.school_logos from anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'school-logos',
  'school-logos',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "admins can upload school logos"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'school-logos'
  and exists (
    select 1 from public.admin_users
    where admin_users.user_id = (select auth.uid())
  )
);
