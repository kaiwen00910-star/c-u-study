-- Remove the Sanxiaokou campus from every published 2026 HFNU campus card.
-- The other HFNU training sites and all admission facts remain unchanged.

do $$
declare
  updated_rows integer;
begin
  update public.admission_offerings
  set training_site = '合肥师范学院校本部（具体校区以学校安排为准；锦绣校区：合肥市经济技术开发区莲花路1688号；滨湖校区：合肥市黄麓科教园区书香路）'
  where year = 2026
    and school_slug = 'hfnu'
    and status = 'published'
    and active = true
    and training_site = '合肥师范学院校本部（具体校区以学校安排为准；锦绣校区：合肥市经济技术开发区莲花路1688号；滨湖校区：合肥市黄麓科教园区书香路；三孝口校区：合肥市金寨路327号）';

  get diagnostics updated_rows = row_count;

  if updated_rows <> 19 then
    raise exception 'Expected to update 19 HFNU campus cards, updated %', updated_rows;
  end if;

  if exists (
    select 1
    from public.admission_offerings
    where school_slug = 'hfnu'
      and training_site like '%三孝口%'
  ) then
    raise exception 'A HFNU training site still contains the Sanxiaokou campus';
  end if;

  if (select count(*) from public.academic_schools where active = true) <> 42
     or (select count(*) from public.admission_offerings where status = 'published' and active = true) <> 465
     or (select count(*) from public.syllabus_points where status = 'published' and active = true) <> 1033
     or (select count(*) from public.resources where status = 'published') <> 80
     or (
       (select count(*) from public.syllabus_points where status = 'draft' and active = false)
       + (select count(*) from public.admission_offerings where status = 'draft' and active = false)
     ) <> 37
     or (
       select count(*)
       from public.offering_scores
       where status = 'published'
         and candidate_category = 'ordinary'
         and score_type = 'actual_admission_minimum'
     ) <> 287 then
    raise exception 'Frozen public-content counts changed while removing the HFNU campus address';
  end if;
end
$$;
