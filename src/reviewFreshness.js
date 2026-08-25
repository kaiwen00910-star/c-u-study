const DAY_MS = 24 * 60 * 60 * 1000

export function isReviewOverdue(date, now = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ''))) return false
  const verifiedAt = new Date(`${date}T00:00:00Z`)
  return now.getTime() - verifiedAt.getTime() > 90 * DAY_MS
}

export function latestVerifiedDate(items) {
  return items.map((item) => item.verified_at).filter(Boolean).sort().at(-1) || ''
}
