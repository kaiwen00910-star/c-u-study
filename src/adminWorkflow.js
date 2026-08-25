import { validateResource } from './resourceValidation'

export const PUBLICATION_STATUS = Object.freeze({
  draft: { label: '草稿', className: 'draft' },
  published: { label: '已发布', className: 'active' },
  archived: { label: '已下架', className: 'archived' },
})

export function publicationChecks(kind, item, validTopics = new Set()) {
  if (kind === 'resource') {
    const errors = validateResource({ ...item, status: 'published' }, validTopics)
    return [
      { label: '必填内容和链接格式完整', pass: errors.length === 0, detail: errors.join('；') },
      { label: '至少关联一个有效 canonical_topic', pass: (item.topic_tags || []).length > 0 && !(item.topic_tags || []).some((tag) => !validTopics.has(tag)) },
      { label: '已填写人工核验日期', pass: /^\d{4}-\d{2}-\d{2}$/.test(item.verified_at || '') },
    ]
  }
  if (kind === 'offering') return [
    { label: '招生章程为 HTTPS 官方链接', pass: /^https:\/\//.test(item.charter_url || '') },
    { label: '考试大纲为 HTTPS 官方链接', pass: /^https:\/\//.test(item.syllabus_url || '') },
    { label: '招生人数、地点、范围和科目完整', pass: Number(item.plan_count) > 0 && Boolean(item.training_site?.trim()) && Boolean(item.eligible_major_categories?.trim()) && (item.public_subjects || item.publicSubjects || []).length > 0 && (item.professional_subjects || item.professionalSubjects || []).length > 0 },
    { label: '已完成新年度官方文件核验', pass: /^\d{4}-\d{2}-\d{2}$/.test(item.verified_at || '') && item.source_status !== '等待新年度官方文件核验' },
  ]
  return [
    { label: '科目、章节和知识点名称完整', pass: Boolean(item.subject_slug && item.subject_name?.trim() && item.section_name?.trim() && item.point_title?.trim()) },
    { label: 'canonical_topic 格式有效', pass: /^[a-z0-9-]+$/.test(item.canonical_topic || '') },
    { label: '发布时存在同范围的已发布招生计划', pass: true, detail: '最终由数据库事务检查' },
  ]
}

export function canPublish(checks) { return checks.every((check) => check.pass) }

export function formatPublicationCheck(checks) {
  return checks.map((check) => `${check.pass ? '✓' : '✗'} ${check.label}${check.detail && !check.pass ? `：${check.detail}` : ''}`).join('\n')
}
