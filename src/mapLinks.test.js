import { describe, expect, it } from 'vitest'
import snapshot from '../content/public-content.snapshot.json'
import { buildAmapSearchKeyword, buildAmapSearchUrl, hasValidMapLocation, parseTrainingSiteLocations, trainingSiteAssignmentNote } from './mapLinks'

describe('培养地点展示解析', () => {
  it('隐藏单一培养地点的括号地址，但搜索内容保留完整原文', () => {
    expect(parseTrainingSiteLocations('合肥职业技术学院汇心湖校区（安徽省合肥市新站区岱河路2号）')).toEqual([
      { label: '合肥职业技术学院汇心湖校区', searchLocation: '合肥职业技术学院汇心湖校区（安徽省合肥市新站区岱河路2号）' },
    ])
  })

  it('拆分括号外以“或”连接的多个校区，并为每个校区保留各自地址', () => {
    expect(parseTrainingSiteLocations('黄山学院率水校区（安徽省黄山市西海路39号）或横江校区（安徽省黄山市戴震路44号）')).toEqual([
      { label: '黄山学院率水校区', searchLocation: '黄山学院率水校区（安徽省黄山市西海路39号）' },
      { label: '黄山学院横江校区', searchLocation: '黄山学院横江校区（安徽省黄山市戴震路44号）' },
    ])
  })

  it('拆分括号内具名的多个校区，忽略说明备注', () => {
    expect(parseTrainingSiteLocations('芜湖职业技术大学（文津校区：安徽省芜湖市文津西路201号；银湖校区：安徽省芜湖市银湖北路62号；章程未按专业区分培养校区）')).toEqual([
      { label: '芜湖职业技术大学文津校区', searchLocation: '芜湖职业技术大学 文津校区（安徽省芜湖市文津西路201号）' },
      { label: '芜湖职业技术大学银湖校区', searchLocation: '芜湖职业技术大学 银湖校区（安徽省芜湖市银湖北路62号）' },
    ])
  })

  it('联合培养的具名校区显示实际培养院校，并保留完整搜索上下文', () => {
    expect(parseTrainingSiteLocations('安徽财经大学与安徽财贸职业学院联合培养（安徽财贸职业学院蜀山校区：安徽省合肥市蜀山区玉兰大道7号）')).toEqual([
      { label: '安徽财贸职业学院蜀山校区', searchLocation: '安徽财经大学与安徽财贸职业学院联合培养 安徽财贸职业学院蜀山校区（安徽省合肥市蜀山区玉兰大道7号）' },
    ])
  })

  it('联合培养的简称校区补全实际培养院校名称', () => {
    expect(parseTrainingSiteLocations('安徽师范大学与合肥幼儿师范高等专科学校联合培养（学林路校区：安徽省合肥市学林路1100号；少荃湖校区：安徽省合肥市文忠路2299号）').map((entry) => entry.label)).toEqual([
      '合肥幼儿师范高等专科学校学林路校区',
      '合肥幼儿师范高等专科学校少荃湖校区',
    ])
  })

  it('移除专业名前缀，不把专业名称误当成培养地点', () => {
    expect(parseTrainingSiteLocations('计算机科学与技术：芜湖学院校本部（安徽省芜湖市鸠江区苏州路66号）')[0].label).toBe('芜湖学院校本部')
  })

  it('拆分合肥城市学院未注明专业对应关系的两个地址，并使用中性校址标签', () => {
    const trainingSite = '合肥城市学院（安徽省合肥市黄麓科教园1号；安徽省合肥市金岗大道88号；章程未按专业区分培养校区）'
    expect(parseTrainingSiteLocations(trainingSite)).toEqual([
      { label: '合肥城市学院黄麓科教园1号校址', searchLocation: '合肥城市学院（安徽省合肥市黄麓科教园1号）' },
      { label: '合肥城市学院金岗大道88号校址', searchLocation: '合肥城市学院（安徽省合肥市金岗大道88号）' },
    ])
    expect(trainingSiteAssignmentNote(trainingSite)).toBe('章程未按专业区分培养校区')
  })

  it('同一路名的多个门牌号仍作为同一培养地点显示', () => {
    expect(parseTrainingSiteLocations('合肥大学（安徽省合肥市经济技术开发区锦绣大道99号、158号；章程未按专业区分培养地址）')).toEqual([
      { label: '合肥大学', searchLocation: '合肥大学（安徽省合肥市经济技术开发区锦绣大道99号、158号；章程未按专业区分培养地址）' },
    ])
  })

  it('补全省略省市的第二个校址，并保持两个搜索地址隔离', () => {
    expect(parseTrainingSiteLocations('安徽艺术职业学院（安徽省合肥市经开区丹霞路8号、包河区宣城路16号）')).toEqual([
      { label: '安徽艺术职业学院丹霞路8号校址', searchLocation: '安徽艺术职业学院（安徽省合肥市经开区丹霞路8号）' },
      { label: '安徽艺术职业学院宣城路16号校址', searchLocation: '安徽艺术职业学院（安徽省合肥市包河区宣城路16号）' },
    ])
  })

  it('池州学院三个联合培养专业均保留安徽警官职业学院两个校址', () => {
    const expectedSite = '安徽警官职业学院（安徽省合肥市蜀山区清溪路78号；安徽省六安市金安区长淮路6号；章程未按专业区分培养校区）'
    const partnerOfferingIds = new Set([
      'b15-czu-ip-2026',
      'b15-czu-network-2026',
      'b15-czu-financial-management-arts-2026',
      'b15-czu-financial-management-science-2026',
    ])
    const partnerOfferings = snapshot.offerings.filter((offering) => partnerOfferingIds.has(offering.offering_id))

    expect(partnerOfferings).toHaveLength(4)
    expect(partnerOfferings.every((offering) => offering.training_site === expectedSite)).toBe(true)
    expect(parseTrainingSiteLocations(expectedSite)).toEqual([
      { label: '安徽警官职业学院清溪路78号校址', searchLocation: '安徽警官职业学院（安徽省合肥市蜀山区清溪路78号）' },
      { label: '安徽警官职业学院长淮路6号校址', searchLocation: '安徽警官职业学院（安徽省六安市金安区长淮路6号）' },
    ])
    expect(trainingSiteAssignmentNote(expectedSite)).toBe('章程未按专业区分培养校区')
  })

  it('合肥师范学院校本部仅保留锦绣与滨湖校区', () => {
    const campusOfferings = snapshot.offerings.filter((offering) => offering.school_slug === 'hfnu' && offering.training_site.startsWith('合肥师范学院校本部'))

    expect(campusOfferings).toHaveLength(19)
    expect(campusOfferings.every((offering) => !offering.training_site.includes('三孝口校区'))).toBe(true)
    expect(campusOfferings.every((offering) => parseTrainingSiteLocations(offering.training_site).map((location) => location.label).join('|') === '合肥师范学院锦绣校区|合肥师范学院滨湖校区')).toBe(true)
  })

  it('审计冻结快照中的 42 所院校，不遗漏含多个门牌号的培养地点', () => {
    expect(new Set(snapshot.offerings.map((offering) => offering.school_slug)).size).toBe(42)
    const uniqueTrainingSites = [...new Set(snapshot.offerings.map((offering) => offering.training_site))]
    const unresolved = uniqueTrainingSites.filter((trainingSite) => {
      const addressCount = trainingSite.match(/\d+号/gu)?.length || 0
      const isSingleCampusDoorNumberList = /\d+号、\d+号/u.test(trainingSite)
      return addressCount > 1 && !isSingleCampusDoorNumberList && parseTrainingSiteLocations(trainingSite).length < addressCount
    })
    expect(unresolved).toEqual([])
  })
})

