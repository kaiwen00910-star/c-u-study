create index admission_offerings_school_slug_idx on public.admission_offerings (school_slug);

drop policy "public can read active academic schools" on public.academic_schools;
drop policy "admins can read all academic schools" on public.academic_schools;
create policy "anonymous can read active academic schools" on public.academic_schools
for select to anon using (active);
create policy "authenticated can read academic schools" on public.academic_schools
for select to authenticated using (
  active or exists (select 1 from public.admin_users where admin_users.user_id = (select auth.uid()))
);

drop policy "public can read active admission offerings" on public.admission_offerings;
drop policy "admins can read all admission offerings" on public.admission_offerings;
create policy "anonymous can read active admission offerings" on public.admission_offerings
for select to anon using (active);
create policy "authenticated can read admission offerings" on public.admission_offerings
for select to authenticated using (
  active or exists (select 1 from public.admin_users where admin_users.user_id = (select auth.uid()))
);

drop policy "public can read active syllabus points" on public.syllabus_points;
drop policy "admins can read all syllabus points" on public.syllabus_points;
create policy "anonymous can read active syllabus points" on public.syllabus_points
for select to anon using (active);
create policy "authenticated can read syllabus points" on public.syllabus_points
for select to authenticated using (
  active or exists (select 1 from public.admin_users where admin_users.user_id = (select auth.uid()))
);
