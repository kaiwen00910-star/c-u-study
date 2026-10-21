-- Store only officially verified 2026 ordinary-candidate actual admission minimum scores.
-- Scores are independent from the frozen admission-offering facts and attach to a
-- specific offering plus the individual program named in the official notice.

create table public.offering_scores (
  score_id bigint generated always as identity primary key,
  offering_id text not null references public.admission_offerings(offering_id) on delete restrict,
  program_name text not null check (char_length(btrim(program_name)) > 0),
  candidate_category text not null default 'ordinary' check (candidate_category = 'ordinary'),
  score_type text not null default 'actual_admission_minimum' check (score_type = 'actual_admission_minimum'),
  score numeric(7, 2) not null check (score >= 0 and score <= 1000),
  source_url text not null check (source_url ~ '^https://'),
  source_published_at date not null,
  verification_note text not null check (char_length(btrim(verification_note)) >= 10),
  verified_at date not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (offering_id, program_name, candidate_category, score_type)
);

comment on table public.offering_scores is
  'Officially verified actual admission minimum scores. Never store provincial public-course cutoffs here.';

create trigger offering_scores_set_updated_at
before update on public.offering_scores
for each row execute function public.set_updated_at();

create index offering_scores_published_offering_idx
  on public.offering_scores (offering_id, program_name)
  where status = 'published';

alter table public.offering_scores enable row level security;

create policy "anonymous can read published offering scores"
on public.offering_scores for select to anon
using (status = 'published');

create policy "authenticated can read offering scores"
on public.offering_scores for select to authenticated
using (status = 'published' or exists (
  select 1 from public.admin_users where admin_users.user_id = (select auth.uid())
));

create policy "admins can insert offering scores"
on public.offering_scores for insert to authenticated
with check (exists (
  select 1 from public.admin_users where admin_users.user_id = (select auth.uid())
));

create policy "admins can update offering scores"
on public.offering_scores for update to authenticated
using (exists (
  select 1 from public.admin_users where admin_users.user_id = (select auth.uid())
))
with check (exists (
  select 1 from public.admin_users where admin_users.user_id = (select auth.uid())
));

grant select on public.offering_scores to anon;
grant select, insert, update on public.offering_scores to authenticated;
revoke delete on public.offering_scores from anon, authenticated;
