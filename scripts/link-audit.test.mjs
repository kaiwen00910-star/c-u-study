import { describe, expect, it } from 'vitest'
import {
  categorizeError,
  classifyResult,
  extractTitle,
  isSpecificResourceUrl,
  redactUrl,
} from './link-audit-lib.mjs'

describe('链接巡检分类', () => {
  it('区分正常访问和跳转', () => {
    expect(classifyResult({ status: 200 })).toBe('accessible')
    expect(classifyResult({ status: 200, redirected: true })).toBe('redirect')
  })

  it('区分验证页、自动请求拦截、登录和下架', () => {
    expect(classifyResult({ status: 200, body: '<title>安全验证</title>请输入验证码', pageTitle: '安全验证' })).toBe('verification-page')
    expect(classifyResult({ status: 200, body: '<title>具体课程</title><script>captcha</script>', pageTitle: '具体课程' })).toBe('accessible')
    expect(classifyResult({ status: 412, body: 'Precondition Failed' })).toBe('automated-request-blocked')
    expect(classifyResult({ status: 200, finalUrl: 'https://example.edu/login' })).toBe('login-required')
    expect(classifyResult({ status: 404 })).toBe('not-found')
  })

  it('单独识别 TLS 证书异常且不泄露敏感查询参数', () => {
    expect(categorizeError({ cause: { code: 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' } })).toBe('tls-error')
    expect(redactUrl('https://example.edu/course?id=1&token=secret')).toBe('https://example.edu/course?id=1&token=%5BREDACTED%5D')
  })

  it('提取标题并识别具体课程或视频入口', () => {
    expect(extractTitle('<title> 大学英语写作 &amp; 实践 </title>')).toBe('大学英语写作 & 实践')
    expect(isSpecificResourceUrl('https://www.bilibili.com/video/BV1Xa4y1k7LU/')).toBe(true)
    expect(isSpecificResourceUrl('https://www.icourse163.org/course/NJTU-1002528009')).toBe(true)
    expect(isSpecificResourceUrl('https://search.bilibili.com/all?keyword=C%E8%AF%AD%E8%A8%80')).toBe(false)
  })
})
