import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

describe('构建分包与 Netlify 配置', () => {
  const appSource = fs.readFileSync(path.join(process.cwd(), 'src', 'App.jsx'), 'utf8')
  const netlify = fs.readFileSync(path.join(process.cwd(), 'netlify.toml'), 'utf8')

  it('后台组件使用懒加载，公开入口不再静态导入 Admin', () => {
    expect(appSource).toContain("lazy(() => import('./Admin')")
    expect(appSource).not.toMatch(/from ['"]\.\/Admin['"]/)
  })

  it('hash 资源长期缓存、HTML 可再验证且 SPA 回退保留', () => {
    expect(netlify).toContain('for = "/assets/*"')
    expect(netlify).toContain('max-age=31536000, immutable')
    expect(netlify).toContain('max-age=0, must-revalidate')
    expect(netlify).toContain('from = "/*"')
    expect(netlify).toContain('to = "/index.html"')
    expect(netlify).toContain('status = 200')
  })
})
