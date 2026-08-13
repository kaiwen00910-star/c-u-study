import fs from 'node:fs'
import path from 'node:path'
import Papa from 'papaparse'

const root = process.cwd()
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

required(offerings, ['offering_id','year','school_slug','school_name','training_site','charter_url','syllabus_url','verified_at'], 'offerings.csv')
required(syllabus, ['year','school_slug','subject_slug','point_id','point_title','canonical_topic'], 'syllabus.csv')
required(resources, ['resource_id','topic_tags','title','platform','url','priority','verified_at','status'], 'resources.csv')
unique(offerings, 'offering_id', 'offerings.csv'); unique(syllabus, 'point_id', 'syllabus.csv'); unique(resources, 'resource_id', 'resources.csv')
urlCheck(offerings, ['charter_url','syllabus_url'], 'offerings.csv'); urlCheck(resources, ['url'], 'resources.csv')
dateCheck(offerings, 'offerings.csv'); dateCheck(resources, 'resources.csv')

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
console.log(`内容校验通过：${offerings.length} 个招生点、${syllabus.length} 个知识点、${resources.length} 条资源。`)
