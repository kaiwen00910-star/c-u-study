// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { Compare, LearningMap } from './App'
import { DEFAULT_SCOPE } from './contentScope'

const baseSchool = {
  school_slug: 'demo',
  school_name: '示例学院',
  short_name: '示例',
  school_type: '公办',
  theme_color: '#1556a6',
  logo_url: '',
  charter_url: 'https://example.com/charter',
  syllabus_url: 'https://example.com/syllabus',
}

function offering(id, programName, trainingSite, eligible = '电子与信息大类') {
  return {
    ...baseSchool,
    offering_id: id,
    programNames: [programName],
    plan_count: 20,
    training_site: trainingSite,
    eligible_major_categories: eligible,
    publicSubjects: ['高等数学', '英语'],
    professionalSubjects: ['C语言程序设计', '数据结构'],
    scores: [],
  }
}

function renderMap(offerings) {
  const school = { ...baseSchool, offerings }
  return render(<MemoryRouter initialEntries={['/anhui/2026/schools/demo']}><Routes><Route path="/anhui/2026/schools/:schoolSlug" element={<LearningMap schools={[school]} scope={DEFAULT_SCOPE} />} /></Routes></MemoryRouter>)
}

describe('院校专业地图培养地点链接', () => {
  it('先显示定位图标再显示培养地点，并隐藏地址但保留完整搜索信息', () => {
    const trainingSite = '汇心湖校区（安徽省 合肥市新站区岱河路2号）'
    const { container } = renderMap([offering('first', '计算机科学与技术', trainingSite, '计算机类、电子信息类')])
    const card = container.querySelector('.offering-detail-grid article')
    const location = within(card).getByText('汇心湖校区')
    const link = within(card).getByRole('link', { name: '示例学院 计算机科学与技术 汇心湖校区：在高德地图查看（第三方地图，在新标签页打开）' })
    const keyword = new URL(link.href).searchParams.get('keyword')

    expect(within(card).queryByText(trainingSite)).not.toBeInTheDocument()
    expect(link.nextElementSibling).toBe(location)
    expect(link).not.toHaveTextContent('在高德地图查看')
    expect(link.querySelector('.map-pin-icon')).not.toBeNull()
    expect(link).toHaveAttribute('title', '在高德地图查看（第三方地图）')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(keyword).toContain('示例学院')
    expect(keyword).toContain('汇心湖校区')
    expect(keyword).toContain('安徽省 合肥市新站区岱河路2号')
    expect(within(card).getByText('计算机类、电子信息类')).toBeVisible()
    expect(screen.getByText('第三方地图结果仅供导航参考，请以院校公布信息和实际校区为准。')).toBeVisible()
  })

  it('多个校区分为多行，每行的定位图标只使用该校区地址', () => {
    const trainingSite = '示例学院南湖校区（安徽省合肥市第一路1号）或北湖校区（安徽省合肥市第二路2号）'
    const { container } = renderMap([offering('multi', '软件工程', trainingSite)])
    const card = container.querySelector('.offering-detail-grid article')
    const rows = card.querySelectorAll('.training-site-location')
    const links = within(card).getAllByRole('link', { name: /高德地图/ })

    expect(rows).toHaveLength(2)
    expect(within(rows[0]).getByText('示例学院南湖校区')).toBeVisible()
    expect(within(rows[1]).getByText('示例学院北湖校区')).toBeVisible()
    expect(rows[0].firstElementChild).toBe(links[0])
    expect(rows[1].firstElementChild).toBe(links[1])
    expect(new URL(links[0].href).searchParams.get('keyword')).toContain('第一路1号')
    expect(new URL(links[0].href).searchParams.get('keyword')).not.toContain('第二路2号')
    expect(new URL(links[1].href).searchParams.get('keyword')).toContain('第二路2号')
    expect(new URL(links[1].href).searchParams.get('keyword')).not.toContain('第一路1号')
    expect(card).not.toHaveTextContent('安徽省合肥市第一路1号')
    expect(card).not.toHaveTextContent('安徽省合肥市第二路2号')
  })

  it('未注明专业对应校区时保留全部校址，并显示章程提示', () => {
    const trainingSite = '合肥城市学院（安徽省合肥市黄麓科教园1号；安徽省合肥市金岗大道88号；章程未按专业区分培养校区）'
    const { container } = renderMap([offering('unnamed-multi', '土木工程', trainingSite)])
    const card = container.querySelector('.offering-detail-grid article')
    const rows = card.querySelectorAll('.training-site-location')
    const links = within(card).getAllByRole('link', { name: /高德地图/ })

    expect(rows).toHaveLength(2)
    expect(within(rows[0]).getByText('合肥城市学院黄麓科教园1号校址')).toBeVisible()
    expect(within(rows[1]).getByText('合肥城市学院金岗大道88号校址')).toBeVisible()
    expect(new URL(links[0].href).searchParams.get('keyword')).toContain('安徽省合肥市黄麓科教园1号')
    expect(new URL(links[0].href).searchParams.get('keyword')).not.toContain('金岗大道88号')
    expect(new URL(links[1].href).searchParams.get('keyword')).toContain('安徽省合肥市金岗大道88号')
    expect(new URL(links[1].href).searchParams.get('keyword')).not.toContain('黄麓科教园1号')
    expect(within(card).getByText('章程未按专业区分培养校区')).toBeVisible()
  })

  it('池州学院联培专业显示安徽警官职业学院两个独立定位行', () => {
    const trainingSite = '安徽警官职业学院（安徽省合肥市蜀山区清溪路78号；安徽省六安市金安区长淮路6号；章程未按专业区分培养校区）'
    const { container } = renderMap([offering('czu-partner', '网络工程', trainingSite)])
    const card = container.querySelector('.offering-detail-grid article')
    const rows = card.querySelectorAll('.training-site-location')
    const links = within(card).getAllByRole('link', { name: /高德地图/ })

    expect(rows).toHaveLength(2)
    expect(links).toHaveLength(2)
    expect(within(rows[0]).getByText('安徽警官职业学院清溪路78号校址')).toBeVisible()
    expect(within(rows[1]).getByText('安徽警官职业学院长淮路6号校址')).toBeVisible()
    expect(new URL(links[0].href).searchParams.get('keyword')).toContain('清溪路78号')
    expect(new URL(links[0].href).searchParams.get('keyword')).not.toContain('长淮路6号')
    expect(new URL(links[1].href).searchParams.get('keyword')).toContain('长淮路6号')
    expect(new URL(links[1].href).searchParams.get('keyword')).not.toContain('清溪路78号')
  })

  it('合肥师范学院校本部不再显示三孝口校区', () => {
    const trainingSite = '合肥师范学院校本部（具体校区以学校安排为准；锦绣校区：合肥市经济技术开发区莲花路1688号；滨湖校区：合肥市黄麓科教园区书香路）'
    const { container } = renderMap([offering('hfnu-campus', '商务英语', trainingSite)])
    const card = container.querySelector('.offering-detail-grid article')
    const rows = card.querySelectorAll('.training-site-location')

    expect(rows).toHaveLength(2)
    expect(within(rows[0]).getByText('合肥师范学院锦绣校区')).toBeVisible()
    expect(within(rows[1]).getByText('合肥师范学院滨湖校区')).toBeVisible()
    expect(card).not.toHaveTextContent('三孝口')
  })

  it('合肥大学的两个门牌号只显示为一个培养地点和一个定位入口', () => {
    const trainingSite = '合肥大学（安徽省合肥市经济技术开发区锦绣大道99号、158号；章程未按专业区分培养地址）'
    const { container } = renderMap([offering('hfuu-single-campus', '机械设计制造及其自动化', trainingSite)])
    const card = container.querySelector('.offering-detail-grid article')
    const rows = card.querySelectorAll('.training-site-location')
    const links = within(card).getAllByRole('link', { name: /高德地图/ })

    expect(rows).toHaveLength(1)
    expect(links).toHaveLength(1)
    expect(within(rows[0]).getByText('合肥大学')).toBeVisible()
    expect(card).not.toHaveTextContent('·')
    expect(new URL(links[0].href).searchParams.get('keyword')).toContain('锦绣大道99号、158号')
    expect(within(card).getByText('章程未按专业区分培养地址')).toBeVisible()
  })

  it('按招生方案隔离培养点，缺失地址和占位符不显示空链接', () => {
    const firstSite = '主校区（安徽省合肥市第一路1号）'
    const secondSite = '合作校区（安徽省芜湖市第二路2号）'
    const { container } = renderMap([
      offering('first', '软件工程', firstSite),
      offering('second', '网络工程', secondSite),
      offering('missing', '数据科学', ''),
      offering('placeholder', '人工智能', '待公布'),
    ])
    const cards = container.querySelectorAll('.offering-detail-grid article')
    const firstLink = within(cards[0]).getByRole('link', { name: '示例学院 软件工程 主校区：在高德地图查看（第三方地图，在新标签页打开）' })
    const secondLink = within(cards[1]).getByRole('link', { name: '示例学院 网络工程 合作校区：在高德地图查看（第三方地图，在新标签页打开）' })
    const firstKeyword = new URL(firstLink.href).searchParams.get('keyword')
    const secondKeyword = new URL(secondLink.href).searchParams.get('keyword')

    expect(firstLink.href).not.toBe(secondLink.href)
    expect(firstKeyword).toContain(firstSite)
    expect(firstKeyword).not.toContain(secondSite)
    expect(secondKeyword).toContain(secondSite)
    expect(secondKeyword).not.toContain(firstSite)
    expect(within(cards[2]).queryByRole('link', { name: /高德地图/ })).not.toBeInTheDocument()
    expect(within(cards[3]).queryByRole('link', { name: /高德地图/ })).not.toBeInTheDocument()
    expect(within(cards[2]).getByText('数据科学')).toBeVisible()
    expect(within(cards[3]).getByText('人工智能')).toBeVisible()
  })
})

