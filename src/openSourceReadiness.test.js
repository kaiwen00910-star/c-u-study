import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')

describe('开源安全基线', () => {
  it('不在登录页、文档或校验模块中公开管理员邮箱', () => {
    const publicRepositoryText = [
      read('README.md'),
      read('src/Admin.jsx'),
      read('src/resourceValidation.js'),
    ].join('\n')

    expect(publicRepositoryText).not.toMatch(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)
    expect(publicRepositoryText).not.toContain('ADMIN_EMAIL')
  })

  it('声明 MIT 代码许可证和第三方内容边界', () => {
    expect(JSON.parse(read('package.json')).license).toBe('MIT')
    expect(read('LICENSE')).toContain('MIT License')
    expect(read('NOTICE.md')).toContain('不因收录在本仓库中而获得 MIT 授权')
  })

  it('生产配置包含浏览器安全响应头', () => {
    const config = read('netlify.toml')
    expect(config).toContain('Content-Security-Policy')
    expect(config).toContain("frame-ancestors 'none'")
    expect(config).toContain('X-Content-Type-Options = "nosniff"')
    expect(config).toContain('Referrer-Policy = "strict-origin-when-cross-origin"')
    expect(config).toContain('Permissions-Policy')
  })

  it('首页不再使用内联统计脚本', () => {
    const html = read('index.html')
    expect(html).not.toContain('VITE_BAIDU_TONGJI_ID')
    expect(html).not.toMatch(/<script(?![^>]*\bsrc=)[^>]*>/i)
  })
})
