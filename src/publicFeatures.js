import { scopePath } from './contentScope'

export function learningDeepLink(scope, schoolSlug, point) {
  const params = new URLSearchParams({ subject: point.subject_slug, point: point.point_id })
  return `${scopePath(scope, schoolSlug)}?${params}`
}

export function sanitizeCompareSelection(value, schools) {
  const allowed = new Set(schools.map((school) => school.school_slug))
  return [...new Set(String(value || '').split(',').filter((slug) => allowed.has(slug)))].slice(0, 3)
}

export function filterSchoolDirectory(wallSchools, openSchools, filters) {
  const openBySlug = new Map(openSchools.map((school) => [school.school_slug, school]))
  const q = String(filters.q || '').trim().toLowerCase()
  return wallSchools.filter((school) => {
    const details = openBySlug.get(school.schoolSlug)
    const subjects = details ? [...details.publicSubjects, ...details.professionalSubjects] : []
    return (!q || `${school.name}${school.shortName}`.toLowerCase().includes(q))
      && (!filters.type || school.schoolType === filters.type)
      && (!filters.map || (filters.map === 'open' ? school.hasDetails : !school.hasDetails))
      && (!filters.subject || subjects.includes(filters.subject))
  })
}

export function aggregateChapterResources(points, resources) {
  const byId = new Map()
  points.forEach((point) => {
    resources.filter((resource) => resource.tags.includes(point.canonical_topic)).forEach((resource) => {
      const existing = byId.get(resource.resource_id) || { resource, points: [] }
      if (!existing.points.some((item) => item.point_id === point.point_id)) existing.points.push(point)
      byId.set(resource.resource_id, existing)
    })
  })
  return [...byId.values()].sort((a, b) => a.resource.priority - b.resource.priority || a.resource.title.localeCompare(b.resource.title))
}

export function differingCompareFields(schools) {
  const fields = {
    sites: (school) => school.sites.join('|'),
    eligible_major_categories: (school) => school.eligible_major_categories,
    totalPlan: (school) => String(school.totalPlan),
    professionalSubjects: (school) => school.professionalSubjects.join('|'),
  }
  return new Set(Object.entries(fields).filter(([, getter]) => new Set(schools.map(getter)).size > 1).map(([key]) => key))
}
