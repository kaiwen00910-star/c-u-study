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
  it('提供专业地图入口且不再显示收藏资源，并可通过 Esc 或菜单项关闭', () => {
    render(<MemoryRouter><MobileNavigation favoritesCount={3} /></MemoryRouter>)
    const trigger = screen.getByRole('button', { name: /更多/ })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('link', { name: '院校与专业' })).toBeVisible()
    expect(screen.getByRole('link', { name: '院校对比' })).toBeVisible()
    expect(screen.getByRole('link', { name: '资料来源' })).toBeVisible()
    expect(screen.queryByText(/我的收藏/)).not.toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('navigation', { name: '移动端导航' })).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()

    fireEvent.click(trigger)
    fireEvent.click(screen.getByRole('link', { name: '资料来源' }))
    expect(screen.queryByRole('navigation', { name: '移动端导航' })).not.toBeInTheDocument()
  })
})

describe('专业地图与学习内容下线状态', () => {
  beforeEach(() => localStorage.clear())

  it('展示院校考试科目但不展示知识点与学习进度', () => {
    renderLearningMap([
      point({ subject_slug: 'english', subject_name: '英语' }),
      point({ point_id: 'c-basic', subject_slug: 'c-language', subject_name: 'C语言程序设计', point_title: '数据类型', canonical_topic: 'c-language-basic' }),
    ])
    expect(screen.getAllByText('C语言程序设计').length).toBeGreaterThanOrEqual(1)
    expect(screen.queryByText('阅读理解')).not.toBeInTheDocument()
    expect(screen.queryByText(/学习进度/)).not.toBeInTheDocument()
    expect(screen.queryByText('高等数学')).not.toBeInTheDocument()
  })

  it('院校没有知识点时仍正常显示专业考试方案', () => {
    renderLearningMap([])
    expect(screen.getAllByRole('heading', { name: '招生专业与培养点' }).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByLabelText('全部招生专业考试方案').length).toBeGreaterThanOrEqual(1)
    expect(screen.queryByRole('heading', { name: '选择招生专业 / 考试方案' })).not.toBeInTheDocument()
    expect(screen.queryByText(/知识点与学习资源/)).not.toBeInTheDocument()
  })
})

describe('后台复核提醒', () => {
  it('最后核验日期超过 90 天时显示建议复核', () => {
    render(<ReviewDate date="2026-01-01" now={new Date('2026-04-02T00:00:00Z')} />)
    expect(screen.getByText('2026-01-01')).toBeVisible()
    expect(screen.getByText('建议复核')).toBeVisible()
  })
})
