// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { EligiblePrograms } from './App'
import { fallbackAcademicSchools, offerings } from './data'
import { findEligibleOfferings } from './eligibleMajorSearch'
import { fallbackContentForScope } from './useContent'

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="location">{`${location.pathname}${location.search}`}</output>
}

function HistoryControls() {
  const navigate = useNavigate()
  return <><button type="button" onClick={() => navigate(-1)}>后退测试</button><button type="button" onClick={() => navigate(1)}>前进测试</button></>
}

function renderPage(path = '/anhui/2026/eligible-programs') {
  return render(<MemoryRouter initialEntries={[path]}><EligiblePrograms offerings={offerings} academicSchools={fallbackAcademicSchools} /><LocationProbe /></MemoryRouter>)
}

afterEach(cleanup)

describe('我能报哪些专业两步查询', () => {
  it('必须先选择大学语文或高等数学方向', () => {
    renderPage()
    expect(screen.getByLabelText('当前专科专业名称')).toBeDisabled()
    expect(screen.queryByLabelText('查询结果')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('radio', { name: /文科方向/ }))
    expect(screen.getByLabelText('当前专科专业名称')).toBeEnabled()
  })

  it('从 URL 恢复科类和专科专业，并保持招生方案隔离', () => {
    renderPage('/anhui/2026/eligible-programs?track=science&major=大数据技术')
    expect(screen.getByRole('radio', { name: /理科方向/ })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByDisplayValue('大数据技术')).toBeVisible()
    const cards = screen.getByLabelText('查询结果').querySelectorAll(':scope > article')
    expect(cards.length).toBeGreaterThan(0)
    cards.forEach((card) => expect(within(card).getByText('高等数学、英语')).toBeVisible())
  })

  it('浏览器前进和后退可恢复科类与专科专业', () => {
    render(<MemoryRouter initialEntries={['/anhui/2026/eligible-programs?track=arts&major=护理', '/anhui/2026/eligible-programs?track=science&major=大数据技术']} initialIndex={1}><EligiblePrograms offerings={offerings} academicSchools={fallbackAcademicSchools} /><HistoryControls /></MemoryRouter>)
    expect(screen.getByDisplayValue('大数据技术')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: '后退测试' }))
    expect(screen.getByDisplayValue('护理')).toBeVisible()
    expect(screen.getByRole('radio', { name: /文科方向/ })).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(screen.getByRole('button', { name: '前进测试' }))
    expect(screen.getByDisplayValue('大数据技术')).toBeVisible()
    expect(screen.getByRole('radio', { name: /理科方向/ })).toHaveAttribute('aria-checked', 'true')
  })

  it('清空专业保留科类，并清理结果筛选', () => {
    renderPage('/anhui/2026/eligible-programs?track=science&major=大数据技术&level=possible&type=公办')
    fireEvent.click(screen.getByRole('button', { name: '清空专业' }))
    expect(screen.getByLabelText('当前专科专业名称')).toHaveValue('')
    const url = decodeURIComponent(screen.getByTestId('location').textContent)
    expect(url).toContain('track=science')
    expect(url).toContain('type=公办')
    expect(url).not.toContain('major=')
    expect(url).not.toContain('level=')
  })

  it('中文 composition 期间不改写 URL，结束后不重复输入', () => {
    renderPage('/anhui/2026/eligible-programs?track=science')
    const input = screen.getByLabelText('当前专科专业名称')
    fireEvent.compositionStart(input)
    fireEvent.change(input, { target: { value: '大' } })
    fireEvent.change(input, { target: { value: '大数据技术' } })
    expect(decodeURIComponent(screen.getByTestId('location').textContent)).toBe('/anhui/2026/eligible-programs?track=science')
    fireEvent.compositionEnd(input, { currentTarget: { value: '大数据技术' }, target: { value: '大数据技术' } })
    fireEvent.change(input, { target: { value: '大数据技术' } })
    expect(input).toHaveValue('大数据技术')
    expect(decodeURIComponent(screen.getByTestId('location').textContent)).toContain('major=大数据技术')
  })

  it('粘贴、删除、连续输入和建议替换保持受控', () => {
    renderPage('/anhui/2026/eligible-programs?track=science')
    const input = screen.getByLabelText('当前专科专业名称')
    fireEvent.change(input, { target: { value: '计算' } })
    fireEvent.change(input, { target: { value: '计算机' } })
    fireEvent.click(screen.getByRole('button', { name: '计算机应用技术' }))
    expect(input).toHaveValue('计算机应用技术')
    fireEvent.change(input, { target: { value: '' } })
    expect(input).toHaveValue('')
  })

  it('切换科类清理不再适用的匹配等级与本科专业筛选', () => {
    renderPage('/anhui/2026/eligible-programs?track=science&major=大数据技术&level=possible&program=计算机科学与技术&type=公办')
    fireEvent.click(screen.getByRole('radio', { name: /文科方向/ }))
    const url = decodeURIComponent(screen.getByTestId('location').textContent)
    expect(url).toContain('track=arts')
    expect(url).toContain('type=公办')
    expect(url).not.toContain('level=')
    expect(url).not.toContain('program=')
  })

  it('目录类别命中明确标为可能匹配，且首次只显示 24 条', () => {
    renderPage('/anhui/2026/eligible-programs?track=science&major=大数据技术')
    expect(screen.getByText('计算机类 · 电子与信息大类')).toBeVisible()
    expect(screen.getAllByText('专业目录类别可能匹配').length).toBeGreaterThan(0)
    const resultList = screen.getByLabelText('查询结果')
    expect(resultList.querySelectorAll(':scope > article')).toHaveLength(24)
    fireEvent.click(screen.getByRole('button', { name: /显示更多/ }))
    expect(resultList.querySelectorAll(':scope > article').length).toBeGreaterThan(24)
  })

  it('未收录专业只给科类范围参考，不标成明确可报', () => {
    renderPage('/anhui/2026/eligible-programs?track=arts&major=火星工程技术')
    expect(screen.getAllByText('仅公共课科类范围参考').length).toBeGreaterThan(0)
    const resultList = screen.getByLabelText('查询结果')
    expect(within(resultList).queryByText('专业名称明确匹配')).not.toBeInTheDocument()
    expect(within(resultList).queryByText('专业目录类别可能匹配')).not.toBeInTheDocument()
    expect(screen.getAllByText(/不能说明你的专科专业符合报考范围/).length).toBeGreaterThan(0)
  })

  it('指标来自当前筛选后的去重数据，切换筛选恢复首批结果', () => {
    renderPage('/anhui/2026/eligible-programs?track=science&major=火星工程技术')
    const expected = findEligibleOfferings({ offerings, academicSchools: fallbackAcademicSchools, major: '火星工程技术', track: 'science' })
    const metric = screen.getByLabelText('当前查询范围指标')
    expect(within(metric).getByText(String(new Set(expected.map((item) => item.offering_id)).size))).toBeVisible()
    expect(within(metric).getByText(String(new Set(expected.map((item) => item.school_slug)).size))).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: /显示更多/ }))
    fireEvent.change(screen.getByLabelText('院校性质'), { target: { value: '公办' } })
    expect(screen.getByLabelText('查询结果').querySelectorAll(':scope > article').length).toBeLessThanOrEqual(24)
  })

  it('结果卡片显示校徽且不再重复报考专业范围原文', () => {
    renderPage('/anhui/2026/eligible-programs?track=science&major=火星工程技术')
    expect(screen.queryByText('资格说明')).not.toBeInTheDocument()
    const firstCard = screen.getByLabelText('查询结果').querySelector('article')
    expect(within(firstCard).getByRole('img', { name: /校徽/ })).toBeVisible()
    expect(within(firstCard).queryByText('报考专业范围原文')).not.toBeInTheDocument()
  })

  it('静态公开快照在不使用在线数据时仍可查询', () => {
    const fallback = fallbackContentForScope({ year: 2026, provinceSlug: 'anhui', majorSlug: 'all-programs' })
    render(<MemoryRouter initialEntries={['/anhui/2026/eligible-programs?track=science&major=大数据技术']}><EligiblePrograms offerings={fallback.offerings} academicSchools={fallback.academicSchools} /></MemoryRouter>)
    expect(screen.getByLabelText('查询结果')).toBeVisible()
  })
})
