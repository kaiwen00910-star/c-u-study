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
    if (!String(row[field]).startsWith('https://')) errors.push(`${file} 第 ${index + 2} 行 ${field} 必须使用 HTTPS`)
  }))
}
function dateCheck(rows, file) {
  rows.forEach((row, index) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(row.verified_at)) errors.push(`${file} 第 ${index + 2} 行日期格式错误`)
  })
}

required(offerings, ['offering_id','year','province_slug','major_slug','school_slug','school_name','training_site','charter_url','syllabus_url','verified_at'], 'offerings.csv')
required(syllabus, ['year','province_slug','major_slug','school_slug','subject_slug','point_id','point_title','canonical_topic'], 'syllabus.csv')
required(resources, ['resource_id','topic_tags','title','platform','url','priority','verified_at','status'], 'resources.csv')
unique(offerings, 'offering_id', 'offerings.csv'); unique(syllabus, 'point_id', 'syllabus.csv'); unique(resources, 'resource_id', 'resources.csv')
urlCheck(offerings, ['charter_url','syllabus_url'], 'offerings.csv'); urlCheck(resources, ['url'], 'resources.csv')
dateCheck(offerings, 'offerings.csv'); dateCheck(resources, 'resources.csv')

if (fallbackAcademicSchools.length !== 42) errors.push(`院校回退数据应为 42 所，当前为 ${fallbackAcademicSchools.length} 所`)
unique(fallbackAcademicSchools, 'school_id', '院校回退数据')
unique(fallbackAcademicSchools, 'school_slug', '院校回退数据')
fallbackAcademicSchools.forEach((school, index) => {
  const expectedId = `anhui-school-${String(index + 1).padStart(2, '0')}`
  if (school.school_id !== expectedId) errors.push(`院校回退数据第 ${index + 1} 所 ID 或顺序错误`)
  if (!school.school_name || !school.short_name) errors.push(`院校回退数据 ${expectedId} 缺少名称或简称`)
})
if (fallbackAcademicSchools.filter((school) => school.has_study_map).length !== 3) errors.push('院校回退数据必须仅开放 3 所学习地图')
if (!snapshot.metadata?.version || !snapshot.metadata?.generatedAt || !snapshot.metadata?.sourceUpdatedAt) errors.push('公开快照缺少版本、生成时间或源数据更新时间')
if (fallbackAcademicSchools.find((school) => school.school_id === 'anhui-school-09')?.school_name !== '安徽科技工程大学') errors.push('公开快照中的 anhui-school-09 未与线上有效校名同步')

const snapshotSchoolSlugs = new Set(fallbackAcademicSchools.map((school) => school.school_slug))
snapshot.syllabusPoints.forEach((row, index) => {
  if (row.school_slug !== 'common' && !snapshotSchoolSlugs.has(row.school_slug)) errors.push(`公开快照考纲第 ${index + 1} 条引用未知院校 ${row.school_slug}`)
})
const activeSnapshotTopics = new Set(snapshot.syllabusPoints.filter((row) => row.active !== false).map((row) => row.canonical_topic))
snapshot.resources.filter((row) => row.status === 'active' || row.status === 'published').forEach((row, index) => {
  const tags = Array.isArray(row.topic_tags) ? row.topic_tags : String(row.topic_tags || '').split('|').filter(Boolean)
  tags.forEach((tag) => { if (!activeSnapshotTopics.has(tag)) errors.push(`公开快照资源第 ${index + 1} 条引用无有效考纲的主题 ${tag}`) })
})

const snapshotOfferingCombinations = new Set()
snapshot.offerings.forEach((row, index) => {
  const combination = [row.year, row.province_slug, row.major_slug, row.school_slug, row.training_site.trim().toLowerCase()].join('|')
  if (snapshotOfferingCombinations.has(combination)) errors.push(`公开快照招生计划第 ${index + 1} 条范围/院校/培养地点组合重复`)
  snapshotOfferingCombinations.add(combination)
})

const offeringCombinations = new Set()
offerings.forEach((row, index) => {
  const combination = [row.year, row.province_slug, row.major_slug, row.school_slug, row.training_site.trim().toLowerCase()].join('|')
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
const forbidden = ['安徽建筑大学', 'ahjzu.edu.cn']
for (const file of ['offerings.csv','syllabus.csv','resources.csv']) {
  const text = fs.readFileSync(path.join(root, 'content', file), 'utf8')
  forbidden.forEach((word) => { if (text.includes(word)) errors.push(`${file} 残留禁止内容: ${word}`) })
}

if (errors.length) {
  console.error(`内容校验失败（${errors.length} 项）：\n- ${errors.join('\n- ')}`)
  process.exit(1)
}
console.log(`内容校验通过：${fallbackAcademicSchools.length} 所院校、${offerings.length} 个招生点、${syllabus.length} 个知识点、${resources.length} 条资源。`)
