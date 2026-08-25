export const DEFAULT_SCOPE = Object.freeze({
  year: 2026,
  provinceSlug: 'anhui',
  majorSlug: 'computer-science',
})

export const MAJOR_NAMES = Object.freeze({
  'computer-science': '计算机科学与技术',
})

export const PROVINCE_NAMES = Object.freeze({ anhui: '安徽省' })

export function normalizeScope(scope = DEFAULT_SCOPE) {
  return {
    year: Number(scope.year ?? DEFAULT_SCOPE.year),
    provinceSlug: scope.provinceSlug ?? scope.province_slug ?? DEFAULT_SCOPE.provinceSlug,
    majorSlug: scope.majorSlug ?? scope.major_slug ?? DEFAULT_SCOPE.majorSlug,
  }
}

export function matchesScope(row, scope = DEFAULT_SCOPE) {
  const normalized = normalizeScope(scope)
  return Number(row.year) === normalized.year
    && (row.province_slug ?? DEFAULT_SCOPE.provinceSlug) === normalized.provinceSlug
    && (row.major_slug ?? DEFAULT_SCOPE.majorSlug) === normalized.majorSlug
}

export function scopeKey(scope = DEFAULT_SCOPE) {
  const normalized = normalizeScope(scope)
  return `${normalized.year}:${normalized.provinceSlug}:${normalized.majorSlug}`
}

export function scopePath(scope = DEFAULT_SCOPE, schoolSlug = '') {
  const normalized = normalizeScope(scope)
  const base = `/${normalized.provinceSlug}/${normalized.year}/${normalized.majorSlug}`
  return schoolSlug ? `${base}/${schoolSlug}` : base
}

export function comparePath(scope = DEFAULT_SCOPE) {
  return `${scopePath(scope)}/compare`
}

export function scopeLabel(scope = DEFAULT_SCOPE) {
  const normalized = normalizeScope(scope)
  return `${normalized.year} · ${MAJOR_NAMES[normalized.majorSlug] ?? normalized.majorSlug}`
}
