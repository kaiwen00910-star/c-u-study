import fs from 'node:fs'
import path from 'node:path'
import { collectLinks, inspectUrl, isSpecificResourceUrl } from './link-audit-lib.mjs'

const root = process.cwd()
const snapshotPath = path.join(root, 'content', 'public-content.snapshot.json')
const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'))
const timeoutArg = process.argv.find((arg) => arg.startsWith('--timeout='))
const concurrencyArg = process.argv.find((arg) => arg.startsWith('--concurrency='))
const outputIndex = process.argv.indexOf('--output')
const timeoutMs = Number(timeoutArg?.split('=')[1] ?? 15_000)
const concurrency = Math.max(1, Number(concurrencyArg?.split('=')[1] ?? 4))
const outputPath = outputIndex >= 0 ? process.argv[outputIndex + 1] : ''

const relations = collectLinks(snapshot)
const uniqueUrls = [...new Set(relations.map((item) => item.url))]
const audits = new Map()
let cursor = 0

async function worker() {
  while (cursor < uniqueUrls.length) {
    const index = cursor
    cursor += 1
    const url = uniqueUrls[index]
    audits.set(url, await inspectUrl(url, { timeoutMs }))
  }
}

await Promise.all(Array.from({ length: Math.min(concurrency, uniqueUrls.length) }, () => worker()))

const grouped = new Map()
for (const relation of relations) {
  const key = `${relation.type}|${relation.url}`
  const current = grouped.get(key) ?? {
    type: relation.type,
    relatedIds: [],
    schoolSlugs: [],
    years: [],
    url: relation.url,
  }
  current.relatedIds.push(relation.relationId)
  if (relation.schoolSlug) current.schoolSlugs.push(relation.schoolSlug)
  if (relation.year) current.years.push(relation.year)
  grouped.set(key, current)
}

const results = [...grouped.values()].map((item) => ({
  type: item.type,
  relatedIds: [...new Set(item.relatedIds)],
  schoolSlugs: [...new Set(item.schoolSlugs)],
  years: [...new Set(item.years)],
  ...audits.get(item.url),
  ...(item.type === 'resource'
    ? { resourceTarget: isSpecificResourceUrl(item.url) ? 'specific-content' : 'review-required' }
    : {}),
}))

const byConclusion = results.reduce((counts, result) => {
  counts[result.conclusion] = (counts[result.conclusion] ?? 0) + 1
  return counts
}, {})
const report = {
  generatedAt: new Date().toISOString(),
  source: path.relative(root, snapshotPath).replaceAll('\\', '/'),
  readOnly: true,
  uniqueUrlCount: uniqueUrls.length,
  recordCount: results.length,
  byConclusion,
  results,
}
const json = `${JSON.stringify(report, null, 2)}\n`

if (outputPath) {
  const resolved = path.resolve(root, outputPath)
  fs.mkdirSync(path.dirname(resolved), { recursive: true })
  fs.writeFileSync(resolved, json, 'utf8')
  console.log(`链接巡检完成：${results.length} 条记录，报告已写入 ${resolved}`)
} else {
  process.stdout.write(json)
}
