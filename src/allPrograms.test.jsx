// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { Link, MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AnhuiHub, RouteScrollManager } from './App'
import { DEFAULT_SCOPE } from './contentScope'
import { fallbackAcademicSchools, offerings, schoolGroups, syllabus } from './data'
import { createSchoolWallSchools } from './schoolWallData'

afterEach(() => {
  cleanup()
  sessionStorage.clear()
  vi.restoreAllMocks()
})

const schools = [
  {
    school_slug: 'demo-anhui', school_name: '安徽示范大学', short_name: '安示大', school_type: '公办',
    theme_color: '#1767bd', publicSubjects: ['大学语文', '英语'], professionalSubjects: ['管理学原理', '基础会计学'],
    programNames: ['会计学'], sites: ['主校区'], eligible_major_categories: '财经商贸大类', totalPlan: 100,
    verified_at: '2026-10-01',
  },
  {
    school_slug: 'demo-hefei', school_name: '合肥示范学院', short_name: '合示院', school_type: '民办',
    theme_color: '#1767bd', publicSubjects: ['高等数学', '英语'], professionalSubjects: ['C语言程序设计', '计算机基础'],
    programNames: ['计算机科学与技术'], sites: ['新校区'], eligible_major_categories: '电子信息大类', totalPlan: 80,
    verified_at: '2026-10-01',
  },
]

const wallSchools = schools.map((school) => ({
  id: school.school_slug,
  schoolSlug: school.school_slug,
  name: school.school_name,
  shortName: school.short_name,
  schoolType: school.school_type,
  hasDetails: true,
}))

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="location">{`${location.pathname}${location.search}`}</output>
}

function renderHub(initialEntry = '/anhui/2026/all-programs') {
  return render(<MemoryRouter initialEntries={[initialEntry]}><Routes>
    <Route path="/anhui/2026/all-programs" element={<><AnhuiHub schools={schools} wallSchools={wallSchools} scope={DEFAULT_SCOPE} publishedScopes={[DEFAULT_SCOPE]} /><LocationProbe /></>} />
  </Routes></MemoryRouter>)
}

describe('全部院校专业地图筛选', () => {
  it('中文输入法组合输入期间不改写 URL，也不会重复字符', () => {
    renderHub()
    const input = screen.getByRole('searchbox', { name: '院校名称' })

    fireEvent.compositionStart(input)
    fireEvent.change(input, { target: { value: '安' } })
    expect(input).toHaveValue('安')
    expect(screen.getByTestId('location')).toHaveTextContent('/anhui/2026/all-programs')
    expect(screen.getByTestId('location')).not.toHaveTextContent('?q=')

    fireEvent.change(input, { target: { value: '安徽' } })
    fireEvent.compositionEnd(input)
    fireEvent.change(input, { target: { value: '安徽' } })
    expect(input).toHaveValue('安徽')
    expect(decodeURIComponent(screen.getByTestId('location').textContent)).toBe('/anhui/2026/all-programs?q=安徽')
    expect(screen.getByText('找到 1 所院校')).toBeVisible()
  })

  it('粘贴、删除、连续输入、清空及从 URL 恢复筛选均保持受控状态', () => {
    const { unmount } = renderHub('/anhui/2026/all-programs?q=%E5%90%88%E8%82%A5')
    const input = screen.getByRole('searchbox', { name: '院校名称' })
    expect(input).toHaveValue('合肥')
    expect(screen.getByText('找到 1 所院校')).toBeVisible()

    fireEvent.change(input, { target: { value: '安' } })
    fireEvent.change(input, { target: { value: '安徽' } })
    fireEvent.change(input, { target: { value: '安徽示' } })
    expect(input).toHaveValue('安徽示')
    expect(decodeURIComponent(screen.getByTestId('location').textContent)).toBe('/anhui/2026/all-programs?q=安徽示')

    fireEvent.change(input, { target: { value: '合肥' } })
    expect(input).toHaveValue('合肥')
    expect(screen.getByText('合肥示范学院')).toBeVisible()
    expect(screen.queryByText('安徽示范大学')).not.toBeInTheDocument()

    fireEvent.change(input, { target: { value: '' } })
    expect(input).toHaveValue('')
    expect(screen.getByText('找到 2 所院校')).toBeVisible()
    expect(screen.getByTestId('location')).not.toHaveTextContent('?q=')

    fireEvent.change(input, { target: { value: '安徽' } })
    fireEvent.click(screen.getByRole('button', { name: '清空筛选' }))
    expect(input).toHaveValue('')
    expect(screen.getByText('找到 2 所院校')).toBeVisible()
    unmount()
  })

  it('42 所院校汇总卡片不再重复显示培养地点', () => {
    const actualSchools = schoolGroups(offerings, fallbackAcademicSchools, DEFAULT_SCOPE, syllabus)
    const actualWallSchools = createSchoolWallSchools(fallbackAcademicSchools, offerings, syllabus, DEFAULT_SCOPE)
    const { container } = render(<MemoryRouter><AnhuiHub schools={actualSchools} wallSchools={actualWallSchools} scope={DEFAULT_SCOPE} publishedScopes={[DEFAULT_SCOPE]} /></MemoryRouter>)
    const cards = container.querySelectorAll('.school-card')
    expect(cards).toHaveLength(42)
    cards.forEach((card) => {
      expect(within(card).queryByText('培养地点')).not.toBeInTheDocument()
      expect(within(card).getByText('计划数')).toBeVisible()
      expect(within(card).getByRole('link', { name: '打开专业地图 →' })).toBeVisible()
    })
  })
})

