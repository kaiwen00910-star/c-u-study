// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { AdvancedInteractionsProvider, GlobalSearchTrigger, SchoolQuickPreviewButton } from './AdvancedInteractions'
import { Compare } from './App'
import { DEFAULT_SCOPE } from './contentScope'

const offering = {
  offering_id: 'demo-software', school_slug: 'demo', active: true, status: 'published', programNames: ['软件工程'], plan_count: 60,
  training_site: '示例学院蜀山校区（合肥市测试路 1 号）', publicSubjects: ['高等数学', '英语'], professionalSubjects: ['C语言程序设计', '数据结构'],
  charter_url: 'https://example.com/charter', syllabus_url: 'https://example.com/syllabus',
}
const school = {
  school_slug: 'demo', school_name: '示例学院', short_name: '示例', school_type: '公办', logo_url: '', verified_at: '2026-08-13',
  offerings: [offering], programNames: ['软件工程'], sites: [offering.training_site], publicSubjects: offering.publicSubjects,
  professionalSubjects: offering.professionalSubjects, totalPlan: 60,
}

function LocationProbe() {
  const location = useLocation()
  return <output aria-label="当前路径">{location.pathname}</output>
}

function renderInteractions(children) {
  return render(<MemoryRouter initialEntries={['/anhui/2026/all-programs']}><AdvancedInteractionsProvider schools={[school]} scope={DEFAULT_SCOPE}>{children}<LocationProbe /></AdvancedInteractionsProvider></MemoryRouter>)
}

afterEach(cleanup)

describe('高级搜索与院校快速预览', () => {
  it('支持 Ctrl+K 打开、按专业科目或培养地点搜索，并从键盘打开结果', async () => {
    renderInteractions(<GlobalSearchTrigger />)
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true })
    const dialog = screen.getByRole('dialog', { name: '全站快速搜索' })
    const input = within(dialog).getByRole('combobox')
    await waitFor(() => expect(input).toHaveFocus())

    fireEvent.change(input, { target: { value: '软件工程' } })
    expect(within(dialog).getByRole('option', { name: /软件工程.*示例学院/ })).toBeVisible()
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(screen.getByLabelText('当前路径')).toHaveTextContent('/anhui/2026/schools/demo')
    expect(screen.queryByRole('dialog', { name: '全站快速搜索' })).not.toBeInTheDocument()
  })

  it('弹窗支持 Escape 关闭并把焦点还给触发按钮', async () => {
    renderInteractions(<GlobalSearchTrigger />)
    const trigger = screen.getByRole('button', { name: /打开全站快速搜索/ })
    trigger.focus()
    fireEvent.click(trigger)
    expect(screen.getByRole('dialog', { name: '全站快速搜索' })).toHaveAttribute('aria-modal', 'true')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog', { name: '全站快速搜索' })).not.toBeInTheDocument()
    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it('院校快速预览保留招生概况，并提供专业地图与对比入口', () => {
    renderInteractions(<SchoolQuickPreviewButton school={school} />)
    fireEvent.click(screen.getByRole('button', { name: '快速预览示例学院' }))
    const dialog = screen.getByRole('dialog', { name: '示例学院快速预览' })
    expect(within(dialog).getByText('软件工程')).toBeVisible()
    expect(within(dialog).getByText(/蜀山校区/)).toBeVisible()
    expect(within(dialog).getByText('60')).toBeVisible()
    expect(within(dialog).getByRole('link', { name: '进入专业地图' })).toHaveAttribute('href', '/anhui/2026/schools/demo')
    expect(within(dialog).getByRole('link', { name: '进入院校对比' })).toHaveAttribute('href', '/anhui/2026/all-programs/compare?program=%E8%BD%AF%E4%BB%B6%E5%B7%A5%E7%A8%8B')
  })
})

describe('对比选择浮动抽屉', () => {
  it('集中显示已选方案，支持收起、展开和清空', () => {
    const secondSchool = { ...school, school_slug: 'demo-2', school_name: '第二学院' }
    const secondOffering = { ...offering, offering_id: 'demo-software-2', school_slug: 'demo-2', training_site: '第二学院新校区', plan_count: 40 }
    render(<MemoryRouter initialEntries={['/anhui/2026/all-programs/compare?program=软件工程']}><Compare offerings={[offering, secondOffering]} academicSchools={[school, secondSchool]} scope={DEFAULT_SCOPE} /></MemoryRouter>)
    fireEvent.click(screen.getAllByRole('button', { name: '加入对比' })[0])
    const tray = screen.getByLabelText('已选对比招生方案')
    expect(tray).toHaveClass('compare-selection-tray', 'is-expanded')
    fireEvent.click(within(tray).getByRole('button', { name: '收起' }))
    expect(within(tray).getByRole('button', { name: '展开' })).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(within(tray).getByRole('button', { name: '展开' }))
    fireEvent.click(within(tray).getByRole('button', { name: '清空选择' }))
    expect(screen.queryByLabelText('已选对比招生方案')).not.toBeInTheDocument()
  })
})
