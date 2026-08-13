import { describe, expect, it } from 'vitest'
import { offerings, schoolGroups, schoolSyllabus } from './data'

describe('招生内容', () => {
  it('仅包含计划中的三所院校', () => {
    expect(schoolGroups().map((school) => school.school_name)).toEqual([
      '合肥师范学院', '安徽信息工程学院', '安徽文达信息工程学院',
    ])
    expect(JSON.stringify(offerings)).not.toContain('安徽建筑大学')
  })

  it('合肥师范学院合并两个培养点并使用正确专业课', () => {
    const school = schoolGroups().find((item) => item.school_slug === 'hfnu')
    expect(school.sites).toHaveLength(2)
    expect(school.totalPlan).toBe(100)
    expect(school.professionalSubjects).toEqual(['C语言程序设计', '数据结构'])
  })

  it('不同院校只读取自己的专业课考纲并复用公共课', () => {
    const hfnu = schoolSyllabus('hfnu')
    const aiit = schoolSyllabus('aiit')
    expect(hfnu.some((point) => point.subject_slug === 'data-structure')).toBe(true)
    expect(hfnu.some((point) => point.subject_slug === 'computer-basics')).toBe(false)
    expect(aiit.some((point) => point.subject_slug === 'computer-basics')).toBe(true)
    expect(aiit.some((point) => point.subject_slug === 'advanced-math')).toBe(true)
  })
})
