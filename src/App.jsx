import { lazy, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { BrowserRouter, Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate, useNavigationType, useParams, useSearchParams } from 'react-router-dom'
import { offeringSchoolGroups, offerings as snapshotOfferings, schoolGroups, subjectNames } from './data'
import { createLocalBackup, getCountdownTarget, importLocalBackup, saveCountdownTarget, saveLastSelection } from './storage'
import { useContent } from './useContent'
import { createSchoolWallSchools, createSchoolWallTracks } from './schoolWallData'
import { comparePath, DEFAULT_SCOPE, MAJOR_NAMES, normalizeScope, schoolPath, scopeLabel, scopePath } from './contentScope'
import { filterSchoolDirectory, learningDeepLink } from './publicFeatures'
import { loadPublishedScopes } from './publicApi'
import { applyPageMetadata } from './seo'
import { trackEvent, trackPageview } from './analytics'
import { COURSE_REFERENCE_NOTICE, ELIGIBILITY_NOTICE, PUBLIC_COURSE_TRACKS, eligibleMajorSuggestions, findEligibleOfferings, mappedEligibleMajorCategories, sortEligibleResults } from './eligibleMajorSearch'
import { buildAmapSearchUrl, parseTrainingSiteLocations, trainingSiteAssignmentNote } from './mapLinks'
import { AdvancedInteractionsProvider, GlobalSearchTrigger, SchoolQuickPreviewButton } from './AdvancedInteractions'
import './App.css'

const AdminDashboard = lazy(() => import('./Admin').then((module) => ({ default: module.AdminDashboard })))
const AdminLogin = lazy(() => import('./Admin').then((module) => ({ default: module.AdminLogin })))
const AdminResetPassword = lazy(() => import('./Admin').then((module) => ({ default: module.AdminResetPassword })))

function AnalyticsRouteTracker() {
  const location = useLocation()
  useEffect(() => { trackPageview(location.pathname) }, [location.pathname])
  return null
}

export function RouteScrollManager() {
  const location = useLocation()
  const navigationType = useNavigationType()
  const previousPathname = useRef(location.pathname)

  useLayoutEffect(() => {
    const pathnameChanged = previousPathname.current !== location.pathname
    previousPathname.current = location.pathname
    if (!pathnameChanged || location.hash || navigationType === 'POP') return
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [location.pathname, location.hash, navigationType])

  return null
}

const SCHOOL_DIRECTORY_RETURN_KEY = 'zsb:v1:schoolDirectoryReturn'

function saveSchoolDirectoryReturn(path, schoolSlug) {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(SCHOOL_DIRECTORY_RETURN_KEY, JSON.stringify({
      path,
      schoolSlug,
      scrollY: Math.max(0, Number(window.scrollY) || 0),
    }))
  } catch {
    // 浏览器禁用会话存储时仍允许正常进入专业地图。
  }
}

function readSchoolDirectoryReturn(path) {
  if (typeof window === 'undefined') return null
  try {
    const value = JSON.parse(window.sessionStorage.getItem(SCHOOL_DIRECTORY_RETURN_KEY) || 'null')
    if (!value || value.path !== path || !/^[a-z0-9-]+$/.test(value.schoolSlug) || !Number.isFinite(value.scrollY)) return null
    return value
  } catch {
    return null
  }
}

function clearSchoolDirectoryReturn() {
  try { window.sessionStorage.removeItem(SCHOOL_DIRECTORY_RETURN_KEY) } catch { /* 无可用会话存储时无需清理。 */ }
}

function Logo() {
  return <Link className="logo" to="/" aria-label="安徽升本导航首页"><span>皖</span><strong>安徽升本导航</strong></Link>
}

export function MobileNavigation() {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef(null)
  const menuRef = useRef(null)
  const location = useLocation()

  useEffect(() => { setOpen(false) }, [location.pathname])
  useEffect(() => {
    if (!open) return undefined
    menuRef.current?.querySelector('a')?.focus()
    function closeOnEscape(event) {
      if (event.key !== 'Escape') return
      setOpen(false)
      buttonRef.current?.focus()
    }
    function closeOnOutsideClick(event) {
      if (!menuRef.current?.contains(event.target) && !buttonRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('keydown', closeOnEscape)
    document.addEventListener('pointerdown', closeOnOutsideClick)
    return () => {
      document.removeEventListener('keydown', closeOnEscape)
      document.removeEventListener('pointerdown', closeOnOutsideClick)
    }
  }, [open])

  const close = () => setOpen(false)
  return <div className="mobile-navigation">
    <button ref={buttonRef} className="mobile-menu-trigger" type="button" aria-expanded={open} aria-controls="mobile-navigation-menu" aria-haspopup="true" onClick={() => setOpen((current) => !current)}>
      <span aria-hidden="true">{open ? '×' : '☰'}</span><span>更多</span>
    </button>
    {open && <nav ref={menuRef} id="mobile-navigation-menu" className="mobile-menu" aria-label="移动端导航">
      <NavLink to="/anhui" onClick={close}>院校与专业</NavLink>
      <NavLink to="/anhui/2026/eligible-programs" onClick={close}>我能报哪些专业</NavLink>
      <NavLink to={comparePath(DEFAULT_SCOPE)} onClick={close}>院校对比</NavLink>
      <NavLink to="/sources" onClick={close}>资料来源</NavLink>
      <a href="https://www.ahzsks.cn/zyyx/" target="_blank" rel="noreferrer" onClick={close} aria-label="安徽省招生考试院（在新标签页打开）">安徽省招生考试院 ↗</a>
    </nav>}
  </div>
}

function Layout({ children, announcement, content }) {
  return <div className="site-shell" data-content-release="professional-maps-only">
    <header className="topbar">
      <div className="topbar-inner">
        <Logo />
        <nav className="desktop-navigation" aria-label="主导航">
          <NavLink to="/anhui">院校与专业</NavLink>
          <NavLink to="/anhui/2026/eligible-programs">我能报哪些专业</NavLink>
          <NavLink to={comparePath(DEFAULT_SCOPE)}>院校对比</NavLink>
          <NavLink to="/sources">资料来源</NavLink>
          <a href="https://www.ahzsks.cn/zyyx/" target="_blank" rel="noreferrer" aria-label="安徽省招生考试院（在新标签页打开）">安徽省招生考试院 ↗</a>
        </nav>
        <div className="topbar-actions"><GlobalSearchTrigger /><MobileNavigation /></div>
      </div>
    </header>
    {content.loading && <aside className="data-status checking" role="status">正在核验在线数据；当前先显示版本化快照。</aside>}
    {content.offline && <aside className="data-status offline" role="alert"><strong>内置快照</strong><span>在线数据暂不可用或版本较旧，招生计划与考纲来自版本 {content.metadata.version}（生成于 {new Date(content.metadata.generatedAt).toLocaleString('zh-CN')}）。请打开官方来源复核。</span></aside>}
    {announcement && <aside className="site-announcement" role="status"><strong>{announcement.title}</strong><span>{announcement.content}</span></aside>}
    <main>{children}</main>
    <footer>
      <div><Logo /><p>专注安徽专升本，集中整理院校、招生专业、培养地点与考试方案。</p></div>
      <div><strong>重要说明</strong><p>本站为非官方学习导航，不组织招生与考试。报考前请以省考试院和招生院校最新通知为准。</p></div>
      <div><strong>访问统计与隐私</strong><p>仅在正式站配置有效站点 ID 时启用百度统计，用于汇总页面访问和固定功能点击。事件参数不含搜索框自由文本、姓名、邮箱或主动采集的 IP。</p></div>
    </footer>
  </div>
}

export function SearchBox({ resources, syllabusPoints, schools, scope }) {
  const [query, setQuery] = useState('')
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    const openSlugs = new Set(schools.map((school) => school.school_slug))
    const pointMatches = syllabusPoints.filter((item) => `${item.point_title}${item.section_name}${item.subject_name || subjectNames[item.subject_slug] || ''}`.toLowerCase().includes(q))
      .map((item) => ({ item, schoolSlug: item.school_slug === 'common' ? schools[0]?.school_slug : item.school_slug }))
      .filter(({ schoolSlug }) => openSlugs.has(schoolSlug)).slice(0, 5)
      .map(({ item, schoolSlug }) => {
        const school = schools.find((candidate) => candidate.school_slug === schoolSlug)
        const subjectName = item.subject_name || subjectNames[item.subject_slug]
        const scheme = school?.examSchemes?.find((candidate) => [...candidate.publicSubjects, ...candidate.professionalSubjects].includes(subjectName))
        return { type: '知识点', title: item.point_title, detail: `${school?.school_name || schoolSlug} · ${subjectName}`, href: learningDeepLink(scope, schoolSlug, item, scheme?.examSchemeId) }
      })
    const resourceMatches = resources.filter((item) => `${item.title}${item.creator}${item.platform}`.toLowerCase().includes(q))
      .slice(0, 3).map((item) => ({ type: '课程', title: item.title, detail: `${item.platform} · ${item.creator}`, url: item.url, resourceId: item.resource_id }))
    return [...pointMatches, ...resourceMatches]
  }, [query, resources, schools, syllabusPoints, scope])

  return <div className="search-wrap">
    <label htmlFor="home-search" className="sr-only">搜索知识点或课程</label>
    <span className="search-icon">⌕</span>
    <input id="home-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索知识点或课程，例如：指针、极限、计算机网络" />
    {query && <div className="search-results" role="status">
      {matches.length ? matches.map((item, index) => item.url
        ? <a key={`${item.title}-${index}`} href={item.url} target="_blank" rel="noreferrer" onClick={() => trackEvent('external_resource_clicked', item.resourceId)}><span>{item.type}</span><b>{item.title}</b><small>{item.detail}</small></a>
        : <Link key={`${item.title}-${index}`} to={item.href}><span>{item.type}</span><b>{item.title}</b><small>{item.detail}</small></Link>)
        : <p>没有找到匹配内容，试试“C语言”或“高等数学”。</p>}
    </div>}
  </div>
}

function Countdown() {
  const [target, setTarget] = useState(() => getCountdownTarget() || '2027-04-18')
  const [today, setToday] = useState(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setToday(new Date()), 60 * 1000)
    return () => window.clearInterval(timer)
  }, [])

  const targetDate = new Date(`${target}T00:00:00+08:00`)
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const days = Math.max(0, Math.ceil((targetDate.getTime() - todayStart.getTime()) / 86400000))
  const formattedTarget = targetDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })

  function changeTarget(event) {
    const value = event.target.value
    setTarget(value)
    saveCountdownTarget(value)
  }

  return <section className="countdown-section" aria-label="安徽专升本备考倒计时">
    <div className="countdown-heading"><span className="countdown-icon">⏳</span><div><span>安徽专升本 · 个人备考提醒</span><h2>{days > 0 ? <>距离目标日还有 <strong>{days}</strong> 天</> : '目标日已到，加油！'}</h2></div></div>
    <div className="countdown-progress"><span style={{ width: `${Math.min(100, Math.max(3, (1 - days / 365) * 100))}%` }} /></div>
    <div className="countdown-settings"><p>当前目标：<strong>{formattedTarget}</strong><small>此日期为个人备考目标，并非安徽省考试院公布的正式考试时间。</small></p><label>修改目标日期<input type="date" value={target} min={new Date().toISOString().slice(0, 10)} onChange={changeTarget} /></label></div>
  </section>
}

