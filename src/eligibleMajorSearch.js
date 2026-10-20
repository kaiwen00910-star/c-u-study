const SPLITTER = /[、,，;；|\n]+/
const WIDE_SCOPE = /(不限|不限制|全部专业|各专业|专业类|大类|相关专业|相关类|相近专业)/

export const ELIGIBILITY_NOTICE = '该结果仅依据招生章程中的报考专业范围进行信息匹配，是否具备报考资格须以招生院校最终审核为准。'

export function normalizeEligibleMajorCategories(value) {
  if (Array.isArray(value)) return value.flatMap(normalizeEligibleMajorCategories)
  const text = String(value ?? '').trim()
  if (!text) return []
  const unwrapped = text.replace(/^\{(.*)\}$/, '$1')
  return unwrapped.split(SPLITTER).map((item) => item.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean)
}

export function normalizeMajorName(value) {
  return String(value ?? '').replace(/\s+/g, '').trim()
}

export function isUnrestrictedEligibleRange(value) {
  const normalized = normalizeMajorName(value)
  return /不限(专业|报考专业)?|不限制(专业|报考专业)?|所有专科专业/.test(normalized)
}

export function eligibleMajorSuggestions(offerings = []) {
  return [...new Set(offerings
    .flatMap((offering) => normalizeEligibleMajorCategories(offering.eligible_major_categories))
    .filter((item) => !WIDE_SCOPE.test(item) && item.length >= 2))]
    .sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'))
}

export function matchEligibleMajorRange(value, query) {
  const input = normalizeMajorName(query)
  const raw = String(value ?? '').trim()
  if (!input) return null
  if (isUnrestrictedEligibleRange(raw)) return { level: 'unrestricted', label: '报考范围不限' }
  const tokens = normalizeEligibleMajorCategories(raw)
  const exactToken = tokens.find((item) => normalizeMajorName(item) === input)
  if (exactToken) return WIDE_SCOPE.test(exactToken)
    ? { level: 'possible', label: '专业类别或相关范围可能匹配' }
    : { level: 'exact', label: '专业名称明确匹配' }
  const possible = tokens.some((item) => {
    const name = normalizeMajorName(item)
    const sharedPrefix = [...name].findIndex((character, index) => character !== [...input][index])
    const prefixLength = sharedPrefix === -1 ? Math.min([...name].length, [...input].length) : sharedPrefix
    return name.length >= 2 && (name.includes(input) || input.includes(name) || (WIDE_SCOPE.test(item) && prefixLength >= 2))
  })
  return possible ? { level: 'possible', label: '专业类别或相关范围可能匹配' } : null
}

export function findEligibleOfferings({ offerings = [], academicSchools = [], major = '' }) {
  const schools = new Map(academicSchools.map((school) => [school.school_slug, school]))
  return offerings
    .filter((offering) => offering.year === 2026 && offering.province_slug === 'anhui' && offering.active !== false && (!offering.status || offering.status === 'published'))
    .map((offering) => {
      const match = matchEligibleMajorRange(offering.eligible_major_categories, major)
      return match ? { ...offering, school: schools.get(offering.school_slug), match } : null
    })
    .filter(Boolean)
}

export function sortEligibleResults(items, sort = 'match') {
  const rank = { exact: 0, possible: 1, unrestricted: 2 }
  return [...items].sort((a, b) => {
    if (sort === 'public') return Number(b.school?.school_type === '公办') - Number(a.school?.school_type === '公办') || a.school?.sort_order - b.school?.sort_order
    if (sort === 'plan') return Number(b.plan_count) - Number(a.plan_count) || a.school?.sort_order - b.school?.sort_order
    if (sort === 'school') return a.school?.sort_order - b.school?.sort_order
    return rank[a.match.level] - rank[b.match.level] || a.school?.sort_order - b.school?.sort_order || Number(b.plan_count) - Number(a.plan_count)
  })
}
