-- Add explicit program and exam-scheme relationships without changing publication counts.
-- Only published 2026 rows are backfilled; existing drafts remain untouched.

alter table public.admission_offerings
  add column if not exists program_names text[] not null default '{}'::text[];
alter table public.admission_offerings
  add column if not exists exam_scheme_id text;

comment on column public.admission_offerings.program_names is
  'Structured admission program names; never derive business relationships from training_site.';
comment on column public.admission_offerings.exam_scheme_id is
  'Stable school-level identifier shared by offerings with the same public/professional subject combination.';

with program_backfill(offering_id, program_names) as (
  values
    ('hfnu-aiec-2026', array['计算机科学与技术']::text[]),
    ('hfnu-mtc-2026', array['计算机科学与技术']::text[]),
    ('aiit-2026', array['计算机科学与技术']::text[]),
    ('wenda-2026', array['计算机科学与技术']::text[]),
    ('bbc-2026', array['计算机科学与技术']::text[]),
    ('axhu-2026', array['计算机科学与技术']::text[]),
    ('slu-2026', array['计算机科学与技术']::text[]),
    ('hfue-computer-2026', array['软件工程','计算机科学与技术']::text[]),
    ('masu-computer-2026', array['计算机科学与技术','软件工程']::text[]),
    ('hnnu-network-2026', array['网络工程']::text[]),
    ('hnnu-cs-huuc-2026', array['计算机科学与技术']::text[]),
    ('hblg-cs-2026', array['计算机科学与技术']::text[]),
    ('hblg-ai-2026', array['人工智能']::text[]),
    ('hblg-data-2026', array['数据科学与大数据技术']::text[]),
    ('wjut-cs-2026', array['计算机科学与技术']::text[]),
    ('fyut-cs-2026', array['计算机科学与技术']::text[]),
    ('ahjzu-cs-2026', array['计算机科学与技术']::text[]),
    ('hfuu-cs-2026', array['计算机科学与技术']::text[]),
    ('tlu-digital-media-2026', array['数字媒体技术']::text[]),
    ('ahut-cs-2026', array['计算机科学与技术']::text[]),
    ('ahut-iot-2026', array['物联网工程']::text[]),
    ('auta-network-engineering-2026', array['网络工程技术']::text[]),
    ('uwh-cs-2026', array['计算机科学与技术']::text[]),
    ('wxc-network-2026', array['网络工程']::text[]),
    ('ahnu-software-2026', array['软件工程']::text[]),
    ('ahstu-cs-2026', array['计算机科学与技术']::text[]),
    ('czu-network-2026', array['网络工程']::text[]),
    ('aufe-cs-acvtc-2026', array['计算机科学与技术']::text[]),
    ('aufe-intelligent-acvtc-2026', array['智能科学与技术']::text[]),
    ('aufe-cs-audit-2026', array['计算机科学与技术']::text[]),
    ('fynu-software-2026', array['软件工程']::text[])
)
update public.admission_offerings offering
set program_names = backfill.program_names,
    exam_scheme_id = offering.school_slug || '-' || substr(md5(concat_ws('|',
      offering.school_slug,
      array_to_string(offering.public_subjects, '|'),
      array_to_string(offering.professional_subjects, '|')
    )), 1, 12)
from program_backfill backfill
where offering.offering_id = backfill.offering_id
  and offering.status = 'published';

do $$
begin
  if exists (
    select 1 from public.admission_offerings
    where status = 'published'
      and (cardinality(program_names) = 0 or nullif(btrim(exam_scheme_id), '') is null)
  ) then
    raise exception 'Every published offering must have program_names and exam_scheme_id';
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'admission_offerings_published_program_names'
      and conrelid = 'public.admission_offerings'::regclass
  ) then
    alter table public.admission_offerings
      add constraint admission_offerings_published_program_names
      check (status <> 'published' or cardinality(program_names) > 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'admission_offerings_published_exam_scheme'
      and conrelid = 'public.admission_offerings'::regclass
  ) then
    alter table public.admission_offerings
      add constraint admission_offerings_published_exam_scheme
      check (status <> 'published' or nullif(btrim(exam_scheme_id), '') is not null);
  end if;
end $$;

create index if not exists admission_offerings_published_school_scheme_idx
  on public.admission_offerings (year desc, province_slug, school_slug, exam_scheme_id)
  where status = 'published';

create or replace function public.copy_academic_year(
  p_source_year integer,
  p_target_year integer,
  p_province_slug text default 'anhui',
  p_major_slug text default 'computer-science'
)
returns jsonb
language plpgsql
security invoker
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
    offering_id, year, province_slug, major_slug, school_slug, program_names, exam_scheme_id,
    training_site, eligible_major_categories, public_subjects, professional_subjects, plan_count,
    charter_url, syllabus_url, source_status, verified_at, active, status, sort_order
  )
  select case when source.offering_id ~ ('-' || p_source_year || '$')
      then regexp_replace(source.offering_id, '-' || p_source_year || '$', '-' || p_target_year)
      else source.offering_id || '-' || p_target_year end,
    p_target_year, p_province_slug, p_major_slug, source.school_slug, source.program_names, source.exam_scheme_id,
    source.training_site, source.eligible_major_categories, source.public_subjects, source.professional_subjects, source.plan_count,
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

revoke all on function public.copy_academic_year(integer, integer, text, text) from public, anon;
grant execute on function public.copy_academic_year(integer, integer, text, text) to authenticated;
