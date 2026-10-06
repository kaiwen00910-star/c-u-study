import fs from 'node:fs'
import path from 'node:path'
import Papa from 'papaparse'

const root = process.cwd()
const snapshot = JSON.parse(fs.readFileSync(path.join(root, 'content', 'public-content.snapshot.json'), 'utf8'))
const fallbackAcademicSchools = snapshot.academicSchools
const load = (name) => Papa.parse(fs.readFileSync(path.join(root, 'content', name), 'utf8'), {
  header: true, skipEmptyLines: true,
}).data
const offerings = load('offerings.csv')
const syllabus = load('syllabus.csv')
const resources = load('resources.csv')
const errors = []

function required(rows, fields, file) {
  rows.forEach((row, index) => fields.forEach((field) => {
    if (!String(row[field] ?? '').trim()) errors.push(`${file} 第 ${index + 2} 行缺少 ${field}`)
  }))
}
function unique(rows, field, file) {
  const seen = new Set()
  rows.forEach((row, index) => {
    if (seen.has(row[field])) errors.push(`${file} 第 ${index + 2} 行 ${field} 重复: ${row[field]}`)
    seen.add(row[field])
  })
}
function urlCheck(rows, fields, file) {
  rows.forEach((row, index) => fields.forEach((field) => {
    const value = String(row[field])
    const isDocumentedOfficialHttp = file === 'offerings.csv' && /^http:\/\/zsb\.wxc\.edu\.cn\//.test(value)
    if (!value.startsWith('https://') && !isDocumentedOfficialHttp) errors.push(`${file} 第 ${index + 2} 行 ${field} 必须使用 HTTPS`)
  }))
}
function uniqueBy(rows, keyFor, file, label) {
  const seen = new Set()
  rows.forEach((row, index) => {
    const key = keyFor(row)
    if (seen.has(key)) errors.push(`${file} 第 ${index + 2} 行 ${label} 重复: ${key}`)
    seen.add(key)
  })
}
function dateCheck(rows, file) {
  rows.forEach((row, index) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(row.verified_at)) errors.push(`${file} 第 ${index + 2} 行日期格式错误`)
  })
}

required(offerings, ['offering_id','year','province_slug','major_slug','school_slug','school_name','program_names','exam_scheme_id','training_site','charter_url','syllabus_url','verified_at'], 'offerings.csv')
required(syllabus, ['year','province_slug','major_slug','school_slug','subject_slug','point_id','point_title','canonical_topic'], 'syllabus.csv')
required(resources, ['resource_id','topic_tags','title','platform','url','priority','verified_at','status'], 'resources.csv')
unique(offerings, 'offering_id', 'offerings.csv')
uniqueBy(syllabus, (row) => [row.year, row.province_slug, row.major_slug, row.point_id].join('|'), 'syllabus.csv', '范围/知识点 ID')
unique(resources, 'resource_id', 'resources.csv')
urlCheck(offerings, ['charter_url','syllabus_url'], 'offerings.csv'); urlCheck(resources, ['url'], 'resources.csv')
dateCheck(offerings, 'offerings.csv'); dateCheck(resources, 'resources.csv')

