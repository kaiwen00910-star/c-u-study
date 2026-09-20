const REDACTED_QUERY_KEY = /(?:token|key|secret|password|passwd|auth|session|cookie)/i
const VERIFICATION_PATTERN = /(?:验证码|请输入验证码|滑动验证|安全验证|访问验证|人机验证|captcha|verify you are human|verification required)/i
const AUTOMATION_BLOCK_PATTERN = /(?:访问过于频繁|异常访问|请求被拦截|automated request|access denied|checking your browser|temporarily blocked|ray id)/i
const LOGIN_PATTERN = /(?:请先登录(?:后|再)|登录后(?:继续|查看)|sign in to continue|login required)/i

export function redactUrl(value) {
  try {
    const url = new URL(value)
    url.username = ''
    url.password = ''
    for (const key of [...url.searchParams.keys()]) {
      if (REDACTED_QUERY_KEY.test(key)) url.searchParams.set(key, '[REDACTED]')
    }
    return url.toString()
  } catch {
    return String(value).replace(/([?&](?:token|key|secret|password|passwd|auth|session|cookie)=)[^&#]*/gi, '$1[REDACTED]')
  }
}

export function extractTitle(html = '') {
  const match = String(html).match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  if (!match) return ''
  return match[1]
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

export function isSpecificResourceUrl(value) {
  try {
    const url = new URL(value)
    const path = url.pathname.replace(/\/$/, '')
    if (/bilibili\.com$/i.test(url.hostname)) return /^\/video\/(?:BV[\w]+|av\d+)$/i.test(path)
    if (/icourse163\.org$/i.test(url.hostname)) {
      return /^\/course\/(?:detail\.htm|[\w-]+)$/i.test(path)
        && !/(?:^|\/)search(?:\/|$)/i.test(path)
    }
    return path.length > 1 && !/(?:^|\/)search(?:\.[a-z]+)?(?:\/|$)/i.test(path)
  } catch {
    return false
  }
}

export function classifyResult({
  status,
  finalUrl = '',
  body = '',
  pageTitle = '',
  redirected = false,
  errorCategory = '',
}) {
  if (errorCategory) return errorCategory
  if (status === 404 || status === 410) return 'not-found'
  if (status === 401 || status === 407 || /\/(?:login|signin|sign-in|auth)(?:[/?#]|$)/i.test(finalUrl) || LOGIN_PATTERN.test(body)) {
    return 'login-required'
  }
  // Some course pages ship dormant captcha/risk-control markup alongside the
  // real page. Treat it as a verification page only when no meaningful title
  // was rendered, or when the title itself identifies a verification screen.
  if (VERIFICATION_PATTERN.test(body) && (!pageTitle || VERIFICATION_PATTERN.test(pageTitle))) return 'verification-page'
  if ([403, 406, 412, 418, 429].includes(status) || AUTOMATION_BLOCK_PATTERN.test(body)) {
    return 'automated-request-blocked'
  }
  if (status >= 200 && status < 300) return redirected ? 'redirect' : 'accessible'
  if (status >= 300 && status < 400) return 'redirect'
  return 'network-error'
}

export function categorizeError(error) {
  const detail = [error?.name, error?.message, error?.cause?.code, error?.cause?.message].filter(Boolean).join(' ')
  if (/(?:certificate|cert_|ssl|tls|self[- _]signed|unable[- _]to[- _]verify|wrong[- _]version[- _]number)/i.test(detail)) return 'tls-error'
  return 'network-error'
}

async function readTextSnippet(response, limit = 512 * 1024) {
  if (!response.body) return ''
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let total = 0
  let text = ''
  try {
    while (total < limit) {
      const { done, value } = await reader.read()
      if (done) break
      const remaining = Math.min(value.byteLength, limit - total)
      text += decoder.decode(value.subarray(0, remaining), { stream: true })
      total += remaining
    }
  } finally {
    await reader.cancel().catch(() => {})
  }
  return text + decoder.decode()
}

export async function inspectUrl(originalUrl, {
  timeoutMs = 15_000,
  maxRedirects = 5,
  fetchImpl = fetch,
} = {}) {
  const redirectChain = []
  let currentUrl = originalUrl
  try {
    for (let hop = 0; hop <= maxRedirects; hop += 1) {
      const response = await fetchImpl(currentUrl, {
        method: 'GET',
        redirect: 'manual',
        signal: AbortSignal.timeout(timeoutMs),
        headers: {
          Accept: 'text/html,application/xhtml+xml,application/pdf,application/zip;q=0.9,*/*;q=0.8',
          'User-Agent': 'C-U-Study-Link-Audit/1.0 (+public-read-only; no-form-submit)',
        },
      })
      const location = response.headers.get('location')
      if (response.status >= 300 && response.status < 400 && location && hop < maxRedirects) {
        const nextUrl = new URL(location, currentUrl).toString()
        redirectChain.push({ status: response.status, from: redactUrl(currentUrl), to: redactUrl(nextUrl) })
        currentUrl = nextUrl
        continue
      }

      const contentType = response.headers.get('content-type')?.split(';')[0]?.trim() ?? ''
      const body = /(?:html|text|json|xml|javascript)/i.test(contentType)
        ? await readTextSnippet(response)
        : ''
      const redirected = redirectChain.length > 0
      const pageTitle = extractTitle(body)
      return {
        originalUrl: redactUrl(originalUrl),
        finalUrl: redactUrl(currentUrl),
        httpStatus: response.status,
        contentType,
        redirected,
        redirectChain,
        pageTitle,
        conclusion: classifyResult({
          status: response.status,
          finalUrl: currentUrl,
          body,
          pageTitle,
          redirected,
        }),
      }
    }
  } catch (error) {
    const conclusion = categorizeError(error)
    return {
      originalUrl: redactUrl(originalUrl),
      finalUrl: redactUrl(currentUrl),
      httpStatus: null,
      contentType: '',
      redirected: redirectChain.length > 0,
      redirectChain,
      pageTitle: '',
      conclusion,
      error: conclusion,
    }
  }

  return {
    originalUrl: redactUrl(originalUrl),
    finalUrl: redactUrl(currentUrl),
    httpStatus: null,
    contentType: '',
    redirected: redirectChain.length > 0,
    redirectChain,
    pageTitle: '',
    conclusion: 'network-error',
    error: 'redirect-limit-exceeded',
  }
}

export function collectLinks(snapshot) {
  const links = []
  for (const offering of snapshot.offerings ?? []) {
    for (const [type, url] of [['charter', offering.charter_url], ['syllabus', offering.syllabus_url]]) {
      if (!url) continue
      links.push({
        type,
        url,
        relationId: offering.offering_id,
        schoolSlug: offering.school_slug,
        year: offering.year,
      })
    }
  }
  for (const resource of snapshot.resources ?? []) {
    if (!resource.url || !['active', 'published'].includes(resource.status)) continue
    links.push({
      type: 'resource',
      url: resource.url,
      relationId: resource.resource_id,
      schoolSlug: null,
      year: null,
    })
  }
  return links
}
