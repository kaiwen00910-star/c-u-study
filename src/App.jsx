import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { BrowserRouter, Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { offeringSchoolGroups, offerings as snapshotOfferings, resourcesForTopic, schoolGroups, schoolSyllabus, subjectNames } from './data'
import { createLocalBackup, getCountdownTarget, getFavorites, getProgress, importLocalBackup, progressKey, saveCountdownTarget, saveFavorites, saveLastSelection, saveProgress } from './storage'
import { useContent } from './useContent'
import { createSchoolWallSchools, createSchoolWallTracks } from './schoolWallData'
import { comparePath, DEFAULT_SCOPE, MAJOR_NAMES, normalizeScope, scopeLabel, scopePath } from './contentScope'
import { aggregateChapterResources, differingCompareFields, filterSchoolDirectory, learningDeepLink, sanitizeCompareSelection } from './publicFeatures'
import { loadPublishedScopes } from './publicApi'
import { applyPageMetadata } from './seo'
import './App.css'

const AdminDashboard = lazy(() => import('./Admin').then((module) => ({ default: module.AdminDashboard })))
const AdminLogin = lazy(() => import('./Admin').then((module) => ({ default: module.AdminLogin })))
const AdminResetPassword = lazy(() => import('./Admin').then((module) => ({ default: module.AdminResetPassword })))

function Logo() {
  return <Link className="logo" to="/" aria-label="安徽升本导航首页"><span>皖</span><strong>安徽升本导航</strong></Link>
}

export function MobileNavigation({ favoritesCount }) {
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
      <NavLink to={comparePath(DEFAULT_SCOPE)} onClick={close}>院校对比</NavLink>
      <NavLink to="/sources" onClick={close}>资料来源</NavLink>
      <NavLink className="mobile-favorite-count" to="/favorites" onClick={close} aria-label={`已收藏 ${favoritesCount} 条资源`}>★ 我的收藏 <b>{favoritesCount}</b></NavLink>
    </nav>}
  </div>
}

