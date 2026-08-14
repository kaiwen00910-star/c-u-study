import { useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Link, NavLink, Navigate, Route, Routes, useParams } from 'react-router-dom'
import { resourcesForTopic, schoolGroups, schoolSyllabus, schoolTheme, subjectNames, syllabus } from './data'
import { AdminDashboard, AdminLogin, AdminResetPassword } from './Admin'
import { getFavorites, getProgress, progressKey, saveFavorites, saveLastSelection, saveProgress } from './storage'
import { useContent } from './useContent'
import { anhuiAdmissionSchools, schoolWallTracks } from './schoolWallData'
import './App.css'

const schools = schoolGroups()

function Logo() {
  return <Link className="logo" to="/" aria-label="安徽升本导航首页"><span>皖</span><strong>安徽升本导航</strong></Link>
}

function Layout({ children, favoritesCount, announcement }) {
  return <div className="site-shell">
    <header className="topbar">
      <div className="topbar-inner">
        <Logo />
        <nav aria-label="主导航">
          <NavLink to="/anhui">院校与专业</NavLink>
          <NavLink to="/anhui/2026/computer-science">院校对比</NavLink>
          <NavLink to="/sources">资料来源</NavLink>
          <span className="favorite-pill" title="已收藏资源">★ {favoritesCount}</span>
        </nav>
      </div>
    </header>
    {announcement && <aside className="site-announcement" role="status"><strong>{announcement.title}</strong><span>{announcement.content}</span></aside>}
    <main>{children}</main>
    <footer>
      <div><Logo /><p>专注安徽专升本，把分散的考纲和课程整理成一条清楚的备考路径。</p></div>
      <div><strong>重要说明</strong><p>本站为非官方学习导航，不组织招生与考试。报考前请以省考试院和招生院校最新通知为准。</p></div>
    </footer>
  </div>
}

function SearchBox({ resources }) {
  const [query, setQuery] = useState('')
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    const pointMatches = syllabus.filter((item) => `${item.point_title}${item.section_name}${subjectNames[item.subject_slug]}`.toLowerCase().includes(q))
      .slice(0, 5).map((item) => ({ type: '知识点', title: item.point_title, detail: subjectNames[item.subject_slug], slug: item.school_slug === 'common' ? 'hfnu' : item.school_slug }))
    const resourceMatches = resources.filter((item) => `${item.title}${item.creator}${item.platform}`.toLowerCase().includes(q))
      .slice(0, 3).map((item) => ({ type: '课程', title: item.title, detail: `${item.platform} · ${item.creator}`, url: item.url }))
    return [...pointMatches, ...resourceMatches]
  }, [query, resources])

  return <div className="search-wrap">
    <label htmlFor="home-search" className="sr-only">搜索知识点或课程</label>
    <span className="search-icon">⌕</span>
    <input id="home-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索知识点或课程，例如：指针、极限、计算机网络" />
    {query && <div className="search-results" role="status">
      {matches.length ? matches.map((item, index) => item.url
        ? <a key={`${item.title}-${index}`} href={item.url} target="_blank" rel="noreferrer"><span>{item.type}</span><b>{item.title}</b><small>{item.detail}</small></a>
        : <Link key={`${item.title}-${index}`} to={`/anhui/2026/computer-science/${item.slug}`}><span>{item.type}</span><b>{item.title}</b><small>{item.detail}</small></Link>)
        : <p>没有找到匹配内容，试试“C语言”或“高等数学”。</p>}
    </div>}
  </div>
}

const COUNTDOWN_STORAGE_KEY = 'zsb:v1:countdownTarget'

function Countdown() {
  const [target, setTarget] = useState(() => localStorage.getItem(COUNTDOWN_STORAGE_KEY) || '2027-04-18')
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
    localStorage.setItem(COUNTDOWN_STORAGE_KEY, value)
  }

  return <section className="countdown-section" aria-label="安徽专升本备考倒计时">
    <div className="countdown-heading"><span className="countdown-icon">⏳</span><div><span>安徽专升本 · 个人备考提醒</span><h2>{days > 0 ? <>距离目标日还有 <strong>{days}</strong> 天</> : '目标日已到，加油！'}</h2></div></div>
    <div className="countdown-progress"><span style={{ width: `${Math.min(100, Math.max(3, (1 - days / 365) * 100))}%` }} /></div>
    <div className="countdown-settings"><p>当前目标：<strong>{formattedTarget}</strong><small>此日期为个人备考目标，并非安徽省考试院公布的正式考试时间。</small></p><label>修改目标日期<input type="date" value={target} min={new Date().toISOString().slice(0, 10)} onChange={changeTarget} /></label></div>
  </section>
}

