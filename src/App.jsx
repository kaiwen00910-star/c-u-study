import { Fragment, lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { BrowserRouter, Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { offeringSchoolGroups, offerings as snapshotOfferings, schoolGroups, subjectNames } from './data'
import { createLocalBackup, getCountdownTarget, importLocalBackup, saveCountdownTarget, saveLastSelection } from './storage'
import { useContent } from './useContent'
import { createSchoolWallSchools, createSchoolWallTracks } from './schoolWallData'
import { comparePath, DEFAULT_SCOPE, MAJOR_NAMES, normalizeScope, schoolPath, scopeLabel, scopePath } from './contentScope'
import { filterSchoolDirectory, learningDeepLink } from './publicFeatures'
import { loadPublishedScopes } from './publicApi'
import { applyPageMetadata } from './seo'
import { trackEvent, trackPageview } from './analytics'
import { FeedbackForm } from './FeedbackForm'
import { ELIGIBILITY_NOTICE, eligibleMajorSuggestions, findEligibleOfferings, sortEligibleResults } from './eligibleMajorSearch'
import './App.css'

const AdminDashboard = lazy(() => import('./Admin').then((module) => ({ default: module.AdminDashboard })))
const AdminLogin = lazy(() => import('./Admin').then((module) => ({ default: module.AdminLogin })))
const AdminResetPassword = lazy(() => import('./Admin').then((module) => ({ default: module.AdminResetPassword })))

function AnalyticsRouteTracker() {
  const location = useLocation()
  useEffect(() => { trackPageview(location.pathname) }, [location.pathname])
  return null
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
        <MobileNavigation />
      </div>
    </header>
    {content.loading && <aside className="data-status checking" role="status">正在核验在线数据；当前先显示版本化快照。</aside>}
    {content.offline && <aside className="data-status offline" role="alert"><strong>内置快照</strong><span>在线数据暂不可用或版本较旧，招生计划与考纲来自版本 {content.metadata.version}（生成于 {new Date(content.metadata.generatedAt).toLocaleString('zh-CN')}）。请打开官方来源复核。</span></aside>}
    {announcement && <aside className="site-announcement" role="status"><strong>{announcement.title}</strong><span>{announcement.content}</span></aside>}
    <main>{children}</main>
    <footer>
      <div><Logo /><p>专注安徽专升本，集中整理院校、招生专业、培养地点与考试方案。</p></div>
      <div><strong>重要说明</strong><p>本站为非官方学习导航，不组织招生与考试。报考前请以省考试院和招生院校最新通知为准。</p></div>
      <div><strong>访问统计与隐私</strong><p>仅在正式站启用百度统计，用于汇总页面访问和固定功能点击。事件参数不含搜索框自由文本、姓名、邮箱或主动采集的 IP；反馈联系方式仅在你自愿填写时提交给 Netlify Forms。</p></div>
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

export function Home({ wallSchools, schoolCount, scope }) {
  return <>
    <section className="hero-section">
      <div className="hero-wall-zone">
        <SchoolLogoWall schools={wallSchools} />
      </div>
      <div className="hero-content-zone">
        <div className="hero-main">
          <div className="eyebrow">ANHUI EXAM PATH · 2026</div>
          <h1>安徽专升本，<br/><em>找到适合你的本科院校</em></h1>
          <p className="hero-copy">收录 {wallSchools.length} 所安徽招生院校名录；其中 {schoolCount} 所已完成招生专业与考试方案核验，可进入院校专业地图。</p>
          <div className="hero-actions"><Link className="primary-btn" to={scopePath(scope)}>查看院校状态 <span>→</span></Link><Link className="secondary-btn" to="/anhui/2026/eligible-programs">查报考范围</Link></div>
          <div className="hero-trust"><span>✓ 官方来源可核验</span><span>✓ 免费公开使用</span><span>✓ 专注安徽</span></div>
        </div>
        <div className="hero-stats" aria-label="当前收录概况"><div><strong>{wallSchools.length}</strong><span>院校名录</span></div><div><strong>{schoolCount}</strong><span>已开放院校地图</span></div></div>
      </div>
    </section>
    <section className="content-section countdown-wrap"><Countdown /></section>
    <section className="content-section score-line-wrap" aria-labelledby="score-line-title">
      <div className="home-section-intro"><span className="eyebrow">OFFICIAL NOTICE</span><h2 id="score-line-title">2026 年普通高校专升本公共课合格线</h2><p>本页仅展示普通类公共课合格线。</p></div>
      <div className="score-line-card">
        <div className="score-line-values" aria-label="普通类公共课合格线：文科 130 分，理科 80 分"><article><span>文科</span><strong>130<small>分</small></strong></article><article><span>理科</span><strong>80<small>分</small></strong></article></div>
        <div className="score-line-notes"><p><strong>提示：</strong>公共课合格线不等同于院校专业实际录取分数。</p><p>具体政策与最终信息以安徽省教育招生考试院官方公告为准。</p><p>官方发布日期：2026 年 5 月 8 日　来源：<a href="https://www.ahzsks.cn/zyyx/8879.htm" target="_blank" rel="noreferrer">安徽省教育招生考试院《安徽省2026年普通高校专升本公共课合格线公布》↗</a></p></div>
      </div>
    </section>
    <section className="content-section timeline-wrap" aria-labelledby="timeline-title">
      <div className="home-section-intro"><span className="eyebrow">OFFICIAL SCHEDULE</span><h2 id="timeline-title">专升本关键时间线</h2><p>日期仅在正式公告发布后展示；其余环节请等待官方公布。</p></div>
      <ol className="admission-timeline">{['报名', '资格审核', '缴费', '准考证', '考试', '成绩查询', '志愿填报或录取', '录取通知书'].map((item, index) => <li key={item}><span className="timeline-step">{String(index + 1).padStart(2, '0')}</span><div><h3>{item}</h3><p>时间待官方公布</p></div></li>)}</ol>
    </section>
    <section className="content-section anhui-focus-section">
      <div className="anhui-focus-card"><div className="province-mark">皖</div><div><span className="status-dot">专注安徽</span><h2>只做安徽专升本，把招生信息做深、做准</h2><p>持续核验安徽院校、招生专业、培养地点、报考范围和考试方案，不再扩展其他省份。</p></div><Link className="primary-btn" to="/anhui">进入安徽专区 <span>→</span></Link></div>
    </section>
    <section className="content-section home-services">
      <div className="section-heading"><div><span className="section-number">01</span><h2>从择校到备考，一站理清</h2></div><p>信息层级更清楚，每一步都有可核验的来源。</p></div>
      <div className="service-grid">
        <Link to="/anhui/2026/eligible-programs"><span>⌕</span><small>01</small><h3>我能报哪些专业</h3><p>按专科专业查询可能对应的院校、本科专业与考试方案。</p><b>开始查询 →</b></Link>
        <Link to="/anhui"><span>⌕</span><small>01</small><h3>院校筛选</h3><p>查看院校类型、培养地点、招生范围与考试科目。</p><b>开始筛选 →</b></Link>
        <Link to={comparePath(scope)}><span>▦</span><small>02</small><h3>招生计划</h3><p>横向比较试点院校招生计划与专业课差异。</p><b>查看对比 →</b></Link>
        <Link to="/sources"><span>◎</span><small>03</small><h3>报考指南</h3><p>了解资料年份、正式章程与官方考纲来源。</p><b>核验资料 →</b></Link>
        <a href="#faq"><span>?</span><small>04</small><h3>常见问题</h3><p>快速了解网站数据、来源核验与更新方式。</p><b>查看说明 ↓</b></a>
      </div>
    </section>
    <section className="content-section faq-section" id="faq">
      <div><span className="eyebrow">QUICK GUIDE</span><h2>开始前，你可能想知道</h2></div>
      <div className="faq-list"><details><summary>这里的信息是官方发布的吗？</summary><p>本站是非官方网站，但招生信息均尽量链接到学校或考试院原始页面，报考时仍请以最新官方通知为准。</p></details><details><summary>院校专业地图包含哪些内容？</summary><p>每所院校按正式章程和考纲展示招生专业、计划、培养地点、报考范围、公共课和专业课；知识点与学习资源功能现已暂停。</p></details><details><summary>资料会继续更新吗？</summary><p>会。进入新的招生年度后，本站将按正式资料逐校复核招生专业和考试方案。</p></details></div>
    </section>
    <section className="notice-strip"><strong>非官方网站</strong><span>本站仅提供招生信息与考试方案整理，所有招生信息请以官方最新发布为准。</span><Link to="/sources">查看资料来源 →</Link></section>
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
  const urlMajor = params.get('major') || ''
  const [major, setMajor] = useState(urlMajor)
  const composing = useRef(false)
  const filters = { level: params.get('level') || '', type: params.get('type') || '', program: params.get('program') || '', sort: params.get('sort') || 'match' }
  const setParam = (key, value) => {
    if ((params.get(key) || '') === value) return
    const next = new URLSearchParams(params)
    if (value) next.set(key, value); else next.delete(key)
    setParams(next, { replace: true })
  }
  const suggestions = useMemo(() => eligibleMajorSuggestions(offerings), [offerings])
  const matched = useMemo(() => major.trim() ? findEligibleOfferings({ offerings, academicSchools, major }) : [], [offerings, academicSchools, major])
  const programs = useMemo(() => [...new Set(matched.flatMap((item) => item.programNames || item.program_names || []))].sort((a, b) => a.localeCompare(b, 'zh-Hans-CN')), [matched])
  const results = useMemo(() => sortEligibleResults(matched.filter((item) => (!filters.level || item.match.level === filters.level) && (!filters.type || item.school?.school_type === filters.type) && (!filters.program || (item.programNames || item.program_names || []).includes(filters.program))), filters.sort), [matched, filters.level, filters.type, filters.program, filters.sort])
  useEffect(() => { if (!composing.current) setMajor(urlMajor) }, [urlMajor])
  const updateMajor = (value) => {
    setMajor(value)
    setParam('major', value)
  }
  const updateInput = (event) => {
    const value = event.target.value
    setMajor(value)
    if (!composing.current) setParam('major', value)
  }
  const finishComposition = (event) => {
    composing.current = false
    updateMajor(event.currentTarget.value)
  }
  const clear = () => { composing.current = false; setMajor(''); setParams({}, { replace: true }) }
  return <div className="page-wrap eligible-page">
    <div className="crumb"><Link to="/">首页</Link><span>/</span>我能报哪些专业</div>
    <section className="page-hero eligible-hero"><div><span className="eyebrow">2026 安徽普通高校专升本</span><h1>我能报哪些专业</h1><p>输入你的专科专业，查看招生章程中可能对应的本科专业、院校和考试方案。</p></div></section>
    <section className="eligibility-disclaimer" role="note"><strong>资格说明</strong><p>{ELIGIBILITY_NOTICE}</p></section>
    <section className="eligible-search-panel" aria-labelledby="eligible-search-title"><h2 id="eligible-search-title">填写专科专业名称</h2><label className="sr-only" htmlFor="eligible-major">专科专业名称</label><div className="eligible-search-row"><input id="eligible-major" value={major} onChange={updateInput} onCompositionStart={() => { composing.current = true }} onCompositionEnd={finishComposition} placeholder="例如：计算机应用技术" autoComplete="off" /><button type="button" onClick={clear}>清空</button></div><p>可输入教育部专业目录中的正式名称，或从已有报考范围中选择。</p>{suggestions.length > 0 && <div className="eligible-suggestions" aria-label="专业名称建议">{suggestions.filter((item) => !major.trim() || item.includes(major.trim())).slice(0, 18).map((item) => <button type="button" key={item} onClick={() => updateMajor(item)}>{item}</button>)}</div>}</section>
    {major.trim() && <>
      <section className="eligible-filters" aria-label="查询结果筛选"><strong>找到 {matched.length} 条可能结果</strong><label>匹配等级<select value={filters.level} onChange={(event) => setParam('level', event.target.value)}><option value="">全部</option><option value="exact">明确匹配</option><option value="possible">可能匹配</option><option value="unrestricted">不限专业</option></select></label><label>院校性质<select value={filters.type} onChange={(event) => setParam('type', event.target.value)}><option value="">全部</option><option value="公办">公办</option><option value="民办">民办</option></select></label><label>本科专业<select value={filters.program} onChange={(event) => setParam('program', event.target.value)}><option value="">全部</option>{programs.map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label>排序<select value={filters.sort} onChange={(event) => setParam('sort', event.target.value)}><option value="match">明确匹配优先</option><option value="public">公办优先</option><option value="plan">计划数从高到低</option><option value="school">院校默认顺序</option></select></label></section>
      {results.length ? <section className="eligible-result-list" aria-label="查询结果">{results.map((item) => { const programNames = item.programNames || item.program_names || []; const programsLabel = programNames.join('、'); const compareTo = `${comparePath({ provinceSlug: 'anhui', year: 2026, majorSlug: 'all-programs' })}?program=${encodeURIComponent(programNames[0] || '')}&offerings=${encodeURIComponent(item.offering_id)}`; return <article key={item.offering_id}><header><div><span className={`match-level ${item.match.level}`}>{item.match.label}</span><h2>{item.school?.school_name || item.school_slug}</h2><p>{item.school?.school_type} · {programsLabel}</p></div><strong>{item.plan_count} 人</strong></header><dl><div><dt>本科招生专业</dt><dd>{programsLabel}</dd></div><div><dt>培养地点</dt><dd>{item.training_site}</dd></div><div><dt>完整培养地址</dt><dd>{item.training_site}</dd></div><div><dt>报考专业范围原文</dt><dd>{formatEligibleMajorCategories(item.eligible_major_categories)}</dd></div><div><dt>公共课</dt><dd>{(item.publicSubjects || item.public_subjects || []).join('、')}</dd></div><div><dt>专业课</dt><dd>{(item.professionalSubjects || item.professional_subjects || []).join('、')}</dd></div></dl><p className="eligibility-card-note">{ELIGIBILITY_NOTICE}</p><nav aria-label={`${item.school?.school_name || item.school_slug}官方资料`}><a href={item.charter_url} target="_blank" rel="noreferrer">正式招生章程 ↗</a><a href={item.syllabus_url} target="_blank" rel="noreferrer">正式考试大纲 ↗</a><Link to={schoolPath({ provinceSlug: 'anhui', year: 2026, majorSlug: 'all-programs' }, item.school_slug)}>进入院校专业地图 →</Link><Link to={compareTo}>加入专业与院校对比 →</Link></nav></article> })}</section> : <section className="eligible-empty"><h2>未找到明确匹配结果</h2><p>建议检查专业名称是否为教育部专业目录中的正式名称；也可以查看全部院校专业地图，或打开院校正式招生章程继续核实。</p><Link className="primary-btn" to="/anhui/2026/all-programs">查看全部院校专业地图</Link></section>}
    </>}
  </div>
}

function SchoolLogo({ school, large = false }) {
  const [imageFailed, setImageFailed] = useState(false)
  return <span className={`school-logo school-logo-${school.school_slug}${large ? ' large' : ''}`}>
    {school.logo_url && !imageFailed
      ? <img src={school.logo_url} alt={`${school.short_name}校徽`} onError={() => setImageFailed(true)} />
      : <b>{school.short_name}</b>}
  </span>
}

export function AnhuiHub({ schools, wallSchools, scope, publishedScopes = [DEFAULT_SCOPE] }) {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const usedFilters = useRef(new Set())
  const filters = { q: params.get('q') || '', type: params.get('type') || '', map: params.get('map') || '', program: params.get('program') || '', subject: params.get('subject') || '' }
  useEffect(() => { trackEvent('school_directory_entered', `${scope.year}:${scope.provinceSlug}:${scope.majorSlug}`) }, [scope.year, scope.provinceSlug, scope.majorSlug])
  const setFilter = (key, value) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value); else next.delete(key)
    setParams(next, { replace: true })
    if (!usedFilters.current.has(key)) {
      usedFilters.current.add(key)
      trackEvent('school_filter_used', key)
    }
  }
  const filteredDirectory = filterSchoolDirectory(wallSchools, schools, filters)
  const filteredSlugs = new Set(filteredDirectory.map((school) => school.schoolSlug))
  const openSchools = schools.filter((school) => filteredSlugs.has(school.school_slug))
  const pendingSchools = filteredDirectory.filter((school) => !school.hasDetails)
  const subjects = [...new Set(schools.flatMap((school) => [...school.publicSubjects, ...school.professionalSubjects]))]
  const programs = [...new Set(schools.flatMap((school) => school.programNames || []))]
  const years = [...new Set(publishedScopes.filter((item) => item.provinceSlug === scope.provinceSlug && item.majorSlug === scope.majorSlug).map((item) => item.year))].sort((a, b) => b - a)
  return <div className="page-wrap" id="school-filter">
    <div className="crumb"><Link to="/">首页</Link><span>/</span>安徽专区</div>
    <section className="page-hero compact"><div><span className="eyebrow">安徽省 · 普通高校专升本</span><h1>选择你的目标院校</h1><p>{wallSchools.length} 所院校名录中，当前 {schools.length} 所院校已开放院校专业地图。</p></div><div className="filter-box scope-summary"><strong>已发布年份</strong><label className="sr-only" htmlFor="published-year">选择年份</label><select id="published-year" value={scope.year} onChange={(event) => navigate(scopePath({ ...scope, year: Number(event.target.value) }))}>{years.map((year) => <option key={year} value={year}>{year} 年</option>)}</select><span>{MAJOR_NAMES[scope.majorSlug] ?? scope.majorSlug}</span><small>仅展示已有正式发布数据的年份</small></div></section>
    <section className="exam-structure"><div><span>安徽考试结构</span><strong>2 门公共课</strong><b>+</b><strong>2 门专业课</strong></div><p>公共课由省考试院组织；专业课由招生院校组织，因此同一专业在不同院校的科目可能不同。</p></section>
    <section className="school-filters" aria-label="院校筛选"><label>院校名称<input type="search" value={filters.q} onChange={(event) => setFilter('q', event.target.value)} placeholder="输入院校名称" /></label><label>办学性质<select value={filters.type} onChange={(event) => setFilter('type', event.target.value)}><option value="">全部</option><option value="公办">公办</option><option value="民办">民办</option></select></label><label>资料状态<select value={filters.map} onChange={(event) => setFilter('map', event.target.value)}><option value="">全部</option><option value="open">已开放专业地图</option><option value="pending">资料整理中</option></select></label><label>招生专业<select value={filters.program} onChange={(event) => setFilter('program', event.target.value)}><option value="">全部专业</option>{programs.map((program) => <option key={program}>{program}</option>)}</select></label><label>考试科目<select value={filters.subject} onChange={(event) => setFilter('subject', event.target.value)}><option value="">全部科目</option>{subjects.map((subject) => <option key={subject}>{subject}</option>)}</select></label><button type="button" onClick={() => setParams({}, { replace: true })}>清空筛选</button></section>
    <p className="filter-result-count" role="status">找到 {filteredDirectory.length} 所院校</p>
    {!filteredDirectory.length && <section className="filter-empty"><h2>没有匹配的院校</h2><p>可以减少筛选条件，或清空后重新查找。</p><button type="button" onClick={() => setParams({}, { replace: true })}>清空筛选</button></section>}
    {!!openSchools.length && <><div className="section-heading"><div><span className="section-number">{openSchools.length} 所</span><h2>已开放院校专业地图</h2></div><Link to={comparePath(scope)}>查看横向对比 →</Link></div><section className="school-grid">{openSchools.map((school) => <SchoolCard key={school.school_slug} school={school} scope={scope} />)}</section></>}
    {!!pendingSchools.length && <><div className="section-heading pending-heading"><div><span className="section-number">{pendingSchools.length} 所</span><h2>资料整理中</h2></div><p>已列入院校名录，暂未开放专业地图</p></div><section className="pending-school-grid">{pendingSchools.map((school) => <article key={school.id}><strong>{school.name}</strong><span>{school.schoolType}</span><small>资料整理中 · 暂未开放专业地图</small></article>)}</section></>}
    <div className="local-tip"><span>ⓘ</span><p><strong>你的进度只保存在当前浏览器</strong><br/>不需要注册即可使用；清除浏览器数据或更换设备后，进度与收藏不会同步。</p></div>
  </div>
}

function SchoolCard({ school, scope }) {
  return <article className="school-card" style={{ '--school-color': school.theme_color }}>
    <div className="school-head"><SchoolLogo school={school} /><div><span className="type-tag">{school.school_type}</span><h3>{school.school_name}</h3></div></div>
    <SubjectTags school={school} />
    <dl><div><dt>培养地点</dt><dd>{school.sites.join(' / ')}</dd></div><div><dt>招生范围</dt><dd>{formatEligibleMajorCategories(school.eligible_major_categories)}</dd></div><div><dt>计划数</dt><dd>{school.totalPlan} 人</dd></div></dl>
    <div className="school-card-foot"><span>核验于 {school.verified_at}</span><Link onClick={() => saveLastSelection({ ...scope, school: school.school_slug })} to={schoolPath(scope, school.school_slug)}>打开专业地图 →</Link></div>
  </article>
}

export function Compare({ offerings, academicSchools, scope }) {
  const [params, setParams] = useSearchParams()
  useEffect(() => { trackEvent('school_compare_opened', `${scope.year}:${scope.provinceSlug}:${scope.majorSlug}`) }, [scope.year, scope.provinceSlug, scope.majorSlug])
  const schoolBySlug = useMemo(() => new Map(academicSchools.map((school) => [school.school_slug, school])), [academicSchools])
  const candidates = useMemo(() => offerings.filter((offering) => offering.active !== false && (!offering.status || offering.status === 'published')).map((offering) => ({ ...offering, school: schoolBySlug.get(offering.school_slug) })).filter((offering) => offering.school), [offerings, schoolBySlug])
  const programs = useMemo(() => [...new Set(candidates.flatMap((offering) => offering.programNames || offering.program_names || []))].sort((a, b) => a.localeCompare(b, 'zh-Hans-CN')), [candidates])
  const program = params.get('program') || ''
  const selectedIds = [...new Set(String(params.get('offerings') || '').split(',').filter((id) => candidates.some((offering) => offering.offering_id === id)))].slice(0, 3)
  const selected = candidates.filter((offering) => selectedIds.includes(offering.offering_id))
  const visible = program ? candidates.filter((offering) => (offering.programNames || offering.program_names || []).includes(program)) : []
  const differences = useMemo(() => {
    const fields = { school_type: (item) => item.school.school_type, program: (item) => (item.programNames || item.program_names || []).join('|'), plan_count: (item) => String(item.plan_count), training_site: (item) => item.training_site, eligible: (item) => String(item.eligible_major_categories), public: (item) => (item.publicSubjects || item.public_subjects || []).join('|'), professional: (item) => (item.professionalSubjects || item.professional_subjects || []).join('|') }
    return new Set(Object.entries(fields).filter(([, getter]) => new Set(selected.map(getter)).size > 1).map(([key]) => key))
  }, [selected])
  const showProgram = selected.length > 0 && differences.has('program')
  const value = (item, key) => ({
    school_type: item.school.school_type,
    program: (item.programNames || item.program_names || []).join('、'),
    plan_count: `${item.plan_count} 人`,
    training_site: item.training_site,
    eligible: formatEligibleMajorCategories(item.eligible_major_categories),
    public: (item.publicSubjects || item.public_subjects || []).join('、'),
    professional: (item.professionalSubjects || item.professional_subjects || []).join('、'),
  })[key]
  const comparisonGroups = [
    { label: '核心比较信息', rows: [['plan_count', '招生计划'], ['training_site', '培养地点与完整地址'], ['eligible', '报考专业范围']] },
    { label: '考试与报考要求', rows: [['school_type', '院校性质'], ...(showProgram ? [['program', '招生专业']] : []), ['professional', '专业课'], ['public', '公共课']] },
  ]
  const setProgram = (value) => {
    const next = new URLSearchParams(params)
    if (value) next.set('program', value); else next.delete('program')
    next.delete('offerings')
    setParams(next, { replace: true })
  }
  const toggleOffering = (id) => {
    const next = selectedIds.includes(id) ? selectedIds.filter((item) => item !== id) : [...selectedIds, id].slice(0, 3)
    const nextParams = new URLSearchParams(params)
    if (next.length) nextParams.set('offerings', next.join(',')); else nextParams.delete('offerings')
    setParams(nextParams, { replace: true })
  }
  return <div className="page-wrap">
    <div className="crumb"><Link to="/">首页</Link><span>/</span><Link to="/anhui">安徽专区</Link><span>/</span>专业与院校对比</div>
    <section className="page-hero"><div><span className="eyebrow">{scopeLabel(scope)}</span><h1>专业与院校对比</h1><p>先选择本科招生专业，再选择最多 3 条招生方案；培养点和考试方案会分别保留。</p></div></section>
    <section className="compare-program-filter"><label htmlFor="compare-program">本科招生专业<select id="compare-program" value={program} onChange={(event) => setProgram(event.target.value)}><option value="">请选择专业</option>{programs.map((item) => <option key={item} value={item}>{item}</option>)}</select></label></section>
    {program && <section className="compare-offering-picker" aria-label="选择对比招生方案">{visible.map((item) => <article key={item.offering_id}><div><span className="type-tag">{item.school.school_type}</span><h2>{item.school.school_name}</h2><strong>{(item.programNames || item.program_names || []).join('、')}</strong></div><dl><div><dt>招生计划</dt><dd>{item.plan_count} 人</dd></div><div><dt>培养地点</dt><dd>{item.training_site}</dd></div><div><dt>公共课</dt><dd>{(item.publicSubjects || item.public_subjects || []).join('、')}</dd></div><div><dt>专业课</dt><dd>{(item.professionalSubjects || item.professional_subjects || []).join('、')}</dd></div></dl><button type="button" aria-pressed={selectedIds.includes(item.offering_id)} disabled={!selectedIds.includes(item.offering_id) && selectedIds.length >= 3} onClick={() => toggleOffering(item.offering_id)}>{selectedIds.includes(item.offering_id) ? '移出对比' : '加入对比'}</button></article>)}</section>}
    {program && selected.length < 2 ? <section className="compare-empty" role="status"><h2>再选择 {2 - selected.length} 条招生方案即可对比</h2><p>当前选择会保存在网址中，复制链接即可分享。</p></section> : null}
    {selected.length >= 2 ? <><div className="compare-scroll desktop-compare" tabIndex="0" aria-label="招生方案对比表，可横向滚动"><table><thead><tr><th>对比项</th>{selected.map((item) => <th key={item.offering_id}>{item.school.school_name}<small>{item.school.school_type}</small></th>)}</tr></thead><tbody>{comparisonGroups.map((group) => <Fragment key={group.label}><tr className="comparison-group-row"><th colSpan={selected.length + 1}>{group.label}</th></tr>{group.rows.map(([key, label]) => <tr key={key} className={`${differences.has(key) ? 'is-different' : 'is-same'} compare-row-${key}`}><th>{label}</th>{selected.map((item) => <td key={item.offering_id}>{key === 'professional' ? <span className="compare-tag professional-tag">{value(item, key)}</span> : key === 'public' ? <span className="compare-tag public-tag">{value(item, key)}</span> : key === 'eligible' ? <span className="compare-eligible">{value(item, key)}</span> : key === 'plan_count' ? <strong className="compare-plan">{value(item, key)}</strong> : value(item, key)}</td>)}</tr>)}</Fragment>)}<tr className="comparison-group-row"><th colSpan={selected.length + 1}>官方资料</th></tr><tr className="is-same"><th>正式资料</th>{selected.map((item) => <td key={item.offering_id}><a href={item.charter_url} target="_blank" rel="noreferrer">招生章程 ↗</a><a href={item.syllabus_url} target="_blank" rel="noreferrer">考试大纲 ↗</a></td>)}</tr></tbody></table></div><section className="mobile-compare-cards" aria-label="招生方案对比卡片">{selected.map((item) => <article key={item.offering_id}><h2>{item.school.school_name}</h2><p>{item.school.school_type}{showProgram ? ` · ${(item.programNames || item.program_names || []).join('、')}` : ''}</p><dl><div className={differences.has('plan_count') ? 'is-different' : ''}><dt>招生计划</dt><dd><strong className="compare-plan">{value(item, 'plan_count')}</strong></dd></div><div className={differences.has('training_site') ? 'is-different' : ''}><dt>培养地点与完整地址</dt><dd>{value(item, 'training_site')}</dd></div><div className={differences.has('eligible') ? 'is-different' : ''}><dt>报考范围</dt><dd><span className="compare-eligible">{value(item, 'eligible')}</span></dd></div><div className={differences.has('professional') ? 'is-different' : ''}><dt>专业课</dt><dd><span className="compare-tag professional-tag">{value(item, 'professional')}</span></dd></div><div className={differences.has('public') ? 'is-different' : ''}><dt>公共课</dt><dd><span className="compare-tag public-tag">{value(item, 'public')}</span></dd></div></dl><div className="compare-official-links"><span>官方资料</span><a href={item.charter_url} target="_blank" rel="noreferrer">招生章程 ↗</a><a href={item.syllabus_url} target="_blank" rel="noreferrer">考试大纲 ↗</a></div></article>)}</section></> : null
    }
  </div>
}

function ResourceCard({ resource, favorites, toggleFavorite, coveragePoints = [] }) {
  const saved = favorites.includes(resource.resource_id)
  return <article className="resource-card"><div className="resource-top"><span className={resource.platform.includes('哔哩') ? 'platform bili' : 'platform mooc'}>{resource.platform}</span><button onClick={() => toggleFavorite(resource.resource_id)} aria-label={saved ? '取消收藏' : '收藏资源'} aria-pressed={saved}>{saved ? '★' : '☆'}</button></div><h4>{resource.title}</h4><p className="creator">{resource.creator}</p><div className="resource-meta"><span>{resource.difficulty}</span><span>{resource.duration_text}</span><span>{resource.resource_type}</span></div>{coveragePoints.length > 0 && <p className="resource-coverage"><strong>覆盖知识点：</strong>{coveragePoints.map((point) => point.point_title).join('、')}</p>}<p>{resource.recommendation_reason}</p><a href={resource.url} target="_blank" rel="noreferrer" onClick={() => trackEvent('external_resource_clicked', resource.resource_id)}>前往官方平台学习 ↗</a><FeedbackForm contextId={`resource:${resource.resource_id}`} compact /></article>
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
  const school = schools.find((item) => item.school_slug === schoolSlug)
  const schoolOfferings = useMemo(() => school?.offerings?.length ? school.offerings : school ? [school] : [], [school])

  useEffect(() => { trackEvent('professional_map_opened', schoolSlug) }, [schoolSlug])

  if (!school) return <Navigate to={scopePath(scope)} replace />

  const heading = <>
    <div className="crumb"><Link to="/">首页</Link><span>/</span><Link to="/anhui">安徽专区</Link><span>/</span>{school.school_name}</div>
    <section className="school-title" style={{ '--school-color': school.theme_color }}><SchoolLogo school={school} large /><div><span className="type-tag">{school.school_type} · {scope.year}</span><h1>{school.school_name}</h1></div><div className="official-links"><a href={schoolOfferings[0]?.charter_url || school.charter_url} target="_blank" rel="noreferrer">招生章程</a><a href={schoolOfferings[0]?.syllabus_url || school.syllabus_url} target="_blank" rel="noreferrer">考试大纲</a></div></section>
  </>

  const offeringOverview = <section className="school-offering-overview" aria-labelledby="offering-overview-title"><div className="section-heading"><div><span className="section-number">{schoolOfferings.length} 个招生点</span><h2 id="offering-overview-title">招生专业与培养点</h2></div><p>每张卡片均展示该专业对应的培养点、报考范围和考试方案。</p></div><div className="offering-detail-grid">{schoolOfferings.map((offering) => { const programLabel = (offering.programNames || offering.program_names || []).join('、') || (MAJOR_NAMES[offering.major_slug || scope.majorSlug] ?? (offering.major_slug || scope.majorSlug)); const scores = (offering.scores || []).filter((score) => score.candidate_category === 'ordinary' && score.score_type === 'actual_admission_minimum'); return <article key={offering.offering_id || offering.school_slug}><div><span>{programLabel}</span><strong>{offering.plan_count} 人</strong></div><dl><div><dt>培养地点与地址</dt><dd>{offering.training_site}</dd></div><div><dt>报考专业范围</dt><dd>{formatEligibleMajorCategories(offering.eligible_major_categories)}</dd></div></dl>{scores.length ? <section className="offering-score" aria-label={`${programLabel}普通考生录取分数线`}><b>普通考生实际录取最低分</b>{scores.map((score) => <div key={score.score_id || `${score.program_name}-${score.score}`}><strong>{score.program_name}</strong><span>{Number(score.score)} 分</span><small>官方公告 {score.source_published_at} · <a href={score.source_url} target="_blank" rel="noreferrer">核验来源 ↗</a></small></div>)}</section> : null}<section className="offering-exam-scheme" aria-label={`${programLabel}考试方案`}><b>考试方案</b><SubjectTags school={offering} compact /></section></article> })}</div></section>

  return <div className="page-wrap learning-page">
    {heading}
    {offeringOverview}
  </div>
}

function Sources({ schools, scope }) {
  return <div className="page-wrap sources-page"><div className="crumb"><Link to="/">首页</Link><span>/</span>资料来源</div><section className="page-hero"><div><span className="eyebrow">透明 · 可核验</span><h1>每条考试信息，都能回到官方来源</h1><p>我们优先采用正式招生章程；拟招生通知只作线索，不覆盖正式文件。</p></div></section><section className="source-rules"><article><b>01</b><h3>正式文件优先</h3><p>正式招生章程高于拟招生方案，后发布的官方更正高于旧版本。</p></article><article><b>02</b><h3>按范围隔离</h3><p>所有招生专业与考试方案按年份、省份和院校隔离，不将其他范围内容混入。</p></article><article><b>03</b><h3>人工复核</h3><p>展示最后核验日期；进入下一招生年度后逐校重新检查。</p></article></section><section className="source-list"><h2>{scope.year} 年试点院校</h2>{schools.map((school) => <article key={school.school_slug}><SchoolLogo school={school} /><div><h3>{school.school_name}</h3><p>{school.source_status} · 核验于 {school.verified_at}</p></div><div className="source-actions"><a href={school.charter_url} target="_blank" rel="noreferrer">正式招生章程 ↗</a><a href={school.syllabus_url} target="_blank" rel="noreferrer">专业课考纲 ↗</a><FeedbackForm contextId={`sources:${school.school_slug}`} compact /></div></article>)}</section><section className="disclaimer"><h2>免责声明</h2><p>“升本导航”不是安徽省教育招生考试院或任何招生院校的官方网站，不提供报名、录取和成绩查询服务。本站仅整理招生专业与考试方案，报名前务必打开官方来源复核。</p></section></div>
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
  return <Layout announcement={content.announcement} content={content}><Routes>
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
}

function AdminFallback() { return <div className="admin-loading">正在加载管理后台…</div> }

export default function App() {
  return <BrowserRouter><AnalyticsRouteTracker /><Suspense fallback={<AdminFallback />}><Routes>
    <Route path="/admin/login" element={<AdminLogin />} />
    <Route path="/admin/reset-password" element={<AdminResetPassword />} />
    <Route path="/admin/*" element={<AdminDashboard />} />
    <Route path="*" element={<PublicSite />} />
  </Routes></Suspense></BrowserRouter>
}
