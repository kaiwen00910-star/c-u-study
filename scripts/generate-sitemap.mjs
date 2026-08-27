import fs from 'node:fs'
import path from 'node:path'

const snapshot = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'content', 'public-content.snapshot.json'), 'utf8'))
const origin = 'https://splendid-duckanoo-926f44.netlify.app'
const published = (row) => row.status ? row.status === 'published' : row.active !== false
const scopes = [...new Map(snapshot.offerings.filter(published).map((row) => [`${row.year}:${row.province_slug}:${row.major_slug}`, row])).values()]
const urls = new Set(['/', '/sources'])

for (const scope of scopes) {
  const base = `/${scope.province_slug}/${scope.year}/${scope.major_slug}`
  urls.add(base); urls.add(`${base}/compare`)
  const offeringSchools = new Set(snapshot.offerings.filter((row) => published(row) && row.year === scope.year && row.province_slug === scope.province_slug && row.major_slug === scope.major_slug).map((row) => row.school_slug))
  const syllabusSchools = new Set(snapshot.syllabusPoints.filter((row) => published(row) && row.year === scope.year && row.province_slug === scope.province_slug && row.major_slug === scope.major_slug && row.school_slug !== 'common').map((row) => row.school_slug))
  ;[...offeringSchools].filter((slug) => syllabusSchools.has(slug)).forEach((slug) => urls.add(`${base}/${slug}`))
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...urls].map((url) => `  <url><loc>${origin}${url}</loc></url>`).join('\n')}\n</urlset>\n`
fs.writeFileSync(path.join(process.cwd(), 'public', 'sitemap.xml'), xml)
console.log(`sitemap 已生成：${urls.size} 个已发布页面。`)
