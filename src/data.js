import snapshot from '../content/public-content.snapshot.json'
import { DEFAULT_SCOPE, matchesScope, normalizeScope } from './contentScope'

export const snapshotMetadata = snapshot.metadata
export const fallbackAnnouncements = snapshot.announcements ?? []

export const fallbackAcademicSchools = snapshot.academicSchools
  .map((row) => ({ ...row, sort_order: Number(row.sort_order), active: row.active !== false }))

export const offerings = snapshot.offerings.map((item) => ({
  ...item,
  year: Number(item.year),
  plan_count: Number(item.plan_count),
  sort_order: Number(item.sort_order),
  publicSubjects: Array.isArray(item.public_subjects) ? item.public_subjects : String(item.public_subjects || '').split('|').filter(Boolean),
  professionalSubjects: Array.isArray(item.professional_subjects) ? item.professional_subjects : String(item.professional_subjects || '').split('|').filter(Boolean),
}))

export const syllabus = snapshot.syllabusPoints.map((item) => ({
  ...item,
  province_slug: item.province_slug ?? DEFAULT_SCOPE.provinceSlug,
  major_slug: item.major_slug ?? DEFAULT_SCOPE.majorSlug,
  year: Number(item.year),
  section_order: Number(item.section_order),
  point_order: Number(item.point_order),
}))

export const fallbackResources = snapshot.resources
  .filter((item) => item.status === 'active' || item.status === 'published')
  .map((item) => ({
    ...item, status: 'published',
    priority: Number(item.priority),
    tags: Array.isArray(item.topic_tags) ? item.topic_tags : String(item.topic_tags || '').split('|').filter(Boolean),
  }))

export const resources = fallbackResources

export const subjectNames = {
  'advanced-math': '高等数学', english: '英语', 'c-language': 'C语言程序设计',
  'data-structure': '数据结构', 'computer-basics': '计算机专业基础',
  'computer-network': '计算机网络基础',
}

export const schoolTheme = {
  hfnu: { short: '合师', color: '#0869a6', logo: '/schools/school-hfnu.jpg' },
  aiit: { short: '安信', color: '#164d89', logo: '/schools/school-aiit.png' },
  wenda: { short: '文达', color: '#173d78', logo: '/schools/school-wenda.jpg' },
}

export function mapAvailableSchoolSlugs(items = offerings, syllabusItems = syllabus, scope = DEFAULT_SCOPE) {
  const normalized = normalizeScope(scope)
  const offeringSchools = new Set(items
    .filter((item) => item.active !== false && matchesScope(item, normalized))
    .map((item) => item.school_slug))
  const syllabusSchools = new Set(syllabusItems
    .filter((item) => item.active !== false && item.school_slug !== 'common' && matchesScope(item, normalized))
    .map((item) => item.school_slug))
  return new Set([...offeringSchools].filter((slug) => syllabusSchools.has(slug)))
}

export function schoolGroups(items = offerings, academicSchools = fallbackAcademicSchools, scope = DEFAULT_SCOPE, syllabusItems = syllabus) {
  const normalized = normalizeScope(scope)
  const available = mapAvailableSchoolSlugs(items, syllabusItems, normalized)
  return offeringSchoolGroups(items, academicSchools, normalized)
    .filter((school) => available.has(school.school_slug))
}

export function offeringSchoolGroups(items = offerings, academicSchools = fallbackAcademicSchools, scope = DEFAULT_SCOPE) {
  const normalized = normalizeScope(scope)
  const metadata = new Map(academicSchools
    .filter((school) => school.active !== false)
    .map((school) => [school.school_slug, school]))
  const groups = Object.values(items
    .filter((item) => item.active !== false && matchesScope(item, normalized))
    .reduce((acc, item) => {
      const school = metadata.get(item.school_slug)
      if (!school) return acc
      acc[item.school_slug] ??= { ...item, ...school, sites: [], totalPlan: 0 }
      acc[item.school_slug].sites.push(item.training_site)
      acc[item.school_slug].totalPlan += item.plan_count
      return acc
    }, {}))
  return groups.sort((a, b) => a.sort_order - b.sort_order)
}

export function schoolSyllabus(slug, items = syllabus, scope = DEFAULT_SCOPE) {
  const normalized = normalizeScope(scope)
  return items.filter((item) => item.active !== false
    && matchesScope(item, normalized)
    && (item.school_slug === 'common' || item.school_slug === slug))
}

export function resourcesForTopic(topic, items = resources) {
  return items.filter((resource) => resource.tags.includes(topic)).sort((a, b) => a.priority - b.priority).slice(0, 3)
}