function SchoolWallCard({ school }) {
  const [imageFailed, setImageFailed] = useState(false)
  return <Link className="wall-school-card" to={school.href} title={school.name}>
    <span className="wall-school-emblem" aria-hidden="true">
      {school.logo && !imageFailed
        ? <img src={school.logo} alt="" onError={() => setImageFailed(true)} />
        : <b>{school.shortName}</b>}
    </span>
    <span className="wall-school-info"><strong>{school.name}</strong><span>查看院校 →</span></span>
  </Link>
}

function SchoolLogoWall() {
  return <div className="school-wall" aria-label="安徽普通专升本招生院校">
    <span className="sr-only">42 所安徽普通专升本招生院校</span>
    <div className="school-wall-window">
      {schoolWallTracks.map((track, index) => <div className={`logo-track track-${index + 1}`} key={index}>
        <div className="logo-track-inner">
          <div className="logo-track-group">{track.map((school) => <SchoolWallCard key={school.id} school={school} />)}</div>
          <div className="logo-track-group" aria-hidden="true">{track.map((school) => <SchoolWallCard key={`${school.id}-copy`} school={school} />)}</div>
        </div>
      </div>)}
      <div className="school-wall-static">{anhuiAdmissionSchools.map((school) => <SchoolWallCard key={`${school.id}-static`} school={school} />)}</div>
    </div>
  </div>
}

