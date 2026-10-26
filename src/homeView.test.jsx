// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Home } from './App'
import { DEFAULT_SCOPE } from './contentScope'

const wallSchools = [{
  id: 'demo',
  school_slug: 'demo',
  school_name: '示例学院',
  short_name: '示例',
  logo_url: '',
  hasDetails: true,
}]

describe('首页首屏精简', () => {
  beforeEach(() => {
    const storedValues = new Map()
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key) => storedValues.get(key) ?? null),
      setItem: vi.fn((key, value) => storedValues.set(key, String(value))),
      removeItem: vi.fn((key) => storedValues.delete(key)),
    })
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })
  })

  it('删除信任文案、统计长条和英文栏目装饰，保留中文核心内容', () => {
    const { container } = render(<MemoryRouter><Home wallSchools={wallSchools} schoolCount={1} scope={DEFAULT_SCOPE} /></MemoryRouter>)

    expect(screen.queryByText('官方来源可核验')).not.toBeInTheDocument()
    expect(screen.queryByText('免费公开使用')).not.toBeInTheDocument()
    expect(screen.queryByText('专注安徽')).not.toBeInTheDocument()
    expect(container.querySelector('.hero-stats')).not.toBeInTheDocument()
    expect(screen.queryByText('OFFICIAL NOTICE')).not.toBeInTheDocument()
    expect(screen.queryByText('OFFICIAL SCHEDULE')).not.toBeInTheDocument()
    expect(screen.queryByText('ANHUI EXAM PATH · 2026')).not.toBeInTheDocument()
    expect(screen.getByText('安徽专升本 · 2026')).toBeVisible()
    expect(screen.getByRole('heading', { name: '2026 年普通高校专升本公共课合格线' })).toBeVisible()
    expect(screen.getByRole('heading', { name: '专升本关键时间线' })).toBeVisible()
  })
})
