import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const supabaseConfigured = Boolean(url && publishableKey)
export const supabase = supabaseConfigured
  ? createClient(url, publishableKey, {
      auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
    })
  : null

export function normalizeResource(row) {
  const tags = Array.isArray(row.topic_tags) ? row.topic_tags : String(row.topic_tags || '').split('|').filter(Boolean)
  return { ...row, topic_tags: tags.join('|'), tags, priority: Number(row.priority) }
}

export async function loadPublicContent() {
  if (!supabase) throw new Error('Supabase 尚未配置')
  const [{ data: resourceRows, error: resourceError }, { data: announcementRows, error: announcementError }, { data: schoolLogoRows, error: schoolLogoError }] = await Promise.all([
    supabase.from('resources').select('*').order('priority').order('title'),
    supabase.from('announcements').select('*').order('updated_at', { ascending: false }).limit(1),
    supabase.from('school_logos').select('school_id,logo_url,updated_at').order('school_id'),
  ])
  if (resourceError) throw resourceError
  if (announcementError) throw announcementError
  if (schoolLogoError) throw schoolLogoError
  return {
    resources: resourceRows.map(normalizeResource),
    announcement: announcementRows[0] ?? null,
    schoolLogos: schoolLogoRows,
  }
}

