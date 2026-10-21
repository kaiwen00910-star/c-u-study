-- Keep runtime content freshness and generated static snapshots in sync whenever
-- a verified score row is inserted, corrected, published, or archived.

create trigger offering_scores_bump_content_version
after insert or update or delete on public.offering_scores
for each statement execute function public.bump_public_content_version();
