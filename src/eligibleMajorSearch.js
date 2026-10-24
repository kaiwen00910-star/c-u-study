import { findVocationalMajor, vocationalMajorSuggestions } from './vocationalMajorCatalog'

const SPLITTER = /[、,，;；|\n]+/
const WIDE_SCOPE = /(不限|不限制|全部专业|各专业|所有专科专业)/

export const PUBLIC_COURSE_TRACKS = {
  arts: { label: '文科方向', primary: '大学语文', subjects: ['大学语文', '英语'] },
  science: { label: '理科方向', primary: '高等数学', subjects: ['高等数学', '英语'] },
}

export const ELIGIBILITY_NOTICE = '查询结果仅用于定位可能相关的招生方案，不是报考资格结论；报名前必须核验招生章程，并以招生院校最终资格审核为准。'
export const COURSE_REFERENCE_NOTICE = '“仅公共课科类范围参考”只表示公共课方向一致，不能说明你的专科专业符合报考范围，不得据此认定可以报考。'

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

export function mappedEligibleMajorCategories(value) {
  const entry = findVocationalMajor(value)
  return entry ? [entry.professionalClass, entry.majorCategory] : []
}

export function isUnrestrictedEligibleRange(value) {
  const normalized = normalizeMajorName(value)
  return /不限(专业|报考专业)?|不限制(专业|报考专业)?|所有专科专业/.test(normalized)
}

function explicitlyNamesMajor(token, major) {
  const name = normalizeMajorName(token)
  const input = normalizeMajorName(major)
  if (!name || !input) return false
  if (name === input) return true
  return name.includes(`限${input}`) || name.includes(`专业：${input}`) || name.includes(`专业:${input}`)
}

function mentionsCatalogCategory(token, entry) {
  const name = normalizeMajorName(token)
  const professionalClass = normalizeMajorName(entry.professionalClass)
  const majorCategory = normalizeMajorName(entry.majorCategory)
  if (name === professionalClass) return entry.professionalClass
  if (name === majorCategory) return entry.majorCategory
  if (name.includes(`专业类：${professionalClass}`) || name.includes(`专业类:${professionalClass}`)) return entry.professionalClass
  if (name.includes(professionalClass) && /(所包含专业|中的|中所有专业|相关专业|[-—]\d{4})/.test(name)) return entry.professionalClass
  if (name.includes(`专业大类：${majorCategory}`) || name.includes(`专业大类:${majorCategory}`)) return entry.majorCategory
  return null
}

export function eligibleMajorSuggestions(offerings = [], query = '', limit = Number.POSITIVE_INFINITY) {
  const needle = normalizeMajorName(query)
  const rangeTokens = offerings
    .flatMap((offering) => normalizeEligibleMajorCategories(offering.eligible_major_categories))
    .filter((item) => !WIDE_SCOPE.test(item) && !/(专业类|大类|相关专业|相近专业)/.test(item) && item.length >= 2)
  const availableRanges = new Set(offerings.flatMap((offering) => normalizeEligibleMajorCategories(offering.eligible_major_categories)).map(normalizeMajorName))
  const catalogSuggestions = vocationalMajorSuggestions(query, Number.POSITIVE_INFINITY).filter((label) => {
    const entry = findVocationalMajor(label)
    return entry && (availableRanges.has(normalizeMajorName(entry.professionalClass)) || availableRanges.has(normalizeMajorName(entry.majorCategory)))
  })
  return [...new Set([...rangeTokens, ...catalogSuggestions])]
    .filter((item) => !needle || normalizeMajorName(item).includes(needle))
    .sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'))
    .slice(0, limit)
}