if (fallbackAcademicSchools.length !== 42) errors.push(`院校回退数据应为 42 所，当前为 ${fallbackAcademicSchools.length} 所`)
if (snapshot.offerings.length !== 174) errors.push(`公开快照应为 174 个已发布招生点，当前为 ${snapshot.offerings.length} 个`)
if (snapshot.syllabusPoints.length !== 1033) errors.push(`公开快照应为 1033 个已发布知识点，当前为 ${snapshot.syllabusPoints.length} 个`)
if (snapshot.resources.filter((row) => row.status === 'published').length !== 80) errors.push('公开快照应为 80 条已发布学习资源')
unique(fallbackAcademicSchools, 'school_id', '院校回退数据')
unique(fallbackAcademicSchools, 'school_slug', '院校回退数据')
fallbackAcademicSchools.forEach((school, index) => {
  const expectedId = `anhui-school-${String(index + 1).padStart(2, '0')}`
  if (school.school_id !== expectedId) errors.push(`院校回退数据第 ${index + 1} 所 ID 或顺序错误`)
  if (!school.school_name || !school.short_name) errors.push(`院校回退数据 ${expectedId} 缺少名称或简称`)
})
if (fallbackAcademicSchools.filter((school) => school.has_study_map).length !== 41) errors.push('院校回退数据应开放 41 所院校专业地图')
if (!snapshot.metadata?.version || !snapshot.metadata?.generatedAt || !snapshot.metadata?.sourceUpdatedAt) errors.push('公开快照缺少版本、生成时间或源数据更新时间')
if (fallbackAcademicSchools.find((school) => school.school_id === 'anhui-school-09')?.school_name !== '安徽科技工程大学') errors.push('公开快照中的 anhui-school-09 未与线上有效校名同步')

const snapshotSchoolSlugs = new Set(fallbackAcademicSchools.map((school) => school.school_slug))
snapshot.syllabusPoints.forEach((row, index) => {
  if (row.school_slug !== 'common' && !snapshotSchoolSlugs.has(row.school_slug)) errors.push(`公开快照考纲第 ${index + 1} 条引用未知院校 ${row.school_slug}`)
})
const activeSnapshotTopics = new Set(snapshot.syllabusPoints.filter((row) => row.active !== false).map((row) => row.canonical_topic))
const publishedSnapshotTopics = new Set(snapshot.resources.filter((row) => row.status === 'published').flatMap((row) => row.topic_tags))
snapshot.syllabusPoints.filter((row) => row.status === 'published').forEach((row, index) => {
  if (!publishedSnapshotTopics.has(row.canonical_topic)) errors.push(`公开快照已发布考纲第 ${index + 1} 条没有已发布学习资源`)
})
snapshot.resources.filter((row) => row.status === 'active' || row.status === 'published').forEach((row, index) => {
  const tags = Array.isArray(row.topic_tags) ? row.topic_tags : String(row.topic_tags || '').split('|').filter(Boolean)
  tags.forEach((tag) => { if (!activeSnapshotTopics.has(tag)) errors.push(`公开快照资源第 ${index + 1} 条引用无有效考纲的主题 ${tag}`) })
})

const snapshotOfferingCombinations = new Set()
snapshot.offerings.forEach((row, index) => {
  const combination = [row.year, row.province_slug, row.major_slug, row.school_slug, row.training_site.trim().toLowerCase(), JSON.stringify(row.program_names), row.exam_scheme_id].join('|')
  if (snapshotOfferingCombinations.has(combination)) errors.push(`公开快照招生计划第 ${index + 1} 条范围/院校/培养地点组合重复`)
  snapshotOfferingCombinations.add(combination)
  if (row.status === 'published' && (!Array.isArray(row.program_names) || row.program_names.length === 0 || !/^[a-z0-9-]+$/.test(row.exam_scheme_id || ''))) {
    errors.push(`公开快照已发布招生计划第 ${index + 1} 条缺少结构化专业或考试方案`)
  }
  if (row.year === 2027 && (row.status === 'published' || row.source_status !== '等待新年度官方文件核验')) {
    errors.push(`公开快照 2027 招生计划第 ${index + 1} 条必须保持待核验草稿`)
  }
})

