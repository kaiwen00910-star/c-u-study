drop policy "public can read active resources" on public.resources;
drop policy "admins can read all resources" on public.resources;

create policy "anonymous users can read active resources"
on public.resources for select
to anon
using (status = 'active');

create policy "authenticated users read permitted resources"
on public.resources for select
to authenticated
using (
  status = 'active'
  or exists (
    select 1 from public.admin_users
    where admin_users.user_id = (select auth.uid())
  )
);

drop policy "public can read current announcements" on public.announcements;
drop policy "admins can read all announcements" on public.announcements;

create policy "anonymous users can read current announcements"
on public.announcements for select
to anon
using (
  enabled
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at > now())
);

create policy "authenticated users read permitted announcements"
on public.announcements for select
to authenticated
using (
  (
    enabled
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at > now())
  )
  or exists (
    select 1 from public.admin_users
    where admin_users.user_id = (select auth.uid())
  )
);
