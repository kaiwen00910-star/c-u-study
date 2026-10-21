// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AnhuiHub, Compare, Favorites, LearningMap, SearchBox } from './App'
import { DEFAULT_SCOPE } from './contentScope'

const school = {
  school_slug: 'demo', school_name: '示例学院', short_name: '示例', school_type: '公办', theme_color: '#1556a6', sites: ['校本部'],
  publicSubjects: ['英语'], professionalSubjects: ['C语言程序设计'], totalPlan: 100, eligible_major_categories: '电子信息类',
  charter_url: 'https://example.com/charter', syllabus_url: 'https://example.com/syllabus', source_status: '正式章程', verified_at: '2026-08-13',
}
const englishPoint = { point_id: 'english-reading', year: 2026, province_slug: 'anhui', major_slug: 'computer-science', school_slug: 'common', subject_slug: 'english', subject_name: '英语', section_order: 1, section_name: '阅读', point_order: 1, point_title: '阅读理解', canonical_topic: 'english-reading', active: true }
const cPoint = { ...englishPoint, point_id: 'demo-pointer', school_slug: 'demo', subject_slug: 'c-language', subject_name: 'C语言程序设计', section_name: '指针', point_title: '函数与指针', canonical_topic: 'c-language-pointer' }

describe('搜索深链接和刷新恢复', () => {
  it('搜索结果携带院校、科目和知识点参数', () => {
    render(<MemoryRouter><SearchBox resources={[]} syllabusPoints={[cPoint]} schools={[school]} scope={DEFAULT_SCOPE} /></MemoryRouter>)
    fireEvent.change(screen.getByPlaceholderText(/搜索知识点/), { target: { value: '指针' } })
    expect(screen.getByRole('link', { name: /函数与指针/ })).toHaveAttribute('href', '/anhui/2026/schools/demo?subject=c-language&point=demo-pointer')
  })

  it('旧知识点深链接安全降级为院校专业地图且不公开学习内容', () => {
    const { container } = render(<MemoryRouter initialEntries={['/anhui/2026/computer-science/demo?subject=c-language&point=demo-pointer']}><Routes><Route path="/:provinceSlug/:year/:majorSlug/:schoolSlug" element={<LearningMap schools={[school]} scope={DEFAULT_SCOPE} />} /></Routes></MemoryRouter>)
    expect(screen.getByRole('heading', { name: '招生专业与培养点' })).toBeVisible()
    expect(screen.getByLabelText('全部招生专业考试方案')).toBeVisible()
    expect(container).not.toHaveTextContent('函数与指针')
    expect(container.querySelector('#point-demo-pointer')).toBeNull()
  })

  it('院校专业地图只在顶部保留两项官方资料，卡片仍完整展示招生方案', () => {
    const offering = { ...school, offering_id: 'map-offering', programNames: ['地图测试专业'], plan_count: 20, training_site: '测试校区', eligible_major_categories: '测试专科专业', publicSubjects: ['公共课测试'], professionalSubjects: ['专业课测试'] }
    const mapSchool = { ...school, offerings: [offering], programNames: ['地图测试专业'], sites: ['测试校区'] }
    const { container } = render(<MemoryRouter initialEntries={['/anhui/2026/schools/demo']}><Routes><Route path="/anhui/2026/schools/:schoolSlug" element={<LearningMap schools={[mapSchool]} scope={DEFAULT_SCOPE} />} /></Routes></MemoryRouter>)
    const title = container.querySelector('.school-title')
    expect(title.querySelector('.school-logo.large')).not.toBeNull()
    expect(title.querySelector('p')).toBeNull()
    expect(within(title).getAllByRole('link')).toHaveLength(2)
    expect(within(title).getByRole('link', { name: '招生章程' })).toBeVisible()
    expect(within(title).getByRole('link', { name: '考试大纲' })).toBeVisible()
    expect(screen.queryByText('内容纠错 / 链接失效')).not.toBeInTheDocument()
    const card = container.querySelector('.offering-detail-grid article')
    expect(within(card).queryByRole('link', { name: /招生章程|考纲/ })).toBeNull()
    expect(within(card).getByText('测试校区')).toBeVisible()
    expect(within(card).getByText('测试专科专业')).toBeVisible()
    expect(within(card).getByText('公共课测试')).toBeVisible()
    expect(within(card).getByText('专业课测试')).toBeVisible()
  })
})

