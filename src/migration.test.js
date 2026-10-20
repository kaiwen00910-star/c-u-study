import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const migrationDirectory = path.join(process.cwd(), 'supabase', 'migrations')
const migrationFiles = fs.readdirSync(migrationDirectory).filter((name) => name.endsWith('.sql')).sort()
const allSql = migrationFiles.map((name) => fs.readFileSync(path.join(migrationDirectory, name), 'utf8')).join('\n').toLowerCase()
const scopedMigration = fs.readFileSync(path.join(migrationDirectory, '20260825073452_enforce_scoped_content_integrity.sql'), 'utf8').toLowerCase()
const healthMigration = fs.readFileSync(path.join(migrationDirectory, '20260826062947_fix_admin_health_and_pagination.sql'), 'utf8').toLowerCase()
const freshnessMigration = fs.readFileSync(path.join(migrationDirectory, '20260827064340_unify_review_staleness_rule.sql'), 'utf8').toLowerCase()
const schoolFirstMigration = fs.readFileSync(path.join(migrationDirectory, '20261003034212_add_offering_exam_schemes.sql'), 'utf8').toLowerCase()
const batchTenMigration = fs.readFileSync(path.join(migrationDirectory, '20261004030846_publish_verified_schools_batch_ten_2026.sql'), 'utf8').toLowerCase()
const batchTwelveMigration = fs.readFileSync(path.join(migrationDirectory, '20261006072507_publish_verified_schools_batch_twelve_2026.sql'), 'utf8').toLowerCase()
const mapFlagMigration = fs.readFileSync(path.join(migrationDirectory, '20261006072816_separate_school_map_and_syllabus_completion.sql'), 'utf8').toLowerCase()
const batchThirteenMigration = fs.readFileSync(path.join(migrationDirectory, '20261018153040_complete_batch_thirteen_professional_maps_2026.sql'), 'utf8').toLowerCase()
const batchFourteenMigration = fs.readFileSync(path.join(migrationDirectory, '20261019050302_complete_batch_fourteen_professional_maps_2026.sql'), 'utf8').toLowerCase()
const batchFifteenMigration = fs.readFileSync(path.join(migrationDirectory, '20261019104817_complete_batch_fifteen_professional_maps_2026.sql'), 'utf8').toLowerCase()
const secondMedicalMigration = fs.readFileSync(path.join(migrationDirectory, '20261019124806_publish_verified_anhui_second_medical_college_2026.sql'), 'utf8').toLowerCase()

