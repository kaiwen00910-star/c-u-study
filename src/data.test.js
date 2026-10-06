import { describe, expect, it } from 'vitest'
import { fallbackAcademicSchools, offerings, resources, resourcesForTopic, schoolGroups, schoolSyllabus, schoolSyllabusForScheme } from './data'
import { validateAnnouncement, validateResource } from './resourceValidation'
import { createSchoolWallSchools, createSchoolWallTracks } from './schoolWallData'
import { fallbackContent, isOnlineContentCurrent } from './useContent'
import { DEFAULT_SCOPE } from './contentScope'
import { progressKey } from './storage'
import { announcementStatus, currentAnnouncement } from './announcements'

describe('招生内容', () => {
  it('包含四十一所已完成招生专业与考试方案核验的院校', () => {
    expect(schoolGroups().map((school) => school.school_name)).toEqual([
      '安徽工业大学', '安徽农业大学', '安徽医科大学', '安徽师范大学', '安徽中医药大学', '阜阳师范大学', '安庆师范大学', '安徽建筑大学', '安徽科技工程大学', '铜陵学院', '蚌埠学院', '蚌埠医科大学', '皖南医科大学', '合肥大学', '巢湖学院', '亳州学院', '滁州学院', '宿州学院', '黄山学院', '池州学院', '皖西学院', '淮南师范学院', '合肥师范学院', '安徽艺术学院', '安徽医科大学临床医学院', '马鞍山学院', '安徽新华学院', '合肥经济学院',
      '合肥城市学院', '安徽外国语学院', '安徽三联学院', '蚌埠工商学院', '安徽信息工程学院', '淮北理工学院', '皖江工学院', '安徽文达信息工程学院', '芜湖学院', '阜阳理工学院', '安徽财经大学', '安徽职业技术大学', '芜湖职业技术大学',
    ])
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

  it('安徽职业技术大学可筛选、对比并生成学校专属学习地图', () => {
    const school = schoolGroups().find((item) => item.school_slug === 'auta')
    expect(school).toMatchObject({
      school_name: '安徽职业技术大学',
      totalPlan: 100,
      publicSubjects: ['高等数学', '英语'],
      professionalSubjects: ['计算机基础', 'C语言'],
    })
    expect(school.sites).toEqual(['网络工程技术：校本部（安徽省合肥市新站区文忠路2600号）'])
    expect(schoolSyllabusForScheme('auta', school.examSchemes[0])).toHaveLength(20)
    expect(schoolSyllabus('auta').filter((point) => point.school_slug === 'auta')).toHaveLength(11)
  })

  it('芜湖学院使用正式章程和考纲生成学校专属学习地图', () => {
    const school = schoolGroups().find((item) => item.school_slug === 'uwh')
    expect(school).toMatchObject({
      school_name: '芜湖学院',
      totalPlan: 100,
      publicSubjects: ['高等数学', '英语'],
      professionalSubjects: ['计算机专业基础', 'C语言程序设计'],
    })
    expect(school.sites).toEqual(['计算机科学与技术：芜湖学院校本部（安徽省芜湖市鸠江区苏州路66号）'])
    expect(schoolSyllabus('uwh').filter((point) => point.school_slug === 'uwh')).toHaveLength(19)
  })

  it('皖西学院使用正式章程和考纲生成学校专属学习地图', () => {
    const school = schoolGroups().find((item) => item.school_slug === 'wxc')
    expect(school).toMatchObject({
      school_name: '皖西学院',
      totalPlan: 50,
      publicSubjects: ['高等数学', '英语'],
      professionalSubjects: ['计算机网络', 'C语言程序设计'],
    })
    expect(school.sites).toEqual(['网络工程：皖西学院本部（安徽省六安市云露桥西月亮岛）'])
    expect(schoolSyllabus('wxc').filter((point) => point.school_slug === 'wxc')).toHaveLength(19)
  })

  it('安徽师范大学使用同一正式发布页和已核验附件生成学校专属学习地图', () => {
    const school = schoolGroups().find((item) => item.school_slug === 'ahnu')
    expect(school).toMatchObject({
      school_name: '安徽师范大学',
      totalPlan: 80,
      publicSubjects: ['高等数学', '英语'],
      professionalSubjects: ['计算机专业基础', 'C语言程序设计'],
    })
    expect(school.sites).toEqual(['软件工程：安徽师范大学天门山校区（安徽省芜湖市九华北路171号）'])
    expect(school.charter_url).toBe('https://zsxx.ahnu.edu.cn/info/1042/4133.htm')
    expect(school.syllabus_url).toBe('https://zsxx.ahnu.edu.cn/info/1042/4133.htm')
    expect(schoolSyllabus('ahnu').filter((point) => point.school_slug === 'ahnu')).toHaveLength(19)
  })

  it('阜阳师范大学使用正式章程和用户提供的官方考纲生成学校专属学习地图', () => {
    const school = schoolGroups().find((item) => item.school_slug === 'fynu')
    expect(school).toMatchObject({
      school_name: '阜阳师范大学',
      totalPlan: 100,
      publicSubjects: ['高等数学', '英语'],
      professionalSubjects: ['计算机专业基础', 'C语言程序设计'],
    })
    expect(school.sites).toEqual(['软件工程：安徽工商职业学院双凤校区（安徽省合肥市双凤经济开发区金宁路北16号）'])
    expect(school.charter_url).toBe('https://www.fynu.edu.cn/bkzsxxw/info/1010/5876.htm')
    expect(school.syllabus_url).toBe('https://www.fynu.edu.cn/bkzsxxw/info/1010/5675.htm')
    expect(schoolSyllabus('fynu').filter((point) => point.school_slug === 'fynu')).toHaveLength(30)
  })

  it('院校列表和学习地图可由后台数据动态替换', () => {
    const dynamicSchools = [{ school_id: 'anhui-school-01', school_slug: 'demo', school_name: '测试院校', school_type: '公办', short_name: '测试', theme_color: '#1556a6', logo_url: '/demo.png', active: true, has_study_map: true, sort_order: 1 }]
    const scopeFields = { year: 2026, province_slug: 'anhui', major_slug: 'computer-science' }
    const dynamicOfferings = [{ ...scopeFields, school_slug: 'demo', training_site: '测试校区', plan_count: 20, publicSubjects: ['英语'], professionalSubjects: ['测试科目'], active: true }]
    const dynamicPoints = [{ ...scopeFields, point_id: 'demo-point', school_slug: 'demo', subject_slug: 'demo-subject', subject_name: '测试科目', active: true }]
    expect(schoolGroups(dynamicOfferings, dynamicSchools, DEFAULT_SCOPE, dynamicPoints)[0]).toMatchObject({ school_name: '测试院校', totalPlan: 20, sites: ['测试校区'] })
    expect(schoolSyllabus('demo', dynamicPoints, DEFAULT_SCOPE).map((point) => point.point_id)).toEqual(['demo-point'])
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
    const wallSchools = createSchoolWallSchools(fallbackAcademicSchools, offerings, fallbackContent.syllabusPoints, DEFAULT_SCOPE)
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
    const wallSchool = createSchoolWallSchools(migrated, offerings, fallbackContent.syllabusPoints, DEFAULT_SCOPE).find((school) => school.id === 'anhui-school-23')
    const academicSchool = schoolGroups(offerings, migrated).find((school) => school.school_slug === 'hfnu')
    expect(wallSchool).toMatchObject({ name: '合肥师范学院（测试名称）', logo: 'https://example.com/uploaded-logo.webp', logoSource: 'database' })
    expect(academicSchool).toMatchObject({ school_name: '合肥师范学院（测试名称）', logo_url: 'https://example.com/uploaded-logo.webp' })
  })

  it('院校专业地图由已发布招生方案开放，不再强制要求知识点', () => {
    const noMapSchool = fallbackAcademicSchools.find((school) => school.school_id === 'anhui-school-01')
    const [wallSchool] = createSchoolWallSchools([noMapSchool])
    const fakeOffering = [{ year: 2026, province_slug: 'anhui', major_slug: 'all-programs', school_slug: noMapSchool.school_slug, training_site: '测试校区', plan_count: 10, publicSubjects: ['英语'], professionalSubjects: ['测试科目'], active: true }]
    expect(wallSchool.hasDetails).toBe(false)
    expect(wallSchool.href).toBeNull()
    const [offeringWallSchool] = createSchoolWallSchools([noMapSchool], fakeOffering, [])
    expect(offeringWallSchool.hasDetails).toBe(true)
    expect(offeringWallSchool.href).toBe('/anhui/2026/schools/ahut')
    expect(schoolGroups(fakeOffering, [noMapSchool])).toHaveLength(1)
  })

  it('Supabase 不可用时的静态回退仍包含完整院校墙与四十一所院校专业地图', () => {
    expect(fallbackContent.source).toBe('snapshot')
    expect(fallbackContent.metadata.version).toBeTruthy()
    expect(createSchoolWallSchools(fallbackContent.academicSchools, fallbackContent.offerings, fallbackContent.syllabusPoints, DEFAULT_SCOPE)).toHaveLength(42)
    expect(schoolGroups(fallbackContent.offerings, fallbackContent.academicSchools, DEFAULT_SCOPE, fallbackContent.syllabusPoints)).toHaveLength(41)
  })

  it('第十二批三校专业、计划与考试方案完整隔离且不新增知识点资源', () => {
    const batch = new Map(schoolGroups().filter((school) => ['cuhf', 'bctb', 'whit'].includes(school.school_slug)).map((school) => [school.school_slug, school]))
    expect([...batch.keys()].sort()).toEqual(['bctb', 'cuhf', 'whit'])
    expect(batch.get('cuhf')).toMatchObject({ totalPlan: 2000 })
    expect(batch.get('cuhf').offerings).toHaveLength(25)
    expect(batch.get('cuhf').programNames).toHaveLength(17)
    expect(batch.get('cuhf').examSchemes).toHaveLength(21)
    expect(batch.get('bctb')).toMatchObject({ totalPlan: 972 })
    expect(batch.get('bctb').offerings).toHaveLength(12)
    expect(batch.get('bctb').examSchemes).toHaveLength(11)
    expect(batch.get('whit')).toMatchObject({ totalPlan: 350 })
    expect(batch.get('whit').offerings).toHaveLength(5)
    expect(batch.get('whit').examSchemes).toHaveLength(5)

    const computerScheme = batch.get('cuhf').examSchemes.find((scheme) => scheme.examSchemeId === 'cuhf-computer-c')
    expect(computerScheme.programNames).toEqual(['物联网工程', '数据科学与大数据技术'])
    expect(computerScheme.offerings).toHaveLength(2)
    const industrialSchemes = batch.get('cuhf').examSchemes.filter((scheme) => scheme.programNames.includes('工业设计'))
    expect(industrialSchemes.map((scheme) => scheme.publicSubjects)).toEqual([['大学语文', '英语'], ['高等数学', '英语']])
    expect(batch.get('bctb').examSchemes.find((scheme) => scheme.examSchemeId === 'bctb-accounting').programNames).toEqual(['会计学', '财务管理'])
    expect(['cuhf', 'bctb', 'whit'].every((slug) => schoolSyllabus(slug).filter((point) => point.school_slug === slug).length === 0)).toBe(true)
    expect(fallbackContent.syllabusPoints).toHaveLength(1033)
    expect(fallbackContent.resources).toHaveLength(80)
    expect(schoolGroups().some((school) => school.school_name === '安徽第二医学院')).toBe(false)
  })

  it('不允许旧版在线数据覆盖已核验的内置快照', () => {
    expect(isOnlineContentCurrent({ version: fallbackContent.metadata.version - 1 })).toBe(false)
    expect(isOnlineContentCurrent({ version: fallbackContent.metadata.version })).toBe(true)
    expect(isOnlineContentCurrent({ version: fallbackContent.metadata.version + 1 })).toBe(true)
  })

  it('同一学校的 2026 与 2027 招生计划严格隔离', () => {
    const school = fallbackAcademicSchools.find((item) => item.school_slug === 'hfnu')
    const scopedPoints = [
      { year: 2026, province_slug: 'anhui', major_slug: 'computer-science', school_slug: 'hfnu', point_id: 'p-2026', active: true },
      { year: 2027, province_slug: 'anhui', major_slug: 'computer-science', school_slug: 'hfnu', point_id: 'p-2027', active: true },
    ]
    const scopedOfferings = [
      { year: 2026, province_slug: 'anhui', major_slug: 'computer-science', school_slug: 'hfnu', training_site: '2026 校区', plan_count: 10, active: true },
      { year: 2027, province_slug: 'anhui', major_slug: 'computer-science', school_slug: 'hfnu', training_site: '2027 校区', plan_count: 99, active: true },
    ]
    const groups = schoolGroups(scopedOfferings, [school], DEFAULT_SCOPE, scopedPoints)
    expect(groups[0]).toMatchObject({ totalPlan: 10, sites: ['2026 校区'] })
  })

  it('全部专业视图聚合，同一年具体专业视图继续严格隔离', () => {
    const school = fallbackAcademicSchools.find((item) => item.school_slug === 'hfnu')
    const otherScope = { year: 2026, provinceSlug: 'anhui', majorSlug: 'software-engineering' }
    const points = [
      { year: 2026, province_slug: 'anhui', major_slug: 'computer-science', school_slug: 'hfnu', point_id: 'computer-point', active: true },
      { year: 2026, province_slug: 'anhui', major_slug: 'software-engineering', school_slug: 'hfnu', point_id: 'software-point', active: true },
    ]
    const plans = [
      { year: 2026, province_slug: 'anhui', major_slug: 'computer-science', school_slug: 'hfnu', training_site: '计算机校区', plan_count: 10, active: true },
      { year: 2026, province_slug: 'anhui', major_slug: 'software-engineering', school_slug: 'hfnu', training_site: '软件校区', plan_count: 20, active: true },
    ]
    expect(schoolGroups(plans, [school], otherScope, points)[0]).toMatchObject({ totalPlan: 20, sites: ['软件校区'] })
    expect(schoolSyllabus('hfnu', points, DEFAULT_SCOPE).map((point) => point.point_id)).toEqual(['computer-point', 'software-point'])
    expect(schoolSyllabus('hfnu', points, { ...DEFAULT_SCOPE, majorSlug: 'computer-science' }).map((point) => point.point_id)).toEqual(['computer-point'])
    expect(schoolSyllabus('hfnu', points, otherScope).map((point) => point.point_id)).toEqual(['software-point'])
  })

  it('不同年份、专业与省份的学习进度 key 互不污染', () => {
    const base = progressKey(DEFAULT_SCOPE, 'hfnu', 'pointer')
    expect(progressKey({ ...DEFAULT_SCOPE, year: 2027 }, 'hfnu', 'pointer')).not.toBe(base)
    expect(progressKey({ ...DEFAULT_SCOPE, majorSlug: 'software-engineering' }, 'hfnu', 'pointer')).not.toBe(base)
    expect(progressKey({ ...DEFAULT_SCOPE, provinceSlug: 'jiangsu' }, 'hfnu', 'pointer')).not.toBe(base)
  })

  it('公告状态区分草稿、待发布、进行中与已过期，前台只取进行中', () => {
    const now = new Date('2026-08-25T08:00:00Z')
    const rows = [
      { id: 'draft', enabled: false },
      { id: 'scheduled', enabled: true, starts_at: '2026-08-26T00:00:00Z' },
      { id: 'active', enabled: true, starts_at: '2026-08-24T00:00:00Z', ends_at: '2026-08-26T00:00:00Z' },
      { id: 'expired', enabled: true, ends_at: '2026-08-24T00:00:00Z' },
    ]
    expect(rows.map((row) => announcementStatus(row, now).key)).toEqual(['draft', 'scheduled', 'active', 'expired'])
    expect(currentAnnouncement(rows, now)?.id).toBe('active')
  })
})