describe('收藏、筛选和可选对比', () => {
  it('收藏页提示失效项目并允许清理', () => {
    const clearInvalid = vi.fn()
    render(<MemoryRouter><Favorites favorites={['missing']} resources={[]} toggleFavorite={vi.fn()} clearInvalid={clearInvalid} onImported={vi.fn()} scope={DEFAULT_SCOPE} /></MemoryRouter>)
    expect(screen.getByText('1 条收藏已失效')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: '清理失效收藏' }))
    expect(clearInvalid).toHaveBeenCalledWith(['missing'])
  })

  it('院校筛选写入 URL 并显示结果数量', () => {
    const wall = [{ id: 'demo', schoolSlug: 'demo', name: '示例学院', shortName: '示例', schoolType: '公办', hasDetails: true }]
    render(<MemoryRouter initialEntries={['/anhui/2026/computer-science']}><Routes><Route path="/:provinceSlug/:year/:majorSlug" element={<AnhuiHub schools={[school]} wallSchools={wall} scope={DEFAULT_SCOPE} publishedScopes={[DEFAULT_SCOPE]} />} /></Routes></MemoryRouter>)
    fireEvent.change(screen.getByLabelText('办学性质'), { target: { value: '民办' } })
    expect(screen.getByText('找到 0 所院校')).toBeVisible()
    expect(screen.getByText('没有匹配的院校')).toBeVisible()
  })

  it('按具体招生方案选择对比，并隔离不同考试方案', () => {
    const second = { ...school, school_slug: 'demo2', school_name: '第二学院', short_name: '第二' }
    const offerings = [
      { offering_id: 'demo-program-a', school_slug: 'demo', active: true, status: 'published', programNames: ['计算机科学与技术'], plan_count: 100, training_site: '校本部 A', eligible_major_categories: '计算机应用技术', publicSubjects: ['英语'], professionalSubjects: ['C语言'], charter_url: 'https://example.com/a', syllabus_url: 'https://example.com/a' },
      { offering_id: 'demo-program-b', school_slug: 'demo2', active: true, status: 'published', programNames: ['计算机科学与技术'], plan_count: 80, training_site: '校本部 B', eligible_major_categories: '软件技术', publicSubjects: ['英语'], professionalSubjects: ['数据结构'], charter_url: 'https://example.com/b', syllabus_url: 'https://example.com/b' },
    ]
    render(<MemoryRouter initialEntries={['/anhui/2026/computer-science/compare?program=计算机科学与技术']}><Compare offerings={offerings} academicSchools={[school, second]} scope={DEFAULT_SCOPE} /></MemoryRouter>)
    expect(screen.getByText(/再选择 2 条招生方案/)).toBeVisible()
    fireEvent.click(screen.getAllByRole('button', { name: '加入对比' })[0])
    fireEvent.click(screen.getAllByRole('button', { name: '加入对比' })[0])
    expect(screen.getByRole('table')).toBeVisible()
    const table = screen.getByRole('table')
    expect(within(table).getByText('C语言')).toBeVisible()
    expect(within(table).getByText('数据结构')).toBeVisible()
    expect(within(table).getByText('核心比较信息')).toBeVisible()
    expect(within(table).getByText('考试与报考要求')).toBeVisible()
    expect(within(table).getByText('官方资料')).toBeVisible()
    expect(within(table).queryByText('招生专业')).not.toBeInTheDocument()
    expect(within(table).getAllByText('100 人')[0]).toHaveClass('compare-plan')
    expect(document.querySelector('.mobile-compare-cards')).toBeTruthy()
  })
})