function Layout({ children, favoritesCount, announcement, content }) {
  return <div className="site-shell">
    <header className="topbar">
      <div className="topbar-inner">
        <Logo />
        <nav className="desktop-navigation" aria-label="主导航">
          <NavLink to="/anhui">院校与专业</NavLink>
          <NavLink to={comparePath(DEFAULT_SCOPE)}>院校对比</NavLink>
          <NavLink to="/sources">资料来源</NavLink>
          <NavLink className="favorite-pill" to="/favorites" aria-label={`查看 ${favoritesCount} 条收藏资源`}>★ {favoritesCount}</NavLink>
        </nav>
        <MobileNavigation favoritesCount={favoritesCount} />
      </div>
    </header>
    {content.loading && <aside className="data-status checking" role="status">正在核验在线数据；当前先显示版本化快照。</aside>}
    {content.offline && <aside className="data-status offline" role="alert"><strong>离线快照</strong><span>在线数据读取失败，招生计划与考纲来自版本 {content.metadata.version}（生成于 {new Date(content.metadata.generatedAt).toLocaleString('zh-CN')}）。请打开官方来源复核。</span></aside>}
    {announcement && <aside className="site-announcement" role="status"><strong>{announcement.title}</strong><span>{announcement.content}</span></aside>}
    <main>{children}</main>
    <footer>
      <div><Logo /><p>专注安徽专升本，把分散的考纲和课程整理成一条清楚的备考路径。</p></div>
      <div><strong>重要说明</strong><p>本站为非官方学习导航，不组织招生与考试。报考前请以省考试院和招生院校最新通知为准。</p></div>
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
      .map(({ item, schoolSlug }) => ({ type: '知识点', title: item.point_title, detail: `${schools.find((school) => school.school_slug === schoolSlug)?.school_name || schoolSlug} · ${item.subject_name || subjectNames[item.subject_slug]}`, href: learningDeepLink(scope, schoolSlug, item) }))
    const resourceMatches = resources.filter((item) => `${item.title}${item.creator}${item.platform}`.toLowerCase().includes(q))
      .slice(0, 3).map((item) => ({ type: '课程', title: item.title, detail: `${item.platform} · ${item.creator}`, url: item.url }))
    return [...pointMatches, ...resourceMatches]
  }, [query, resources, schools, syllabusPoints, scope])

  return <div className="search-wrap">
    <label htmlFor="home-search" className="sr-only">搜索知识点或课程</label>
    <span className="search-icon">⌕</span>
    <input id="home-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索知识点或课程，例如：指针、极限、计算机网络" />
    {query && <div className="search-results" role="status">
      {matches.length ? matches.map((item, index) => item.url
        ? <a key={`${item.title}-${index}`} href={item.url} target="_blank" rel="noreferrer"><span>{item.type}</span><b>{item.title}</b><small>{item.detail}</small></a>
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
    <span className="wall-school-info"><strong>{school.name}</strong><span>{school.hasDetails ? '进入学习地图 →' : '资料整理中'}</span></span>
  </>
  if (interactive && school.hasDetails) return <Link className="wall-school-card" to={school.href} title={`${school.name}：进入学习地图`}>{contents}</Link>
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
    <span className="sr-only">{schools.length} 所安徽普通专升本招生院校，其中 {schools.filter((school) => school.hasDetails).length} 所已开放学习地图</span>
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

function Home({ resources, wallSchools, syllabusPoints, schools, schoolCount, scope }) {
  return <>
    <section className="hero-section">
      <div className="hero-wall-zone">
        <SchoolLogoWall schools={wallSchools} />
      </div>
      <div className="hero-content-zone">
        <div className="hero-main">
          <div className="eyebrow">ANHUI EXAM PATH · 2026</div>
          <h1>安徽专升本，<br/><em>找到适合你的本科院校</em></h1>
          <p className="hero-copy">收录 42 所安徽招生院校名录；其中 3 所已完成招生计划与考纲整理，可进入学习地图。</p>
          <div className="hero-actions"><Link className="primary-btn" to={scopePath(scope)}>查看院校状态 <span>→</span></Link><Link className="secondary-btn" to={`${scopePath(scope)}#school-filter`}>查报考条件</Link></div>
          <div className="hero-trust"><span>✓ 官方来源可核验</span><span>✓ 免费公开使用</span><span>✓ 专注安徽</span></div>
          <div className="hero-search"><SearchBox resources={resources} syllabusPoints={syllabusPoints} schools={schools} scope={scope} /></div>
        </div>
        <div className="hero-stats" aria-label="当前收录概况"><div><strong>{wallSchools.length}</strong><span>院校名录</span></div><div><strong>{schoolCount}</strong><span>已开放学习地图</span></div><div><strong>{syllabusPoints.length}</strong><span>考纲知识点</span></div><div><strong>{resources.length}</strong><span>精选资源</span></div></div>
      </div>
    </section>
    <section className="content-section countdown-wrap"><Countdown /></section>
    <section className="content-section anhui-focus-section">
      <div className="anhui-focus-card"><div className="province-mark">皖</div><div><span className="status-dot">专注安徽</span><h2>只做安徽专升本，把资料做深、做准</h2><p>持续补充安徽院校、招生专业、考试大纲和优质学习资源，不再扩展其他省份。</p></div><Link className="primary-btn" to="/anhui">进入安徽专区 <span>→</span></Link></div>
    </section>
    <section className="content-section home-services">
      <div className="section-heading"><div><span className="section-number">01</span><h2>从择校到备考，一站理清</h2></div><p>信息层级更清楚，每一步都有可核验的来源。</p></div>
      <div className="service-grid">
        <Link to="/anhui"><span>⌕</span><small>01</small><h3>院校筛选</h3><p>查看院校类型、培养地点、招生范围与考试科目。</p><b>开始筛选 →</b></Link>
        <Link to={comparePath(scope)}><span>▦</span><small>02</small><h3>招生计划</h3><p>横向比较试点院校招生计划与专业课差异。</p><b>查看对比 →</b></Link>
        <Link to="/sources"><span>◎</span><small>03</small><h3>报考指南</h3><p>了解资料年份、正式章程与官方考纲来源。</p><b>核验资料 →</b></Link>
        <a href="#faq"><span>?</span><small>04</small><h3>常见问题</h3><p>快速了解网站数据、学习进度与更新方式。</p><b>查看说明 ↓</b></a>
      </div>
    </section>
    <section className="content-section faq-section" id="faq">
      <div><span className="eyebrow">QUICK GUIDE</span><h2>开始前，你可能想知道</h2></div>
      <div className="faq-list"><details><summary>这里的信息是官方发布的吗？</summary><p>本站是非官方学习导航，但招生信息均尽量链接到学校或考试院原始页面，报考时仍请以最新官方通知为准。</p></details><details><summary>为什么目前只有 3 所院校能进入学习地图？</summary><p>首页院校墙展示安徽招生院校索引；学习地图需要逐校核对考纲，目前先完成计算机科学与技术专业的 3 所试点院校。</p></details><details><summary>学习进度会同步到其他设备吗？</summary><p>不会。当前进度和收藏只保存在本机浏览器，清除数据或更换设备后会丢失。</p></details></div>
    </section>
    <section className="notice-strip"><strong>非官方网站</strong><span>本站仅提供信息整理与学习资源导航，所有招生信息请以官方最新发布为准。</span><Link to="/sources">查看资料来源 →</Link></section>
  </>
}

function SubjectTags({ school }) {
  return <div className="subject-groups"><div><small>公共课</small>{school.publicSubjects.map((s) => <span key={s}>{s}</span>)}</div><div><small>专业课</small>{school.professionalSubjects.map((s) => <span className="professional" key={s}>{s}</span>)}</div></div>
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
  const filters = { q: params.get('q') || '', type: params.get('type') || '', map: params.get('map') || '', subject: params.get('subject') || '' }
  const setFilter = (key, value) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value); else next.delete(key)
    setParams(next, { replace: true })
  }
  const filteredDirectory = filterSchoolDirectory(wallSchools, schools, filters)
  const filteredSlugs = new Set(filteredDirectory.map((school) => school.schoolSlug))
  const openSchools = schools.filter((school) => filteredSlugs.has(school.school_slug))
  const pendingSchools = filteredDirectory.filter((school) => !school.hasDetails)
  const subjects = [...new Set(schools.flatMap((school) => [...school.publicSubjects, ...school.professionalSubjects]))]
  const years = [...new Set(publishedScopes.filter((item) => item.provinceSlug === scope.provinceSlug && item.majorSlug === scope.majorSlug).map((item) => item.year))].sort((a, b) => b - a)
  return <div className="page-wrap" id="school-filter">
    <div className="crumb"><Link to="/">首页</Link><span>/</span>安徽专区</div>
    <section className="page-hero compact"><div><span className="eyebrow">安徽省 · 普通高校专升本</span><h1>选择你的目标院校</h1><p>{wallSchools.length} 所院校名录中，当前 {schools.length} 所院校开放完整学习地图。</p></div><div className="filter-box scope-summary"><strong>已发布年份</strong><label className="sr-only" htmlFor="published-year">选择年份</label><select id="published-year" value={scope.year} onChange={(event) => navigate(scopePath({ ...scope, year: Number(event.target.value) }))}>{years.map((year) => <option key={year} value={year}>{year} 年</option>)}</select><span>{MAJOR_NAMES[scope.majorSlug] ?? scope.majorSlug}</span><small>仅展示已有正式发布数据的年份</small></div></section>
    <section className="exam-structure"><div><span>安徽考试结构</span><strong>2 门公共课</strong><b>+</b><strong>2 门专业课</strong></div><p>公共课由省考试院组织；专业课由招生院校组织，因此同一专业在不同院校的科目可能不同。</p></section>
    <section className="school-filters" aria-label="院校筛选"><label>院校名称<input type="search" value={filters.q} onChange={(event) => setFilter('q', event.target.value)} placeholder="输入院校名称" /></label><label>办学性质<select value={filters.type} onChange={(event) => setFilter('type', event.target.value)}><option value="">全部</option><option value="公办">公办</option><option value="民办">民办</option></select></label><label>资料状态<select value={filters.map} onChange={(event) => setFilter('map', event.target.value)}><option value="">全部</option><option value="open">已开放学习地图</option><option value="pending">资料整理中</option></select></label><label>考试科目<select value={filters.subject} onChange={(event) => setFilter('subject', event.target.value)}><option value="">全部科目</option>{subjects.map((subject) => <option key={subject}>{subject}</option>)}</select></label><button type="button" onClick={() => setParams({}, { replace: true })}>清空筛选</button></section>
    <p className="filter-result-count" role="status">找到 {filteredDirectory.length} 所院校</p>
    {!filteredDirectory.length && <section className="filter-empty"><h2>没有匹配的院校</h2><p>可以减少筛选条件，或清空后重新查找。</p><button type="button" onClick={() => setParams({}, { replace: true })}>清空筛选</button></section>}
    {!!openSchools.length && <><div className="section-heading"><div><span className="section-number">{openSchools.length} 所</span><h2>已开放学习地图</h2></div><Link to={comparePath(scope)}>查看横向对比 →</Link></div><section className="school-grid">{openSchools.map((school) => <SchoolCard key={school.school_slug} school={school} scope={scope} />)}</section></>}
    {!!pendingSchools.length && <><div className="section-heading pending-heading"><div><span className="section-number">{pendingSchools.length} 所</span><h2>资料整理中</h2></div><p>已列入院校名录，暂未开放学习地图</p></div><section className="pending-school-grid">{pendingSchools.map((school) => <article key={school.id}><strong>{school.name}</strong><span>{school.schoolType}</span><small>资料整理中 · 暂未开放学习地图</small></article>)}</section></>}
    <div className="local-tip"><span>ⓘ</span><p><strong>你的进度只保存在当前浏览器</strong><br/>不需要注册即可使用；清除浏览器数据或更换设备后，进度与收藏不会同步。</p></div>
  </div>
}

function SchoolCard({ school, scope }) {
  return <article className="school-card" style={{ '--school-color': school.theme_color }}>
    <div className="school-head"><SchoolLogo school={school} /><div><span className="type-tag">{school.school_type}</span><h3>{school.school_name}</h3></div></div>
    <SubjectTags school={school} />
    <dl><div><dt>培养地点</dt><dd>{school.sites.join(' / ')}</dd></div><div><dt>招生范围</dt><dd>{school.eligible_major_categories}</dd></div><div><dt>计划数</dt><dd>{school.totalPlan} 人</dd></div></dl>
    <div className="school-card-foot"><span>核验于 {school.verified_at}</span><Link onClick={() => saveLastSelection({ ...scope, school: school.school_slug })} to={scopePath(scope, school.school_slug)}>打开学习地图 →</Link></div>
  </article>
}

export function Compare({ schools, scope }) {
  const [params, setParams] = useSearchParams()
  const selectedSlugs = sanitizeCompareSelection(params.get('schools'), schools)
  const selected = schools.filter((school) => selectedSlugs.includes(school.school_slug))
  const differences = differingCompareFields(selected)
  const toggleSchool = (slug) => {
    const next = selectedSlugs.includes(slug) ? selectedSlugs.filter((item) => item !== slug) : [...selectedSlugs, slug].slice(0, 3)
    const nextParams = new URLSearchParams(params)
    if (next.length) nextParams.set('schools', next.join(',')); else nextParams.delete('schools')
    setParams(nextParams, { replace: true })
  }
  return <div className="page-wrap">
    <div className="crumb"><Link to="/">首页</Link><span>/</span><Link to="/anhui">安徽专区</Link><span>/</span>院校对比</div>
    <section className="page-hero"><div><span className="eyebrow">{scopeLabel(scope)}</span><h1>选择院校进行对比</h1><p>最多选择 3 所已开放院校；至少选择 2 所后生成有效对比。</p></div></section>
    <section className="compare-picker" aria-label="选择对比院校">{schools.map((school) => <label key={school.school_slug}><input type="checkbox" checked={selectedSlugs.includes(school.school_slug)} disabled={!selectedSlugs.includes(school.school_slug) && selectedSlugs.length >= 3} onChange={() => toggleSchool(school.school_slug)} /><span>{school.school_name}</span></label>)}</section>
    {selected.length < 2 ? <section className="compare-empty" role="status"><h2>再选择 {2 - selected.length} 所院校即可对比</h2><p>当前选择会保存在网址中，复制链接即可分享。</p></section> : <div className="compare-scroll" tabIndex="0" aria-label="院校对比表，可横向滚动"><table><thead><tr><th>对比项</th>{selected.map((s) => <th key={s.school_slug}><span className="compare-school"><SchoolLogo school={s} /><span>{s.school_name}<small>{s.school_type}</small></span></span></th>)}</tr></thead><tbody>
      <tr className={differences.has('sites') ? 'is-different' : ''}><th>培养地点</th>{selected.map((s) => <td key={s.school_slug}>{s.sites.map(x => <span className="table-line" key={x}>{x}</span>)}</td>)}</tr>
      <tr className={differences.has('eligible_major_categories') ? 'is-different' : ''}><th>招生范围</th>{selected.map((s) => <td key={s.school_slug}>{s.eligible_major_categories}</td>)}</tr>
      <tr className={differences.has('totalPlan') ? 'is-different' : ''}><th>招生计划</th>{selected.map((s) => <td key={s.school_slug}><strong>{s.totalPlan}</strong> 人</td>)}</tr>
      <tr><th>公共课</th>{selected.map((s) => <td key={s.school_slug}>{s.publicSubjects.join(' · ')}</td>)}</tr>
      <tr className={differences.has('professionalSubjects') ? 'is-different highlight-row' : 'highlight-row'}><th>专业课</th>{selected.map((s) => <td key={s.school_slug}>{s.professionalSubjects.map(x => <span className="table-subject" key={x}>{x}</span>)}</td>)}</tr>
      <tr><th>官方资料</th>{selected.map((s) => <td key={s.school_slug}><a href={s.charter_url} target="_blank" rel="noreferrer">招生章程 ↗</a><a href={s.syllabus_url} target="_blank" rel="noreferrer">考试大纲 ↗</a><small>{s.source_status} · {s.verified_at}</small></td>)}</tr>
      <tr><th>学习入口</th>{selected.map((s) => <td key={s.school_slug}><Link className="small-primary" to={scopePath(scope, s.school_slug)}>查看学习地图</Link></td>)}</tr>
    </tbody></table></div>
    }
  </div>
}

function ResourceCard({ resource, favorites, toggleFavorite, coveragePoints = [] }) {
  const saved = favorites.includes(resource.resource_id)
  return <article className="resource-card"><div className="resource-top"><span className={resource.platform.includes('哔哩') ? 'platform bili' : 'platform mooc'}>{resource.platform}</span><button onClick={() => toggleFavorite(resource.resource_id)} aria-label={saved ? '取消收藏' : '收藏资源'} aria-pressed={saved}>{saved ? '★' : '☆'}</button></div><h4>{resource.title}</h4><p className="creator">{resource.creator}</p><div className="resource-meta"><span>{resource.difficulty}</span><span>{resource.duration_text}</span><span>{resource.resource_type}</span></div>{coveragePoints.length > 0 && <p className="resource-coverage"><strong>覆盖知识点：</strong>{coveragePoints.map((point) => point.point_title).join('、')}</p>}<p>{resource.recommendation_reason}</p><a href={resource.url} target="_blank" rel="noreferrer">前往官方平台学习 ↗</a></article>
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

export function LearningMap({ favorites, toggleFavorite, resources, schools, syllabusPoints, scope }) {
  const { schoolSlug } = useParams()
  const location = useLocation()
  const school = schools.find((item) => item.school_slug === schoolSlug)
  const [progress, setProgress] = useState(getProgress)
  const [selectedSubject, setSelectedSubject] = useState('')
  const [highlightedPoint, setHighlightedPoint] = useState('')
  const points = useMemo(() => schoolSyllabus(schoolSlug, syllabusPoints, scope), [schoolSlug, syllabusPoints, scope])
  const subjectOrder = useMemo(() => {
    const declaredSubjects = school ? [...school.publicSubjects, ...school.professionalSubjects] : []
    const declaredSubjectOrder = declaredSubjects.map((name) => points.find((point) => (point.subject_name || subjectNames[point.subject_slug]) === name)?.subject_slug).filter(Boolean)
    return [...new Set([...declaredSubjectOrder, ...points.map((point) => point.subject_slug)])]
  }, [points, school])
  const activeSubject = subjectOrder.includes(selectedSubject) ? selectedSubject : subjectOrder[0] || ''
  const shownSubjects = activeSubject ? [activeSubject] : []
  const completed = points.filter((point) => progress[progressKey(scope, schoolSlug, point.point_id)]).length
  const percent = points.length ? Math.round(completed / points.length * 100) : 0

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const pointId = params.get('point') || ''
    const subjectSlug = params.get('subject') || ''
    const target = points.find((point) => point.point_id === pointId && (!subjectSlug || point.subject_slug === subjectSlug))
    setSelectedSubject(target?.subject_slug || subjectOrder[0] || '')
    if (!target) { setHighlightedPoint(''); return undefined }
    setHighlightedPoint(target.point_id)
    const scrollTimer = window.setTimeout(() => document.getElementById(`point-${target.point_id}`)?.scrollIntoView?.({ behavior: 'smooth', block: 'center' }), 50)
    const clearTimer = window.setTimeout(() => setHighlightedPoint(''), 2400)
    return () => { window.clearTimeout(scrollTimer); window.clearTimeout(clearTimer) }
  }, [location.search, points, schoolSlug, scope.year, scope.provinceSlug, scope.majorSlug, subjectOrder])

  if (!school) return <Navigate to={scopePath(scope)} replace />

  function togglePoint(pointId) {
    const key = progressKey(scope, schoolSlug, pointId)
    const next = { ...progress, [key]: !progress[key] }
    setProgress(next); saveProgress(next)
  }

  const heading = <>
    <div className="crumb"><Link to="/">首页</Link><span>/</span><Link to="/anhui">安徽专区</Link><span>/</span>{school.school_name}</div>
    <section className="school-title" style={{ '--school-color': school.theme_color }}><SchoolLogo school={school} large /><div><span className="type-tag">{school.school_type} · {scope.year}</span><h1>{school.school_name}</h1><p>{MAJOR_NAMES[scope.majorSlug] ?? scope.majorSlug} · {school.sites.join(' / ')}</p></div><div className="official-links"><a href={school.charter_url} target="_blank" rel="noreferrer">招生章程 ↗</a><a href={school.syllabus_url} target="_blank" rel="noreferrer">官方考纲 ↗</a></div></section>
  </>

  if (!points.length) return <div className="page-wrap learning-page">
    {heading}
    <section className="syllabus-empty" role="status"><span aria-hidden="true">◇</span><h2>该院校暂无可展示考纲</h2><p>当前年份、省份和专业范围内尚未录入已核验的考纲内容；可能是官方考纲暂未发布，或本站仍在整理复核。</p><Link className="primary-btn" to={scopePath(scope)}>返回院校列表</Link></section>
  </div>

  return <div className="page-wrap learning-page">
    {heading}
    <SubjectTags school={school} />
    <section className="progress-panel"><div className="progress-copy"><span>学习进度</span><strong>{completed} / {points.length} 个知识点</strong></div><div className="progress-track"><span style={{ width: `${percent}%` }} /></div><b>{percent}%</b></section>
    <div className="subject-tabs" role="tablist" aria-label="选择考试科目">{subjectOrder.map((slug) => <button type="button" role="tab" aria-selected={activeSubject === slug} className={activeSubject === slug ? 'active' : ''} onClick={() => setSelectedSubject(slug)} key={slug}>{points.find((point) => point.subject_slug === slug)?.subject_name || subjectNames[slug]}</button>)}</div>
    <div className="syllabus-column">{shownSubjects.map((subjectSlug) => {
      const subjectPoints = points.filter((p) => p.subject_slug === subjectSlug)
      const sections = [...new Set(subjectPoints.map((p) => p.section_name))]
      const subjectName = subjectPoints[0]?.subject_name || subjectNames[subjectSlug]
      return <section className="subject-block" id={subjectSlug} key={subjectSlug}><div className="subject-title"><div><span>{school.professionalSubjects.includes(subjectName) ? '专业课' : '公共课'}</span><h2>{subjectName}</h2></div><small>{subjectPoints.length} 个知识点</small></div>{sections.map((section) => {
        const sectionPoints = subjectPoints.filter((point) => point.section_name === section)
        const recommendations = aggregateChapterResources(sectionPoints, resources)
        return <div className="chapter" key={section}><h3>{section}</h3>{sectionPoints.map((point) => {
          const done = !!progress[progressKey(scope, schoolSlug, point.point_id)]
          const linked = resourcesForTopic(point.canonical_topic, resources)
          return <div id={`point-${point.point_id}`} className={`knowledge-item compact ${done ? 'done' : ''} ${highlightedPoint === point.point_id ? 'target-highlight' : ''}`} key={point.point_id}><div className="knowledge-heading"><label><input type="checkbox" checked={done} onChange={() => togglePoint(point.point_id)} /><span className="checkmark">✓</span><b>{point.point_title}</b></label><small>{linked.length} 个推荐</small></div></div>
        })}<details className="chapter-resources"><summary>查看本章推荐资源（已去重 {recommendations.length} 条）</summary><div className="resource-row">{recommendations.length ? recommendations.map(({ resource, points: covered }) => <ResourceCard key={resource.resource_id} resource={resource} coveragePoints={covered} favorites={favorites} toggleFavorite={toggleFavorite} />) : <p className="empty-resource">资源整理中，建议先对照官方考纲和参考书学习。</p>}</div></details></div>
      })}</section>
    })}</div>
    <div className="source-date">资料状态：{school.source_status} · 最后人工核验 {school.verified_at}。如与官方最新通知不一致，请以官方为准。</div>
  </div>
}