export function matchEligibleMajorRange(value, query, { allowUnrestricted = true } = {}) {
  const input = normalizeMajorName(query)
  const raw = String(value ?? '').trim()
  if (!input) return null
  const tokens = normalizeEligibleMajorCategories(raw)
  const exactToken = tokens.find((item) => explicitlyNamesMajor(item, input))
  if (exactToken) return { level: 'exact', label: '专业名称明确匹配', matchBasis: 'explicit-major-name' }

  const catalogEntry = findVocationalMajor(input)
  if (catalogEntry?.alias) {
    const canonicalToken = tokens.find((item) => explicitlyNamesMajor(item, catalogEntry.name))
    if (canonicalToken) return { level: 'possible', label: '旧名称对应目录专业可能匹配', matchedCategory: catalogEntry.name, matchBasis: 'catalog-alias' }
  }

  if (catalogEntry) {
    const matchedCategory = tokens.map((item) => mentionsCatalogCategory(item, catalogEntry)).find(Boolean)
    if (matchedCategory) return { level: 'possible', label: '专业目录类别可能匹配', matchedCategory, matchBasis: 'catalog-category' }
  }

  if (allowUnrestricted && isUnrestrictedEligibleRange(raw)) return { level: 'unrestricted', label: '报考范围不限', matchBasis: 'unrestricted' }
  return null
}

export function offeringMatchesPublicCourseTrack(offering, track) {
  const selected = PUBLIC_COURSE_TRACKS[track]
  if (!selected) return false
  const subjects = offering.publicSubjects || offering.public_subjects || []
  return selected.subjects.every((subject) => subjects.includes(subject))
}

function activeAnhuiOfferings(offerings, track) {
  const seen = new Set()
  return offerings.filter((offering) => {
    const id = offering.offering_id
    if (seen.has(id)) return false
    const usable = offering.year === 2026
      && offering.province_slug === 'anhui'
      && offering.active !== false
      && (!offering.status || offering.status === 'published')
      && offeringMatchesPublicCourseTrack(offering, track)
    if (usable) seen.add(id)
    return usable
  })
}

export function findEligibleOfferings({ offerings = [], academicSchools = [], major = '', track = '' }) {
  const input = normalizeMajorName(major)
  if (!input || !PUBLIC_COURSE_TRACKS[track]) return []
  const schools = new Map(academicSchools.map((school) => [school.school_slug, school]))
  const base = activeAnhuiOfferings(offerings, track)
  const catalogEntry = findVocationalMajor(input)
  const exactRows = base.map((offering) => {
    const match = matchEligibleMajorRange(offering.eligible_major_categories, input, { allowUnrestricted: false })
    return match?.level === 'exact' ? { ...offering, school: schools.get(offering.school_slug), match } : null
  }).filter(Boolean)

  if (!catalogEntry && exactRows.length === 0) {
    return base.map((offering) => ({
      ...offering,
      school: schools.get(offering.school_slug),
      match: { level: 'reference', label: '仅公共课科类范围参考', matchBasis: 'public-course-only' },
    }))
  }

  return base.map((offering) => {
    const match = matchEligibleMajorRange(offering.eligible_major_categories, input)
    return match ? { ...offering, school: schools.get(offering.school_slug), match } : null
  }).filter(Boolean)
}

export function sortEligibleResults(items, sort = 'match') {
  const rank = { exact: 0, possible: 1, unrestricted: 2, reference: 3 }
  return [...items].sort((a, b) => {
    if (sort === 'public') return Number(b.school?.school_type === '公办') - Number(a.school?.school_type === '公办') || (a.school?.sort_order ?? 999) - (b.school?.sort_order ?? 999)
    if (sort === 'plan') return Number(b.plan_count) - Number(a.plan_count) || (a.school?.sort_order ?? 999) - (b.school?.sort_order ?? 999)
    if (sort === 'school') return (a.school?.sort_order ?? 999) - (b.school?.sort_order ?? 999)
    return rank[a.match.level] - rank[b.match.level] || (a.school?.sort_order ?? 999) - (b.school?.sort_order ?? 999) || Number(b.plan_count) - Number(a.plan_count)
  })
}
