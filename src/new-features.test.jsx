// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen } from '@testing-library/react'
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
    expect(screen.getByRole('link', { name: /函数与指针/ })).toHaveAttribute('href', '/anhui/2026/computer-science/demo?subject=c-language&point=demo-pointer')
  })

  it('直接打开深链接会选择科目并短暂高亮目标；错误参数安全降级', () => {
    const first = render(<MemoryRouter initialEntries={['/anhui/2026/computer-science/demo?subject=c-language&point=demo-pointer']}><Routes><Route path="/:provinceSlug/:year/:majorSlug/:schoolSlug" element={<LearningMap favorites={[]} toggleFavorite={vi.fn()} resources={[]} schools={[school]} syllabusPoints={[englishPoint, cPoint]} scope={DEFAULT_SCOPE} />} /></Routes></MemoryRouter>)
    expect(screen.getByRole('tab', { name: 'C语言程序设计' })).toHaveAttribute('aria-selected', 'true')
    expect(document.getElementById('point-demo-pointer')).toHaveClass('target-highlight')
    first.unmount()
    render(<MemoryRouter initialEntries={['/anhui/2026/computer-science/demo?subject=bad&point=missing']}><Routes><Route path="/:provinceSlug/:year/:majorSlug/:schoolSlug" element={<LearningMap favorites={[]} toggleFavorite={vi.fn()} resources={[]} schools={[school]} syllabusPoints={[englishPoint, cPoint]} scope={DEFAULT_SCOPE} />} /></Routes></MemoryRouter>)
    expect(screen.getByRole('tab', { name: '英语' })).toHaveAttribute('aria-selected', 'true')
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

  it('至少选择两所才显示对比表且选择保存在 URL', () => {
    const second = { ...school, school_slug: 'demo2', school_name: '第二学院', short_name: '第二', totalPlan: 80, professionalSubjects: ['数据结构'] }
    render(<MemoryRouter initialEntries={['/anhui/2026/computer-science/compare']}><Compare schools={[school, second]} scope={DEFAULT_SCOPE} /></MemoryRouter>)
    expect(screen.getByText(/再选择 2 所院校/)).toBeVisible()
    fireEvent.click(screen.getByLabelText('示例学院'))
    fireEvent.click(screen.getByLabelText('第二学院'))
    expect(screen.getByRole('table')).toBeVisible()
  })
})
