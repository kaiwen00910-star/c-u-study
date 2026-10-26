// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { initializeAnalytics, isPublicTrackingPath, trackEvent, validBaiduSiteId } from './analytics'

afterEach(() => {
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
