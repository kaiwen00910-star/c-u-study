import { useEffect, useMemo, useState } from 'react'
import { currentAnnouncement } from './announcements'
import { DEFAULT_SCOPE, matchesScope, normalizeScope, scopeKey } from './contentScope'
import {
  fallbackAcademicSchools, fallbackAnnouncements, fallbackResources, offerings, snapshotMetadata, syllabus,
} from './data'
import {
  normalizeAcademicSchool, normalizeOffering, normalizeResource, normalizeSyllabusPoint,
} from './contentNormalization'
import { loadPublicContent } from './publicApi'

export function fallbackContentForScope(scope = DEFAULT_SCOPE) {
  const normalized = normalizeScope(scope)
  return {
    resources: fallbackResources,
    announcement: currentAnnouncement(fallbackAnnouncements),
    academicSchools: fallbackAcademicSchools,
    offerings: offerings.filter((item) => matchesScope(item, normalized)),
    syllabusPoints: syllabus.filter((item) => matchesScope(item, normalized)),
    metadata: snapshotMetadata,
    source: 'snapshot',
    loading: true,
    offline: false,
    error: null,
  }
}

export const fallbackContent = fallbackContentForScope(DEFAULT_SCOPE)

function normalizeContent(next) {
  return {
    resources: next.resources.map(normalizeResource),
    announcement: currentAnnouncement(next.announcements),
    academicSchools: next.academicSchools.map(normalizeAcademicSchool),
    offerings: next.offerings.map(normalizeOffering),
    syllabusPoints: next.syllabusPoints.map(normalizeSyllabusPoint),
    metadata: next.metadata,
    source: 'database',
    loading: false,
    offline: false,
    error: null,
  }
}

export function useContent(scope = DEFAULT_SCOPE) {
  const { year, provinceSlug, majorSlug } = scope
  const normalized = useMemo(() => normalizeScope({ year, provinceSlug, majorSlug }), [year, provinceSlug, majorSlug])
  const normalizedKey = scopeKey(normalized)
  const [content, setContent] = useState(() => fallbackContentForScope(normalized))

  useEffect(() => {
    let active = true
    setContent(fallbackContentForScope(normalized))
    loadPublicContent(normalized)
      .then((next) => { if (active) setContent(normalizeContent(next)) })
      .catch((error) => {
        if (active) setContent({ ...fallbackContentForScope(normalized), loading: false, offline: true, error: error.message })
      })
    return () => { active = false }
  }, [normalized, normalizedKey])

  return content
}