describe('院校对比培养地点链接', () => {
  it('在桌面对比表和移动端对比卡片中使用同一定位图标与隔离链接', () => {
    const firstSite = '主校区（安徽省合肥市第一路1号）'
    const secondSite = '新校区（安徽省芜湖市第二路2号）'
    const secondSchool = { ...baseSchool, school_slug: 'demo-two', school_name: '第二学院', short_name: '第二' }
    const offerings = [
      { ...offering('first', '软件工程', firstSite), school_slug: 'demo', active: true, status: 'published' },
      { ...offering('second', '软件工程', secondSite), school_slug: 'demo-two', active: true, status: 'published' },
    ]
    const { container } = render(<MemoryRouter initialEntries={['/anhui/2026/compare?program=软件工程&offerings=first,second']}><Compare offerings={offerings} academicSchools={[baseSchool, secondSchool]} scope={DEFAULT_SCOPE} /></MemoryRouter>)
    const desktopRow = container.querySelector('.compare-row-training_site')
    const mobileCards = container.querySelector('.mobile-compare-cards')
    const desktopLinks = within(desktopRow).getAllByRole('link')
    const mobileLinks = within(mobileCards).getAllByRole('link', { name: /高德地图/ })

    expect(desktopLinks).toHaveLength(2)
    expect(mobileLinks).toHaveLength(2)
    expect(desktopRow).toHaveTextContent('主校区')
    expect(desktopRow).toHaveTextContent('新校区')
    expect(desktopRow).not.toHaveTextContent('安徽省合肥市第一路1号')
    expect(desktopRow).not.toHaveTextContent('安徽省芜湖市第二路2号')
    expect(desktopRow).not.toHaveTextContent('在高德地图查看')
    expect(desktopLinks.every((link) => link.querySelector('.map-pin-icon'))).toBe(true)
    expect(desktopLinks.every((link) => link.target === '_blank' && link.rel === 'noopener noreferrer')).toBe(true)
    expect(desktopLinks[0].href).not.toBe(desktopLinks[1].href)
    expect(new URL(desktopLinks[0].href).searchParams.get('keyword')).toContain(firstSite)
    expect(new URL(desktopLinks[0].href).searchParams.get('keyword')).not.toContain(secondSite)
    expect(new URL(desktopLinks[1].href).searchParams.get('keyword')).toContain(secondSite)
    expect(within(container).getByText('第三方地图结果仅供导航参考，请以院校公布信息和实际校区为准。')).toBeVisible()
  })
})
