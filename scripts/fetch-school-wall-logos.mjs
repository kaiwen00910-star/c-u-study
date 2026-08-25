import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const names = [
  '安徽工业大学', '安徽农业大学', '安徽医科大学', '安徽师范大学', '安徽中医药大学', '阜阳师范大学',
  '安庆师范大学', '安徽建筑大学', '安徽科技工程大学', '铜陵学院', '蚌埠学院', '蚌埠医科大学',
  '皖南医科大学', '合肥大学', '巢湖学院', '亳州学院', '滁州学院', '宿州学院', '黄山学院',
  '池州学院', '皖西学院', '淮南师范学院', '合肥师范学院', '安徽艺术学院', '安徽医科大学临床医学院',
  '马鞍山学院', '安徽新华学院', '合肥经济学院', '合肥城市学院', '安徽外国语学院', '安徽三联学院',
  '蚌埠工商学院', '安徽信息工程学院', '淮北理工学院', '皖江工学院', '安徽文达信息工程学院',
  '芜湖学院', '阜阳理工学院', '安徽财经大学', '安徽第二医学院', '安徽职业技术大学', '芜湖职业技术大学',
]

const page = await fetch('https://www.urongda.com/logos').then((response) => response.text())
const output = resolve('public/school-wall')
await mkdir(output, { recursive: true })
const found = {}

for (const name of names) {
  const position = page.indexOf(`alt="${name}校徽`)
  if (position < 0) continue
  const snippet = page.slice(Math.max(0, position - 1400), position)
  const urls = [...snippet.matchAll(/https:\/\/cdn\.urongda\.com\/images\/schools\/[^" ]+\/240w\/[^" ]+?-240w\.webp/g)]
  const url = urls.at(-1)?.[0]
  if (!url) continue
  const slug = url.match(/schools\/([^/]+)\//)?.[1]
  if (!slug) continue
  const response = await fetch(url)
  if (!response.ok) continue
  await writeFile(resolve(output, `${slug}.webp`), Buffer.from(await response.arrayBuffer()))
  found[name] = `/school-wall/${slug}.webp`
  console.log(`${name}|${found[name]}`)
}

await writeFile(resolve(output, 'logo-map.json'), `${JSON.stringify(found, null, 2)}\n`)
console.log(`found ${Object.keys(found).length}/${names.length}`)
