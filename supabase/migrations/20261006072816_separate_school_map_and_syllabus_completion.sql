-- Separate the school/program map publication flag from syllabus/resource completion.
-- A school map is open when it has at least one active published admission offering.

create or replace function public.refresh_academic_school_map_flags()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.academic_schools as school
  set has_study_map = exists (
    select 1
    from public.admission_offerings as offering
    where offering.school_slug = school.school_slug
      and offering.active
      and offering.status = 'published'
  );
  return null;
end;
$$;

revoke execute on function public.refresh_academic_school_map_flags() from public, anon, authenticated;

do $$
begin
  if (select count(*) from public.admission_offerings where status = 'published') <> 174
     or (select count(*) from public.syllabus_points where status = 'published') <> 1033
     or (select count(*) from public.resources where status = 'published') <> 80
     or (select count(*) from public.admission_offerings where year = 2027 and status = 'draft' and active = false) <> 4
     or (select count(*) from public.syllabus_points where status = 'draft' and active = false) <> 33 then
    raise exception 'Batch twelve map-flag update stopped: production baseline changed';
  end if;
end $$;

update public.academic_schools as school
set has_study_map = exists (
  select 1
  from public.admission_offerings as offering
  where offering.school_slug = school.school_slug
    and offering.active
    and offering.status = 'published'
);

do $$
begin
  if (select count(*) from public.academic_schools where active and has_study_map) <> 41
     or not exists (select 1 from public.academic_schools where school_slug = 'cuhf' and has_study_map)
     or not exists (select 1 from public.academic_schools where school_slug = 'bctb' and has_study_map)
     or not exists (select 1 from public.academic_schools where school_slug = 'whit' and has_study_map)
     or not exists (select 1 from public.academic_schools where wall_school_id = 'anhui-school-40' and school_slug = 'anhui-school-40' and has_study_map = false) then
    raise exception 'Batch twelve map-flag update stopped: school map flags are incorrect';
  end if;
  if (select version from public.content_versions where id = 'public-content') <= 110 then
    raise exception 'Batch twelve map-flag update stopped: public content version was not advanced';
  end if;
end $$;