function Sources({ schools, scope }) {
  return <div className="page-wrap sources-page"><div className="crumb"><Link to="/">首页</Link><span>/</span>资料来源</div><section className="page-hero"><div><span className="eyebrow">透明 · 可核验</span><h1>每条考试信息，都能回到官方来源</h1><p>我们优先采用正式招生章程；拟招生通知只作线索，不覆盖正式文件。</p></div></section><section className="source-rules"><article><b>01</b><h3>正式文件优先</h3><p>正式招生章程高于拟招生方案，后发布的官方更正高于旧版本。</p></article><article><b>02</b><h3>按范围隔离</h3><p>所有招生方案和知识点按年份、省份、专业隔离，不将其他范围内容混入。</p></article><article><b>03</b><h3>人工复核</h3><p>展示最后核验日期；进入下一招生年度后逐校重新检查。</p></article></section><section className="source-list"><h2>{scope.year} 年试点院校</h2>{schools.map((school) => <article key={school.school_slug}><SchoolLogo school={school} /><div><h3>{school.school_name}</h3><p>{school.source_status} · 核验于 {school.verified_at}</p></div><div><a href={school.charter_url} target="_blank" rel="noreferrer">正式招生章程 ↗</a><a href={school.syllabus_url} target="_blank" rel="noreferrer">专业课考纲 ↗</a></div></article>)}</section><section className="disclaimer"><h2>免责声明</h2><p>“升本导航”不是安徽省教育招生考试院或任何招生院校的官方网站，不提供报名、录取和成绩查询服务。课程推荐为编辑整理，不代表招生单位意见，也不保证单个课程覆盖全部考试内容。报名前务必打开官方来源复核。</p></section></div>
}

