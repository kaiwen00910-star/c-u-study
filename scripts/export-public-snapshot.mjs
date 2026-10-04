import fs from 'node:fs'
import path from 'node:path'
import Papa from 'papaparse'

const url = process.env.SNAPSHOT_SUPABASE_URL || process.env.VITE_SUPABASE_URL
const publishableKey = process.env.SNAPSHOT_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY
if (!url || !publishableKey) {
  console.error('请设置 SNAPSHOT_SUPABASE_URL 和 SNAPSHOT_SUPABASE_PUBLISHABLE_KEY（仅使用 publishable key）。')
  process.exit(1)
}

async function read(table, params = {}) {
  const target = new URL(`${url}/rest/v1/${table}`)
  Object.entries({ select: '*', ...params }).forEach(([key, value]) => target.searchParams.append(key, value))
  const response = await fetch(target, { headers: { apikey: publishableKey, Authorization: `Bearer ${publishableKey}` } })
  if (!response.ok) throw new Error(`${table} 导出失败（${response.status}）：${await response.text()}`)
  return response.json()
}

async function readAll(table, params = {}) {
  const pageSize = 1000
  const rows = []
  for (let offset = 0; ; offset += pageSize) {
    const page = await read(table, { ...params, limit: String(pageSize), offset: String(offset) })
    rows.push(...page)
    if (page.length < pageSize) return rows
  }
}

const [academicSchools, offerings, rawSyllabusPoints, resources, announcements] = await Promise.all([
  readAll('academic_schools', { order: 'sort_order.asc,school_id.asc' }),
  readAll('admission_offerings', { order: 'year.asc,province_slug.asc,major_slug.asc,sort_order.asc' }),
  readAll('syllabus_points', { order: 'year.asc,province_slug.asc,major_slug.asc,school_slug.asc,subject_slug.asc,section_order.asc,point_order.asc' }),
  readAll('resources', { order: 'priority.asc,title.asc' }),
  readAll('announcements', { order: 'updated_at.desc' }),
])

let versionRows = []
try { versionRows = await read('content_versions', { select: 'version,updated_at', id: 'eq.public-content', limit: '1' }) } catch { /* migration not yet applied */ }

const syllabusPoints = rawSyllabusPoints.map((row) => ({
  ...row,
  province_slug: row.province_slug ?? 'anhui',
  major_slug: row.major_slug ?? 'computer-science',
}))
const collections = [academicSchools, offerings, syllabusPoints, resources, announcements]
const sourceUpdatedAt = versionRows[0]?.updated_at ?? collections.flat().reduce((latest, row) => {
  if (!row.updated_at) return latest
  return !latest || row.updated_at > latest ? row.updated_at : latest
}, null)
const generatedAt = new Date().toISOString()
const snapshot = {
  metadata: {
    schemaVersion: 2,
    version: versionRows[0]?.version ?? `legacy-${sourceUpdatedAt ?? generatedAt}`,
    generatedAt,
    sourceUpdatedAt,
    source: 'supabase-public-rest-rls',
  },
  academicSchools,
  offerings,
  syllabusPoints,
  resources,
  announcements,
}

const output = path.join(process.cwd(), 'content', 'public-content.snapshot.json')
fs.writeFileSync(output, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8')
const schoolsBySlug = new Map(academicSchools.map((school) => [school.school_slug, school]))
const writeCsv = (name, rows, columns) => fs.writeFileSync(
  path.join(process.cwd(), 'content', name),
  `${Papa.unparse(rows, { columns, newline: '\n' })}\n`,
  'utf8',
)
writeCsv('offerings.csv', offerings.map((row) => ({
  ...row,
  school_name: schoolsBySlug.get(row.school_slug)?.school_name ?? '',
  school_type: schoolsBySlug.get(row.school_slug)?.school_type ?? '',
  public_subjects: (row.public_subjects ?? []).join('|'),
  professional_subjects: (row.professional_subjects ?? []).join('|'),
  program_names: (row.program_names ?? []).join('|'),
})), [
  'offering_id', 'year', 'province_slug', 'major_slug', 'school_slug', 'school_name', 'school_type',
  'training_site', 'eligible_major_categories', 'public_subjects', 'professional_subjects', 'plan_count',
  'charter_url', 'syllabus_url', 'source_status', 'verified_at', 'program_names', 'exam_scheme_id',
])
writeCsv('syllabus.csv', syllabusPoints.map((row) => ({ ...row })), [
  'year', 'province_slug', 'major_slug', 'school_slug', 'subject_slug', 'section_order',
  'section_name', 'point_order', 'point_id', 'point_title', 'canonical_topic',
])
writeCsv('resources.csv', resources.map((row) => ({
  ...row,
  topic_tags: (row.topic_tags ?? []).join('|'),
})), [
  'resource_id', 'topic_tags', 'title', 'platform', 'creator', 'url', 'resource_type', 'difficulty',
  'duration_text', 'recommendation_reason', 'priority', 'verified_at', 'status',
])
console.log(`公开快照已同步：版本 ${snapshot.metadata.version}，${academicSchools.length} 所院校、${offerings.length} 个招生点、${syllabusPoints.length} 个知识点、${resources.length} 条资源。`)