function ScrollFixture() {
  const navigate = useNavigate()
  return <>
    <Link to="/anhui/2026/all-programs?q=安徽">只改搜索参数</Link>
    <Link to="/anhui/2026/schools/demo">打开院校专业地图</Link>
    <Link to="/anhui/2026/schools/demo#exam">打开合法锚点</Link>
    <button type="button" onClick={() => navigate(-1)}>后退</button>
  </>
}

describe('页面滚动恢复', () => {
  it('pathname 前进导航归零，搜索参数、锚点和浏览器后退不被强制归零', async () => {
    Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 640 })
    window.scrollTo = vi.fn(({ top }) => { window.scrollY = top })
    render(<MemoryRouter initialEntries={['/anhui/2026/all-programs']}><RouteScrollManager /><Routes>
      <Route path="*" element={<ScrollFixture />} />
    </Routes></MemoryRouter>)

    fireEvent.click(screen.getByRole('link', { name: '只改搜索参数' }))
    expect(window.scrollY).toBe(640)
    expect(window.scrollTo).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('link', { name: '打开院校专业地图' }))
    await waitFor(() => expect(window.scrollY).toBe(0))
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'instant' })

    window.scrollY = 420
    window.scrollTo.mockClear()
    fireEvent.click(screen.getByRole('button', { name: '后退' }))
    await waitFor(() => expect(window.scrollY).toBe(420))
    expect(window.scrollTo).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('link', { name: '打开合法锚点' }))
    await waitFor(() => expect(window.scrollY).toBe(420))
    expect(window.scrollTo).not.toHaveBeenCalled()
  })

  it('从院校专业地图返回时恢复原院校卡片位置和键盘焦点', async () => {
    Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 1380 })
    window.scrollTo = vi.fn(({ top }) => { window.scrollY = top })
    window.requestAnimationFrame = vi.fn((callback) => { callback(); return 1 })
    window.cancelAnimationFrame = vi.fn()

    function SchoolDetailFixture() {
      const navigate = useNavigate()
      const location = useLocation()
      return <><output data-testid="detail-state">{JSON.stringify(location.state)}</output><button type="button" onClick={() => navigate(-1)}>返回院校列表</button></>
    }

    render(<MemoryRouter initialEntries={['/anhui/2026/all-programs?q=%E5%90%88%E8%82%A5']}><Routes>
      <Route path="/anhui/2026/all-programs" element={<AnhuiHub schools={schools} wallSchools={wallSchools} scope={DEFAULT_SCOPE} publishedScopes={[DEFAULT_SCOPE]} />} />
      <Route path="/anhui/2026/schools/:schoolSlug" element={<SchoolDetailFixture />} />
    </Routes></MemoryRouter>)

    const card = screen.getByRole('heading', { name: '合肥示范学院' }).closest('article')
    fireEvent.click(within(card).getByRole('link', { name: '打开专业地图 →' }))
    expect(screen.getByTestId('detail-state')).toHaveTextContent('demo-hefei')
    expect(screen.getByTestId('detail-state')).toHaveTextContent('%E5%90%88%E8%82%A5')
    window.scrollY = 0
    window.scrollTo.mockClear()
    fireEvent.click(screen.getByRole('button', { name: '返回院校列表' }))

    await waitFor(() => expect(window.scrollTo).toHaveBeenCalledWith({ top: 1380, left: 0, behavior: 'instant' }))
    const restoredCard = screen.getByRole('heading', { name: '合肥示范学院' }).closest('article')
    expect(within(restoredCard).getByRole('link', { name: '打开专业地图 →' })).toHaveFocus()
    expect(sessionStorage.getItem('zsb:v1:schoolDirectoryReturn')).toBeNull()
  })
})
