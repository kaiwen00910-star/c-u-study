export const FEEDBACK_FORM_NAME = 'content-feedback'

export function encodeFeedback(fields) {
  return new URLSearchParams({
    'form-name': FEEDBACK_FORM_NAME,
    feedback_type: fields.feedbackType,
    page_url: fields.pageUrl,
    context_id: fields.contextId || '',
    description: fields.description,
    contact: fields.contact || '',
    'bot-field': fields.botField || '',
  }).toString()
}

export async function submitFeedback(fields, fetchImpl = fetch) {
  const response = await fetchImpl('/__forms.html', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: encodeFeedback(fields),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
}