describe('Supabase migration 安全与完整性', () => {
  it('所有公开表均启用 RLS，新增表也不例外', () => {
    const publicTables = ['admin_users', 'resources', 'announcements', 'school_logos', 'academic_schools', 'admission_offerings', 'syllabus_points', 'content_versions']
    publicTables.forEach((table) => expect(allSql).toContain(`alter table public.${table} enable row level security`))
  })

  it('写策略继续以 admin_users 成员关系为最终授权依据且不出现 service role', () => {
    expect(scopedMigration).toContain('from public.admin_users')
    expect(scopedMigration).toContain('auth.uid()')
    expect(allSql).not.toContain('service_role')
  })

  it('范围列、招生唯一组合、考纲院校引用、资源主题和公告单条规则均由数据库约束', () => {
    expect(scopedMigration).toContain('add column province_slug')
    expect(scopedMigration).toContain('add column major_slug')
    expect(scopedMigration).toContain('admission_offerings_scope_school_site_unique')
    expect(scopedMigration).toContain('syllabus_points_validate_school')
    expect(scopedMigration).toContain('resources_validate_topic_tags')
    expect(scopedMigration).toContain('announcements_prevent_overlap')
  })

  it('草稿默认不可公开读取，年度复制 RPC 检查管理员并收紧执行权限', () => {
    expect(allSql).toContain("alter table public.resources alter column status set default 'draft'")
    expect(allSql).toContain('anonymous users can read published resources')
    expect(allSql).toContain('anonymous can read published admission offerings')
    expect(allSql).toContain('anonymous can read published syllabus points')
    expect(allSql).toContain('create or replace function public.copy_academic_year')
    expect(allSql).toContain('pg_advisory_xact_lock')
    expect(allSql).toContain("'等待新年度官方文件核验'")
    expect(allSql).toContain('where user_id = (select auth.uid())')
    expect(allSql).toContain('revoke all on function public.copy_academic_year')
  })

  it('公开体检只用 published 对照，草稿体检独立统计', () => {
    expect(healthMigration).toContain("point.status = 'published'")
    expect(healthMigration).toContain("resource.status = 'published'")
    expect(healthMigration).toContain("offering.status = 'published'")
    expect(healthMigration).toContain("'publishedissues'")
    expect(healthMigration).toContain("'draftissues'")
    expect(healthMigration).toContain("'draft-no-resource'")
  })

  it('分页与筛选 RPC 保持 SECURITY INVOKER 并拒绝 anon', () => {
    expect(healthMigration).toContain('create or replace function public.admin_resources_page')
    expect(healthMigration).toContain('create or replace function public.admin_syllabus_page')
    expect(healthMigration.match(/security invoker/g)?.length).toBeGreaterThanOrEqual(4)
    expect(healthMigration).toContain('revoke all on function public.admin_resources_page(text, text, text, text) from public, anon, authenticated')
    expect(healthMigration).toContain('grant execute on function public.admin_resources_page(text, text, text, text) to authenticated')
  })

  it('stale 体检拆分并链接到实际筛选模块', () => {
    expect(healthMigration).toContain("'href','/admin/offerings?filter=stale'")
    expect(healthMigration).toContain("'href','/admin/resources?filter=stale'")
    expect(healthMigration).not.toContain('/admin/overview?filter=stale')
  })

  it('核验过期统一通过上海自然日函数计算，供后台筛选与体检共用', () => {
    expect(freshnessMigration).toContain("time zone 'asia/shanghai'")
    expect(freshnessMigration).toContain('p_verified_at < p_as_of - 90')
    expect(freshnessMigration.match(/public\.review_stale_on\(verified_at\)/g)?.length).toBeGreaterThanOrEqual(2)
  })

  it('院校主地图使用结构化专业和考试方案且年度复制保持关系', () => {
    expect(schoolFirstMigration).toContain('add column if not exists program_names text[]')
    expect(schoolFirstMigration).toContain('add column if not exists exam_scheme_id text')
    expect(schoolFirstMigration).toContain("and offering.status = 'published'")
    expect(schoolFirstMigration).toContain('source.program_names, source.exam_scheme_id')
    expect(schoolFirstMigration).toContain('security invoker')
    expect(schoolFirstMigration).toContain('admission_offerings_published_school_scheme_idx')
  })

  it('第十批允许同校同培养点的多专业并逐行保护草稿', () => {
    expect(batchTenMigration).toContain('admission_offerings_scope_school_site_program_unique')
    expect(batchTenMigration).toContain('program_names')
    expect(batchTenMigration).toContain('batch_ten_protected_offering_drafts')
    expect(batchTenMigration).toContain('batch_ten_protected_point_drafts')
    expect(batchTenMigration).toContain('protected draft content changed')
    expect(batchTenMigration).toContain("school_slug = 'hfcity'")
  })

  it('第十二批只发布三校招生方案并逐字段保护所有草稿与非激活内容', () => {
    expect(batchTwelveMigration).toContain('batch_twelve_protected_offering_drafts')
    expect(batchTwelveMigration).toContain('batch_twelve_protected_point_drafts')
    expect(batchTwelveMigration).toContain('batch_twelve_protected_resource_drafts')
    expect(batchTwelveMigration).toContain('protected draft/inactive content changed')
    expect(batchTwelveMigration).toContain("when 'anhui-school-29' then 'cuhf'")
    expect(batchTwelveMigration).toContain("when 'anhui-school-32' then 'bctb'")
    expect(batchTwelveMigration).toContain("when 'anhui-school-42' then 'whit'")
    expect(batchTwelveMigration).toContain("school_slug = 'anhui-school-40'")
    expect(batchTwelveMigration).not.toMatch(/insert\s+into\s+public\.syllabus_points/)
    expect(batchTwelveMigration).not.toMatch(/insert\s+into\s+public\.resources/)
  })

  it('院校专业地图开放状态与知识点资源完成状态分离', () => {
    expect(mapFlagMigration).toContain('create or replace function public.refresh_academic_school_map_flags')
    expect(mapFlagMigration).toContain("offering.status = 'published'")
    expect(mapFlagMigration).not.toContain('from public.syllabus_points as point')
    expect(mapFlagMigration).toContain('41')
  })

  it('第十三批只替换八校招生点并冻结知识点、资源、草稿和非目标院校', () => {
    expect(batchThirteenMigration).toContain('batch_thirteen_protected_offering_drafts')
    expect(batchThirteenMigration).toContain('batch_thirteen_protected_points')
    expect(batchThirteenMigration).toContain('batch_thirteen_protected_resources')
    expect(batchThirteenMigration).toContain('batch_thirteen_protected_other_offerings')
    expect(batchThirteenMigration).toContain("<> 278")
    expect(batchThirteenMigration).toContain("<> 1033")
    expect(batchThirteenMigration).toContain("<> 80")
    expect(batchThirteenMigration).toContain("<> 33")
    expect(batchThirteenMigration).toContain("<> 4")
    expect(batchThirteenMigration).toContain('identical exam schemes were duplicated')
    expect(batchThirteenMigration).toContain('different exam subjects share one scheme')
    expect(batchThirteenMigration).not.toMatch(/insert\s+into\s+public\.syllabus_points/)
    expect(batchThirteenMigration).not.toMatch(/insert\s+into\s+public\.resources/)
    expect(batchThirteenMigration).not.toMatch(/delete\s+from\s+public\.syllabus_points/)
    expect(batchThirteenMigration).not.toMatch(/delete\s+from\s+public\.resources/)
  })

  it('第十四批完整替换八校专业地图并逐字段冻结学习内容和草稿', () => {
    expect(batchFourteenMigration).toContain('batch_fourteen_protected_offering_drafts')
    expect(batchFourteenMigration).toContain('batch_fourteen_protected_points')
    expect(batchFourteenMigration).toContain('batch_fourteen_protected_resources')
    expect(batchFourteenMigration).toContain('batch_fourteen_protected_other_offerings')
    expect(batchFourteenMigration).toContain('<> 367')
    expect(batchFourteenMigration).toContain('<> 1033')
    expect(batchFourteenMigration).toContain('<> 80')
    expect(batchFourteenMigration).toContain('<> 33')
    expect(batchFourteenMigration).toContain('<> 4')
    expect(batchFourteenMigration).toContain('<> 100')
    expect(batchFourteenMigration).toContain('<> 7640')
    expect(batchFourteenMigration).toContain('identical exam schemes were duplicated')
    expect(batchFourteenMigration).toContain('different exam subjects share one scheme')
    expect(batchFourteenMigration).not.toMatch(/insert\s+into\s+public\.syllabus_points/)
    expect(batchFourteenMigration).not.toMatch(/insert\s+into\s+public\.resources/)
    expect(batchFourteenMigration).not.toMatch(/delete\s+from\s+public\.syllabus_points/)
    expect(batchFourteenMigration).not.toMatch(/delete\s+from\s+public\.resources/)
  })

  it('第十五批完整替换七校专业地图并逐字段冻结学习内容和草稿', () => {
    expect(batchFifteenMigration).toContain('batch_fifteen_protected_offering_drafts')
    expect(batchFifteenMigration).toContain('batch_fifteen_protected_points')
    expect(batchFifteenMigration).toContain('batch_fifteen_protected_resources')
    expect(batchFifteenMigration).toContain('batch_fifteen_protected_other_offerings')
    expect(batchFifteenMigration).toContain('<> 461')
    expect(batchFifteenMigration).toContain('<> 1033')
    expect(batchFifteenMigration).toContain('<> 80')
    expect(batchFifteenMigration).toContain('<> 33')
    expect(batchFifteenMigration).toContain('<> 4')
    expect(batchFifteenMigration).toContain('<> 101')
    expect(batchFifteenMigration).toContain('<> 9350')
    expect(batchFifteenMigration).toContain('identical exam schemes were duplicated')
    expect(batchFifteenMigration).toContain('different exam subjects share one scheme')
    expect(batchFifteenMigration).not.toMatch(/insert\s+into\s+public\.syllabus_points/)
    expect(batchFifteenMigration).not.toMatch(/insert\s+into\s+public\.resources/)
    expect(batchFifteenMigration).not.toMatch(/delete\s+from\s+public\.syllabus_points/)
    expect(batchFifteenMigration).not.toMatch(/delete\s+from\s+public\.resources/)
  })

  it('安徽第二医学院只新增四个专业地图并逐字段冻结既有学习内容与草稿', () => {
    expect(secondMedicalMigration).toContain("school_slug = 'ahyz'")
    expect(secondMedicalMigration).toContain('<> 465')
    expect(secondMedicalMigration).toContain('<> 1033')
    expect(secondMedicalMigration).toContain('<> 80')
    expect(secondMedicalMigration).toContain('<> 33')
    expect(secondMedicalMigration).toContain('<> 4')
    expect(secondMedicalMigration).toContain('syllabus points changed')
    expect(secondMedicalMigration).toContain('resources changed')
    expect(secondMedicalMigration).not.toMatch(/insert\s+into\s+public\.syllabus_points/)
    expect(secondMedicalMigration).not.toMatch(/insert\s+into\s+public\.resources/)
    expect(secondMedicalMigration).not.toMatch(/delete\s+from\s+public\.syllabus_points/)
    expect(secondMedicalMigration).not.toMatch(/delete\s+from\s+public\.resources/)
  })
})
