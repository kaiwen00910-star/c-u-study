// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { initializeAnalytics, isPublicTrackingPath, trackEvent, validBaiduSiteId } from './analytics'
import { FeedbackForm } from './FeedbackForm'
import { encodeFeedback, submitFeedback } from './feedbackApi'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('百度统计隐私边界', () => {
  it('只接受格式正常的站点 ID，并排除全部后台路由', () => {
    expect(validBaiduSiteId('0123456789abcdef0123456789abcdef')).toBe(true)
    expect(validBaiduSiteId('YOUR_BAIDU_TONGJI_SITE_ID')).toBe(false)
    expect(isPublicTrackingPath('/anhui/2026/computer-science')).toBe(true)
    expect(isPublicTrackingPath('/admin/login')).toBe(false)
  })

  it('测试环境未配置统计时事件调用静默失败且不影响功能', () => {
    expect(() => trackEvent('resource_favorited', 'res-c-1')).not.toThrow()
    expect(trackEvent('not-allowed', 'private text')).toBe(false)
  })

  it('统计脚本加载失败时不会抛错或阻断页面交互', () => {
    const append = vi.spyOn(document.head, 'appendChild').mockImplementation((node) => {
      node.onerror()
      return node
    })

    expect(() => initializeAnalytics('/schools', {
      production: true,
      siteId: '0123456789abcdef0123456789abcdef',
    })).not.toThrow()
    expect(append).toHaveBeenCalledTimes(1)
    expect(append.mock.calls[0][0]).toHaveAttribute('data-load-state', 'failed')

    const button = document.createElement('button')
    button.addEventListener('click', () => { button.dataset.clicked = 'true' })
    button.click()
    expect(button.dataset.clicked).toBe('true')
  })

  it('即使生产配置有效也不会在后台页面加载统计脚本', () => {
    const append = vi.spyOn(document.head, 'appendChild')
    expect(initializeAnalytics('/admin/login', {
      production: true,
      siteId: '0123456789abcdef0123456789abcdef',
    })).toBe(false)
    expect(append).not.toHaveBeenCalled()
  })
})

describe('Netlify Forms 内容反馈', () => {
  const fields = { feedbackType: '内容错误', pageUrl: 'https://example.test/sources', contextId: 'school:demo', description: '计划人数需要复核', contact: '' }

  it('只编码允许字段，不附加搜索词或其他浏览器信息', () => {
    const params = new URLSearchParams(encodeFeedback(fields))
    expect([...params.keys()].sort()).toEqual(['bot-field', 'contact', 'context_id', 'description', 'feedback_type', 'form-name', 'page_url'].sort())
    expect(params.get('form-name')).toBe('content-feedback')
  })

  it('服务返回失败时抛错，网络异常原样传递', async () => {
    await expect(submitFeedback(fields, vi.fn().mockResolvedValue({ ok: false, status: 503 }))).rejects.toThrow('HTTP 503')
    await expect(submitFeedback(fields, vi.fn().mockRejectedValue(new TypeError('offline')))).rejects.toThrow('offline')
  })

  it('空说明不能提交，连续点击只发送一次并显示成功', async () => {
    let resolveRequest
    const fetchMock = vi.fn(() => new Promise((resolve) => { resolveRequest = resolve }))
    vi.stubGlobal('fetch', fetchMock)
    render(<FeedbackForm contextId="resource:res-c-1" />)
    fireEvent.click(screen.getByText('内容纠错 / 链接失效'))
    const submit = screen.getByRole('button', { name: '提交反馈' })
    expect(submit).toBeDisabled()
    fireEvent.change(screen.getByLabelText('反馈说明'), { target: { value: '链接打不开' } })
    fireEvent.click(submit)
    fireEvent.submit(submit.closest('form'))
    expect(fetchMock).toHaveBeenCalledTimes(1)
    resolveRequest({ ok: true, status: 200 })
    await waitFor(() => expect(screen.getByText('提交成功，感谢你的反馈。')).toBeVisible())
  })

  it('区分服务失败和网络异常提示', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))
    const server = render(<FeedbackForm contextId="sources:demo" />)
    fireEvent.click(screen.getByText('内容纠错 / 链接失效'))
    fireEvent.change(screen.getByLabelText('反馈说明'), { target: { value: '资料过期' } })
    fireEvent.click(screen.getByRole('button', { name: '提交反馈' }))
    await waitFor(() => expect(screen.getByText(/反馈服务暂时不可用/)).toBeVisible())
    server.unmount()

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')))
    render(<FeedbackForm contextId="sources:demo" />)
    fireEvent.click(screen.getByText('内容纠错 / 链接失效'))
    fireEvent.change(screen.getByLabelText('反馈说明'), { target: { value: '链接失效' } })
    fireEvent.click(screen.getByRole('button', { name: '提交反馈' }))
    await waitFor(() => expect(screen.getByText(/网络异常/)).toBeVisible())
  })
})