function SchoolWallCard({ school, interactive = true }) {
  const [imageFailed, setImageFailed] = useState(false)
  const contents = <>
    <span className="wall-school-emblem" aria-hidden="true">
      {school.logo && !imageFailed
        ? <img src={school.logo} alt="" onError={() => setImageFailed(true)} />
        : <b>{school.shortName}</b>}
    </span>
    <span className="wall-school-info"><strong>{school.name}</strong><span>{school.hasDetails ? '进入专业地图 →' : '资料整理中'}</span></span>
  </>
  if (school.hasDetails) return <Link className="wall-school-card" to={school.href} tabIndex={interactive ? undefined : -1} title={`${school.name}：进入专业地图`}>{contents}</Link>
  return <div className={`wall-school-card ${school.hasDetails ? '' : 'is-pending'}`} title={`${school.name}：资料整理中`}>{contents}</div>
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)
  useEffect(() => {
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!media) return undefined
    const update = () => setReduced(media.matches)
    media.addEventListener?.('change', update)
    return () => media.removeEventListener?.('change', update)
  }, [])
  return reduced
}

export function SchoolLogoWall({ schools }) {
  const tracks = createSchoolWallTracks(schools)
  const reducedMotion = usePrefersReducedMotion()
  return <div className="school-wall" aria-label="安徽普通专升本招生院校">
    <span className="sr-only">{schools.length} 所安徽普通专升本招生院校，其中 {schools.filter((school) => school.hasDetails).length} 所已开放院校专业地图</span>
    <div className="school-wall-window">
      {!reducedMotion && tracks.map((track, index) => <div className={`logo-track track-${index + 1}`} key={index}>
        <div className="logo-track-inner">
          <div className="logo-track-group">{track.map((school) => <SchoolWallCard key={school.id} school={school} />)}</div>
          <div className="logo-track-group" aria-hidden="true">{track.map((school) => <SchoolWallCard key={`${school.id}-copy`} school={school} interactive={false} />)}</div>
        </div>
      </div>)}
      {reducedMotion && <div className="school-wall-static">{schools.map((school) => <SchoolWallCard key={`${school.id}-static`} school={school} />)}</div>}
    </div>
  </div>
}

const admissionTimelineItems = [
  {
    date: '1 月 30 日',
    title: '考试招生工作安排发布',
    summary: '年度政策、报名、考试与录取安排公开',
    detail: '发布安徽省 2026 年普通高校专升本考试招生工作安排，明确年度报考流程、考试组织、录取批次及专项计划等要求。',
    sourceLabel: '2026 年安徽专升本考试招生工作安排',
    sourceUrl: 'https://edu.anhuinews.com/kszx/gk/202601/t20260129_9064933.html',
    desktopX: 7, desktopY: 16, mobileX: 25, mobileY: 4,
  },
  {
    date: '3 月下旬',
    title: '院校章程与考纲集中发布',
    summary: '招生专业、专业课大纲和参考书目陆续明确',
    detail: '各招生院校分别发布招生章程、招生专业、专业课考试大纲和参考书目。该节点为集中发布时段，并非全省统一的法定截止日。',
    sourceLabel: '招生院校章程示例',
    sourceUrl: 'https://www.ahstu.edu.cn/zsc/zszc/zsbzszc.htm',
    desktopX: 74, desktopY: 13, mobileX: 25, mobileY: 36,
  },
  {
    date: '3 月 23—27 日',
    title: '网上报名与首次志愿',
    summary: '23 日 10:00 开始，27 日 17:00 截止',
    detail: '考生登录省考试院报名系统完成信息填报、采像和 A、B 段志愿填报。志愿提交前应仔细核对，报名截止后不再补报。',
    sourceLabel: '省级考试招生工作安排（高校转载）',
    sourceUrl: 'https://www.wenda.edu.cn/zs/m/display_34096.html',
    desktopX: 23, desktopY: 9, mobileX: 75, mobileY: 12,
  },
  {
    date: '3 月 28 日 12:00',
    title: '资格审核截止',
    summary: '及时查看审核状态并修正材料',
    detail: '资格审核与报名同步进行。考生应通过“安徽招生考试”微信小程序及时查看审核结果，在截止前修正未通过项目。',
    sourceLabel: '2026 年专升本报名操作指引',
    sourceUrl: 'https://www.cnedu.cn/shengxue/zx/wa20260323180622.shtml',
    desktopX: 39, desktopY: 15, mobileX: 25, mobileY: 20,
  },
  {
    date: '3 月 29 日 17:00',
    title: '报名缴费截止',
    summary: '报名考试费 120 元，逾期视为放弃',
    detail: '资格审核通过后登录报名系统缴费。未在截止时间前完成缴费的考生视为放弃报名，后期不再组织补报名。',
    sourceLabel: '专升本报名资格审核工作通知',
    sourceUrl: 'https://www.acdt.edu.cn/jwc/info/1253/5926.htm',
    desktopX: 56, desktopY: 10, mobileX: 75, mobileY: 28,
  },
  {
    date: '4 月 11 日起',
    title: '公共课准考证打印',
    summary: '登录报名系统下载并核对准考证',
    detail: '公共课准考证开放打印。专业课准考证由各招生院校另行安排，应同时关注报考院校招生网站。',
    sourceLabel: '2026 年普通高校专升本招生章程',
    sourceUrl: 'https://zsb.wnmc.edu.cn/__local/3/7E/D5/041BB95CFAB5989C5AD88A7B7E4_182A5F2D_3179F.pdf',
    desktopX: 93, desktopY: 19, mobileX: 75, mobileY: 44,
  },
  {
    date: '4 月 18 日',
    title: '公共课统考',
    summary: '专业课由各校在 4 月中下旬自主安排',
    detail: '大学语文或高等数学为 9:00—11:00，英语为 14:00—15:30。普通专业课多集中在 4 月 19 日，特殊考查及个别安排以报考院校通知为准。',
    sourceLabel: '安徽建筑大学 2026 年招生章程',
    sourceUrl: 'https://www.ahjzu.edu.cn/zsw/2026/0204/c2390a263781/page.htm',
    desktopX: 88, desktopY: 43, mobileX: 25, mobileY: 52,
  },
  {
    date: '5 月上旬',
    title: '公共课成绩与合格线',
    summary: '开放成绩查询并划定公共课合格线',
    detail: '省考试院公布公共课成绩和合格线。达到公共课合格线仅代表具备录取资格，不等同于院校专业实际录取。',
    sourceLabel: '安徽省教育招生考试院合格线公告',
    sourceUrl: 'https://www.ahzsks.cn/zyyx/8879.htm',
    desktopX: 68, desktopY: 39, mobileX: 75, mobileY: 60,
  },
  {
    date: '5 月 11—12 日',
    title: '公共课成绩复核登记',
    summary: '按要求向毕业院校登记，逾期不受理',
    detail: '对公共课成绩有疑问的考生，可在规定时间携带身份证向毕业院校登记申请复核；省外院校毕业的安徽入伍退役士兵向报考院校登记。',
    sourceLabel: '公共课合格线及成绩复核通知',
    sourceUrl: 'https://zsb.hblgxy.edu.cn/info/1032/2384.htm',
    desktopX: 47, desktopY: 45, mobileX: 25, mobileY: 68,
  },
  {
    date: '5 月 27—28 日',
    title: '调剂志愿填报',
    summary: '27 日 10:00 开始，28 日 17:00 截止',
    detail: '达到公共课合格线且一志愿未录取的考生，可按缺额计划和院校调剂规则填报。调剂志愿提交后不可修改。',
    sourceLabel: '2026 年专升本调剂报名及计划',
    sourceUrl: 'https://www.wjut.edu.cn/zhao-sheng-zhuan-ti/zhao-sheng-kuai-xun/pageinfo1000010000027809.html',
    desktopX: 27, desktopY: 41, mobileX: 75, mobileY: 76,
  },
  {
    date: '5 月底前',
    title: '拟录取阶段原则上完成',
    summary: '一志愿和调剂录取结果由院校陆续公布',
    detail: '招生院校原则上在 5 月底前完成一志愿、调剂和拟录取工作，并向考生提供查询。拟录取不等同于省级正式投档录取。',
    sourceLabel: '省级考试招生工作安排（高校转载）',
    sourceUrl: 'https://www.czcvc.edu.cn/jyxxfw/info/1007/2555.htm',
    desktopX: 10, desktopY: 69, mobileX: 25, mobileY: 84,
  },
  {
    date: '7 月下旬',
    title: '省级正式投档录取',
    summary: '完成投档、阅档和正式录取手续',
    detail: '专升本正式录取与普通高考录取流程衔接，由省级主管部门投档，高校完成阅档并报批。具体日期以省考试院最终安排为准。',
    sourceLabel: '安徽建筑大学录取工作说明',
    sourceUrl: 'https://www.ahjzu.edu.cn/zsw/2026/0520/c2435a270211/page.htm',
    desktopX: 45, desktopY: 79, mobileX: 75, mobileY: 92,
  },
  {
    date: '7 月下旬—8 月上旬',
    title: '录取通知书陆续寄发',
    summary: '各院校按正式录取进度分批寄出',
    detail: '正式录取完成后，各院校通过 EMS 等方式陆续寄发录取通知书和新生入学指南，寄发时间以录取院校通知为准。',
    sourceLabel: '专升本新生录取相关事宜',
    sourceUrl: 'https://zs.ahut.edu.cn/info/5888/3047.htm',
    desktopX: 83, desktopY: 74, mobileX: 25, mobileY: 96,
  },
]