describe('高德地图搜索链接', () => {
  it('组合院校、培养点和完整地址，并编码中文、括号、空格与特殊字符', () => {
    const schoolName = '示例学院 & 联合校'
    const trainingSite = '汇心湖校区（安徽省 合肥市#1号）'
    const keyword = `${schoolName} ${trainingSite}`
    const url = buildAmapSearchUrl({ schoolName, trainingSite })

    expect(buildAmapSearchKeyword({ schoolName, trainingSite })).toBe(keyword)
    expect(url).toBe(`https://uri.amap.com/search?keyword=${encodeURIComponent(keyword)}&src=${encodeURIComponent('安徽升本导航')}&callnative=0`)
    expect(url).toContain('%E7%A4%BA%E4%BE%8B%E5%AD%A6%E9%99%A2')
    expect(url).toContain('%20')
    expect(url).toContain('%EF%BC%88')
    expect(url).toContain('%26')
    expect(url).toContain('%23')
  })

  it('培养地点已经包含院校名称时不重复院校名，同时保留完整原文', () => {
    const trainingSite = '合肥职业技术学院汇心湖校区（安徽省合肥市新站区岱河路2号）'
    expect(buildAmapSearchKeyword({ schoolName: '合肥职业技术学院', trainingSite })).toBe(trainingSite)
    expect(new URL(buildAmapSearchUrl({ schoolName: '合肥职业技术学院', trainingSite })).searchParams.get('keyword')).toBe(trainingSite)
  })

  it('不同培养点生成彼此隔离的链接', () => {
    const first = buildAmapSearchUrl({ schoolName: '示例学院', trainingSite: '主校区（安徽省合肥市第一路1号）' })
    const second = buildAmapSearchUrl({ schoolName: '示例学院', trainingSite: '新校区（安徽省合肥市第二路2号）' })
    expect(first).not.toBe(second)
    expect(decodeURIComponent(first)).not.toContain('第二路2号')
    expect(decodeURIComponent(second)).not.toContain('第一路1号')
  })

  it.each([undefined, null, '', ' ', '-', '——', '/', '暂无', '暂无地址', '待公布', '校区待定', 'null', 'N/A'])('缺失或占位地点 %s 不生成链接', (trainingSite) => {
    expect(hasValidMapLocation(trainingSite)).toBe(false)
    expect(buildAmapSearchUrl({ schoolName: '示例学院', trainingSite })).toBeNull()
  })

  it('院校名称缺失时不生成可能串校的链接', () => {
    expect(buildAmapSearchUrl({ schoolName: '', trainingSite: '测试校区（安徽省合肥市测试路1号）' })).toBeNull()
  })
})
