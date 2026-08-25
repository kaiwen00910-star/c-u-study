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
})
