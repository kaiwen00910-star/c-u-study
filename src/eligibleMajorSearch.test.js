import { describe, expect, it } from 'vitest'
import { eligibleMajorSuggestions, matchEligibleMajorRange, normalizeEligibleMajorCategories } from './eligibleMajorSearch'

describe('报考专业范围规范化与匹配', () => {
  it('统一数组、Postgres 数组文本及中文分隔符', () => {
    expect(normalizeEligibleMajorCategories([' 计算机应用技术、软件技术 ', '网络技术；大数据技术'])).toEqual(['计算机应用技术', '软件技术', '网络技术', '大数据技术'])
    expect(normalizeEligibleMajorCategories('{计算机应用技术,软件技术}')).toEqual(['计算机应用技术', '软件技术'])
  })

  it('忽略输入首尾空格，仅将完整专业名称标为明确匹配', () => {
    expect(matchEligibleMajorRange('计算机应用技术、软件技术', ' 计算机应用技术 ')).toMatchObject({ level: 'exact' })
    expect(matchEligibleMajorRange('计算机应用技术、软件技术', '计算机')).toMatchObject({ level: 'possible' })
  })

  it('识别相关范围与不限专业，建议不混入宽泛描述', () => {
    expect(matchEligibleMajorRange('计算机类相关专业', '计算机应用技术')).toMatchObject({ level: 'possible' })
    expect(matchEligibleMajorRange('不限专业', '护理')).toMatchObject({ level: 'unrestricted' })
    expect(eligibleMajorSuggestions([{ eligible_major_categories: '计算机应用技术、电子与信息大类、不限专业' }])).toEqual(['计算机应用技术'])
  })
})
