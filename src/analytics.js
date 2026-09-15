const EVENT_NAMES = new Set([
  'school_directory_entered',
  'school_filter_used',
  'school_compare_opened',
  'learning_map_opened',
  'external_resource_clicked',
  'resource_favorited',
  'syllabus_point_completed',
  'content_feedback_submitted',
])

const TRACKING_SCRIPT_ID = 'baidu-tongji-script'
let lastTrackedPath = ''

export function isPublicTrackingPath(pathname = '/') {
  return !pathname.startsWith('/admin')
}

export function validBaiduSiteId(value) {
  const normalized = String(value || '').trim()
  return !normalized.startsWith('YOUR_') && /^[a-zA-Z0-9_-]{8,64}$/.test(normalized)
}

function trackingConfig() {
  return {
    production: import.meta.env.PROD,
    siteId: String(import.meta.env.VITE_BAIDU_TONGJI_ID || '').trim(),
  }
}

export function initializeAnalytics(pathname = window.location.pathname, config = trackingConfig()) {
  const { production, siteId } = config
  if (!production || !validBaiduSiteId(siteId) || !isPublicTrackingPath(pathname)) return false

  window._hmt = window._hmt || []
  if (!document.getElementById(TRACKING_SCRIPT_ID)) {
    window._hmt.push(['_setAutoPageview', false])
    const script = document.createElement('script')
    script.id = TRACKING_SCRIPT_ID
    script.async = true
    script.src = `https://hm.baidu.com/hm.js?${encodeURIComponent(siteId)}`
    script.onerror = () => { script.dataset.loadState = 'failed' }
    document.head.appendChild(script)
  }
  return true
}

export function trackPageview(pathname) {
  const cleanPath = String(pathname || '/').split(/[?#]/, 1)[0] || '/'
  if (cleanPath === lastTrackedPath || !initializeAnalytics(cleanPath)) return false
  lastTrackedPath = cleanPath
  window._hmt.push(['_trackPageview', cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`])
  return true
}

export function trackEvent(name, label = '') {
  if (!EVENT_NAMES.has(name) || !initializeAnalytics(window.location.pathname)) return false
  const safeLabel = String(label || '').toLowerCase().replace(/[^a-z0-9:_-]/g, '').slice(0, 80)
  window._hmt.push(['_trackEvent', 'site_action', name, safeLabel])
  return true
}

export function resetAnalyticsForTests() {
  lastTrackedPath = ''
}
