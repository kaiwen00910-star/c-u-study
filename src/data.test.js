import { describe, expect, it } from 'vitest'
import { offerings, resources, resourcesForTopic, schoolGroups, schoolSyllabus } from './data'
import { validateAnnouncement, validateResource } from './resourceValidation'
import { anhuiAdmissionSchools, createSchoolWallTracks, mergeSchoolLogos } from './schoolWallData'

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

  it('院校列表和学习地图可由后台数据动态替换', () => {
    const dynamicSchools = [{ school_slug: 'demo', school_name: '测试院校', school_type: '公办', short_name: '测试', theme_color: '#1556a6', logo_url: '/demo.png', active: true, sort_order: 1 }]
    const dynamicOfferings = [{ school_slug: 'demo', training_site: '测试校区', plan_count: 20, publicSubjects: ['英语'], professionalSubjects: ['测试科目'], active: true }]
    const dynamicPoints = [{ point_id: 'demo-point', school_slug: 'demo', subject_slug: 'demo-subject', subject_name: '测试科目', active: true }]
    expect(schoolGroups(dynamicOfferings, dynamicSchools)[0]).toMatchObject({ school_name: '测试院校', totalPlan: 20, sites: ['测试校区'] })
    expect(schoolSyllabus('demo', dynamicPoints).map((point) => point.point_id)).toEqual(['demo-point'])
  })

  it('资源使用具体课程或视频入口且每个知识点不超过三条推荐', () => {
    expect(resources.some((resource) => /\/search(?:\.htm)?[?/]/.test(resource.url))).toBe(false)
    expect(resources.filter((resource) => resource.platform === '哔哩哔哩')
      .every((resource) => /^https:\/\/www\.bilibili\.com\/video\/(?:BV[\w]+|av\d+)\/?$/.test(resource.url))).toBe(true)

    const topics = new Set(resources.flatMap((resource) => resource.tags))
    topics.forEach((topic) => expect(resourcesForTopic(topic).length).toBeLessThanOrEqual(3))
  })

  it('后台拒绝非 HTTPS、搜索页和不规范的 B 站地址', () => {
    const base = { ...resources[0], topic_tags: resources[0].tags, status: 'active' }
    const topics = new Set(resources.flatMap((resource) => resource.tags))
    expect(validateResource({ ...base, url: 'http://example.com' }, topics)).toContain('链接必须使用 HTTPS')
    expect(validateResource({ ...base, url: 'https://search.bilibili.com/all?keyword=C语言' }, topics)
      .some((error) => error.includes('搜索结果页'))).toBe(true)
    expect(validateResource({ ...base, url: 'https://www.bilibili.com/' }, topics)
      .some((error) => error.includes('具体视频链接'))).toBe(true)
  })

  it('公告结束时间必须晚于开始时间', () => {
    expect(validateAnnouncement({ title: '通知', content: '内容', starts_at: '2026-08-13T10:00:00Z', ends_at: '2026-08-13T09:00:00Z' }))
      .toContain('结束时间必须晚于开始时间')
  })

  it('首页将 42 所院校均分为三条轨道并优先使用后台校徽', () => {
    expect(anhuiAdmissionSchools).toHaveLength(42)
    expect(createSchoolWallTracks().map((track) => track.length)).toEqual([14, 14, 14])
    const school = anhuiAdmissionSchools.find((item) => !item.logo)
    const [merged] = mergeSchoolLogos([{ school_id: school.id, logo_url: 'https://example.com/logo.webp', display_name: '新校名' }])
      .filter((item) => item.id === school.id)
    expect(merged.logo).toBe('https://example.com/logo.webp')
    expect(merged.logoSource).toBe('database')
    expect(merged.name).toBe('新校名')
    expect(merged.defaultName).toBe(school.name)
  })
})
