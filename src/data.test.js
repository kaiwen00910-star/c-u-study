import { describe, expect, it } from 'vitest'
import { fallbackAcademicSchools, offerings, resources, resourcesForTopic, schoolGroups, schoolSyllabus } from './data'
import { validateAnnouncement, validateResource } from './resourceValidation'
import { createSchoolWallSchools, createSchoolWallTracks } from './schoolWallData'
import { fallbackContent } from './useContent'

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
    const dynamicSchools = [{ school_id: 'anhui-school-01', school_slug: 'demo', school_name: '测试院校', school_type: '公办', short_name: '测试', theme_color: '#1556a6', logo_url: '/demo.png', active: true, has_study_map: true, sort_order: 1 }]
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

  it('统一院校数据生成 42 张卡片并保持三条轨道与原始顺序', () => {
    const wallSchools = createSchoolWallSchools(fallbackAcademicSchools)
    expect(wallSchools).toHaveLength(42)
    expect(createSchoolWallTracks(wallSchools).map((track) => track.length)).toEqual([14, 14, 14])
    expect(wallSchools.map((school) => school.id)).toEqual(
      Array.from({ length: 42 }, (_, index) => `anhui-school-${String(index + 1).padStart(2, '0')}`),
    )
  })

  it('迁移后的后台校名与已上传校徽同时驱动校徽墙和院校页面', () => {
    const migrated = fallbackAcademicSchools.map((school) => school.school_id === 'anhui-school-23'
      ? { ...school, school_name: '合肥师范学院（测试名称）', logo_url: 'https://example.com/uploaded-logo.webp' }
      : school)
    const wallSchool = createSchoolWallSchools(migrated).find((school) => school.id === 'anhui-school-23')
    const academicSchool = schoolGroups(offerings, migrated).find((school) => school.school_slug === 'hfnu')
    expect(wallSchool).toMatchObject({ name: '合肥师范学院（测试名称）', logo: 'https://example.com/uploaded-logo.webp', logoSource: 'database' })
    expect(academicSchool).toMatchObject({ school_name: '合肥师范学院（测试名称）', logo_url: 'https://example.com/uploaded-logo.webp' })
  })

  it('没有招生计划与学校考纲的院校不会生成无效学习地图入口', () => {
    const noMapSchool = fallbackAcademicSchools.find((school) => school.school_id === 'anhui-school-01')
    const [wallSchool] = createSchoolWallSchools([noMapSchool])
    const fakeOffering = [{ school_slug: noMapSchool.school_slug, training_site: '测试校区', plan_count: 10, publicSubjects: ['英语'], professionalSubjects: ['测试科目'], active: true }]
    expect(wallSchool.hasDetails).toBe(false)
    expect(wallSchool.href).toBe('/anhui#school-filter')
    expect(schoolGroups(fakeOffering, [noMapSchool])).toEqual([])
  })

  it('Supabase 不可用时的静态回退仍包含完整院校墙与三所学习地图', () => {
    expect(fallbackContent.source).toBe('csv')
    expect(createSchoolWallSchools(fallbackContent.academicSchools)).toHaveLength(42)
    expect(schoolGroups(fallbackContent.offerings, fallbackContent.academicSchools)).toHaveLength(3)
  })
})
