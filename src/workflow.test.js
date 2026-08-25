// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { aggregateChapterResources, differingCompareFields, learningDeepLink } from './publicFeatures'
import { createLocalBackup, importLocalBackup, saveFavorites, saveProgress, validateLocalBackup } from './storage'
import { metadataForPath } from './seo'
import { publicationChecks } from './adminWorkflow'
import { DEFAULT_SCOPE } from './contentScope'

const memoryStorage = (() => {
  let values = {}
  return { clear: () => { values = {} }, getItem: (key) => values[key] ?? null, setItem: (key, value) => { values[key] = String(value) }, removeItem: (key) => { delete values[key] } }
})()
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: memoryStorage })

describe('本地备份安全性', () => {
  beforeEach(() => localStorage.clear())
  it('导出版本化结构并拒绝异常文件且不破坏现有数据', () => {
    saveFavorites(['res-good']); saveProgress({ '2026:anhui:computer-science:hfnu:point-a': true })
    expect(createLocalBackup()).toMatchObject({ app: 'anhui-zsb-navigation', version: 1 })
    expect(() => validateLocalBackup({ app: 'anhui-zsb-navigation', version: 1, data: { progress: { '<script>': true }, favorites: [] } })).toThrow()
    expect(() => importLocalBackup({ app: 'bad', version: 1, data: {} })).toThrow()
    expect(JSON.parse(localStorage.getItem('zsb:v1:favorites'))).toEqual(['res-good'])
  })
})

describe('资源去重、发布检查与 SEO', () => {
  it('按章节去重资源并列出覆盖知识点', () => {
    const points = [{ point_id: 'a', canonical_topic: 'topic-a', point_title: 'A' }, { point_id: 'b', canonical_topic: 'topic-b', point_title: 'B' }]
    const resource = { resource_id: 'r', tags: ['topic-a', 'topic-b'], priority: 1, title: '课程' }
    expect(aggregateChapterResources(points, [resource])).toEqual([{ resource, points }])
  })
  it('发布前检查能拦截等待官方核验的年度草稿', () => {
    const checks = publicationChecks('offering', { charter_url: '', syllabus_url: '', plan_count: 1, training_site: '校本部', eligible_major_categories: '工科', public_subjects: ['英语'], professional_subjects: ['C语言'], source_status: '等待新年度官方文件核验', verified_at: '' })
    expect(checks.some((check) => !check.pass)).toBe(true)
  })
  it('生成可复制的深链接、独立标题和差异字段', () => {
    expect(learningDeepLink(DEFAULT_SCOPE, 'hfnu', { subject_slug: 'c-language', point_id: 'p' })).toContain('subject=c-language&point=p')
    expect(metadataForPath('/favorites').title).toContain('我的收藏')
    expect(metadataForPath('/admin/overview').robots).toBe('noindex,nofollow')
    expect(differingCompareFields([{ sites: ['A'], eligible_major_categories: 'x', totalPlan: 1, professionalSubjects: ['C'] }, { sites: ['B'], eligible_major_categories: 'x', totalPlan: 1, professionalSubjects: ['C'] }])).toContain('sites')
  })
})
