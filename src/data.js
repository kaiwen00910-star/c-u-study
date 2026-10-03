import snapshot from '../content/public-content.snapshot.json'
import { DEFAULT_SCOPE, matchesScope, normalizeScope } from './contentScope'

const asList = (value) => Array.isArray(value) ? value : String(value || '').split('|').filter(Boolean)

export const snapshotMetadata = snapshot.metadata
export const fallbackAnnouncements = snapshot.announcements ?? []

export const fallbackAcademicSchools = snapshot.academicSchools
  .map((row) => ({ ...row, sort_order: Number(row.sort_order), active: row.active !== false }))

export const offerings = snapshot.offerings.map((item) => ({
  ...item,
  year: Number(item.year),
  plan_count: Number(item.plan_count),
  sort_order: Number(item.sort_order),
  programNames: asList(item.program_names),
  publicSubjects: asList(item.public_subjects),
  professionalSubjects: asList(item.professional_subjects),
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
      acc[item.school_slug] ??= { ...item, ...school, offerings: [], sites: [], totalPlan: 0, publicSubjects: [], professionalSubjects: [], programNames: [] }
      acc[item.school_slug].offerings.push(item)
      acc[item.school_slug].sites.push(item.training_site)
      acc[item.school_slug].totalPlan += item.plan_count
      acc[item.school_slug].publicSubjects.push(...asList(item.publicSubjects || item.public_subjects))
      acc[item.school_slug].professionalSubjects.push(...asList(item.professionalSubjects || item.professional_subjects))
      acc[item.school_slug].programNames.push(...asList(item.programNames || item.program_names))
      return acc
    }, {}))
  groups.forEach((school) => {
    school.sites = [...new Set(school.sites)]
    school.publicSubjects = [...new Set(school.publicSubjects)]
    school.professionalSubjects = [...new Set(school.professionalSubjects)]
    school.programNames = [...new Set(school.programNames)]
    school.examSchemes = examSchemesForOfferings(school.offerings)
  })
  return groups.sort((a, b) => a.sort_order - b.sort_order)
}

export function examSchemesForOfferings(items = []) {
  return Object.values(items.reduce((acc, item) => {
    const publicSubjects = asList(item.publicSubjects || item.public_subjects)
    const professionalSubjects = asList(item.professionalSubjects || item.professional_subjects)
    const fallbackId = `legacy:${item.school_slug}:${[...publicSubjects, ...professionalSubjects].join('|')}`
    const examSchemeId = item.exam_scheme_id || fallbackId
    acc[examSchemeId] ??= {
      examSchemeId,
      publicSubjects: [...publicSubjects],
      professionalSubjects: [...professionalSubjects],
      offerings: [],
      programNames: [],
      totalPlan: 0,
    }
    acc[examSchemeId].offerings.push(item)
    acc[examSchemeId].programNames.push(...asList(item.programNames || item.program_names))
    acc[examSchemeId].totalPlan += Number(item.plan_count)
    return acc
  }, {})).map((scheme) => ({
    ...scheme,
    programNames: [...new Set(scheme.programNames)],
  }))
}

export function schoolSyllabus(slug, items = syllabus, scope = DEFAULT_SCOPE) {
  const normalized = normalizeScope(scope)
  return items.filter((item) => item.active !== false
    && matchesScope(item, normalized)
    && (item.school_slug === 'common' || item.school_slug === slug))
}

export function schoolSyllabusForScheme(slug, scheme, items = syllabus, scope = DEFAULT_SCOPE) {
  const allowedSubjects = new Set([...(scheme?.publicSubjects || []), ...(scheme?.professionalSubjects || [])])
  const points = schoolSyllabus(slug, items, scope)
  if (!allowedSubjects.size) return points
  return points.filter((point) => allowedSubjects.has(point.subject_name || subjectNames[point.subject_slug]))
}

export function resourcesForTopic(topic, items = resources) {
  return items.filter((resource) => resource.tags.includes(topic)).sort((a, b) => a.priority - b.priority).slice(0, 3)
}
