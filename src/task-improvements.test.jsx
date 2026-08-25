// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LearningMap, MobileNavigation } from './App'
import { DEFAULT_SCOPE } from './contentScope'
import { ReviewDate } from './ReviewDate'

const memoryStorage = (() => {
  let values = {}
  return {
    clear: () => { values = {} },
    getItem: (key) => values[key] ?? null,
    setItem: (key, value) => { values[key] = String(value) },
    removeItem: (key) => { delete values[key] },
  }
})()
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: memoryStorage })

const school = {
  school_slug: 'demo', school_name: '示例学院', short_name: '示例', school_type: '公办', theme_color: '#1556a6',
  sites: ['校本部'], publicSubjects: ['英语'], professionalSubjects: ['C语言程序设计'],
  charter_url: 'https://example.com/charter', syllabus_url: 'https://example.com/syllabus', source_status: '正式章程', verified_at: '2026-08-13',
}

function point(overrides) {
  return {
    point_id: 'english-reading', year: 2026, province_slug: 'anhui', major_slug: 'computer-science', school_slug: 'demo',
    subject_slug: 'english', subject_name: '英语', section_order: 1, section_name: '阅读', point_order: 1,
    point_title: '阅读理解', canonical_topic: 'english-reading', active: true, ...overrides,
  }
}

function renderLearningMap(syllabusPoints) {
  return render(<MemoryRouter initialEntries={['/anhui/2026/computer-science/demo']}>
    <Routes><Route path="/:provinceSlug/:year/:majorSlug/:schoolSlug" element={<LearningMap favorites={[]} toggleFavorite={vi.fn()} resources={[]} schools={[school]} syllabusPoints={syllabusPoints} scope={DEFAULT_SCOPE} />} /></Routes>
  </MemoryRouter>)
}

describe('移动端更多菜单', () => {
  it('提供全部入口、收藏数量，并可通过 Esc 或菜单项关闭', () => {
    render(<MemoryRouter><MobileNavigation favoritesCount={3} /></MemoryRouter>)
    const trigger = screen.getByRole('button', { name: /更多/ })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('link', { name: '院校与专业' })).toBeVisible()
    expect(screen.getByRole('link', { name: '院校对比' })).toBeVisible()
    expect(screen.getByRole('link', { name: '资料来源' })).toBeVisible()
    expect(screen.getByLabelText('已收藏 3 条资源')).toBeVisible()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('navigation', { name: '移动端导航' })).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()

    fireEvent.click(trigger)
    fireEvent.click(screen.getByRole('link', { name: '资料来源' }))
    expect(screen.queryByRole('navigation', { name: '移动端导航' })).not.toBeInTheDocument()
  })
})

describe('学习地图科目选择与空状态', () => {
  beforeEach(() => localStorage.clear())

  it('默认选择院校实际存在的第一个科目，而不是固定高等数学', () => {
    renderLearningMap([
      point({ subject_slug: 'english', subject_name: '英语' }),
      point({ point_id: 'c-basic', subject_slug: 'c-language', subject_name: 'C语言程序设计', point_title: '数据类型', canonical_topic: 'c-language-basic' }),
    ])
    expect(screen.getByRole('tab', { name: '英语' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('heading', { name: '英语', level: 2 })).toBeVisible()
    expect(screen.queryByText('高等数学')).not.toBeInTheDocument()
  })

  it('院校没有可展示考纲时说明原因并提供返回入口', () => {
    renderLearningMap([])
    expect(screen.getByRole('heading', { name: '该院校暂无可展示考纲' })).toBeVisible()
    expect(screen.getByText(/官方考纲暂未发布/)).toBeVisible()
    expect(screen.getByRole('link', { name: '返回院校列表' })).toHaveAttribute('href', '/anhui/2026/computer-science')
  })
})

describe('后台复核提醒', () => {
  it('最后核验日期超过 90 天时显示建议复核', () => {
    render(<ReviewDate date="2026-01-01" now={new Date('2026-04-02T00:00:00Z')} />)
    expect(screen.getByText('2026-01-01')).toBeVisible()
    expect(screen.getByText('建议复核')).toBeVisible()
  })
})