const timelineRows = [
  [
    { x: 76, y: 120 }, { x: 262, y: 120 }, { x: 448, y: 120 },
    { x: 634, y: 120 }, { x: 820, y: 120 }, { x: 1006, y: 120 },
  ],
  [
    { x: 1006, y: 340 }, { x: 851, y: 340 }, { x: 696, y: 340 },
    { x: 541, y: 340 }, { x: 386, y: 340 }, { x: 231, y: 340 },
    { x: 76, y: 340 },
  ],
]

const timelineCurvePoints = timelineRows.flat()
const timelineEventDates = [
  '2026-01-30T00:00:00+08:00',
  '2026-03-21T00:00:00+08:00',
  '2026-03-23T10:00:00+08:00',
  '2026-03-28T12:00:00+08:00',
  '2026-03-29T17:00:00+08:00',
  '2026-04-11T00:00:00+08:00',
  '2026-04-18T09:00:00+08:00',
  '2026-05-08T00:00:00+08:00',
  '2026-05-11T00:00:00+08:00',
  '2026-05-27T10:00:00+08:00',
  '2026-05-31T00:00:00+08:00',
  '2026-07-25T00:00:00+08:00',
  '2026-08-01T00:00:00+08:00',
]
const timelineProgressStops = [0, 8.653, 17.306, 25.958, 34.611, 43.264, 56.736, 63.947, 71.157, 78.368, 85.579, 92.789, 100]

function createCurveSegment(start, end) {
  const controlX = (start.x + end.x) / 2
  return `C ${controlX} ${start.y}, ${controlX} ${end.y}, ${end.x} ${end.y}`
}

function createCurvePath(points) {
  return points.slice(1).reduce((path, point, index) => `${path} ${createCurveSegment(points[index], point)}`, `M ${points[0].x} ${points[0].y}`)
}

const timelineCurvePath = `${createCurvePath(timelineRows[0])} C 1100 120, 1100 340, ${timelineRows[1][0].x} ${timelineRows[1][0].y} ${timelineRows[1].slice(1).reduce((path, point, index) => `${path} ${createCurveSegment(timelineRows[1][index], point)}`, '')}`
const timelineCurveSegments = [
  ...timelineRows[0].slice(1).map((point, index) => ({ path: `M ${timelineRows[0][index].x} ${timelineRows[0][index].y} ${createCurveSegment(timelineRows[0][index], point)}`, nodes: [index, index + 1] })),
  { path: 'M 1006 120 C 1100 120, 1100 340, 1006 340', nodes: [5, 6] },
  ...timelineRows[1].slice(1).map((point, index) => ({ path: `M ${timelineRows[1][index].x} ${timelineRows[1][index].y} ${createCurveSegment(timelineRows[1][index], point)}`, nodes: [index + 6, index + 7] })),
]

function getCurrentTimelineProgress(now = new Date()) {
  const currentTime = now.getTime()
  const eventTimes = timelineEventDates.map((eventDate) => new Date(eventDate).getTime())

  if (currentTime <= eventTimes[0]) return timelineProgressStops[0]
  if (currentTime >= eventTimes.at(-1)) return timelineProgressStops.at(-1)

  const nextIndex = eventTimes.findIndex((eventTime) => currentTime < eventTime)
  const previousIndex = nextIndex - 1
  const elapsedRatio = (currentTime - eventTimes[previousIndex]) / (eventTimes[nextIndex] - eventTimes[previousIndex])
  return timelineProgressStops[previousIndex] + (timelineProgressStops[nextIndex] - timelineProgressStops[previousIndex]) * elapsedRatio
}

export function AdmissionTimeline() {
  const [activeIndex, setActiveIndex] = useState(null)
  const [hoveredIndex, setHoveredIndex] = useState(null)
  const [timelineNow, setTimelineNow] = useState(() => Date.now())
  const [isVisible, setIsVisible] = useState(false)
  const containerRef = useRef(null)
  const reducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    if (reducedMotion || !window.IntersectionObserver) {
      setIsVisible(true)
      return undefined
    }
    const observer = new window.IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      setIsVisible(true)
      observer.disconnect()
    }, { threshold: 0.12 })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [reducedMotion])

  useEffect(() => {
    const timerId = window.setInterval(() => setTimelineNow(Date.now()), 60_000)
    return () => window.clearInterval(timerId)
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (reducedMotion || !container) return undefined
    let frameId
    const updateParallax = () => {
      window.cancelAnimationFrame(frameId)
      frameId = window.requestAnimationFrame(() => {
        const bounds = container.getBoundingClientRect()
        const offset = (window.innerHeight / 2 - (bounds.top + bounds.height / 2)) / window.innerHeight
        const limitedOffset = Math.max(-1, Math.min(1, offset))
        container.style.setProperty('--timeline-parallax', `${(limitedOffset * 5).toFixed(2)}px`)
      })
    }
    updateParallax()
    window.addEventListener('scroll', updateParallax, { passive: true })
    window.addEventListener('resize', updateParallax)
    return () => {
      window.cancelAnimationFrame(frameId)
      window.removeEventListener('scroll', updateParallax)
      window.removeEventListener('resize', updateParallax)
    }
  }, [reducedMotion])

  const highlightedIndex = hoveredIndex ?? activeIndex
  const markerProgress = getCurrentTimelineProgress(new Date(timelineNow))
  const toggleItem = (index) => setActiveIndex((current) => current === index ? null : index)

  return <section ref={containerRef} className={`timeline-experience ${isVisible ? 'is-visible' : ''}`}>
    <div className="timeline-scroll" role="region" aria-label="时间线横向浏览区域" tabIndex="0">
      <div className="timeline-stage">
        <svg className="timeline-curve" viewBox="0 0 1116 460" aria-hidden="true">
          <g className="timeline-curve-base">
            <path d={timelineCurvePath} pathLength="1" />
          </g>
          <g className="timeline-curve-glow">
            {timelineCurveSegments.map((segment, index) => <path key={`glow-${index}`} d={segment.path} className={highlightedIndex !== null && segment.nodes.includes(highlightedIndex) ? 'is-active' : ''} />)}
          </g>
        </svg>
        <span
          className="timeline-progress-dot"
          style={{ '--timeline-progress': `${markerProgress}%`, offsetPath: `path("${timelineCurvePath}")` }}
          aria-hidden="true"
        />
        <ol className="admission-timeline" aria-label="2026 年安徽普通专升本关键时间节点">
          {admissionTimelineItems.map((item, index) => {
            const point = timelineCurvePoints[index]
            const rowIndex = index < 6 ? 0 : 1
            const isAbove = index % 2 === 0
            const tooltipShift = point.x === 76 ? '-76px' : point.x === 1006 ? 'calc(-100% + 109px)' : '-50%'
            return <li key={`${item.date}-${item.title}`} className={`timeline-row-${rowIndex + 1} ${isAbove ? 'is-above' : 'is-below'}`} style={{ '--timeline-x': `${point.x}px`, '--timeline-y': `${point.y}px`, '--timeline-delay': `${index * 38}ms`, '--tooltip-shift': tooltipShift }}>
              <button
                type="button"
                className="timeline-node"
                aria-expanded={activeIndex === index}
                aria-controls={`timeline-tooltip-${index}`}
                aria-describedby={highlightedIndex === index ? `timeline-tooltip-${index}` : undefined}
                aria-label={`${item.date}，${item.title}`}
                onClick={() => toggleItem(index)}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onFocus={() => setHoveredIndex(index)}
                onBlur={() => setHoveredIndex(null)}
                onKeyDown={(event) => {
                  if (event.key !== 'Escape') return
                  setHoveredIndex(null)
                  setActiveIndex(null)
                }}
              >
                <time>{item.date}</time>
                <strong>{item.title}</strong>
              </button>
              {highlightedIndex === index && <aside
                id={`timeline-tooltip-${index}`}
                role="tooltip"
                className="timeline-tooltip"
              >
                <div><time>{item.date}</time><strong>{item.title}</strong></div>
                <p>{item.detail}</p>
              </aside>}
            </li>
          })}
        </ol>
      </div>
    </div>
  </section>
}

