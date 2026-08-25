import { DEFAULT_SCOPE, normalizeScope } from './contentScope'

const url = import.meta.env.VITE_SUPABASE_URL
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const publicApiConfigured = Boolean(url && publishableKey)

function endpoint(table, params = {}) {
  const target = new URL(`${url}/rest/v1/${table}`)
  Object.entries(params).forEach(([key, value]) => target.searchParams.append(key, value))
  return target
}

async function read(table, params) {
  const response = await fetch(endpoint(table, params), {
    headers: { apikey: publishableKey, Authorization: `Bearer ${publishableKey}` },
  })
  if (!response.ok) throw new Error(`${table} 读取失败（${response.status}）`)
  return response.json()
}

const maxUpdatedAt = (collections) => collections.flat().reduce((latest, row) => {
  if (!row.updated_at) return latest
  return !latest || row.updated_at > latest ? row.updated_at : latest
}, null)

export async function loadPublicContent(scope = DEFAULT_SCOPE, attempt = 0) {
  if (!publicApiConfigured) throw new Error('公开内容服务尚未配置')
  const normalized = normalizeScope(scope)
  const scopeFilters = {
    year: `eq.${normalized.year}`,
    province_slug: `eq.${normalized.provinceSlug}`,
    major_slug: `eq.${normalized.majorSlug}`,
  }
  const versionBefore = await read('content_versions', { select: 'version,updated_at', id: 'eq.public-content', limit: '1' })
  const [resourceRows, announcementRows, academicSchoolRows, offeringRows, syllabusRows] = await Promise.all([
    read('resources', { select: '*', order: 'priority.asc,title.asc' }),
    read('announcements', { select: '*', order: 'updated_at.desc', limit: '1' }),
    read('academic_schools', { select: '*', order: 'sort_order.asc,school_id.asc' }),
    read('admission_offerings', { select: '*', ...scopeFilters, order: 'sort_order.asc' }),
    read('syllabus_points', { select: '*', ...scopeFilters, order: 'subject_slug.asc,section_order.asc,point_order.asc' }),
  ])
  const versionAfter = await read('content_versions', { select: 'version,updated_at', id: 'eq.public-content', limit: '1' })
  if (versionBefore[0]?.version !== versionAfter[0]?.version) {
    if (attempt < 1) return loadPublicContent(normalized, attempt + 1)
    throw new Error('在线内容正在更新，请稍后重试')
  }
  return {
    resources: resourceRows,
    announcements: announcementRows,
    academicSchools: academicSchoolRows,
    offerings: offeringRows,
    syllabusPoints: syllabusRows,
    metadata: {
      version: versionAfter[0]?.version ?? null,
      sourceUpdatedAt: versionAfter[0]?.updated_at ?? maxUpdatedAt([resourceRows, announcementRows, academicSchoolRows, offeringRows, syllabusRows]),
    },
  }
}