const snapshotSchemes = new Map()
snapshot.offerings.filter((row) => row.status === 'published').forEach((row, index) => {
  const key = `${row.school_slug}:${row.exam_scheme_id}`
  const subjects = JSON.stringify([row.public_subjects, row.professional_subjects])
  if (snapshotSchemes.has(key) && snapshotSchemes.get(key) !== subjects) errors.push(`公开快照招生计划第 ${index + 1} 条的考试方案科目不一致`)
  snapshotSchemes.set(key, subjects)
})
const publishedMapSchools = new Set(snapshot.offerings.filter((row) => row.status === 'published').map((row) => row.school_slug))
if (publishedMapSchools.size !== 41) errors.push(`公开快照应为 41 所院校专业地图，当前为 ${publishedMapSchools.size} 所`)
const expectedBatchTwelve = {
  cuhf: { offerings: 25, programs: 17, plans: 2000, schemes: 21 },
  bctb: { offerings: 12, programs: 12, plans: 972, schemes: 11 },
  whit: { offerings: 5, programs: 5, plans: 350, schemes: 5 },
}
Object.entries(expectedBatchTwelve).forEach(([slug, expected]) => {
  const rows = snapshot.offerings.filter((row) => row.status === 'published' && row.school_slug === slug)
  const programs = new Set(rows.flatMap((row) => row.program_names))
  const schemes = new Set(rows.map((row) => row.exam_scheme_id))
  const plans = rows.reduce((total, row) => total + Number(row.plan_count), 0)
  if (rows.length !== expected.offerings || programs.size !== expected.programs || plans !== expected.plans || schemes.size !== expected.schemes) {
    errors.push(`${slug} 招生记录、专业、计划或考试方案统计不正确`)
  }
  if (snapshot.syllabusPoints.some((row) => row.school_slug === slug)) errors.push(`${slug} 本批不得新增知识点`)
})
const secondMedical = fallbackAcademicSchools.find((school) => school.school_name === '安徽第二医学院')
if (!secondMedical || secondMedical.has_study_map || snapshot.offerings.some((row) => row.school_slug === secondMedical.school_slug)) {
  errors.push('安徽第二医学院必须保持未开放且无招生点')
}

const offeringCombinations = new Set()
offerings.forEach((row, index) => {
  const combination = [row.year, row.province_slug, row.major_slug, row.school_slug, row.training_site.trim().toLowerCase(), row.program_names, row.exam_scheme_id].join('|')
  if (offeringCombinations.has(combination)) errors.push(`offerings.csv 第 ${index + 2} 行年份/省份/专业/院校/培养地点组合重复`)
  offeringCombinations.add(combination)
})

const schoolSlugs = new Set(offerings.map((row) => row.school_slug))
syllabus.forEach((row, index) => {
  if (row.school_slug !== 'common' && !schoolSlugs.has(row.school_slug)) errors.push(`syllabus.csv 第 ${index + 2} 行引用了未知院校`)
})
const topics = new Set(syllabus.map((row) => row.canonical_topic))
resources.forEach((row, index) => row.topic_tags.split('|').forEach((tag) => {
  if (!topics.has(tag)) errors.push(`resources.csv 第 ${index + 2} 行引用了未知主题 ${tag}`)
}))
resources.forEach((row, index) => {
  if (/\/search(?:\.htm)?[?/]/.test(row.url)) {
    errors.push(`resources.csv 第 ${index + 2} 行必须链接到具体课程或视频，不能使用搜索结果页`)
  }
  if (row.platform === '哔哩哔哩' && !/^https:\/\/www\.bilibili\.com\/video\/(?:BV[\w]+|av\d+)\/?$/.test(row.url)) {
    errors.push(`resources.csv 第 ${index + 2} 行不是规范的哔哩哔哩视频链接`)
  }
})
const resourceUrls = new Set()
resources.forEach((row, index) => {
  const normalized = row.url.trim().replace(/\/$/, '')
  if (resourceUrls.has(normalized)) errors.push(`resources.csv 第 ${index + 2} 行资源链接重复`)
  resourceUrls.add(normalized)
})
if (errors.length) {
  console.error(`内容校验失败（${errors.length} 项）：\n- ${errors.join('\n- ')}`)
  process.exit(1)
}
console.log(`内容校验通过：${fallbackAcademicSchools.length} 所院校、${offerings.length} 个招生点、${syllabus.length} 个知识点、${resources.length} 条资源。`)
