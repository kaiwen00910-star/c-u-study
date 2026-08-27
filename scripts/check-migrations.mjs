import fs from 'node:fs'
import path from 'node:path'

const directory = path.join(process.cwd(), 'supabase', 'migrations')
const files = fs.readdirSync(directory).filter((name) => name.endsWith('.sql')).sort()
const pattern = /^(\d{14})_([a-z][a-z0-9_]*)\.sql$/
const errors = []
const versions = new Set()
let previousVersion = ''

for (const file of files) {
  const match = file.match(pattern)
  if (!match) {
    errors.push(`${file}: 文件名必须是 14 位时间戳加 snake_case 名称`)
    continue
  }
  const [, version] = match
  if (versions.has(version)) errors.push(`${file}: 时间戳重复`)
  if (previousVersion && version <= previousVersion) errors.push(`${file}: 时间戳必须严格递增`)
  if (!fs.readFileSync(path.join(directory, file), 'utf8').trim()) errors.push(`${file}: 迁移文件不能为空`)
  versions.add(version)
  previousVersion = version
}

if (!files.length) errors.push('supabase/migrations 中缺少迁移文件')
if (errors.length) {
  console.error(`迁移一致性检查失败：\n- ${errors.join('\n- ')}`)
  process.exit(1)
}

console.log(`迁移一致性检查通过：${files.length} 个文件，版本唯一且按顺序排列。`)