function NotFound() { return <div className="page-wrap not-found"><span>404</span><h1>这个页面还没整理好</h1><p>回到安徽专区，继续选择院校和学习路线。</p><Link className="primary-btn" to="/anhui">返回安徽专区</Link></div> }

function scopeFromLocation(pathname) {
  const match = pathname.match(/^\/([a-z0-9-]+)\/(\d{4})\/([a-z0-9-]+)/)
  return match ? normalizeScope({ provinceSlug: match[1], year: match[2], majorSlug: match[3] }) : DEFAULT_SCOPE
}

const snapshotPublishedScopes = [...new Map(snapshotOfferings
  .filter((item) => item.status ? item.status === 'published' : item.active !== false)
  .map((item) => [`${item.year}:${item.province_slug}:${item.major_slug}`, normalizeScope(item)]))
  .values()].sort((a, b) => b.year - a.year)

export function PublicSite() {
  const [favorites, setFavorites] = useState(getFavorites)
  const location = useLocation()
  const scope = useMemo(() => scopeFromLocation(location.pathname), [location.pathname])
  const content = useContent(scope)
  const [publishedScopeState, setPublishedScopeState] = useState({ status: 'loading', items: snapshotPublishedScopes })
  const publishedScopes = publishedScopeState.items
  const academicSchools = content.academicSchools
  const wallSchools = useMemo(() => createSchoolWallSchools(academicSchools, content.offerings, content.syllabusPoints, scope), [academicSchools, content.offerings, content.syllabusPoints, scope])
  const schools = useMemo(() => schoolGroups(content.offerings, academicSchools, scope, content.syllabusPoints), [content.offerings, academicSchools, scope, content.syllabusPoints])
  const routeSchools = useMemo(() => offeringSchoolGroups(content.offerings, academicSchools, scope), [content.offerings, academicSchools, scope])
  const defaultPublishedScope = publishedScopes.find((item) => item.provinceSlug === 'anhui' && item.majorSlug === 'computer-science') || publishedScopes[0] || null
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
    const match = location.pathname.match(/^\/[a-z0-9-]+\/\d{4}\/[a-z0-9-]+\/([a-z0-9-]+)/)
    applyPageMetadata(location.pathname, routeSchools.find((school) => school.school_slug === match?.[1])?.school_name || '')
  }, [location.pathname, routeSchools])
  function toggleFavorite(id) { const next = favorites.includes(id) ? favorites.filter((x) => x !== id) : [...favorites, id]; setFavorites(next); saveFavorites(next) }
  function clearInvalid(ids) { const invalid = new Set(ids); const next = favorites.filter((id) => !invalid.has(id)); setFavorites(next); saveFavorites(next) }
  const pathHasScope = /^\/[a-z0-9-]+\/\d{4}\/[a-z0-9-]+/.test(location.pathname)
  const waitsForPublishedScopes = pathHasScope || location.pathname === '/anhui'
  const scopeIsPublished = publishedScopes.some((item) => item.year === scope.year && item.provinceSlug === scope.provinceSlug && item.majorSlug === scope.majorSlug)
  if (waitsForPublishedScopes && publishedScopeState.status === 'loading') return <div className="public-scope-loading" role="status">正在加载已发布年份…</div>
  if (waitsForPublishedScopes && !defaultPublishedScope) return <div className="public-scope-loading" role="status">暂时没有已发布年份。</div>
  if (location.pathname === '/anhui') return <Navigate to={scopePath(defaultPublishedScope)} replace />
  if (pathHasScope && !scopeIsPublished) return <Navigate to={scopePath(requestedScopeFallback)} replace />
  return <Layout favoritesCount={favorites.length} announcement={content.announcement} content={content}><Routes>
    <Route path="/" element={<Home resources={content.resources} wallSchools={wallSchools} syllabusPoints={content.syllabusPoints} schools={schools} schoolCount={schools.length} scope={scope} />} />
    <Route path="/anhui" element={<Navigate to={scopePath(defaultPublishedScope)} replace />} />
    <Route path="/favorites" element={<Favorites favorites={favorites} resources={content.resources} toggleFavorite={toggleFavorite} clearInvalid={clearInvalid} onImported={(imported) => setFavorites(imported.favorites)} scope={defaultPublishedScope || DEFAULT_SCOPE} />} />
    <Route path="/:provinceSlug/:year/:majorSlug" element={<AnhuiHub schools={schools} wallSchools={wallSchools} scope={scope} publishedScopes={publishedScopes} />} />
    <Route path="/:provinceSlug/:year/:majorSlug/compare" element={<Compare schools={schools} scope={scope} />} />
    <Route path="/:provinceSlug/:year/:majorSlug/:schoolSlug" element={<LearningMap favorites={favorites} toggleFavorite={toggleFavorite} resources={content.resources} schools={routeSchools} syllabusPoints={content.syllabusPoints} scope={scope} />} />
    <Route path="/sources" element={<Sources schools={schools} scope={scope} />} />
    <Route path="*" element={<NotFound />} />
  </Routes></Layout>
}

function AdminFallback() { return <div className="admin-loading">正在加载管理后台…</div> }

export default function App() {
  return <BrowserRouter><Suspense fallback={<AdminFallback />}><Routes>
    <Route path="/admin/login" element={<AdminLogin />} />
    <Route path="/admin/reset-password" element={<AdminResetPassword />} />
    <Route path="/admin/*" element={<AdminDashboard />} />
    <Route path="*" element={<PublicSite />} />
  </Routes></Suspense></BrowserRouter>
}
