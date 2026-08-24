import Papa from 'papaparse'
import offeringsCsv from '../content/offerings.csv?raw'
import syllabusCsv from '../content/syllabus.csv?raw'
import resourcesCsv from '../content/resources.csv?raw'

const parse = (csv) => Papa.parse(csv, { header: true, skipEmptyLines: true }).data

export const offerings = parse(offeringsCsv).map((item) => ({
  ...item,
  year: Number(item.year),
  plan_count: Number(item.plan_count),
  publicSubjects: item.public_subjects.split('|'),
  professionalSubjects: item.professional_subjects.split('|'),
}))

export const syllabus = parse(syllabusCsv).map((item) => ({
  ...item,
  year: Number(item.year),
  section_order: Number(item.section_order),
  point_order: Number(item.point_order),
}))

export const fallbackResources = parse(resourcesCsv)
  .filter((item) => item.status === 'active')
  .map((item) => ({ ...item, priority: Number(item.priority), tags: item.topic_tags.split('|') }))

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

export const fallbackAcademicSchools = [
  { school_slug: 'hfnu', wall_school_id: 'anhui-school-23', school_name: '合肥师范学院', school_type: '公办', short_name: '合师', theme_color: '#0869a6', logo_url: '/schools/school-hfnu.jpg', active: true, sort_order: 1 },
  { school_slug: 'aiit', wall_school_id: 'anhui-school-33', school_name: '安徽信息工程学院', school_type: '民办', short_name: '安信', theme_color: '#164d89', logo_url: '/schools/school-aiit.png', active: true, sort_order: 2 },
  { school_slug: 'wenda', wall_school_id: 'anhui-school-36', school_name: '安徽文达信息工程学院', school_type: '民办', short_name: '文达', theme_color: '#173d78', logo_url: '/schools/school-wenda.jpg', active: true, sort_order: 3 },
]

export function schoolGroups(items = offerings, academicSchools = fallbackAcademicSchools) {
  const metadata = new Map(academicSchools.filter((school) => school.active !== false).map((school) => [school.school_slug, school]))
  const groups = Object.values(items.filter((item) => item.active !== false).reduce((acc, item) => {
    const school = metadata.get(item.school_slug)
    if (!school) return acc
    acc[item.school_slug] ??= { ...item, ...school, sites: [], totalPlan: 0 }
    acc[item.school_slug].sites.push(item.training_site)
    acc[item.school_slug].totalPlan += item.plan_count
    return acc
  }, {}))
  return groups.sort((a, b) => a.sort_order - b.sort_order)
}

export function schoolSyllabus(slug, items = syllabus) {
  return items.filter((item) => item.active !== false && (item.school_slug === 'common' || item.school_slug === slug))
}

export function resourcesForTopic(topic, items = resources) {
  return items.filter((resource) => resource.tags.includes(topic)).sort((a, b) => a.priority - b.priority).slice(0, 3)
}
