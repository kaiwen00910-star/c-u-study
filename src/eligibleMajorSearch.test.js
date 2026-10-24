import { describe, expect, it } from 'vitest'
import { eligibleMajorSuggestions, findEligibleOfferings, mappedEligibleMajorCategories, matchEligibleMajorRange, normalizeEligibleMajorCategories } from './eligibleMajorSearch'

describe('报考专业范围规范化与匹配', () => {
  it('统一数组、Postgres 数组文本及中文分隔符', () => {
    expect(normalizeEligibleMajorCategories([' 计算机应用技术、软件技术 ', '网络技术；大数据技术'])).toEqual(['计算机应用技术', '软件技术', '网络技术', '大数据技术'])
    expect(normalizeEligibleMajorCategories('{计算机应用技术,软件技术}')).toEqual(['计算机应用技术', '软件技术'])
  })

  it('忽略输入首尾空格，仅将完整专业名称标为明确匹配，不用名称相似推断资格', () => {
    expect(matchEligibleMajorRange('计算机应用技术、软件技术', ' 计算机应用技术 ')).toMatchObject({ level: 'exact' })
    expect(matchEligibleMajorRange('计算机应用技术、软件技术', '计算机')).toBeNull()
  })

  it('识别相关范围与不限专业，建议不混入宽泛描述', () => {
    expect(matchEligibleMajorRange('计算机类相关专业', '计算机应用技术')).toMatchObject({ level: 'possible' })
    expect(matchEligibleMajorRange('不限专业', '护理')).toMatchObject({ level: 'unrestricted' })
    const suggestions = eligibleMajorSuggestions([{ eligible_major_categories: '计算机应用技术、电子与信息大类、不限专业' }])
    expect(suggestions).toContain('计算机应用技术')
    expect(suggestions).toContain('大数据技术')
    expect(suggestions).not.toContain('电子与信息大类')
    expect(suggestions).not.toContain('不限专业')
  })

  it('依据官方专业目录把大数据技术映射到计算机类和电子与信息大类', () => {
    expect(mappedEligibleMajorCategories(' 大数据技术 ')).toEqual(['计算机类', '电子与信息大类'])
    expect(matchEligibleMajorRange('大数据技术、软件技术', '大数据技术')).toMatchObject({ level: 'exact' })
    expect(matchEligibleMajorRange('计算机类相关专业', '大数据技术')).toMatchObject({ level: 'possible', matchBasis: 'catalog-category', matchedCategory: '计算机类' })
    expect(matchEligibleMajorRange('电子与信息大类', '大数据技术')).toMatchObject({ level: 'possible', matchBasis: 'catalog-category', matchedCategory: '电子与信息大类' })
    expect(matchEligibleMajorRange('财经商贸大类', '大数据技术')).toBeNull()
  })

  it('合理旧名称只作为目录映射建议，不提升为明确匹配', () => {
    expect(mappedEligibleMajorCategories('大数据技术与应用')).toEqual(['计算机类', '电子与信息大类'])
    expect(matchEligibleMajorRange('大数据技术', '大数据技术与应用')).toMatchObject({ level: 'possible', matchBasis: 'catalog-alias' })
  })

  it('未收录且无文字匹配时只按公共课科类返回参考结果', () => {
    const fixture = [
      { offering_id: 'a', year: 2026, province_slug: 'anhui', school_slug: 's', status: 'published', active: true, eligible_major_categories: '不限专业', public_subjects: ['大学语文', '英语'] },
      { offering_id: 'b', year: 2026, province_slug: 'anhui', school_slug: 's', status: 'published', active: true, eligible_major_categories: '计算机类', public_subjects: ['高等数学', '英语'] },
    ]
    const result = findEligibleOfferings({ offerings: fixture, academicSchools: [{ school_slug: 's' }], major: '火星工程技术', track: 'arts' })
    expect(result).toHaveLength(1)
    expect(result[0].match).toMatchObject({ level: 'reference', matchBasis: 'public-course-only' })
  })
})
