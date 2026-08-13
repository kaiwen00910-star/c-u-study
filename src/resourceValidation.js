export const ADMIN_EMAIL = '3130708522@qq.com'

export function validateResource(resource, validTopics) {
  const errors = []
  const required = ['resource_id', 'title', 'platform', 'creator', 'url', 'resource_type', 'difficulty', 'duration_text', 'recommendation_reason', 'verified_at']
  required.forEach((field) => { if (!String(resource[field] ?? '').trim()) errors.push(`${field} 不能为空`) })
  if (!String(resource.url || '').startsWith('https://')) errors.push('链接必须使用 HTTPS')
  const resourceUrl = String(resource.url || '')
  let parsedUrl = null
  try {
    parsedUrl = new URL(resourceUrl)
  } catch {
    // 必填与 HTTPS 校验会给出面向用户的错误提示。
  }
  if (parsedUrl && (parsedUrl.hostname.startsWith('search.') || /\/search(?:\.htm)?(?:[/?]|$)/.test(parsedUrl.pathname))) {
    errors.push('不能保存搜索结果页，请填写具体课程或视频')
  }
  const isBilibili = resource.platform === '哔哩哔哩' || parsedUrl?.hostname.endsWith('bilibili.com')
  if (isBilibili && !/^https:\/\/www\.bilibili\.com\/video\/(?:BV[\w]+|av\d+)\/?$/.test(resourceUrl)) errors.push('请填写规范的哔哩哔哩具体视频链接')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(resource.verified_at || '')) errors.push('核验日期格式应为 YYYY-MM-DD')
  if (!Number.isInteger(Number(resource.priority)) || Number(resource.priority) < 1) errors.push('优先级必须是大于 0 的整数')
  if (!['active', 'inactive'].includes(resource.status)) errors.push('资源状态无效')
  const tags = Array.isArray(resource.topic_tags) ? resource.topic_tags : String(resource.topic_tags || '').split('|').filter(Boolean)
  if (!tags.length) errors.push('至少选择一个知识点标签')
  tags.forEach((tag) => { if (!validTopics.has(tag)) errors.push(`未知知识点标签：${tag}`) })
  return errors
}

export function validateAnnouncement(item) {
  const errors = []
  if (!String(item.title || '').trim()) errors.push('公告标题不能为空')
  if (!String(item.content || '').trim()) errors.push('公告内容不能为空')
  if (item.starts_at && item.ends_at && new Date(item.ends_at) <= new Date(item.starts_at)) errors.push('结束时间必须晚于开始时间')
  return errors
}
