import { DEFAULT_SCOPE, scopePath } from './contentScope'
import { mapAvailableSchoolSlugs } from './data'

export function createSchoolWallSchools(schools, offerings = [], syllabusPoints = [], scope = DEFAULT_SCOPE) {
  const available = mapAvailableSchoolSlugs(offerings, syllabusPoints, scope)
  return [...schools]
    .filter((school) => school.active !== false)
    .sort((a, b) => a.sort_order - b.sort_order || a.school_id.localeCompare(b.school_id))
    .map((school) => {
      const hasDetails = available.has(school.school_slug)
      return {
        id: school.school_id,
        schoolSlug: school.school_slug,
        name: school.school_name,
        shortName: school.short_name,
        schoolType: school.school_type,
        logo: school.logo_url || '',
        logoSource: school.logo_url?.startsWith('https://') ? 'database' : school.logo_url ? 'local' : 'missing',
        href: hasDetails ? scopePath(scope, school.school_slug) : null,
        hasDetails,
      }
    })
}

export function createSchoolWallTracks(schools) {
  return [schools.slice(0, 14), schools.slice(14, 28), schools.slice(28)]
}
