import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const migrationDirectory = path.join(process.cwd(), 'supabase', 'migrations')
const migrationFiles = fs.readdirSync(migrationDirectory).filter((name) => name.endsWith('.sql')).sort()
const allSql = migrationFiles.map((name) => fs.readFileSync(path.join(migrationDirectory, name), 'utf8')).join('\n').toLowerCase()
const scopedMigration = fs.readFileSync(path.join(migrationDirectory, '20260825062221_enforce_scoped_content_integrity.sql'), 'utf8').toLowerCase()

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
})
