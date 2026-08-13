import { useEffect, useState } from 'react'
import { fallbackResources } from './data'
import { loadPublicContent } from './supabase'

export function useContent() {
  const [content, setContent] = useState({ resources: fallbackResources, announcement: null, source: 'csv', loading: true })

  useEffect(() => {
    let active = true
    loadPublicContent()
      .then((next) => { if (active) setContent({ ...next, source: 'database', loading: false }) })
      .catch(() => { if (active) setContent((current) => ({ ...current, source: 'csv', loading: false })) })
    return () => { active = false }
  }, [])

  return content
}

