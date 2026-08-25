-- These RPCs can operate through the existing admin-only RLS policies.
-- SECURITY INVOKER keeps the explicit auth.uid()/admin_users checks while avoiding bypassrls.
alter function public.preview_academic_year_copy(integer, integer, text, text) security invoker;
alter function public.copy_academic_year(integer, integer, text, text) security invoker;
alter function public.admin_data_health() security invoker;

revoke all on function public.preview_academic_year_copy(integer, integer, text, text) from public, anon;
revoke all on function public.copy_academic_year(integer, integer, text, text) from public, anon;
revoke all on function public.admin_data_health() from public, anon;
grant execute on function public.preview_academic_year_copy(integer, integer, text, text) to authenticated;
grant execute on function public.copy_academic_year(integer, integer, text, text) to authenticated;
grant execute on function public.admin_data_health() to authenticated;
