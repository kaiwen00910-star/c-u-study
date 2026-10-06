// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import fs from 'node:fs'
import path from 'node:path'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { LearningMap, LegacySchoolRedirect } from './App'
import { DEFAULT_SCOPE, schoolPath } from './contentScope'
import { fallbackAcademicSchools, offerings, resources, schoolGroups, schoolSyllabusForScheme, syllabus } from './data'
import { createSchoolWallSchools } from './schoolWallData'
import { canonicalPathForPath, metadataForPath } from './seo'

function LocationProbe() {
  const location = useLocation()
  return <output>{`${location.pathname}${location.search}${location.hash}`}</output>
}

describe('院校主导型学习地图', () => {
  it('四十一所已开放院校全部生成 canonical 院校主路由', () => {
    const paths = schoolGroups().map((school) => schoolPath(DEFAULT_SCOPE, school.school_slug))
    expect(paths).toHaveLength(41)
    expect(new Set(paths).size).toBe(41)
    expect(paths.every((value) => /^\/anhui\/2026\/schools\/[a-z0-9-]+$/.test(value))).toBe(true)
  })

  it('首页院校墙只给已开放院校生成新主路由', () => {
    const wall = createSchoolWallSchools(fallbackAcademicSchools, offerings, syllabus, DEFAULT_SCOPE)
    expect(wall.filter((school) => school.hasDetails)).toHaveLength(41)
    expect(wall.filter((school) => school.hasDetails).every((school) => school.href === `/anhui/2026/schools/${school.schoolSlug}`)).toBe(true)
    expect(wall.find((school) => school.name === '合肥城市学院')).toMatchObject({ hasDetails: true, href: '/anhui/2026/schools/cuhf' })
    expect(wall.find((school) => school.name === '安徽第二医学院')).toMatchObject({ hasDetails: false, href: null })
  })

  it('旧专业范围 URL 保留查询和锚点并跳转到新主路由', () => {
    render(<MemoryRouter initialEntries={['/anhui/2026/computer-science/fynu?subject=c-language#chapter']}><Routes>
      <Route path="/:provinceSlug/:year/schools/:schoolSlug" element={<LocationProbe />} />
      <Route path="/:provinceSlug/:year/:majorSlug/:schoolSlug" element={<LegacySchoolRedirect />} />
    </Routes></MemoryRouter>)
    expect(screen.getByRole('status')).toHaveTextContent('/anhui/2026/schools/fynu?subject=c-language#chapter')
  })

  it('相同科目方案复用知识点，不同方案严格隔离', () => {
    const hfnu = schoolGroups().find((school) => school.school_slug === 'hfnu')
    expect(hfnu.offerings).toHaveLength(2)
    expect(hfnu.examSchemes).toHaveLength(1)
    expect(schoolSyllabusForScheme('hfnu', hfnu.examSchemes[0])).toHaveLength(new Set(schoolSyllabusForScheme('hfnu', hfnu.examSchemes[0]).map((point) => point.point_id)).size)

    const aufe = schoolGroups().find((school) => school.school_slug === 'aufe')
    expect(aufe.examSchemes).toHaveLength(2)
    const computer = aufe.examSchemes.find((scheme) => scheme.professionalSubjects.includes('计算机专业基础'))
    const intelligent = aufe.examSchemes.find((scheme) => scheme.professionalSubjects.includes('智能科学与技术专业基础'))
    const computerSubjects = new Set(schoolSyllabusForScheme('aufe', computer).map((point) => point.subject_name))
    const intelligentSubjects = new Set(schoolSyllabusForScheme('aufe', intelligent).map((point) => point.subject_name))
    expect(computerSubjects.has('智能科学与技术专业基础')).toBe(false)
    expect(intelligentSubjects.has('计算机专业基础')).toBe(false)
    expect(computer.offerings).toHaveLength(2)
    expect(intelligent.offerings).toHaveLength(1)
  })

  it('阜阳师范大学保持一个招生点和三十个学校专属知识点', () => {
    const fynu = schoolGroups().find((school) => school.school_slug === 'fynu')
    expect(fynu.offerings).toHaveLength(1)
    expect(schoolSyllabusForScheme('fynu', fynu.examSchemes[0]).filter((point) => point.school_slug === 'fynu')).toHaveLength(30)
  })

  it('第十批七所院校全部开放，且共享方案与不同方案均正确分组', () => {
    const batch = new Map(schoolGroups().filter((school) => ['ahau', 'ahmu', 'ahtcm', 'aqnu', 'bbmu', 'wnmc', 'chu'].includes(school.school_slug)).map((school) => [school.school_slug, school]))
    expect([...batch.keys()].sort()).toEqual(['ahau', 'ahmu', 'ahtcm', 'aqnu', 'bbmu', 'chu', 'wnmc'])
    expect(batch.get('ahau')).toMatchObject({ offerings: expect.arrayContaining([expect.objectContaining({ offering_id: 'ahau-water-2026' }), expect.objectContaining({ offering_id: 'ahau-environment-2026' })]) })
    expect(batch.get('ahau').examSchemes).toHaveLength(4)
    expect(batch.get('ahmu').examSchemes).toHaveLength(4)
    expect(batch.get('ahtcm').examSchemes).toHaveLength(5)
    expect(batch.get('aqnu').examSchemes).toHaveLength(2)
    expect(batch.get('bbmu').examSchemes).toHaveLength(6)
    expect(batch.get('wnmc').examSchemes).toHaveLength(2)
    expect(batch.get('chu').examSchemes).toHaveLength(5)

    const shared = batch.get('ahau').examSchemes.find((scheme) => scheme.examSchemeId === 'ahau-water-environment')
    expect(shared.offerings).toHaveLength(2)
    expect(new Set(schoolSyllabusForScheme('ahau', shared).map((point) => point.point_id)).size).toBe(schoolSyllabusForScheme('ahau', shared).length)
    const preschool = batch.get('chu').examSchemes.find((scheme) => scheme.examSchemeId === 'chu-preschool')
    const chinese = batch.get('chu').examSchemes.find((scheme) => scheme.examSchemeId === 'chu-chinese')
    expect(new Set(schoolSyllabusForScheme('chu', preschool).map((point) => point.subject_name))).not.toContain('中国古代文学')
    expect(new Set(schoolSyllabusForScheme('chu', chinese).map((point) => point.subject_name))).not.toContain('心理学')
  })

  it('第十一批七所院校全部开放，文理方案与共享知识点正确隔离', () => {
    const batch = new Map(schoolGroups().filter((school) => ['bzuu', 'chzu', 'ahszu', 'hsu', 'ahua', 'aycc', 'aisu'].includes(school.school_slug)).map((school) => [school.school_slug, school]))
    expect([...batch.keys()].sort()).toEqual(['ahszu', 'ahua', 'aisu', 'aycc', 'bzuu', 'chzu', 'hsu'])
    expect(batch.get('bzuu').offerings).toHaveLength(6)
    expect(batch.get('chzu').offerings).toHaveLength(4)
    expect(batch.get('ahszu').offerings).toHaveLength(9)
    expect(batch.get('hsu').offerings).toHaveLength(8)
    expect(batch.get('ahua').offerings).toHaveLength(8)
    expect(batch.get('aycc').offerings).toHaveLength(8)
    expect(batch.get('aisu').offerings).toHaveLength(22)

    const accountingWen = batch.get('aisu').examSchemes.find((scheme) => scheme.examSchemeId === 'aisu-accounting-wen')
    const accountingLi = batch.get('aisu').examSchemes.find((scheme) => scheme.examSchemeId === 'aisu-accounting-li')
    expect(accountingWen.publicSubjects).toEqual(['大学语文', '英语'])
    expect(accountingLi.publicSubjects).toEqual(['高等数学', '英语'])
    expect(accountingWen.offerings).toHaveLength(2)
    expect(accountingLi.offerings).toHaveLength(2)
    expect(new Set(schoolSyllabusForScheme('aisu', accountingWen).filter((point) => point.school_slug === 'aisu').map((point) => point.point_id))).toEqual(new Set(schoolSyllabusForScheme('aisu', accountingLi).filter((point) => point.school_slug === 'aisu').map((point) => point.point_id)))

    const visual = batch.get('ahua').examSchemes.find((scheme) => scheme.examSchemeId === 'ahua-visual')
    expect(visual.offerings).toHaveLength(3)
    expect(new Set(schoolSyllabusForScheme('ahua', visual).map((point) => point.point_id)).size).toBe(schoolSyllabusForScheme('ahua', visual).length)
  })

  it('没有知识点的新院校仍展示完整专业考试方案与后续整理状态', () => {
    render(<MemoryRouter initialEntries={['/anhui/2026/schools/whit']}><Routes>
      <Route path="/anhui/2026/schools/:schoolSlug" element={<LearningMap favorites={[]} toggleFavorite={() => {}} resources={resources} schools={schoolGroups()} syllabusPoints={syllabus} scope={DEFAULT_SCOPE} />} />
    </Routes></MemoryRouter>)
    expect(screen.getByRole('heading', { name: '芜湖职业技术大学' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '招生专业与培养点' })).toBeInTheDocument()
    expect(screen.getByText('工程力学 · 材料力学')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '知识点与学习资源待后续整理' })).toBeInTheDocument()
  })

  it('SEO 将旧路由 canonical 到院校主路由，院校页描述包含考试方案', () => {
    expect(canonicalPathForPath('/anhui/2026/computer-science/aufe')).toBe('/anhui/2026/schools/aufe')
    expect(canonicalPathForPath('/anhui/2026/schools/aufe')).toBe('/anhui/2026/schools/aufe')
    expect(metadataForPath('/anhui/2026/schools/aufe', '安徽财经大学').description).toContain('考试方案')
  })

  it('sitemap 只收录 canonical 院校主路由且保持四十五页', () => {
    const xml = fs.readFileSync(path.join(process.cwd(), 'public', 'sitemap.xml'), 'utf8')
    const locations = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1])
    expect(locations).toHaveLength(45)
    expect(locations.filter((url) => /\/anhui\/2026\/schools\//.test(url))).toHaveLength(41)
    expect(locations.some((url) => /\/anhui\/2026\/computer-science\/(?!compare$)[a-z0-9-]+$/.test(url))).toBe(false)
  })
})
