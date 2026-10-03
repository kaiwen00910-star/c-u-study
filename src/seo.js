import { DEFAULT_SCOPE, MAJOR_NAMES, normalizeScope, schoolPath, scopePath } from './contentScope'

const SITE_NAME = '安徽升本导航'
const SITE_ORIGIN = 'https://splendid-duckanoo-926f44.netlify.app'

export function metadataForPath(pathname, schoolName = '') {
  const schoolRouteMatch = pathname.match(/^\/([a-z0-9-]+)\/(\d{4})\/schools\/([a-z0-9-]+)/)
  const scopeMatch = pathname.match(/^\/([a-z0-9-]+)\/(\d{4})\/([a-z0-9-]+)/)
  const scope = schoolRouteMatch
    ? normalizeScope({ provinceSlug: schoolRouteMatch[1], year: schoolRouteMatch[2], majorSlug: DEFAULT_SCOPE.majorSlug })
    : scopeMatch ? normalizeScope({ provinceSlug: scopeMatch[1], year: scopeMatch[2], majorSlug: scopeMatch[3] }) : DEFAULT_SCOPE
  const major = MAJOR_NAMES[scope.majorSlug] || scope.majorSlug
  if (pathname.startsWith('/admin')) return { title: `管理后台｜${SITE_NAME}`, description: '安徽升本导航内容管理后台', robots: 'noindex,nofollow' }
  if (pathname === '/') return { title: '安徽专升本院校、考纲与学习地图｜安徽升本导航', description: '整理安徽普通专升本院校、正式招生来源、考试大纲、院校对比和可保存的本地学习进度。' }
  if (pathname === '/favorites') return { title: `我的收藏｜${SITE_NAME}`, description: '集中查看和管理当前浏览器收藏的安徽专升本学习资源。', robots: 'noindex,follow' }
  if (pathname === '/sources') return { title: `资料来源与核验规则｜${SITE_NAME}`, description: '查看安徽专升本招生章程、考试大纲来源与本站人工核验规则。' }
  if (pathname.endsWith('/compare')) return { title: `${scope.year} 安徽专升本院校对比｜${SITE_NAME}`, description: `最多选择 3 所已开放院校，对比${major}专业课、招生人数、培养地点和招生范围。` }
  if (schoolRouteMatch || (scopeMatch && pathname !== scopePath(scope))) return { title: `${schoolName || '院校'} ${scope.year} 专升本学习地图｜${SITE_NAME}`, description: `${schoolName || '目标院校'} ${scope.year} 年招生专业、培养点、考试方案、考纲知识点与学习资源。` }
  if (scopeMatch) return { title: `${scope.year} 安徽专升本院校筛选｜${SITE_NAME}`, description: `按院校名称、办学性质、学习地图状态和考试科目筛选${scope.year}安徽专升本院校。` }
  return { title: `页面未找到｜${SITE_NAME}`, description: '返回安徽升本导航继续查看院校和学习地图。' }
}

export function canonicalPathForPath(pathname) {
  const legacySchoolMatch = pathname.match(/^\/([a-z0-9-]+)\/(\d{4})\/([a-z0-9-]+)\/([a-z0-9-]+)\/?$/)
  if (legacySchoolMatch && legacySchoolMatch[4] !== 'compare') {
    return schoolPath(normalizeScope({ provinceSlug: legacySchoolMatch[1], year: legacySchoolMatch[2], majorSlug: legacySchoolMatch[3] }), legacySchoolMatch[4])
  }
  return pathname === '/' ? '/' : pathname.replace(/\/$/, '')
}

function ensureMeta(selector, attributes) {
  let element = document.head.querySelector(selector)
  if (!element) {
    element = document.createElement(attributes.tag || 'meta')
    document.head.appendChild(element)
  }
  Object.entries(attributes).forEach(([key, value]) => { if (key !== 'tag') element.setAttribute(key, value) })
  return element
}

export function applyPageMetadata(pathname, schoolName = '') {
  const meta = metadataForPath(pathname, schoolName)
  const canonicalUrl = `${SITE_ORIGIN}${canonicalPathForPath(pathname)}`
  document.title = meta.title
  ensureMeta('meta[name="description"]', { name: 'description', content: meta.description })
  ensureMeta('meta[name="robots"]', { name: 'robots', content: meta.robots || 'index,follow' })
  ensureMeta('link[rel="canonical"]', { tag: 'link', rel: 'canonical', href: canonicalUrl })
  ensureMeta('meta[property="og:title"]', { property: 'og:title', content: meta.title })
  ensureMeta('meta[property="og:description"]', { property: 'og:description', content: meta.description })
  ensureMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' })
  ensureMeta('meta[property="og:url"]', { property: 'og:url', content: canonicalUrl })
  ensureMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: SITE_NAME })
  return meta
}
