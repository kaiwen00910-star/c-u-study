// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AnhuiHub, Compare, Favorites, LearningMap, SearchBox } from './App'
import { DEFAULT_SCOPE } from './contentScope'

const school = {
  school_slug: 'demo', school_name: '示例学院', short_name: '示例', school_type: '公办', theme_color: '#1556a6', sites: ['校本部'],
  logo_url: 'https://example.com/demo-logo.png',
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
    const offering = { ...school, offering_id: 'map-offering', programNames: ['地图测试专业'], plan_count: 20, training_site: '测试校区', eligible_major_categories: '测试专科专业', publicSubjects: ['公共课测试'], professionalSubjects: ['专业课测试'], scores: [{ score_id: 1, program_name: '地图测试专业', candidate_category: 'ordinary', score_type: 'actual_admission_minimum', score: 312.5, source_published_at: '2026-05-20', source_url: 'https://example.com/score' }] }
    const noScoreOffering = { ...school, offering_id: 'map-offering-no-score', programNames: ['无分数专业'], plan_count: 10, training_site: '第二培养点', eligible_major_categories: '另一测试专业', publicSubjects: ['大学语文', '英语'], professionalSubjects: ['管理学', '会计学'], scores: [] }
    const mapSchool = { ...school, offerings: [offering, noScoreOffering], programNames: ['地图测试专业', '无分数专业'], sites: ['测试校区', '第二培养点'] }
    const { container } = render(<MemoryRouter initialEntries={['/anhui/2026/schools/demo']}><Routes><Route path="/anhui/2026/schools/:schoolSlug" element={<LearningMap schools={[mapSchool]} scope={DEFAULT_SCOPE} />} /></Routes></MemoryRouter>)
    const title = container.querySelector('.school-title')
    expect(title.querySelector('.school-logo.large')).not.toBeNull()
    expect(title.querySelector('p')).toBeNull()
    expect(within(title).getAllByRole('link')).toHaveLength(2)
    expect(within(title).getByRole('link', { name: '招生章程' })).toBeVisible()
    expect(within(title).getByRole('link', { name: '考试大纲' })).toBeVisible()
    expect(screen.queryByText('内容纠错 / 链接失效')).not.toBeInTheDocument()
    const cards = container.querySelectorAll('.offering-detail-grid article')
    expect(cards).toHaveLength(2)
    const card = cards[0]
    expect(within(card).queryByRole('link', { name: /招生章程|考纲/ })).toBeNull()
    expect(within(card).getByText('测试校区')).toBeVisible()
    expect(within(card).getByText('测试专科专业')).toBeVisible()
    expect(within(card).getByText('公共课测试')).toBeVisible()
    expect(within(card).getByText('专业课测试')).toBeVisible()
    expect(card.querySelector('.offering-score')).toBeNull()
    expect(within(card).queryByText('普通考生实际录取最低分')).not.toBeInTheDocument()
    expect(within(card).queryByText('官方公告')).not.toBeInTheDocument()
    expect(within(card).queryByText('2026-05-20')).not.toBeInTheDocument()
    expect(within(card).getByText('312.5 分')).toBeVisible()
    const scheme = card.querySelector('.offering-exam-scheme')
    const schemeText = scheme.textContent
    expect(schemeText.indexOf('公共课')).toBeLessThan(schemeText.indexOf('专业课'))
    expect(schemeText.indexOf('专业课')).toBeLessThan(schemeText.indexOf('分数线'))
    const scoreLine = card.querySelector('.offering-score-line')
    expect(scoreLine).not.toHaveTextContent('地图测试专业')
    expect(scoreLine).not.toHaveTextContent('普通考生实际录取最低分')
    expect(scoreLine).not.toHaveTextContent('官方公告')
    const source = within(scoreLine).getByRole('link', { name: '核验来源（在新标签页打开）' })
    expect(source).toHaveTextContent('核验来源 ↗')
    expect(source).toHaveAttribute('href', 'https://example.com/score')
    expect(source).toHaveAttribute('target', '_blank')
    expect(source).toHaveAttribute('rel', 'noreferrer')
    expect(within(cards[1]).getByText('第二培养点')).toBeVisible()
    expect(within(cards[1]).getByText('管理学')).toBeVisible()
    expect(cards[1].querySelector('.offering-score-line')).toBeNull()
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
      { offering_id: 'demo-program-a', school_slug: 'demo', active: true, status: 'published', programNames: ['计算机科学与技术'], plan_count: 100, training_site: '校本部 A', eligible_major_categories: '计算机应用技术', publicSubjects: ['英语'], professionalSubjects: ['C语言'], charter_url: 'https://example.com/a', syllabus_url: 'https://example.com/a', scores: [{ candidate_category: 'ordinary', score_type: 'actual_admission_minimum', score: 481, source_url: 'https://example.com/score' }] },
      { offering_id: 'demo-program-b', school_slug: 'demo2', active: true, status: 'published', programNames: ['计算机科学与技术'], plan_count: 80, training_site: '校本部 B', eligible_major_categories: '软件技术', publicSubjects: ['英语'], professionalSubjects: ['数据结构'], charter_url: 'https://example.com/b', syllabus_url: 'https://example.com/b' },
    ]
    const { container } = render(<MemoryRouter initialEntries={['/anhui/2026/computer-science/compare?program=计算机科学与技术']}><Compare offerings={offerings} academicSchools={[school, second]} scope={DEFAULT_SCOPE} /></MemoryRouter>)
    expect(screen.getByText(/再选择 2 条招生方案/)).toBeVisible()
    const picker = screen.getByLabelText('选择对比招生方案')
    expect(picker.querySelectorAll('.school-logo')).toHaveLength(2)
    expect(within(picker).getByRole('img', { name: '示例学院校徽' })).toBeVisible()
    fireEvent.click(screen.getAllByRole('button', { name: '加入对比' })[0])
    fireEvent.click(screen.getAllByRole('button', { name: '加入对比' })[0])
    expect(screen.getByRole('table')).toBeVisible()
    const table = screen.getByRole('table')
    expect(within(table).getByText('C语言')).toBeVisible()
    expect(within(table).getByText('数据结构')).toBeVisible()
    expect(within(table).queryByText('核心比较信息')).not.toBeInTheDocument()
    expect(within(table).queryByText('考试与报考要求')).not.toBeInTheDocument()
    expect(within(table).queryByText('官方资料')).not.toBeInTheDocument()
    expect(table.querySelectorAll('.comparison-group-row')).toHaveLength(0)
    expect(within(table).queryByText('报考专业范围')).not.toBeInTheDocument()
    expect(within(table).getAllByRole('link', { name: '进入院校专业地图 →' })).toHaveLength(2)
    expect(within(table).queryByText('招生专业')).not.toBeInTheDocument()
    expect(within(table).getAllByText('100 人')[0]).toHaveClass('compare-plan')
    expect(table.querySelectorAll('thead .school-logo')).toHaveLength(2)
    const mobileCards = document.querySelector('.mobile-compare-cards')
    expect(mobileCards).toBeTruthy()
    expect(mobileCards.querySelectorAll('.school-logo')).toHaveLength(2)
    expect(within(mobileCards).queryByText('报考范围')).not.toBeInTheDocument()
    expect(within(mobileCards).getAllByRole('link', { name: '进入院校专业地图 →' })).toHaveLength(2)
    const brokenLogo = within(picker).getByRole('img', { name: '示例学院校徽' })
    fireEvent.error(brokenLogo)
    expect(within(picker).getByText('示例')).toBeVisible()
    expect(within(container).queryByText('481 分')).not.toBeInTheDocument()
    expect(within(container).queryByText('分数线')).not.toBeInTheDocument()
  })

  it('切换本科专业时保留已选方案并支持跨专业等宽对比', () => {
    const second = { ...school, school_slug: 'demo2', school_name: '第二学院', short_name: '第二', school_type: '民办' }
    const offerings = [
      { offering_id: 'demo-computer', school_slug: 'demo', active: true, status: 'published', programNames: ['计算机科学与技术'], plan_count: 100, training_site: '校本部 A', publicSubjects: ['高等数学', '英语'], professionalSubjects: ['C语言'], charter_url: 'https://example.com/a', syllabus_url: 'https://example.com/a' },
      { offering_id: 'demo-software', school_slug: 'demo2', active: true, status: 'published', programNames: ['软件工程'], plan_count: 80, training_site: '校本部 B', publicSubjects: ['高等数学', '英语'], professionalSubjects: ['数据结构'], charter_url: 'https://example.com/b', syllabus_url: 'https://example.com/b' },
    ]
    const { container } = render(<MemoryRouter initialEntries={['/anhui/2026/all-programs/compare?program=计算机科学与技术']}><Compare offerings={offerings} academicSchools={[school, second]} scope={DEFAULT_SCOPE} /></MemoryRouter>)
    const view = within(container)

    fireEvent.click(view.getByRole('button', { name: '加入对比' }))
    expect(within(view.getByLabelText('已选对比招生方案')).getByText('已选 1 / 3 条招生方案')).toBeVisible()
    fireEvent.change(view.getByRole('combobox', { name: '筛选本科招生专业' }), { target: { value: '软件工程' } })
    expect(within(view.getByLabelText('已选对比招生方案')).getByText('计算机科学与技术')).toBeVisible()
    fireEvent.click(view.getByRole('button', { name: '加入对比' }))

    const table = view.getByRole('table')
    expect(within(table).getByText('招生专业')).toBeVisible()
    expect(within(table).getByText('计算机科学与技术')).toBeVisible()
    expect(within(table).getByText('软件工程')).toBeVisible()
    expect(table.querySelectorAll('col.compare-school-column')).toHaveLength(2)
    expect(table.querySelectorAll('col.compare-divider-column')).toHaveLength(1)
    expect(table.querySelectorAll('thead .school-logo')).toHaveLength(2)
    expect(within(table.querySelector('thead')).queryByText('公办')).not.toBeInTheDocument()
    expect(within(table.querySelector('thead')).queryByText('民办')).not.toBeInTheDocument()
  })
})