function Home({ resources }) {
  return <>
    <section className="hero-section">
      <div className="hero-stage">
        <SchoolLogoWall />
        <div className="hero-content-layer">
          <div className="hero-main">
          <div className="eyebrow">ANHUI EXAM PATH · 2026</div>
          <h1>安徽专升本，<br/><em>找到适合你的本科院校</em></h1>
          <p className="hero-copy">汇总安徽招生院校与报考信息，按目标院校的考试科目拆解考纲，再为每个知识点匹配值得学的公开课程。</p>
          <div className="hero-actions"><Link className="primary-btn" to="/anhui">查看院校 <span>→</span></Link><Link className="secondary-btn" to="/anhui#school-filter">查报考条件</Link></div>
          <div className="hero-trust"><span>✓ 官方来源可核验</span><span>✓ 免费公开使用</span><span>✓ 专注安徽</span></div>
          <div className="hero-search"><SearchBox resources={resources} /></div>
          </div>
        </div>
      </div>
      <div className="hero-stats" aria-label="当前收录概况"><div><strong>42</strong><span>招生院校索引</span></div><div><strong>3</strong><span>完整学习地图</span></div><div><strong>{syllabus.length}</strong><span>考纲知识点</span></div><div><strong>{resources.length}</strong><span>精选资源</span></div></div>
    </section>
    <section className="content-section countdown-wrap"><Countdown /></section>
    <section className="content-section anhui-focus-section">
      <div className="anhui-focus-card"><div className="province-mark">皖</div><div><span className="status-dot">专注安徽</span><h2>只做安徽专升本，把资料做深、做准</h2><p>持续补充安徽院校、招生专业、考试大纲和优质学习资源，不再扩展其他省份。</p></div><Link className="primary-btn" to="/anhui">进入安徽专区 <span>→</span></Link></div>
    </section>
    <section className="content-section home-services">
      <div className="section-heading"><div><span className="section-number">01</span><h2>从择校到备考，一站理清</h2></div><p>信息层级更清楚，每一步都有可核验的来源。</p></div>
      <div className="service-grid">
        <Link to="/anhui"><span>⌕</span><small>01</small><h3>院校筛选</h3><p>查看院校类型、培养地点、招生范围与考试科目。</p><b>开始筛选 →</b></Link>
        <Link to="/anhui/2026/computer-science"><span>▦</span><small>02</small><h3>招生计划</h3><p>横向比较试点院校招生计划与专业课差异。</p><b>查看对比 →</b></Link>
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

function SchoolLogo({ schoolSlug, large = false }) {
  const theme = schoolTheme[schoolSlug]
  return <span className={`school-logo school-logo-${schoolSlug}${large ? ' large' : ''}`}>
    <img src={theme.logo} alt={`${theme.short}校徽`} />
  </span>
}

function AnhuiHub() {
  return <div className="page-wrap" id="school-filter">
    <div className="crumb"><Link to="/">首页</Link><span>/</span>安徽专区</div>
    <section className="page-hero compact"><div><span className="eyebrow">安徽省 · 普通高校专升本</span><h1>选择你的目标院校</h1><p>先看清报考条件与考试科目，再开始对应学习。当前基于 2026 年公开资料。</p></div><div className="filter-box"><label>考纲年份<select defaultValue="2026"><option>2026</option><option disabled>2027（待发布）</option></select></label><label>本科专业<select defaultValue="computer"><option value="computer">计算机科学与技术</option></select></label></div></section>
    <section className="exam-structure"><div><span>安徽考试结构</span><strong>2 门公共课</strong><b>+</b><strong>2 门专业课</strong></div><p>公共课由省考试院组织；专业课由招生院校组织，因此同一专业在不同院校的科目可能不同。</p></section>
    <div className="section-heading"><div><span className="section-number">3 所</span><h2>已整理院校</h2></div><Link to="/anhui/2026/computer-science">查看横向对比 →</Link></div>
    <section className="school-grid">{schools.map((school) => <SchoolCard key={school.school_slug} school={school} />)}</section>
    <div className="local-tip"><span>ⓘ</span><p><strong>你的进度只保存在当前浏览器</strong><br/>不需要注册即可使用；清除浏览器数据或更换设备后，进度与收藏不会同步。</p></div>
  </div>
}

function SchoolCard({ school }) {
  const theme = schoolTheme[school.school_slug]
  return <article className="school-card" style={{ '--school-color': theme.color }}>
    <div className="school-head"><SchoolLogo schoolSlug={school.school_slug} /><div><span className="type-tag">{school.school_type}</span><h3>{school.school_name}</h3></div></div>
    <SubjectTags school={school} />
    <dl><div><dt>培养地点</dt><dd>{school.sites.join(' / ')}</dd></div><div><dt>招生范围</dt><dd>{school.eligible_major_categories}</dd></div><div><dt>计划数</dt><dd>{school.totalPlan} 人</dd></div></dl>
    <div className="school-card-foot"><span>核验于 {school.verified_at}</span><Link onClick={() => saveLastSelection({ year: 2026, major: 'computer-science', school: school.school_slug })} to={`/anhui/2026/computer-science/${school.school_slug}`}>打开学习地图 →</Link></div>
  </article>
}

function Compare() {
  return <div className="page-wrap">
    <div className="crumb"><Link to="/">首页</Link><span>/</span><Link to="/anhui">安徽专区</Link><span>/</span>院校对比</div>
    <section className="page-hero"><div><span className="eyebrow">2026 · 计算机科学与技术</span><h1>三所院校，一页看清</h1><p>专业课差异是备考路线的关键。先选择院校，再按该校考纲学习。</p></div></section>
    <div className="compare-scroll" tabIndex="0" aria-label="院校对比表，可横向滚动"><table><thead><tr><th>对比项</th>{schools.map((s) => <th key={s.school_slug}><span className="compare-school"><SchoolLogo schoolSlug={s.school_slug} /><span>{s.school_name}<small>{s.school_type}</small></span></span></th>)}</tr></thead><tbody>
      <tr><th>培养地点</th>{schools.map((s) => <td key={s.school_slug}>{s.sites.map(x => <span className="table-line" key={x}>{x}</span>)}</td>)}</tr>
      <tr><th>招生范围</th>{schools.map((s) => <td key={s.school_slug}>{s.eligible_major_categories}</td>)}</tr>
      <tr><th>招生计划</th>{schools.map((s) => <td key={s.school_slug}><strong>{s.totalPlan}</strong> 人</td>)}</tr>
      <tr><th>公共课</th>{schools.map((s) => <td key={s.school_slug}>{s.publicSubjects.join(' · ')}</td>)}</tr>
      <tr className="highlight-row"><th>专业课</th>{schools.map((s) => <td key={s.school_slug}>{s.professionalSubjects.map(x => <span className="table-subject" key={x}>{x}</span>)}</td>)}</tr>
      <tr><th>官方资料</th>{schools.map((s) => <td key={s.school_slug}><a href={s.charter_url} target="_blank" rel="noreferrer">招生章程 ↗</a><a href={s.syllabus_url} target="_blank" rel="noreferrer">考试大纲 ↗</a><small>{s.source_status} · {s.verified_at}</small></td>)}</tr>
      <tr><th>学习入口</th>{schools.map((s) => <td key={s.school_slug}><Link className="small-primary" to={`/anhui/2026/computer-science/${s.school_slug}`}>查看学习地图</Link></td>)}</tr>
    </tbody></table></div>
  </div>
}

function ResourceCard({ resource, favorites, toggleFavorite }) {
  const saved = favorites.includes(resource.resource_id)
  return <article className="resource-card"><div className="resource-top"><span className={resource.platform.includes('哔哩') ? 'platform bili' : 'platform mooc'}>{resource.platform}</span><button onClick={() => toggleFavorite(resource.resource_id)} aria-label={saved ? '取消收藏' : '收藏资源'} aria-pressed={saved}>{saved ? '★' : '☆'}</button></div><h4>{resource.title}</h4><p className="creator">{resource.creator}</p><div className="resource-meta"><span>{resource.difficulty}</span><span>{resource.duration_text}</span><span>{resource.resource_type}</span></div><p>{resource.recommendation_reason}</p><a href={resource.url} target="_blank" rel="noreferrer">前往官方平台学习 ↗</a></article>
}

function LearningMap({ favorites, toggleFavorite, resources }) {
  const { schoolSlug } = useParams()
  const school = schools.find((item) => item.school_slug === schoolSlug)
  const [progress, setProgress] = useState(getProgress)
  const [activeSubject, setActiveSubject] = useState('advanced-math')
  if (!school) return <Navigate to="/anhui" replace />
  const points = schoolSyllabus(schoolSlug)
  const subjectOrder = ['advanced-math', 'english', ...Object.keys(subjectNames).filter((key) => school.professionalSubjects.includes(subjectNames[key]))]
  const shownSubjects = [activeSubject]
  const completed = points.filter((point) => progress[progressKey(schoolSlug, point.point_id)]).length
  const percent = Math.round(completed / points.length * 100)

  function togglePoint(pointId) {
    const key = progressKey(schoolSlug, pointId)
    const next = { ...progress, [key]: !progress[key] }
    setProgress(next); saveProgress(next)
  }

  return <div className="page-wrap learning-page">
    <div className="crumb"><Link to="/">首页</Link><span>/</span><Link to="/anhui">安徽专区</Link><span>/</span>{school.school_name}</div>
    <section className="school-title" style={{ '--school-color': schoolTheme[schoolSlug].color }}><SchoolLogo schoolSlug={schoolSlug} large /><div><span className="type-tag">{school.school_type} · 2026</span><h1>{school.school_name}</h1><p>计算机科学与技术 · {school.sites.join(' / ')}</p></div><div className="official-links"><a href={school.charter_url} target="_blank" rel="noreferrer">招生章程 ↗</a><a href={school.syllabus_url} target="_blank" rel="noreferrer">官方考纲 ↗</a></div></section>
    <SubjectTags school={school} />
    <section className="progress-panel"><div className="progress-copy"><span>学习进度</span><strong>{completed} / {points.length} 个知识点</strong></div><div className="progress-track"><span style={{ width: `${percent}%` }} /></div><b>{percent}%</b></section>
    <div className="subject-tabs" role="tablist" aria-label="选择考试科目">{subjectOrder.map((slug) => <button type="button" role="tab" aria-selected={activeSubject === slug} className={activeSubject === slug ? 'active' : ''} onClick={() => setActiveSubject(slug)} key={slug}>{subjectNames[slug]}</button>)}</div>
    <div className="syllabus-column">{shownSubjects.map((subjectSlug) => {
      const subjectPoints = points.filter((p) => p.subject_slug === subjectSlug)
      const sections = [...new Set(subjectPoints.map((p) => p.section_name))]
      return <section className="subject-block" id={subjectSlug} key={subjectSlug}><div className="subject-title"><div><span>{school.professionalSubjects.includes(subjectNames[subjectSlug]) ? '专业课' : '公共课'}</span><h2>{subjectNames[subjectSlug]}</h2></div><small>{subjectPoints.length} 个知识点</small></div>{sections.map((section) => <div className="chapter" key={section}><h3>{section}</h3>{subjectPoints.filter((p) => p.section_name === section).map((point) => {
        const done = !!progress[progressKey(schoolSlug, point.point_id)]
        const linked = resourcesForTopic(point.canonical_topic, resources)
        return <div className={`knowledge-item ${done ? 'done' : ''}`} key={point.point_id}><div className="knowledge-heading"><label><input type="checkbox" checked={done} onChange={() => togglePoint(point.point_id)} /><span className="checkmark">✓</span><b>{point.point_title}</b></label><small>{linked.length} 个推荐</small></div><div className="resource-row">{linked.length ? linked.map((r) => <ResourceCard key={r.resource_id} resource={r} favorites={favorites} toggleFavorite={toggleFavorite} />) : <p className="empty-resource">资源整理中，建议先对照官方考纲和参考书学习。</p>}</div></div>})}</div>)}</section>
    })}</div>
    <div className="source-date">资料状态：{school.source_status} · 最后人工核验 {school.verified_at}。如与官方最新通知不一致，请以官方为准。</div>
  </div>
}

function Sources() {
  return <div className="page-wrap sources-page"><div className="crumb"><Link to="/">首页</Link><span>/</span>资料来源</div><section className="page-hero"><div><span className="eyebrow">透明 · 可核验</span><h1>每条考试信息，都能回到官方来源</h1><p>我们优先采用正式招生章程；拟招生通知只作线索，不覆盖正式文件。</p></div></section><section className="source-rules"><article><b>01</b><h3>正式文件优先</h3><p>正式招生章程高于拟招生方案，后发布的官方更正高于旧版本。</p></article><article><b>02</b><h3>按年份隔离</h3><p>所有招生方案和知识点都标注适用年份，不将往年内容冒充最新考纲。</p></article><article><b>03</b><h3>人工复核</h3><p>展示最后核验日期；进入下一招生年度后逐校重新检查。</p></article></section><section className="source-list"><h2>2026 年试点院校</h2>{schools.map((school) => <article key={school.school_slug}><SchoolLogo schoolSlug={school.school_slug} /><div><h3>{school.school_name}</h3><p>{school.source_status} · 核验于 {school.verified_at}</p></div><div><a href={school.charter_url} target="_blank" rel="noreferrer">正式招生章程 ↗</a><a href={school.syllabus_url} target="_blank" rel="noreferrer">专业课考纲 ↗</a></div></article>)}</section><section className="disclaimer"><h2>免责声明</h2><p>“升本导航”不是安徽省教育招生考试院或任何招生院校的官方网站，不提供报名、录取和成绩查询服务。课程推荐为编辑整理，不代表招生单位意见，也不保证单个课程覆盖全部考试内容。报名前务必打开官方来源复核。</p></section></div>
}

function NotFound() { return <div className="page-wrap not-found"><span>404</span><h1>这个页面还没整理好</h1><p>回到安徽专区，继续选择院校和学习路线。</p><Link className="primary-btn" to="/anhui">返回安徽专区</Link></div> }

export default function App() {
  const [favorites, setFavorites] = useState(getFavorites)
  const content = useContent()
  function toggleFavorite(id) { const next = favorites.includes(id) ? favorites.filter((x) => x !== id) : [...favorites, id]; setFavorites(next); saveFavorites(next) }
  return <BrowserRouter><Routes>
    <Route path="/admin/login" element={<AdminLogin />} />
    <Route path="/admin/reset-password" element={<AdminResetPassword />} />
    <Route path="/admin" element={<AdminDashboard />} />
    <Route path="*" element={<Layout favoritesCount={favorites.length} announcement={content.announcement}><Routes><Route path="/" element={<Home resources={content.resources} />} /><Route path="/anhui" element={<AnhuiHub />} /><Route path="/anhui/2026/computer-science" element={<Compare />} /><Route path="/anhui/2026/computer-science/:schoolSlug" element={<LearningMap favorites={favorites} toggleFavorite={toggleFavorite} resources={content.resources} />} /><Route path="/sources" element={<Sources />} /><Route path="*" element={<NotFound />} /></Routes></Layout>} />
  </Routes></BrowserRouter>
}
