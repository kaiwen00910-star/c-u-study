import fs from 'node:fs'
import path from 'node:path'

const url = process.env.SNAPSHOT_SUPABASE_URL
const publishableKey = process.env.SNAPSHOT_SUPABASE_PUBLISHABLE_KEY
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

const [academicSchools, offerings, rawSyllabusPoints, resources, announcements] = await Promise.all([
  read('academic_schools', { order: 'sort_order.asc,school_id.asc' }),
  read('admission_offerings', { order: 'year.asc,province_slug.asc,major_slug.asc,sort_order.asc' }),
  read('syllabus_points', { order: 'year.asc,province_slug.asc,major_slug.asc,school_slug.asc,subject_slug.asc,section_order.asc,point_order.asc' }),
  read('resources', { order: 'priority.asc,title.asc' }),
  read('announcements', { order: 'updated_at.desc' }),
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
console.log(`公开快照已同步：版本 ${snapshot.metadata.version}，${academicSchools.length} 所院校、${offerings.length} 个招生点、${syllabusPoints.length} 个知识点、${resources.length} 条资源。`)