export function Home({ wallSchools, schoolCount, scope }) {
  return <>
    <section className="hero-section">
      <div className="hero-wall-zone">
        <SchoolLogoWall schools={wallSchools} />
      </div>
      <div className="hero-content-zone">
        <div className="hero-main">
          <div className="eyebrow">安徽专升本 · 2026</div>
          <h1>安徽专升本，<br/><em>找到适合你的本科院校</em></h1>
          <p className="hero-copy">收录 {wallSchools.length} 所安徽招生院校名录；其中 {schoolCount} 所已完成招生专业与考试方案核验，可进入院校专业地图。</p>
          <div className="hero-actions"><Link className="primary-btn" to={scopePath(scope)}>查看院校状态 <span>→</span></Link><Link className="secondary-btn" to="/anhui/2026/eligible-programs">查报考范围</Link></div>
        </div>
      </div>
    </section>
    <section className="content-section countdown-wrap"><Countdown /></section>
    <section className="content-section score-line-wrap" aria-labelledby="score-line-title">
      <div className="home-section-intro"><h2 id="score-line-title">2026 年普通高校专升本公共课合格线</h2><p>本页仅展示普通类公共课合格线。</p></div>
      <div className="score-line-card">
        <div className="score-line-values" aria-label="普通类公共课合格线：文科 130 分，理科 80 分"><article><span>文科</span><strong>130<small>分</small></strong></article><article><span>理科</span><strong>80<small>分</small></strong></article></div>
        <div className="score-line-notes"><p><strong>提示：</strong>公共课合格线不等同于院校专业实际录取分数。</p><p>具体政策与最终信息以安徽省教育招生考试院官方公告为准。</p><p>官方发布日期：2026 年 5 月 8 日</p><p>来源：<a href="https://www.ahzsks.cn/zyyx/8879.htm" target="_blank" rel="noreferrer">安徽省教育招生考试院《安徽省2026年普通高校专升本公共课合格线公布》↗</a></p></div>
      </div>
    </section>
    <section className="content-section timeline-wrap" aria-labelledby="timeline-title">
      <div className="home-section-intro"><h2 id="timeline-title">专升本关键时间线</h2></div>
      <AdmissionTimeline />
    </section>
  </>
}

function SubjectTags({ school, compact = false }) {
  return <div className={`subject-groups${compact ? ' offering-subject-groups' : ''}`}><div><small>公共课</small>{school.publicSubjects.map((s) => <span key={s}>{s}</span>)}</div><div><small>专业课</small>{school.professionalSubjects.map((s) => <span className="professional" key={s}>{s}</span>)}</div></div>
}

function formatEligibleMajorCategories(value) {
  if (Array.isArray(value)) return value.join('、')
  return String(value || '').replace(/^\{(.*)\}$/, '$1').replaceAll(',', '、')
}

