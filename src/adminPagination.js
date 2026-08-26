export const ADMIN_PAGE_SIZE = 20

export function normalizeAdminPage(value) {
  return Math.max(1, Number(value) || 1)
}

export function totalAdminPages(total) {
  return Math.max(1, Math.ceil((Number(total) || 0) / ADMIN_PAGE_SIZE))
}

export function adminPageRange(page) {
  const normalizedPage = normalizeAdminPage(page)
  const from = (normalizedPage - 1) * ADMIN_PAGE_SIZE
  return { from, to: from + ADMIN_PAGE_SIZE - 1 }
}

export function updateAdminSearchParams(current, key, value) {
  const next = new URLSearchParams(current)
  if (value && value !== 'all') next.set(key, value); else next.delete(key)
  if (key !== 'page') next.delete('page')
  return next
}

function optionalFilter(value) {
  return value && value !== 'all' ? value : null
}

async function loadRpcPage(client, functionName, args, page) {
  const { from, to } = adminPageRange(page)
  const result = await client
    .rpc(functionName, args, { count: 'exact' })
    .range(from, to)
  if (result.error) throw result.error
  return { rows: result.data || [], count: result.count || 0, from, to }
}

export function loadResourceAdminPage(client, filters) {
  return loadRpcPage(client, 'admin_resources_page', {
    p_query: optionalFilter(filters.query),
    p_platform: optionalFilter(filters.platform),
    p_status: optionalFilter(filters.status),
    p_filter: optionalFilter(filters.issueFilter),
  }, filters.page)
}

export function loadSyllabusAdminPage(client, filters) {
  return loadRpcPage(client, 'admin_syllabus_page', {
    p_query: optionalFilter(filters.query),
    p_status: optionalFilter(filters.status),
    p_filter: optionalFilter(filters.issueFilter),
  }, filters.page)
}

export function isStaleReview(date, now = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ''))) return true
  const verifiedAt = new Date(`${date}T00:00:00Z`)
  return now.getTime() - verifiedAt.getTime() > 90 * 24 * 60 * 60 * 1000
}

export function staleReviewLabel(item) {
  if (!isStaleReview(item.verified_at)) return ''
  return item.status === 'published' ? '已发布内容过期' : '草稿待核验'
}
