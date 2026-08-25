import { DEFAULT_SCOPE } from './contentScope'

export function normalizeResource(row) {
  const tags = Array.isArray(row.topic_tags) ? row.topic_tags : String(row.topic_tags || '').split('|').filter(Boolean)
  return { ...row, topic_tags: tags.join('|'), tags, priority: Number(row.priority) }
}

export function normalizeAcademicSchool(row) {
  return { ...row, sort_order: Number(row.sort_order), active: row.active !== false }
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
  return {
    ...row,
    province_slug: row.province_slug ?? DEFAULT_SCOPE.provinceSlug,
    major_slug: row.major_slug ?? DEFAULT_SCOPE.majorSlug,
    year: Number(row.year),
    section_order: Number(row.section_order),
    point_order: Number(row.point_order),
  }
}

