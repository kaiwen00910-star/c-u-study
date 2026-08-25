import { isReviewOverdue } from './reviewFreshness'

export function ReviewDate({ date, now }) {
  const overdue = isReviewOverdue(date, now)
  return <span className="admin-review-date">
    {date ? <time dateTime={date}>{date}</time> : <span>未记录</span>}
    {overdue && <span className="admin-review-warning">建议复核</span>}
  </span>
}
