export function announcementStatus(item, now = new Date()) {
  if (!item?.enabled) return { key: 'draft', label: '草稿' }
  const current = now.getTime()
  const starts = item.starts_at ? new Date(item.starts_at).getTime() : Number.NEGATIVE_INFINITY
  const ends = item.ends_at ? new Date(item.ends_at).getTime() : Number.POSITIVE_INFINITY
  if (current < starts) return { key: 'scheduled', label: '待发布' }
  if (current >= ends) return { key: 'expired', label: '已过期' }
  return { key: 'active', label: '进行中' }
}

export function currentAnnouncement(items, now = new Date()) {
  return items.find((item) => announcementStatus(item, now).key === 'active') ?? null
}

