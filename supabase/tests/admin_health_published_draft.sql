begin;

do $$
declare
  admin_id uuid;
  school text;
  baseline bigint;
  after_point bigint;
  after_draft bigint;
  after_publish bigint;
begin
  select user_id into admin_id from public.admin_users order by created_at limit 1;
  if admin_id is null then raise exception 'database test requires one existing admin'; end if;
  perform set_config('request.jwt.claim.sub', admin_id::text, true);

  if has_function_privilege('anon', 'public.admin_data_health()', 'execute') then
    raise exception 'anon must not execute admin_data_health';
  end if;
  if not has_function_privilege('authenticated', 'public.admin_data_health()', 'execute') then
    raise exception 'authenticated role must be able to reach the explicit admin check';
  end if;

  perform set_config('request.jwt.claim.sub', gen_random_uuid()::text, true);
  begin
    perform public.admin_data_health();
    raise exception 'non-admin authenticated identity was not rejected';
  exception when insufficient_privilege then
    null;
  end;
  perform set_config('request.jwt.claim.sub', admin_id::text, true);

  select (issue->>'count')::bigint into baseline
  from jsonb_array_elements(public.admin_data_health()->'publishedIssues') issue
  where issue->>'key' = 'no-resource';

  select school_slug into school from public.academic_schools order by school_slug limit 1;
  insert into public.admission_offerings (
    offering_id, year, province_slug, major_slug, school_slug, training_site,
    eligible_major_categories, public_subjects, professional_subjects, plan_count,
    charter_url, syllabus_url, source_status, verified_at, active, status, sort_order
  ) values (
    'health-test-offering', 2099, 'anhui', 'health-test', school, '数据库体检测试',
    '测试', array['英语'], array['测试科目'], 1,
    'https://example.com/charter', 'https://example.com/syllabus', '正式章程', current_date,
    true, 'published', 999
  );
  insert into public.syllabus_points (
    point_id, year, province_slug, major_slug, school_slug, subject_slug, subject_name,
    section_order, section_name, point_order, point_title, canonical_topic, active, status
  ) values (
    'health-test-point', 2099, 'anhui', 'health-test', 'common', 'health-test', '数据库体检测试',
    999, '数据库体检测试', 999, '数据库体检测试', 'health-test-topic', true, 'published'
  );

  select (issue->>'count')::bigint into after_point
  from jsonb_array_elements(public.admin_data_health()->'publishedIssues') issue
  where issue->>'key' = 'no-resource';
  if after_point <> baseline + 1 then raise exception 'published missing-resource issue was not detected'; end if;

  insert into public.resources (
    resource_id, topic_tags, title, platform, creator, url, resource_type, difficulty,
    duration_text, recommendation_reason, priority, verified_at, status
  ) values (
    'health-test-resource', array['health-test-topic'], '数据库体检测试草稿', '测试平台', '测试',
    'https://example.com/health-test-resource', '测试', '测试', '1 分钟', '测试', 999, current_date, 'draft'
  );

  select (issue->>'count')::bigint into after_draft
  from jsonb_array_elements(public.admin_data_health()->'publishedIssues') issue
  where issue->>'key' = 'no-resource';
  if after_draft <> after_point then raise exception 'draft resource masked a published data issue'; end if;

  update public.resources set status = 'published' where resource_id = 'health-test-resource';
  select (issue->>'count')::bigint into after_publish
  from jsonb_array_elements(public.admin_data_health()->'publishedIssues') issue
  where issue->>'key' = 'no-resource';
  if after_publish <> baseline then raise exception 'published resource did not resolve the published issue'; end if;
end;
$$;

rollback;
