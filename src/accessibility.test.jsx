// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SchoolLogoWall } from './App'
import { DEFAULT_SCOPE } from './contentScope'
import { fallbackAcademicSchools, offerings, syllabus } from './data'
import { createSchoolWallSchools } from './schoolWallData'

const wallSchools = createSchoolWallSchools(fallbackAcademicSchools, offerings, syllabus, DEFAULT_SCOPE)

function setReducedMotion(matches) {
  window.matchMedia = vi.fn().mockReturnValue({
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })
}

describe('首页院校墙键盘导航', () => {
  beforeEach(() => setReducedMotion(false))

  it('动画模式只有三所已开放院校生成可聚焦链接，复制轨道不生成链接', () => {
    const { container } = render(<BrowserRouter><SchoolLogoWall schools={wallSchools} /></BrowserRouter>)
    expect(container.querySelectorAll('a.wall-school-card')).toHaveLength(3)
    expect(container.querySelectorAll('[aria-hidden="true"] a')).toHaveLength(0)
  })

  it('减少动态效果模式只渲染一组可交互院校，不保留动画组重复焦点', () => {
    setReducedMotion(true)
    const { container } = render(<BrowserRouter><SchoolLogoWall schools={wallSchools} /></BrowserRouter>)
    expect(container.querySelectorAll('.logo-track')).toHaveLength(0)
    expect(container.querySelectorAll('a.wall-school-card')).toHaveLength(3)
  })
})
