import { useEffect, useState } from 'react'
import { fallbackAcademicSchools, fallbackResources, offerings, syllabus } from './data'
import { loadPublicContent } from './supabase'

export const fallbackContent = {
  resources: fallbackResources,
  announcement: null,
  academicSchools: fallbackAcademicSchools,
  offerings,
  syllabusPoints: syllabus,
  source: 'csv',
  loading: true,
}

export function useContent() {
  const [content, setContent] = useState(fallbackContent)

  useEffect(() => {
    let active = true
    loadPublicContent()
      .then((next) => { if (active) setContent({ ...next, source: 'database', loading: false }) })
      .catch(() => { if (active) setContent((current) => ({ ...current, source: 'csv', loading: false })) })
    return () => { active = false }
  }, [])

  return content
}

