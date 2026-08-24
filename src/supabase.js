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

export function normalizeAcademicSchool(row) {
  return {
    ...row,
    sort_order: Number(row.sort_order),
    active: row.active !== false,
    has_study_map: Boolean(row.has_study_map),
  }
}

export function normalizeOffering(row) {
  return {
    ...row,
    year: Number(row.year),
    plan_count: Number(row.plan_count),
    sort_order: Number(row.sort_order),
    publicSubjects: Array.isArray(row.public_subjects) ? row.public_subjects : [],
    professionalSubjects: Array.isArray(row.professional_subjects) ? row.professional_subjects : [],
  }
}

export function normalizeSyllabusPoint(row) {
  return { ...row, year: Number(row.year), section_order: Number(row.section_order), point_order: Number(row.point_order) }
}

export async function loadPublicContent() {
  if (!supabase) throw new Error('Supabase 尚未配置')
  const [
    { data: resourceRows, error: resourceError },
    { data: announcementRows, error: announcementError },
    { data: academicSchoolRows, error: academicSchoolError },
    { data: offeringRows, error: offeringError },
    { data: syllabusRows, error: syllabusError },
  ] = await Promise.all([
    supabase.from('resources').select('*').order('priority').order('title'),
    supabase.from('announcements').select('*').order('updated_at', { ascending: false }).limit(1),
    supabase.from('academic_schools').select('*').order('sort_order').order('school_id'),
    supabase.from('admission_offerings').select('*').order('sort_order'),
    supabase.from('syllabus_points').select('*').order('subject_slug').order('section_order').order('point_order'),
  ])
  if (resourceError) throw resourceError
  if (announcementError) throw announcementError
  if (academicSchoolError) throw academicSchoolError
  if (offeringError) throw offeringError
  if (syllabusError) throw syllabusError
  return {
    resources: resourceRows.map(normalizeResource),
    announcement: announcementRows[0] ?? null,
    academicSchools: academicSchoolRows.map(normalizeAcademicSchool),
    offerings: offeringRows.map(normalizeOffering),
    syllabusPoints: syllabusRows.map(normalizeSyllabusPoint),
  }
}