export function EligiblePrograms({ offerings, academicSchools }) {
  const [params, setParams] = useSearchParams()
  const track = params.get('track') || ''
  const urlMajor = params.get('major') || ''
  const [major, setMajor] = useState(urlMajor)
  const [visibleLimit, setVisibleLimit] = useState(24)
  const composing = useRef(false)
  const filters = { level: params.get('level') || '', type: params.get('type') || '', program: params.get('program') || '', sort: params.get('sort') || 'match' }
  const setParam = (key, value, replace = false) => {
    if ((params.get(key) || '') === value) return
    const next = new URLSearchParams(params)
    if (value) next.set(key, value); else next.delete(key)
    setParams(next, { replace })
  }
  const suggestions = useMemo(() => eligibleMajorSuggestions(offerings, major, 18), [offerings, major])
  const mappedCategories = useMemo(() => mappedEligibleMajorCategories(major), [major])
  const matched = useMemo(() => track && major.trim() ? findEligibleOfferings({ offerings, academicSchools, major, track }) : [], [offerings, academicSchools, major, track])
  const programs = useMemo(() => [...new Set(matched.flatMap((item) => item.programNames || item.program_names || []))].sort((a, b) => a.localeCompare(b, 'zh-Hans-CN')), [matched])
  const results = useMemo(() => sortEligibleResults(matched.filter((item) => (!filters.level || item.match.level === filters.level) && (!filters.type || item.school?.school_type === filters.type) && (!filters.program || (item.programNames || item.program_names || []).includes(filters.program))), filters.sort), [matched, filters.level, filters.type, filters.program, filters.sort])
  const visibleResults = useMemo(() => results.slice(0, visibleLimit), [results, visibleLimit])
  const metrics = useMemo(() => ({
    offerings: new Set(results.map((item) => item.offering_id)).size,
    schools: new Set(results.map((item) => item.school_slug)).size,
    programs: new Set(results.flatMap((item) => item.programNames || item.program_names || [])).size,
    basis: [...new Set(results.map((item) => item.match.label))].join(' / ') || '当前筛选无结果',
  }), [results])
  useEffect(() => { if (!composing.current) setMajor(urlMajor) }, [urlMajor])
  useEffect(() => { setVisibleLimit(24) }, [track, major, filters.level, filters.type, filters.program, filters.sort])
  const updateTrack = (value) => {
    const next = new URLSearchParams(params)
    if (value) next.set('track', value); else next.delete('track')
    next.delete('level')
    next.delete('program')
    setParams(next)
  }
  const updateMajor = (value) => {
    setMajor(value)
    setParam('major', value, true)
  }
  const updateInput = (event) => {
    const value = event.target.value
    setMajor(value)
    if (!composing.current) setParam('major', value, true)
  }
  const finishComposition = (event) => {
    composing.current = false
    updateMajor(event.currentTarget.value)
  }
  const clearMajor = () => {
    composing.current = false
    setMajor('')
    const next = new URLSearchParams(params)
    next.delete('major')
    next.delete('level')
    next.delete('program')
    setParams(next)
  }
  return <div className="page-wrap eligible-page">
    <div className="crumb"><Link to="/">首页</Link><span>/</span>我能报哪些专业</div>
    <section className="page-hero eligible-hero"><div><span className="eyebrow">2026 安徽普通高校专升本</span><h1>我能报哪些专业</h1><p>先选择公共课科类，再填写当前专科专业，查看招生章程中可能相关的本科专业、院校和考试方案。</p></div></section>
    <section className="eligible-search-panel" aria-labelledby="eligible-search-title">
      <div className="eligible-step"><span>第一步</span><h2 id="eligible-search-title">选择公共课科类</h2></div>
      <div className="eligible-track-options" role="radiogroup" aria-label="公共课科类">
        {Object.entries(PUBLIC_COURSE_TRACKS).map(([value, option]) => <button type="button" role="radio" aria-checked={track === value} className={track === value ? 'active' : ''} key={value} onClick={() => updateTrack(value)}><strong>{option.label}</strong><small>{option.subjects.join(' + ')}</small></button>)}
      </div>
      <div className={`eligible-major-step${track ? '' : ' is-locked'}`}>
        <div className="eligible-step"><span>第二步</span><h2>填写当前专科专业</h2></div>
        <label className="sr-only" htmlFor="eligible-major">当前专科专业名称</label>
        <div className="eligible-search-row"><input id="eligible-major" value={major} disabled={!track} onChange={updateInput} onCompositionStart={() => { composing.current = true }} onCompositionEnd={finishComposition} placeholder={track ? '例如：计算机应用技术' : '请先选择大学语文或高等数学方向'} autoComplete="off" /><button type="button" disabled={!major} onClick={clearMajor}>清空专业</button></div>
        <p><strong>请填写你目前就读或已经毕业的专科专业</strong>，不是想报考的目标本科专业；建议优先使用专业目录中的正式名称。</p>
        {mappedCategories.length > 0 && <p className="eligible-catalog-hint"><span>专业目录归类</span><strong>{mappedCategories.join(' · ')}</strong><small>目录分类只用于搜索建议；按类别命中的方案属于可能匹配，最终以招生章程和院校审核为准。</small></p>}
        {track && suggestions.length > 0 && <div className="eligible-suggestions" aria-label="专业名称建议">{suggestions.map((item) => <button type="button" key={item} onClick={() => updateMajor(item)}>{item}</button>)}</div>}
      </div>
    </section>
    {track && major.trim() && <>
      <section className="eligible-filters" aria-label="查询结果筛选"><strong>当前筛选 {results.length} 条招生方案</strong><label>匹配等级<select value={filters.level} onChange={(event) => setParam('level', event.target.value)}><option value="">全部</option><option value="exact">专业名称明确匹配</option><option value="possible">专业目录类别可能匹配</option><option value="unrestricted">报考范围不限</option><option value="reference">仅科类范围参考</option></select></label><label>院校性质<select value={filters.type} onChange={(event) => setParam('type', event.target.value)}><option value="">全部</option><option value="公办">公办</option><option value="民办">民办</option></select></label><label>本科专业<select value={filters.program} onChange={(event) => setParam('program', event.target.value)}><option value="">全部</option>{programs.map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label>排序<select value={filters.sort} onChange={(event) => setParam('sort', event.target.value)}><option value="match">匹配依据优先</option><option value="public">公办优先</option><option value="plan">计划数从高到低</option><option value="school">院校默认顺序</option></select></label></section>
      <section className="eligible-metrics" aria-label="当前查询范围指标"><article><span>招生方案</span><strong>{metrics.offerings}</strong></article><article><span>涉及院校</span><strong>{metrics.schools}</strong></article><article><span>本科专业</span><strong>{metrics.programs}</strong></article><article><span>当前匹配依据</span><strong>{metrics.basis}</strong></article><article><span>公共课方向</span><strong>{PUBLIC_COURSE_TRACKS[track].label} · {PUBLIC_COURSE_TRACKS[track].subjects.join(' + ')}</strong></article></section>
      {results.length ? <><section className="eligible-result-list" aria-label="查询结果">{visibleResults.map((item) => { const programNames = item.programNames || item.program_names || []; const programsLabel = programNames.join('、'); const compareTo = `${comparePath({ provinceSlug: 'anhui', year: 2026, majorSlug: 'all-programs' })}?program=${encodeURIComponent(programNames[0] || '')}&offerings=${encodeURIComponent(item.offering_id)}`; return <article key={item.offering_id}><header><div className="eligible-school-identity"><SchoolLogo school={item.school} /><div><span className={`match-level ${item.match.level}`}>{item.match.label}</span><h2>{item.school?.school_name || item.school_slug}</h2><p>{item.school?.school_type} · {programsLabel}</p></div></div><strong>{item.plan_count} 人</strong></header><dl><div><dt>本科招生专业</dt><dd>{programsLabel}</dd></div><div><dt>培养地点</dt><dd>{item.training_site}</dd></div><div><dt>完整培养地址</dt><dd>{item.training_site}</dd></div><div><dt>公共课</dt><dd>{(item.publicSubjects || item.public_subjects || []).join('、')}</dd></div><div><dt>专业课</dt><dd>{(item.professionalSubjects || item.professional_subjects || []).join('、')}</dd></div></dl><p className="eligibility-card-note">{item.match.level === 'reference' ? COURSE_REFERENCE_NOTICE : ELIGIBILITY_NOTICE}</p><nav aria-label={`${item.school?.school_name || item.school_slug}官方资料`}><a href={item.charter_url} target="_blank" rel="noreferrer">正式招生章程 ↗</a><a href={item.syllabus_url} target="_blank" rel="noreferrer">正式考试大纲 ↗</a><Link to={schoolPath({ provinceSlug: 'anhui', year: 2026, majorSlug: 'all-programs' }, item.school_slug)}>进入院校专业地图 →</Link><Link to={compareTo}>加入专业与院校对比 →</Link></nav></article> })}</section>{visibleResults.length < results.length && <button className="eligible-load-more" type="button" onClick={() => setVisibleLimit((current) => current + 24)}>显示更多（剩余 {results.length - visibleResults.length} 条）</button>}</> : <section className="eligible-empty"><h2>当前筛选没有结果</h2><p>请清除结果筛选，或打开院校专业地图与正式招生章程继续核实。</p><Link className="primary-btn" to="/anhui/2026/all-programs">查看全部院校专业地图</Link></section>}
    </>}
  </div>
}

function SchoolLogo({ school, large = false }) {
  const [imageFailed, setImageFailed] = useState(false)
  const shortName = school?.short_name || school?.school_name || '院校'
  return <span className={`school-logo school-logo-${school?.school_slug || 'unknown'}${large ? ' large' : ''}`}>
    {school?.logo_url && !imageFailed
      ? <img src={school.logo_url} alt={`${school.school_name || shortName}校徽`} onError={() => setImageFailed(true)} />
      : <b>{shortName}</b>}
  </span>
}

function MapPinIcon() {
  return <svg className="map-pin-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 22s7-6.2 7-13a7 7 0 1 0-14 0c0 6.8 7 13 7 13Z" /><circle cx="12" cy="9" r="3" /></svg>
}

function AmapLocationLink({ schoolName, programLabel, trainingSite, locationLabel }) {
  const mapUrl = buildAmapSearchUrl({ schoolName, trainingSite })
  if (!mapUrl) return null
  return <a className="amap-link" href={mapUrl} target="_blank" rel="noopener noreferrer" aria-label={`${schoolName}${programLabel ? ` ${programLabel}` : ''} ${locationLabel || '培养地点'}：在高德地图查看（第三方地图，在新标签页打开）`} title="在高德地图查看（第三方地图）"><MapPinIcon /></a>
}

function TrainingSiteLocations({ schoolName, programLabel, trainingSite }) {
  const locations = parseTrainingSiteLocations(trainingSite)
  const assignmentNote = trainingSiteAssignmentNote(trainingSite)
  return <div className="training-site-locations">{locations.map((location, index) => <div className="training-site-location" key={`${location.searchLocation}:${index}`}><AmapLocationLink schoolName={schoolName} programLabel={programLabel} trainingSite={location.searchLocation} locationLabel={location.label} /><span>{location.label}</span></div>)}{assignmentNote && <small className="training-site-assignment-note">{assignmentNote}</small>}</div>
}

export function AnhuiHub({ schools, wallSchools, scope, publishedScopes = [DEFAULT_SCOPE] }) {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const navigationType = useNavigationType()
  const usedFilters = useRef(new Set())
  const urlSchoolQuery = params.get('q') || ''
  const [schoolQuery, setSchoolQuery] = useState(urlSchoolQuery)
  const composingSchoolQuery = useRef(false)
  const filters = { q: schoolQuery, type: params.get('type') || '', map: params.get('map') || '', program: params.get('program') || '', subject: params.get('subject') || '' }
  useEffect(() => { trackEvent('school_directory_entered', `${scope.year}:${scope.provinceSlug}:${scope.majorSlug}`) }, [scope.year, scope.provinceSlug, scope.majorSlug])
  useEffect(() => { if (!composingSchoolQuery.current) setSchoolQuery(urlSchoolQuery) }, [urlSchoolQuery])
  const setFilter = (key, value) => {
    if ((params.get(key) || '') === value) return
    const next = new URLSearchParams(params)
    if (value) next.set(key, value); else next.delete(key)
    setParams(next, { replace: true })
    if (!usedFilters.current.has(key)) {
      usedFilters.current.add(key)
      trackEvent('school_filter_used', key)
    }
  }
  const updateSchoolQuery = (event) => {
    const value = event.target.value
    setSchoolQuery(value)
    if (!composingSchoolQuery.current) setFilter('q', value)
  }
  const finishSchoolQueryComposition = (event) => {
    composingSchoolQuery.current = false
    const value = event.currentTarget.value
    setSchoolQuery(value)
    setFilter('q', value)
  }
  const clearFilters = () => {
    composingSchoolQuery.current = false
    setSchoolQuery('')
    setParams({}, { replace: true })
  }
  const filteredDirectory = filterSchoolDirectory(wallSchools, schools, filters)
  const filteredSlugs = new Set(filteredDirectory.map((school) => school.schoolSlug))
  const openSchools = schools.filter((school) => filteredSlugs.has(school.school_slug))
  const pendingSchools = filteredDirectory.filter((school) => !school.hasDetails)
  const subjects = [...new Set(schools.flatMap((school) => [...school.publicSubjects, ...school.professionalSubjects]))]
  const programs = [...new Set(schools.flatMap((school) => school.programNames || []))]
  const years = [...new Set(publishedScopes.filter((item) => item.provinceSlug === scope.provinceSlug && item.majorSlug === scope.majorSlug).map((item) => item.year))].sort((a, b) => b - a)
  const directoryPath = `${location.pathname}${location.search}`
  useLayoutEffect(() => {
    const savedReturn = readSchoolDirectoryReturn(directoryPath)
    const stateSchoolSlug = /^[a-z0-9-]+$/.test(location.state?.restoreSchoolSlug || '') ? location.state.restoreSchoolSlug : ''
    const schoolSlug = stateSchoolSlug || (navigationType === 'POP' ? savedReturn?.schoolSlug : '')
    if (!schoolSlug) return undefined
    const card = document.getElementById(`school-card-${schoolSlug}`)
    if (!card) {
      clearSchoolDirectoryReturn()
      return undefined
    }
    const restore = () => {
      if (savedReturn?.schoolSlug === schoolSlug) window.scrollTo({ top: savedReturn.scrollY, left: 0, behavior: 'instant' })
      else card.scrollIntoView?.({ block: 'center', behavior: 'instant' })
      card.querySelector('[data-school-map-link]')?.focus({ preventScroll: true })
      clearSchoolDirectoryReturn()
    }
    const frame = window.requestAnimationFrame ? window.requestAnimationFrame(restore) : window.setTimeout(restore, 0)
    return () => window.cancelAnimationFrame ? window.cancelAnimationFrame(frame) : window.clearTimeout(frame)
  }, [directoryPath, location.key, location.state, navigationType])
  return <div className="page-wrap" id="school-filter">
    <div className="crumb"><Link to="/">首页</Link><span>/</span>安徽专区</div>
    <section className="page-hero compact"><div><span className="eyebrow">安徽省 · 普通高校专升本</span><h1>选择你的目标院校</h1><p>{wallSchools.length} 所院校名录中，当前 {schools.length} 所院校已开放院校专业地图。</p></div><div className="filter-box scope-summary"><strong>已发布年份</strong><label className="sr-only" htmlFor="published-year">选择年份</label><select id="published-year" value={scope.year} onChange={(event) => navigate(scopePath({ ...scope, year: Number(event.target.value) }))}>{years.map((year) => <option key={year} value={year}>{year} 年</option>)}</select><span>{MAJOR_NAMES[scope.majorSlug] ?? scope.majorSlug}</span><small>仅展示已有正式发布数据的年份</small></div></section>
    <section className="exam-structure"><div><span>安徽考试结构</span><strong>2 门公共课</strong><b>+</b><strong>2 门专业课</strong></div><p>公共课由省考试院组织；专业课由招生院校组织，因此同一专业在不同院校的科目可能不同。</p></section>
    <section className="school-filters" aria-label="院校筛选"><label>院校名称<input type="search" value={schoolQuery} onChange={updateSchoolQuery} onCompositionStart={() => { composingSchoolQuery.current = true }} onCompositionEnd={finishSchoolQueryComposition} placeholder="输入院校名称" /></label><label>办学性质<select value={filters.type} onChange={(event) => setFilter('type', event.target.value)}><option value="">全部</option><option value="公办">公办</option><option value="民办">民办</option></select></label><label>资料状态<select value={filters.map} onChange={(event) => setFilter('map', event.target.value)}><option value="">全部</option><option value="open">已开放专业地图</option><option value="pending">资料整理中</option></select></label><label>招生专业<select value={filters.program} onChange={(event) => setFilter('program', event.target.value)}><option value="">全部专业</option>{programs.map((program) => <option key={program}>{program}</option>)}</select></label><label>考试科目<select value={filters.subject} onChange={(event) => setFilter('subject', event.target.value)}><option value="">全部科目</option>{subjects.map((subject) => <option key={subject}>{subject}</option>)}</select></label><button type="button" onClick={clearFilters}>清空筛选</button></section>
    <p className="filter-result-count" role="status">找到 {filteredDirectory.length} 所院校</p>
    {!filteredDirectory.length && <section className="filter-empty"><h2>没有匹配的院校</h2><p>可以减少筛选条件，或清空后重新查找。</p><button type="button" onClick={clearFilters}>清空筛选</button></section>}
    {!!openSchools.length && <><div className="section-heading"><div><span className="section-number">{openSchools.length} 所</span><h2>已开放院校专业地图</h2></div><Link to={comparePath(scope)}>查看横向对比 →</Link></div><section className="school-grid">{openSchools.map((school) => <SchoolCard key={school.school_slug} school={school} scope={scope} directoryPath={directoryPath} />)}</section></>}
    {!!pendingSchools.length && <><div className="section-heading pending-heading"><div><span className="section-number">{pendingSchools.length} 所</span><h2>资料整理中</h2></div><p>已列入院校名录，暂未开放专业地图</p></div><section className="pending-school-grid">{pendingSchools.map((school) => <article key={school.id}><strong>{school.name}</strong><span>{school.schoolType}</span><small>资料整理中 · 暂未开放专业地图</small></article>)}</section></>}
    <div className="local-tip"><span>ⓘ</span><p><strong>你的进度只保存在当前浏览器</strong><br/>不需要注册即可使用；清除浏览器数据或更换设备后，进度与收藏不会同步。</p></div>
  </div>
}

function SchoolCard({ school, scope, directoryPath }) {
  const openSchoolMap = (event) => {
    try { saveLastSelection({ ...scope, school: school.school_slug }) } catch { /* 本地存储不可用时继续导航。 */ }
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    saveSchoolDirectoryReturn(directoryPath, school.school_slug)
  }
  return <article className="school-card" id={`school-card-${school.school_slug}`} style={{ '--school-color': school.theme_color }}>
    <div className="school-head"><SchoolLogo school={school} /><div><span className="type-tag">{school.school_type}</span><h3>{school.school_name}</h3></div></div>
    <SubjectTags school={school} />
    <dl><div><dt>招生范围</dt><dd>{formatEligibleMajorCategories(school.eligible_major_categories)}</dd></div><div><dt>计划数</dt><dd>{school.totalPlan} 人</dd></div></dl>
    <div className="school-card-foot"><span>核验于 {school.verified_at}</span><div className="school-card-actions"><SchoolQuickPreviewButton school={school} /><Link data-school-map-link onClick={openSchoolMap} state={{ schoolDirectoryReturn: { path: directoryPath, schoolSlug: school.school_slug } }} to={schoolPath(scope, school.school_slug)}>打开专业地图 →</Link></div></div>
  </article>
}

export function Compare({ offerings, academicSchools, scope }) {
  const [params, setParams] = useSearchParams()
  const [trayExpanded, setTrayExpanded] = useState(true)
  useEffect(() => { trackEvent('school_compare_opened', `${scope.year}:${scope.provinceSlug}:${scope.majorSlug}`) }, [scope.year, scope.provinceSlug, scope.majorSlug])
  const schoolBySlug = useMemo(() => new Map(academicSchools.map((school) => [school.school_slug, school])), [academicSchools])
  const candidates = useMemo(() => offerings.filter((offering) => offering.active !== false && (!offering.status || offering.status === 'published')).map((offering) => ({ ...offering, school: schoolBySlug.get(offering.school_slug) })).filter((offering) => offering.school), [offerings, schoolBySlug])
  const programs = useMemo(() => [...new Set(candidates.flatMap((offering) => offering.programNames || offering.program_names || []))].sort((a, b) => a.localeCompare(b, 'zh-Hans-CN')), [candidates])
  const program = params.get('program') || ''
  const selectedIds = [...new Set(String(params.get('offerings') || '').split(',').filter((id) => candidates.some((offering) => offering.offering_id === id)))].slice(0, 3)
  const selected = candidates.filter((offering) => selectedIds.includes(offering.offering_id))
  const visible = program ? candidates.filter((offering) => (offering.programNames || offering.program_names || []).includes(program)) : []
  const differences = useMemo(() => {
    const fields = { school_type: (item) => item.school.school_type, program: (item) => (item.programNames || item.program_names || []).join('|'), plan_count: (item) => String(item.plan_count), training_site: (item) => item.training_site, public: (item) => (item.publicSubjects || item.public_subjects || []).join('|'), professional: (item) => (item.professionalSubjects || item.professional_subjects || []).join('|') }
    return new Set(Object.entries(fields).filter(([, getter]) => new Set(selected.map(getter)).size > 1).map(([key]) => key))
  }, [selected])
  const showProgram = selected.length > 0 && differences.has('program')
  const value = (item, key) => ({
    school_type: item.school.school_type,
    program: (item.programNames || item.program_names || []).join('、'),
    plan_count: `${item.plan_count} 人`,
    training_site: item.training_site,
    public: (item.publicSubjects || item.public_subjects || []).join('、'),
    professional: (item.professionalSubjects || item.professional_subjects || []).join('、'),
  })[key]
  const comparisonRows = [
    ['plan_count', '招生计划'],
    ['training_site', '培养地点'],
    ['school_type', '院校性质'],
    ...(showProgram ? [['program', '招生专业']] : []),
    ['professional', '专业课'],
    ['public', '公共课'],
  ]
  const setProgram = (value) => {
    const next = new URLSearchParams(params)
    if (value) next.set('program', value); else next.delete('program')
    setParams(next, { replace: true })
  }
  const toggleOffering = (id) => {
    const next = selectedIds.includes(id) ? selectedIds.filter((item) => item !== id) : [...selectedIds, id].slice(0, 3)
    const nextParams = new URLSearchParams(params)
    if (next.length) nextParams.set('offerings', next.join(',')); else nextParams.delete('offerings')
    setParams(nextParams, { replace: true })
  }
  const clearSelected = () => {
    const nextParams = new URLSearchParams(params)
    nextParams.delete('offerings')
    setParams(nextParams, { replace: true })
  }
  const viewComparison = () => document.getElementById('comparison-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  return <div className={`page-wrap compare-page${selected.length ? ' has-compare-tray' : ''}`}>
    <div className="crumb"><Link to="/">首页</Link><span>/</span><Link to="/anhui">安徽专区</Link><span>/</span>专业与院校对比</div>
    <section className="page-hero"><div><span className="eyebrow">{scopeLabel(scope)}</span><h1>专业与院校对比</h1><p>可跨本科专业选择最多 3 条招生方案；不同培养点、考试方案和招生专业会分别保留。</p></div></section>
    <section className="compare-program-filter"><label htmlFor="compare-program">筛选本科招生专业<select id="compare-program" aria-label="筛选本科招生专业" value={program} onChange={(event) => setProgram(event.target.value)}><option value="">请选择要浏览的专业</option>{programs.map((item) => <option key={item} value={item}>{item}</option>)}</select></label><p>先加入当前专业的招生方案，再切换专业继续选择；已选方案不会被清空。</p></section>
    {program && <section className="compare-offering-picker" aria-label="选择对比招生方案">{visible.map((item) => <article key={item.offering_id}><div className="compare-picker-school"><SchoolLogo school={item.school} /><div><span className="type-tag">{item.school.school_type}</span><h2>{item.school.school_name}</h2><strong>{(item.programNames || item.program_names || []).join('、')}</strong></div></div><dl><div><dt>招生计划</dt><dd>{item.plan_count} 人</dd></div><div><dt>培养地点</dt><dd>{item.training_site}</dd></div><div><dt>公共课</dt><dd>{(item.publicSubjects || item.public_subjects || []).join('、')}</dd></div><div><dt>专业课</dt><dd>{(item.professionalSubjects || item.professional_subjects || []).join('、')}</dd></div></dl><button type="button" aria-pressed={selectedIds.includes(item.offering_id)} disabled={!selectedIds.includes(item.offering_id) && selectedIds.length >= 3} onClick={() => toggleOffering(item.offering_id)}>{selectedIds.includes(item.offering_id) ? '移出对比' : '加入对比'}</button></article>)}</section>}
    {selected.length > 0 && <aside className={`compare-selection-tray${trayExpanded ? ' is-expanded' : ''}`} aria-label="已选对比招生方案">
      <div className="compare-tray-heading"><div><strong>已选 {selected.length} / 3 条招生方案</strong><span>{selected.length >= 2 ? '可以查看完整对比' : '再选 1 条即可对比'}</span></div><button type="button" aria-expanded={trayExpanded} aria-controls="compare-tray-content" onClick={() => setTrayExpanded((current) => !current)}>{trayExpanded ? '收起' : '展开'}</button></div>
      {trayExpanded && <div id="compare-tray-content" className="compare-tray-content"><div className="compare-selected-list">{selected.map((item) => <button type="button" key={item.offering_id} onClick={() => toggleOffering(item.offering_id)} aria-label={`移除${item.school.school_name}的${(item.programNames || item.program_names || []).join('、')}招生方案`}><span><b>{item.school.school_name}</b><small>{(item.programNames || item.program_names || []).join('、')}</small></span><em>移除</em></button>)}</div><div className="compare-tray-actions"><button type="button" onClick={clearSelected}>清空选择</button><button className="compare-tray-primary" type="button" disabled={selected.length < 2} onClick={viewComparison}>{selected.length >= 2 ? '查看完整对比' : '还需选择 1 条'}</button></div></div>}
    </aside>}
    {(program || selected.length > 0) && selected.length < 2 ? <section className="compare-empty" role="status"><h2>再选择 {2 - selected.length} 条招生方案即可对比</h2><p>可以切换本科专业继续选择；当前选择会保存在网址中，复制链接即可分享。</p></section> : null}
    {selected.length >= 2 ? <section id="comparison-results" className="comparison-results" aria-label="完整对比结果">
      <div className="compare-scroll desktop-compare" tabIndex="0" aria-label="招生方案对比表，可横向滚动">
        <table>
          <colgroup><col className="compare-label-column" />{selected.map((item, index) => <col className={`compare-school-column${index > 0 ? ' compare-divider-column' : ''}`} key={item.offering_id} />)}</colgroup>
          <thead><tr><th>对比项</th>{selected.map((item) => <th key={item.offering_id}><div className="compare-table-school"><SchoolLogo school={item.school} /><span>{item.school.school_name}</span></div></th>)}</tr></thead>
          <tbody>{comparisonRows.map(([key, label]) => <tr key={key} className={`${differences.has(key) ? 'is-different' : 'is-same'} compare-row-${key}`}><th>{label}</th>{selected.map((item) => <td key={item.offering_id}>{key === 'professional' ? <span className="compare-tag professional-tag">{value(item, key)}</span> : key === 'public' ? <span className="compare-tag public-tag">{value(item, key)}</span> : key === 'plan_count' ? <strong className="compare-plan">{value(item, key)}</strong> : key === 'training_site' ? <TrainingSiteLocations schoolName={item.school.school_name} programLabel={(item.programNames || item.program_names || []).join('、')} trainingSite={item.training_site} /> : value(item, key)}</td>)}</tr>)}<tr className="is-same"><th>正式资料</th>{selected.map((item) => <td key={item.offering_id}><a href={item.charter_url} target="_blank" rel="noreferrer">招生章程 ↗</a><a href={item.syllabus_url} target="_blank" rel="noreferrer">考试大纲 ↗</a></td>)}</tr><tr className="is-same compare-map-row"><th>院校专业地图</th>{selected.map((item) => <td key={item.offering_id}><Link to={schoolPath(scope, item.school_slug)}>进入院校专业地图 →</Link></td>)}</tr></tbody>
        </table>
      </div>
      <section className="mobile-compare-cards" aria-label="招生方案对比卡片">{selected.map((item) => <article key={item.offering_id}><div className="mobile-compare-school"><SchoolLogo school={item.school} /><div><h2>{item.school.school_name}</h2><p>{item.school.school_type}{showProgram ? ` · ${(item.programNames || item.program_names || []).join('、')}` : ''}</p></div></div><dl><div className={differences.has('plan_count') ? 'is-different' : ''}><dt>招生计划</dt><dd><strong className="compare-plan">{value(item, 'plan_count')}</strong></dd></div><div className={differences.has('training_site') ? 'is-different' : ''}><dt>培养地点</dt><dd><TrainingSiteLocations schoolName={item.school.school_name} programLabel={(item.programNames || item.program_names || []).join('、')} trainingSite={item.training_site} /></dd></div><div className={differences.has('professional') ? 'is-different' : ''}><dt>专业课</dt><dd><span className="compare-tag professional-tag">{value(item, 'professional')}</span></dd></div><div className={differences.has('public') ? 'is-different' : ''}><dt>公共课</dt><dd><span className="compare-tag public-tag">{value(item, 'public')}</span></dd></div></dl><div className="compare-official-links"><span>官方资料</span><a href={item.charter_url} target="_blank" rel="noreferrer">招生章程 ↗</a><a href={item.syllabus_url} target="_blank" rel="noreferrer">考试大纲 ↗</a><Link to={schoolPath(scope, item.school_slug)}>进入院校专业地图 →</Link></div></article>)}</section>
      <p className="map-reference-note compare-map-reference-note">第三方地图结果仅供导航参考，请以院校公布信息和实际校区为准。</p>
    </section> : null
    }
  </div>
}

function ResourceCard({ resource, favorites, toggleFavorite, coveragePoints = [] }) {
  const saved = favorites.includes(resource.resource_id)
  return <article className="resource-card"><div className="resource-top"><span className={resource.platform.includes('哔哩') ? 'platform bili' : 'platform mooc'}>{resource.platform}</span><button onClick={() => toggleFavorite(resource.resource_id)} aria-label={saved ? '取消收藏' : '收藏资源'} aria-pressed={saved}>{saved ? '★' : '☆'}</button></div><h4>{resource.title}</h4><p className="creator">{resource.creator}</p><div className="resource-meta"><span>{resource.difficulty}</span><span>{resource.duration_text}</span><span>{resource.resource_type}</span></div>{coveragePoints.length > 0 && <p className="resource-coverage"><strong>覆盖知识点：</strong>{coveragePoints.map((point) => point.point_title).join('、')}</p>}<p>{resource.recommendation_reason}</p><a href={resource.url} target="_blank" rel="noreferrer" onClick={() => trackEvent('external_resource_clicked', resource.resource_id)}>前往官方平台学习 ↗</a></article>
}

function LocalBackup({ onImported }) {
  const [message, setMessage] = useState('')
  function exportBackup() {
    const blob = new Blob([JSON.stringify(createLocalBackup(), null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url; link.download = `anhui-zsb-backup-${new Date().toISOString().slice(0, 10)}.json`; link.click()
    URL.revokeObjectURL(url)
    setMessage('备份文件已生成。')
  }
  async function importBackup(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      if (file.size > 1024 * 1024) throw new Error('备份文件不能超过 1MB')
      const parsed = JSON.parse(await file.text())
      if (!window.confirm('导入会覆盖当前浏览器的学习进度、收藏、目标日期和最后选择。确定继续吗？')) return
      const imported = importLocalBackup(parsed)
      onImported(imported)
      setMessage('导入成功；新数据已安全应用。')
    } catch (error) {
      setMessage(`导入失败：${error.message}。现有本地数据未改变。`)
    }
  }
  return <section className="local-backup"><div><h2>本地进度与收藏备份</h2><p>导出文件只包含本站认可的本地字段；导入会先完整校验，异常文件不会覆盖现有数据。</p></div><div><button type="button" onClick={exportBackup}>导出备份</button><label className="backup-import">导入备份<input type="file" accept="application/json,.json" onChange={importBackup} /></label></div>{message && <p role="status">{message}</p>}</section>
}

export function Favorites({ favorites, resources, toggleFavorite, clearInvalid, onImported, scope }) {
  const resourceById = new Map(resources.map((resource) => [resource.resource_id, resource]))
  const savedResources = favorites.map((id) => resourceById.get(id)).filter(Boolean)
  const invalidIds = favorites.filter((id) => !resourceById.has(id))
  return <div className="page-wrap favorites-page"><div className="crumb"><Link to="/">首页</Link><span>/</span>我的收藏</div><section className="page-hero compact"><div><span className="eyebrow">仅保存在当前浏览器</span><h1>我的收藏</h1><p>当前共收藏 {favorites.length} 条资源，可在这里取消收藏或清理已失效项目。</p></div><Link className="primary-btn" to={scopePath(scope)}>返回学习地图</Link></section>
    {!favorites.length && <section className="favorites-empty"><span aria-hidden="true">☆</span><h2>还没有收藏资源</h2><p>进入学习地图，点击资源卡右上角的星标即可收藏。</p><Link className="primary-btn" to={scopePath(scope)}>去学习地图</Link></section>}
    {!!savedResources.length && <section className="favorites-grid">{savedResources.map((resource) => <ResourceCard key={resource.resource_id} resource={resource} favorites={favorites} toggleFavorite={toggleFavorite} />)}</section>}
    {!!invalidIds.length && <section className="invalid-favorites" role="status"><div><h2>{invalidIds.length} 条收藏已失效</h2><p>对应资源可能已下架或删除，不影响其他收藏。</p></div><button type="button" onClick={() => clearInvalid(invalidIds)}>清理失效收藏</button></section>}
    <LocalBackup onImported={onImported} />
  </div>
}

export function LearningMap({ schools, scope }) {
  const { schoolSlug } = useParams()
  const location = useLocation()
  const school = schools.find((item) => item.school_slug === schoolSlug)
  const schoolOfferings = useMemo(() => school?.offerings?.length ? school.offerings : school ? [school] : [], [school])

  useEffect(() => { trackEvent('professional_map_opened', schoolSlug) }, [schoolSlug])

  if (!school) return <Navigate to={scopePath(scope)} replace />

  const directoryReturn = location.state?.schoolDirectoryReturn
  const hasDirectoryReturn = directoryReturn?.schoolSlug === schoolSlug && /^\/(?!\/)/.test(directoryReturn?.path || '')
  const directoryPath = hasDirectoryReturn ? directoryReturn.path : scopePath(scope)
  const directoryState = hasDirectoryReturn ? { restoreSchoolSlug: schoolSlug } : undefined

  const heading = <>
    <div className="crumb"><Link to="/">首页</Link><span>/</span><Link to={directoryPath} state={directoryState}>安徽专区</Link><span>/</span>{school.school_name}</div>
    <section className="school-title" style={{ '--school-color': school.theme_color }}><SchoolLogo school={school} large /><div><span className="type-tag">{school.school_type} · {scope.year}</span><h1>{school.school_name}</h1></div><div className="official-links"><a href={schoolOfferings[0]?.charter_url || school.charter_url} target="_blank" rel="noreferrer">招生章程</a><a href={schoolOfferings[0]?.syllabus_url || school.syllabus_url} target="_blank" rel="noreferrer">考试大纲</a></div></section>
  </>

  const offeringOverview = <section className="school-offering-overview" aria-labelledby="offering-overview-title">
    <div className="section-heading"><div><span className="section-number">{schoolOfferings.length} 个招生点</span><h2 id="offering-overview-title">招生专业与培养点</h2></div><p>每张卡片均展示该专业对应的培养点、报考范围和考试方案。</p></div>
    <div className="offering-detail-grid">{schoolOfferings.map((offering) => {
      const programLabel = (offering.programNames || offering.program_names || []).join('、') || (MAJOR_NAMES[offering.major_slug || scope.majorSlug] ?? (offering.major_slug || scope.majorSlug))
      const scores = (offering.scores || []).filter((score) => score.candidate_category === 'ordinary' && score.score_type === 'actual_admission_minimum')
      return <article key={offering.offering_id || offering.school_slug}><div><span>{programLabel}</span><strong>{offering.plan_count} 人</strong></div><dl><div><dt>培养地点</dt><dd className="offering-site-detail"><TrainingSiteLocations schoolName={school.school_name} programLabel={programLabel} trainingSite={offering.training_site} /></dd></div><div><dt>报考专业范围</dt><dd>{formatEligibleMajorCategories(offering.eligible_major_categories)}</dd></div></dl><section className="offering-exam-scheme" aria-label={`${programLabel}考试方案`}><b>考试方案</b><SubjectTags school={offering} compact />{scores.length ? <div className="offering-score-line"><small>分数线</small><div className="offering-score-values">{scores.map((score) => <div className="offering-score-entry" key={score.score_id || `${score.program_name}-${score.score}`}><strong>{Number(score.score)} 分</strong><a href={score.source_url} target="_blank" rel="noreferrer" aria-label="核验来源（在新标签页打开）">核验来源 ↗</a></div>)}</div></div> : null}</section></article>
    })}</div>
    <p className="map-reference-note">第三方地图结果仅供导航参考，请以院校公布信息和实际校区为准。</p>
  </section>

  return <div className="page-wrap learning-page">
    {heading}
    {offeringOverview}
  </div>
}

function Sources({ schools, scope }) {
  return <div className="page-wrap sources-page"><div className="crumb"><Link to="/">首页</Link><span>/</span>资料来源</div><section className="page-hero"><div><span className="eyebrow">透明 · 可核验</span><h1>每条考试信息，都能回到官方来源</h1><p>我们优先采用正式招生章程；拟招生通知只作线索，不覆盖正式文件。</p></div></section><section className="source-rules"><article><b>01</b><h3>正式文件优先</h3><p>正式招生章程高于拟招生方案，后发布的官方更正高于旧版本。</p></article><article><b>02</b><h3>按范围隔离</h3><p>所有招生专业与考试方案按年份、省份和院校隔离，不将其他范围内容混入。</p></article><article><b>03</b><h3>人工复核</h3><p>展示最后核验日期；进入下一招生年度后逐校重新检查。</p></article></section><section className="source-list"><h2>{scope.year} 年试点院校</h2>{schools.map((school) => <article key={school.school_slug}><SchoolLogo school={school} /><div><h3>{school.school_name}</h3><p>{school.source_status} · 核验于 {school.verified_at}</p></div><div className="source-actions"><a href={school.charter_url} target="_blank" rel="noreferrer">正式招生章程 ↗</a><a href={school.syllabus_url} target="_blank" rel="noreferrer">专业课考纲 ↗</a></div></article>)}</section><section className="disclaimer"><h2>免责声明</h2><p>“升本导航”不是安徽省教育招生考试院或任何招生院校的官方网站，不提供报名、录取和成绩查询服务。本站仅整理招生专业与考试方案，报名前务必打开官方来源复核。</p></section></div>
}

function NotFound() { return <div className="page-wrap not-found"><span>404</span><h1>这个页面还没整理好</h1><p>回到安徽专区，继续选择院校和学习路线。</p><Link className="primary-btn" to="/anhui">返回安徽专区</Link></div> }

export function LegacySchoolRedirect() {
  const { provinceSlug, year, majorSlug, schoolSlug } = useParams()
  const location = useLocation()
  const target = schoolPath(normalizeScope({ provinceSlug, year, majorSlug }), schoolSlug)
  return <Navigate to={`${target}${location.search}${location.hash}`} replace />
}

function scopeFromLocation(pathname) {
  const eligibleMatch = pathname.match(/^\/([a-z0-9-]+)\/(\d{4})\/eligible-programs/)
  if (eligibleMatch) return normalizeScope({ provinceSlug: eligibleMatch[1], year: eligibleMatch[2], majorSlug: 'all-programs' })
  const schoolMatch = pathname.match(/^\/([a-z0-9-]+)\/(\d{4})\/schools\/[a-z0-9-]+/)
  if (schoolMatch) return normalizeScope({ provinceSlug: schoolMatch[1], year: schoolMatch[2], majorSlug: DEFAULT_SCOPE.majorSlug })
  const match = pathname.match(/^\/([a-z0-9-]+)\/(\d{4})\/([a-z0-9-]+)/)
  return match ? normalizeScope({ provinceSlug: match[1], year: match[2], majorSlug: match[3] }) : DEFAULT_SCOPE
}

const snapshotSpecificScopes = [...new Map(snapshotOfferings
  .filter((item) => item.status ? item.status === 'published' : item.active !== false)
  .map((item) => [`${item.year}:${item.province_slug}:${item.major_slug}`, normalizeScope(item)]))
  .values()]
const snapshotAllProgramScopes = [...new Map(snapshotSpecificScopes.map((item) => [`${item.year}:${item.provinceSlug}`, normalizeScope({ ...item, majorSlug: 'all-programs' })])).values()]
const snapshotPublishedScopes = [...snapshotAllProgramScopes, ...snapshotSpecificScopes].sort((a, b) => b.year - a.year)

export function PublicSite() {
  const location = useLocation()
  const scope = useMemo(() => scopeFromLocation(location.pathname), [location.pathname])
  const content = useContent(scope)
  const [publishedScopeState, setPublishedScopeState] = useState({ status: 'loading', items: snapshotPublishedScopes })
  const publishedScopes = publishedScopeState.items
  const academicSchools = content.academicSchools
  const wallSchools = useMemo(() => createSchoolWallSchools(academicSchools, content.offerings, content.syllabusPoints, scope), [academicSchools, content.offerings, content.syllabusPoints, scope])
  const schools = useMemo(() => schoolGroups(content.offerings, academicSchools, scope, content.syllabusPoints), [content.offerings, academicSchools, scope, content.syllabusPoints])
  const routeSchools = useMemo(() => offeringSchoolGroups(content.offerings, academicSchools, scope), [content.offerings, academicSchools, scope])
  const defaultPublishedScope = publishedScopes.find((item) => item.provinceSlug === 'anhui' && item.majorSlug === 'all-programs') || publishedScopes[0] || null
  const requestedScopeFallback = publishedScopes.find((item) => item.provinceSlug === scope.provinceSlug && item.majorSlug === scope.majorSlug) || defaultPublishedScope
  useEffect(() => {
    let active = true
    loadPublishedScopes()
      .then((items) => {
        if (active) setPublishedScopeState({ status: 'ready', items: [...items].sort((a, b) => b.year - a.year) })
      })
      .catch(() => {
        if (active) setPublishedScopeState({ status: 'fallback', items: snapshotPublishedScopes })
      })
    return () => { active = false }
  }, [])
  useEffect(() => {
    const newRouteMatch = location.pathname.match(/^\/[a-z0-9-]+\/\d{4}\/schools\/([a-z0-9-]+)/)
    const legacyRouteMatch = location.pathname.match(/^\/[a-z0-9-]+\/\d{4}\/(?!schools\/)[a-z0-9-]+\/([a-z0-9-]+)/)
    const schoolSlug = newRouteMatch?.[1] || legacyRouteMatch?.[1]
    applyPageMetadata(location.pathname, routeSchools.find((school) => school.school_slug === schoolSlug)?.school_name || '')
  }, [location.pathname, routeSchools])
  const pathHasScope = /^\/[a-z0-9-]+\/\d{4}\/(?:schools\/[a-z0-9-]+|[a-z0-9-]+)/.test(location.pathname)
  const waitsForPublishedScopes = pathHasScope || location.pathname === '/anhui'
  const scopeIsPublished = publishedScopes.some((item) => item.year === scope.year && item.provinceSlug === scope.provinceSlug && item.majorSlug === scope.majorSlug)
  if (waitsForPublishedScopes && publishedScopeState.status === 'loading') return <div className="public-scope-loading" role="status">正在加载已发布年份…</div>
  if (waitsForPublishedScopes && !defaultPublishedScope) return <div className="public-scope-loading" role="status">暂时没有已发布年份。</div>
  if (location.pathname === '/anhui') return <Navigate to={scopePath(defaultPublishedScope)} replace />
  if (pathHasScope && !scopeIsPublished) return <Navigate to={scopePath(requestedScopeFallback)} replace />
  return <AdvancedInteractionsProvider schools={schools} scope={scope}>
    <Layout announcement={content.announcement} content={content}><Routes>
    <Route path="/" element={<Home wallSchools={wallSchools} schoolCount={schools.length} scope={scope} />} />
    <Route path="/anhui" element={<Navigate to={scopePath(defaultPublishedScope)} replace />} />
    <Route path="/favorites" element={<Navigate to={scopePath(defaultPublishedScope || DEFAULT_SCOPE)} replace />} />
    <Route path="/:provinceSlug/:year/eligible-programs" element={<EligiblePrograms offerings={content.offerings} academicSchools={academicSchools} />} />
    <Route path="/:provinceSlug/:year/:majorSlug" element={<AnhuiHub schools={schools} wallSchools={wallSchools} scope={scope} publishedScopes={publishedScopes} />} />
    <Route path="/:provinceSlug/:year/:majorSlug/compare" element={<Compare offerings={content.offerings} academicSchools={academicSchools} scope={scope} />} />
    <Route path="/:provinceSlug/:year/schools/:schoolSlug" element={<LearningMap schools={routeSchools} scope={scope} />} />
    <Route path="/:provinceSlug/:year/:majorSlug/:schoolSlug" element={<LegacySchoolRedirect />} />
    <Route path="/sources" element={<Sources schools={schools} scope={scope} />} />
    <Route path="*" element={<NotFound />} />
    </Routes></Layout>
  </AdvancedInteractionsProvider>
}

function AdminFallback() { return <div className="admin-loading">正在加载管理后台…</div> }

export default function App() {
  return <BrowserRouter><AnalyticsRouteTracker /><RouteScrollManager /><Suspense fallback={<AdminFallback />}><Routes>
    <Route path="/admin/login" element={<AdminLogin />} />
    <Route path="/admin/reset-password" element={<AdminResetPassword />} />
    <Route path="/admin/*" element={<AdminDashboard />} />
    <Route path="*" element={<PublicSite />} />
  </Routes></Suspense></BrowserRouter>
}
