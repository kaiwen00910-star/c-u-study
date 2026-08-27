export const REVIEW_STALE_DAYS = 90
export const REVIEW_TIME_ZONE = 'Asia/Shanghai'

function isDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))
}

function dateInReviewTimeZone(now) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: REVIEW_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]))
  return `${values.year}-${values.month}-${values.day}`
}

function daysBefore(date, days) {
  const result = new Date(`${date}T12:00:00Z`)
  result.setUTCDate(result.getUTCDate() - days)
  return result.toISOString().slice(0, 10)
}

export function isReviewOverdue(date, now = new Date()) {
  if (!isDate(date)) return false
  return date < daysBefore(dateInReviewTimeZone(now), REVIEW_STALE_DAYS)
}

export function isStaleReview(date, now = new Date()) {
  return !isDate(date) || isReviewOverdue(date, now)
}

export function latestVerifiedDate(items) {
  return items.map((item) => item.verified_at).filter(Boolean).sort().at(-1) || ''
}
