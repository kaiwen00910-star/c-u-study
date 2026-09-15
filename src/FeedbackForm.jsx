import { useRef, useState } from 'react'
import { trackEvent } from './analytics'
import { FEEDBACK_FORM_NAME, submitFeedback } from './feedbackApi'

export function FeedbackForm({ contextId = '', compact = false }) {
  const [feedbackType, setFeedbackType] = useState('链接失效')
  const [description, setDescription] = useState('')
  const [contact, setContact] = useState('')
  const [botField, setBotField] = useState('')
  const [state, setState] = useState('idle')
  const submittingRef = useRef(false)

  async function handleSubmit(event) {
    event.preventDefault()
    if (submittingRef.current || !description.trim()) return
    submittingRef.current = true
    setState('submitting')
    try {
      await submitFeedback({
        feedbackType,
        pageUrl: window.location.href.split('#', 1)[0],
        contextId,
        description: description.trim(),
        contact: contact.trim(),
        botField,
      })
      setDescription('')
      setContact('')
      setState('success')
      trackEvent('content_feedback_submitted', contextId)
    } catch (error) {
      setState(error instanceof TypeError ? 'network-error' : 'server-error')
    } finally {
      submittingRef.current = false
    }
  }

  return <details className={`feedback-panel ${compact ? 'compact' : ''}`}>
    <summary>内容纠错 / 链接失效</summary>
    <form name={FEEDBACK_FORM_NAME} method="POST" data-netlify="true" data-netlify-honeypot="bot-field" onSubmit={handleSubmit}>
      <input type="hidden" name="form-name" value={FEEDBACK_FORM_NAME} />
      <input type="hidden" name="page_url" value={typeof window === 'undefined' ? '' : window.location.href.split('#', 1)[0]} />
      <input type="hidden" name="context_id" value={contextId} />
      <label className="feedback-honeypot">请勿填写<input name="bot-field" value={botField} onChange={(event) => setBotField(event.target.value)} tabIndex="-1" autoComplete="off" /></label>
      <label>反馈类型<select name="feedback_type" value={feedbackType} onChange={(event) => setFeedbackType(event.target.value)}>
        <option>链接失效</option><option>内容错误</option><option>资料过期</option><option>建议补充</option>
      </select></label>
      <label>反馈说明<textarea name="description" required maxLength="500" rows="4" value={description} onChange={(event) => { setDescription(event.target.value); if (state !== 'idle') setState('idle') }} placeholder="请简要说明问题（最多 500 字）" /></label>
      <label>联系方式（选填）<input name="contact" maxLength="120" value={contact} onChange={(event) => setContact(event.target.value)} placeholder="邮箱、手机号或其他联系方式" /></label>
      <div className="feedback-actions"><small>{description.length} / 500</small><button type="submit" disabled={state === 'submitting' || !description.trim()}>{state === 'submitting' ? '正在提交…' : '提交反馈'}</button></div>
      <div className="feedback-status" aria-live="polite">
        {state === 'success' && <p className="success">提交成功，感谢你的反馈。</p>}
        {state === 'server-error' && <p className="error">提交失败，反馈服务暂时不可用，请稍后重试。</p>}
        {state === 'network-error' && <p className="error">网络异常，未能提交；请检查网络后重试。</p>}
      </div>
    </form>
  </details>
}
