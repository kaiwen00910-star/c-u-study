// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Home, LearningMap, MobileNavigation } from './App'
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
    expect(screen.getByRole('link', { name: /安徽省招生考试院/ })).toHaveAttribute('href', 'https://www.ahzsks.cn/zyyx/')
    expect(screen.getByRole('link', { name: /安徽省招生考试院/ })).toHaveAttribute('target', '_blank')
    expect(screen.queryByText(/我的收藏/)).not.toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('navigation', { name: '移动端导航' })).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()

    fireEvent.click(trigger)
    fireEvent.click(screen.getByRole('link', { name: '资料来源' }))
    expect(screen.queryByRole('navigation', { name: '移动端导航' })).not.toBeInTheDocument()
  })
})

describe('首页公共课合格线与时间线', () => {
  it('展示普通类文理科公共课合格线和完整的已核验时间线', () => {
    const { unmount } = render(<MemoryRouter><Home wallSchools={[]} schoolCount={0} scope={DEFAULT_SCOPE} /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: '2026 年普通高校专升本公共课合格线' })).toBeVisible()
    expect(screen.getByText('文科')).toBeVisible()
    expect(screen.getByText('130')).toBeVisible()
    expect(screen.getByText('理科')).toBeVisible()
    expect(screen.getByText('80')).toBeVisible()
    expect(screen.getByText('本页仅展示普通类公共课合格线。')).toBeVisible()
    expect(screen.getByText(/公共课合格线不等同于院校专业实际录取分数/)).toBeVisible()
    const publicationLine = screen.getByText('官方发布日期：2026 年 5 月 8 日')
    const sourceLink = screen.getByRole('link', { name: /安徽省教育招生考试院《安徽省2026年普通高校专升本公共课合格线公布》/ })
    expect(sourceLink).toHaveAttribute('href', 'https://www.ahzsks.cn/zyyx/8879.htm')
    expect(sourceLink.closest('p')).toHaveTextContent(/^来源：/)
    expect(sourceLink.closest('p')).not.toBe(publicationLine)
    expect(screen.getByRole('heading', { name: '专升本关键时间线' })).toBeVisible()
    const timeline = screen.getByRole('list', { name: '2026 年安徽普通专升本关键时间节点' })
    expect(timeline).toBeVisible()
    const timelineNodes = within(timeline).getAllByRole('button', { expanded: false })
    expect(timelineNodes).toHaveLength(13)
    expect(timelineNodes[0]).toHaveAccessibleName('1 月 30 日，考试招生工作安排发布')
    expect(timelineNodes[1]).toHaveAccessibleName('3 月下旬，院校章程与考纲集中发布')
    expect(timelineNodes[2]).toHaveAccessibleName('3 月 23—27 日，网上报名与首次志愿')
    expect(screen.queryByText('时间待官方公布')).not.toBeInTheDocument()
    expect(screen.getByText('3 月 23—27 日')).toBeVisible()
    expect(screen.getByText('3 月 28 日 12:00')).toBeVisible()
    expect(screen.getByText('3 月 29 日 17:00')).toBeVisible()
    expect(screen.getByText('4 月 11 日起')).toBeVisible()
    expect(screen.getByText('4 月 18 日')).toBeVisible()
    expect(screen.getByText('5 月 27—28 日')).toBeVisible()
    expect(screen.getByText('7 月下旬—8 月上旬')).toBeVisible()
    expect(screen.queryByRole('heading', { name: '只做安徽专升本，把招生信息做深、做准' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '从择校到备考，一站理清' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '开始前，你可能想知道' })).not.toBeInTheDocument()
    unmount()
  })

    it('按上六下七双行排列，并在悬浮或点按时显示详情 tooltip', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-04-14T16:30:00+08:00'))
      const { container, unmount } = render(<MemoryRouter><Home wallSchools={[]} schoolCount={0} scope={DEFAULT_SCOPE} /></MemoryRouter>)
      const timeline = screen.getByRole('list', { name: '2026 年安徽普通专升本关键时间节点' })
      const examNode = within(timeline).getByRole('button', { name: /公共课统考/ })
      expect(examNode).toHaveAttribute('aria-expanded', 'false')
      expect(container.querySelector('.timeline-step')).not.toBeInTheDocument()
      expect(container.querySelectorAll('.timeline-row-1')).toHaveLength(6)
      expect(container.querySelectorAll('.timeline-row-2')).toHaveLength(7)
      expect(new Set([...container.querySelectorAll('.timeline-row-1')].map((node) => node.style.getPropertyValue('--timeline-y'))).size).toBe(1)
      expect(new Set([...container.querySelectorAll('.timeline-row-2')].map((node) => node.style.getPropertyValue('--timeline-y'))).size).toBe(1)
      const firstRowY = Number.parseFloat(container.querySelector('.timeline-row-1').style.getPropertyValue('--timeline-y'))
      const secondRowY = Number.parseFloat(container.querySelector('.timeline-row-2').style.getPropertyValue('--timeline-y'))
      expect(secondRowY - firstRowY).toBeGreaterThanOrEqual(170)
      const secondRowX = [...container.querySelectorAll('.timeline-row-2')].map((node) => Number.parseFloat(node.style.getPropertyValue('--timeline-x')))
      expect(secondRowX.every((value, index) => index === 0 || value < secondRowX[index - 1])).toBe(true)
      const progressDot = container.querySelector('.timeline-progress-dot')
      expect(progressDot).toBeInTheDocument()
      expect(progressDot.style.getPropertyValue('--timeline-progress')).toBe('50%')
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
      expect(within(examNode).queryByText(/专业课由各校/)).not.toBeInTheDocument()

      fireEvent.mouseEnter(examNode)
      expect(screen.getByRole('tooltip')).toBeVisible()
      expect(examNode.parentElement.querySelector('[role="tooltip"]')).toBe(screen.getByRole('tooltip'))
      expect(progressDot.style.getPropertyValue('--timeline-progress')).toBe('50%')
      expect(screen.getByText('公共课统考', { selector: '.timeline-tooltip strong' })).toBeVisible()
      expect(screen.getByText(/大学语文或高等数学为 9:00—11:00/)).toBeVisible()
      fireEvent.mouseLeave(examNode)
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

      fireEvent.click(examNode)
      expect(examNode).toHaveAttribute('aria-expanded', 'true')
      expect(screen.getByRole('tooltip')).toBeVisible()
      expect(screen.queryByText('核验来源 ↗')).not.toBeInTheDocument()
      expect(container.querySelector('.notice-strip')).not.toBeInTheDocument()

      fireEvent.click(examNode)
      expect(examNode).toHaveAttribute('aria-expanded', 'false')
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
      unmount()
      vi.useRealTimers()
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
