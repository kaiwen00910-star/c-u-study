// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import fs from 'node:fs'
import path from 'node:path'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { LegacySchoolRedirect } from './App'
import { DEFAULT_SCOPE, schoolPath } from './contentScope'
import { fallbackAcademicSchools, offerings, schoolGroups, schoolSyllabusForScheme, syllabus } from './data'
import { createSchoolWallSchools } from './schoolWallData'
import { canonicalPathForPath, metadataForPath } from './seo'

function LocationProbe() {
  const location = useLocation()
  return <output>{`${location.pathname}${location.search}${location.hash}`}</output>
}

describe('院校主导型学习地图', () => {
  it('二十四所已开放院校全部生成 canonical 院校主路由', () => {
    const paths = schoolGroups().map((school) => schoolPath(DEFAULT_SCOPE, school.school_slug))
    expect(paths).toHaveLength(24)
    expect(new Set(paths).size).toBe(24)
    expect(paths.every((value) => /^\/anhui\/2026\/schools\/[a-z0-9-]+$/.test(value))).toBe(true)
  })

  it('首页院校墙只给已开放院校生成新主路由', () => {
    const wall = createSchoolWallSchools(fallbackAcademicSchools, offerings, syllabus, DEFAULT_SCOPE)
    expect(wall.filter((school) => school.hasDetails)).toHaveLength(24)
    expect(wall.filter((school) => school.hasDetails).every((school) => school.href === `/anhui/2026/schools/${school.schoolSlug}`)).toBe(true)
    expect(wall.find((school) => school.name === '合肥城市学院')).toMatchObject({ hasDetails: false, href: null })
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

  it('SEO 将旧路由 canonical 到院校主路由，院校页描述包含考试方案', () => {
    expect(canonicalPathForPath('/anhui/2026/computer-science/aufe')).toBe('/anhui/2026/schools/aufe')
    expect(canonicalPathForPath('/anhui/2026/schools/aufe')).toBe('/anhui/2026/schools/aufe')
    expect(metadataForPath('/anhui/2026/schools/aufe', '安徽财经大学').description).toContain('考试方案')
  })

  it('sitemap 只收录 canonical 院校主路由且保持二十八页', () => {
    const xml = fs.readFileSync(path.join(process.cwd(), 'public', 'sitemap.xml'), 'utf8')
    const locations = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1])
    expect(locations).toHaveLength(28)
    expect(locations.filter((url) => /\/anhui\/2026\/schools\//.test(url))).toHaveLength(24)
    expect(locations.some((url) => /\/anhui\/2026\/computer-science\/(?!compare$)[a-z0-9-]+$/.test(url))).toBe(false)
  })
})
