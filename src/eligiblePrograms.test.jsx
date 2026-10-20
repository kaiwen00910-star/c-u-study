// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { EligiblePrograms } from './App'
import { fallbackAcademicSchools, offerings } from './data'
import { fallbackContentForScope } from './useContent'

function renderPage(path = '/anhui/2026/eligible-programs?major=%E8%AE%A1%E7%AE%97%E6%9C%BA%E5%BA%94%E7%94%A8%E6%8A%80%E6%9C%AF') {
  return render(<MemoryRouter initialEntries={[path]}><EligiblePrograms offerings={offerings} academicSchools={fallbackAcademicSchools} /></MemoryRouter>)
}

afterEach(cleanup)

describe('我能报哪些专业', () => {
  it('从 URL 恢复查询，并把招生点的考试方案分开呈现', () => {
    renderPage()
    expect(screen.getByDisplayValue('计算机应用技术')).toBeVisible()
    expect(screen.getAllByText(/找到 \d+ 条可能结果/)).toHaveLength(1)
    expect(screen.getAllByText('公共课').length).toBeGreaterThan(0)
    expect(screen.getAllByText('专业课').length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: /进入院校专业地图/ }).length).toBeGreaterThan(0)
  })

  it('清空查询后恢复初始状态', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: '清空' }))
    expect(screen.getByPlaceholderText('例如：计算机应用技术')).toHaveValue('')
    expect(screen.queryByText(/找到 \d+ 条可能结果/)).not.toBeInTheDocument()
  })

  it('静态公开快照在不使用在线数据时仍可查询', () => {
    const fallback = fallbackContentForScope({ year: 2026, provinceSlug: 'anhui', majorSlug: 'all-programs' })
    render(<MemoryRouter initialEntries={['/anhui/2026/eligible-programs?major=计算机应用技术']}><EligiblePrograms offerings={fallback.offerings} academicSchools={fallback.academicSchools} /></MemoryRouter>)
    expect(screen.getAllByText(/找到 \d+ 条可能结果/)).toHaveLength(1)
  })
})
