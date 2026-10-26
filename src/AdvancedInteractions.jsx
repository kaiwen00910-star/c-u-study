import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { comparePath, schoolPath } from './contentScope'
import { parseTrainingSiteLocations } from './mapLinks'

const AdvancedInteractionsContext = createContext(null)

const asList = (value) => Array.isArray(value) ? value : String(value || '').split('|').filter(Boolean)
const unique = (items) => [...new Set(items.filter(Boolean))]

function focusableElements(container) {
  if (!container) return []
  return [...container.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
    .filter((element) => !element.hasAttribute('hidden') && element.getAttribute('aria-hidden') !== 'true')
}

export function AccessibleDialog({ open, onClose, title, description, children, className = '', initialFocusRef }) {
  const dialogRef = useRef(null)
  const closeButtonRef = useRef(null)
  const returnFocusRef = useRef(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    if (!open) return undefined
    returnFocusRef.current = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusTimer = window.setTimeout(() => {
      const focusTarget = initialFocusRef?.current || closeButtonRef.current
      focusTarget?.focus()
    }, 0)

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab') return
      const focusable = focusableElements(dialogRef.current)
      if (!focusable.length) {
        event.preventDefault()
        dialogRef.current?.focus()
        return
      }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      window.clearTimeout(focusTimer)
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      returnFocusRef.current?.focus?.()
    }
  }, [initialFocusRef, onClose, open])

  if (!open) return null
  return createPortal(
    <div className="interaction-dialog-backdrop" onClick={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className={`interaction-dialog ${className}`} ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined} tabIndex="-1">
        <header className="interaction-dialog-header">
          <div>
            <h2 id={titleId}>{title}</h2>
            {description && <p id={descriptionId}>{description}</p>}
          </div>
          <button ref={closeButtonRef} className="interaction-dialog-close" type="button" onClick={onClose} aria-label={`关闭${title}弹窗`}>×</button>
        </header>
        {children}
      </section>
    </div>,
    document.body,
  )
}

function SchoolMark({ school }) {
  const [failed, setFailed] = useState(false)
  const shortName = school?.short_name || school?.school_name?.slice(0, 2) || '院校'
  return <span className="preview-school-mark">
    {school?.logo_url && !failed
      ? <img src={school.logo_url} alt={`${school.school_name}校徽`} onError={() => setFailed(true)} />
      : <b>{shortName}</b>}
  </span>
}

function schoolSearchItems(schools, scope) {
  return schools.flatMap((school) => {
    const schoolItem = {
      id: `school:${school.school_slug}`,
      kind: 'school',
      label: '院校',
      title: school.school_name,
      detail: `${school.school_type} · ${(school.programNames || []).length} 个招生专业 · ${school.totalPlan} 人`,
      haystack: [school.school_name, school.short_name, school.school_type, ...(school.programNames || []), ...(school.publicSubjects || []), ...(school.professionalSubjects || []), ...(school.sites || [])].join(' '),
      href: schoolPath(scope, school.school_slug),
      school,
    }
    const offeringItems = (school.offerings || []).flatMap((offering) => asList(offering.programNames || offering.program_names).map((program, index) => ({
      id: `offering:${offering.offering_id}:${index}`,
      kind: 'offering',
      label: '专业',
      title: program,
      detail: `${school.school_name} · ${asList(offering.publicSubjects || offering.public_subjects).join(' + ')} · ${offering.training_site}`,
      haystack: [school.school_name, program, offering.training_site, ...asList(offering.publicSubjects || offering.public_subjects), ...asList(offering.professionalSubjects || offering.professional_subjects)].join(' '),
      href: schoolPath(scope, school.school_slug),
      school,
    })))
    return [schoolItem, ...offeringItems]
  })
}

function GlobalSearchDialog({ open, onClose, onPreview, schools, scope }) {
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const items = useMemo(() => schoolSearchItems(schools, scope), [schools, scope])
  const matches = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('zh-CN')
    if (!normalized) return items.filter((item) => item.kind === 'school').slice(0, 6)
    return items.map((item, index) => {
      const title = item.title.toLocaleLowerCase('zh-CN')
      const searchable = `${item.title} ${item.haystack}`.toLocaleLowerCase('zh-CN')
      const rank = title === normalized ? 0 : title.startsWith(normalized) ? 1 : title.includes(normalized) ? 2 : searchable.includes(normalized) ? 3 : -1
      return { item, index, rank }
    }).filter(({ rank }) => rank >= 0).sort((a, b) => a.rank - b.rank || a.index - b.index).slice(0, 10).map(({ item }) => item)
  }, [items, query])

  useEffect(() => {
    if (!open) return
    setQuery('')
    setActiveIndex(0)
  }, [open])
  useEffect(() => { setActiveIndex(0) }, [query])

  function selectResult(item) {
    if (!item) return
    if (item.kind === 'school') {
      onPreview(item.school)
      return
    }
    onClose()
    navigate(item.href)
  }

  function handleKeyDown(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index) => matches.length ? (index + 1) % matches.length : 0)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => matches.length ? (index - 1 + matches.length) % matches.length : 0)
    } else if (event.key === 'Enter' && matches.length) {
      event.preventDefault()
      selectResult(matches[activeIndex])
    }
  }

  return <AccessibleDialog open={open} onClose={onClose} title="全站快速搜索" description="搜索院校、招生专业、考试科目或培养地点。" className="global-search-dialog" initialFocusRef={inputRef}>
    <div className="global-search-field">
      <span aria-hidden="true">⌕</span>
      <input ref={inputRef} type="search" value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={handleKeyDown} role="combobox" aria-expanded="true" aria-controls="global-search-results" aria-activedescendant={matches[activeIndex]?.id} aria-autocomplete="list" placeholder="例如：安徽大学、计算机科学、高等数学、蜀山校区" />
      <kbd>Esc</kbd>
    </div>
    <div className="global-search-status" role="status">{query.trim() ? `找到 ${matches.length} 条相关结果` : '常用院校入口'}</div>
    <div className="global-search-results" id="global-search-results" role="listbox" aria-label="快速搜索结果">
      {matches.map((item, index) => <button type="button" role="option" aria-selected={index === activeIndex} id={item.id} key={item.id} className={index === activeIndex ? 'is-active' : ''} onMouseEnter={() => setActiveIndex(index)} onClick={() => selectResult(item)}>
        <span className="global-search-kind">{item.label}</span>
        <span><strong>{item.title}</strong><small>{item.detail}</small></span>
        <span aria-hidden="true">{item.kind === 'school' ? '预览' : '打开'} →</span>
      </button>)}
      {!matches.length && <div className="global-search-empty"><strong>没有找到匹配内容</strong><span>可缩短关键词，或搜索院校名称、专业、科目与校区。</span></div>}
    </div>
    <footer className="global-search-help"><span><kbd>↑</kbd><kbd>↓</kbd> 选择</span><span><kbd>Enter</kbd> 打开</span><span>院校结果先显示快速预览</span></footer>
  </AccessibleDialog>
}

function SchoolPreviewDialog({ school, scope, onClose }) {
  if (!school) return null
  const programs = unique(school.programNames || (school.offerings || []).flatMap((item) => asList(item.programNames || item.program_names)))
  const sites = unique((school.sites || []).flatMap((site) => parseTrainingSiteLocations(site).map((location) => location.label)))
  const compareHref = programs[0] ? `${comparePath(scope)}?program=${encodeURIComponent(programs[0])}` : comparePath(scope)
  return <AccessibleDialog open={Boolean(school)} onClose={onClose} title={`${school.school_name}快速预览`} description="先查看招生概况，再决定是否进入完整专业地图。" className="school-preview-dialog">
    <div className="school-preview-identity"><SchoolMark school={school} /><div><span>{school.school_type}</span><h3>{school.school_name}</h3><small>核验于 {school.verified_at}</small></div></div>
    <div className="school-preview-metrics" aria-label="院校招生概况">
      <div><strong>{programs.length}</strong><span>招生专业</span></div>
      <div><strong>{(school.offerings || []).length}</strong><span>招生方案</span></div>
      <div><strong>{school.totalPlan}</strong><span>计划人数</span></div>
    </div>
    <section className="school-preview-section"><h4>招生专业</h4><div className="school-preview-tags">{programs.map((program) => <span key={program}>{program}</span>)}</div></section>
    {!!sites.length && <section className="school-preview-section"><h4>培养地点</h4><ul>{sites.map((site) => <li key={site}>{site}</li>)}</ul></section>}
    <section className="school-preview-section school-preview-subjects"><h4>考试科目概览</h4><p><span>公共课</span>{(school.publicSubjects || []).join('、')}</p><p><span>专业课</span>{(school.professionalSubjects || []).join('、')}</p></section>
    <div className="school-preview-actions">
      <Link className="primary-btn" to={schoolPath(scope, school.school_slug)} onClick={onClose}>进入专业地图</Link>
      <Link className="secondary-btn" to={compareHref} onClick={onClose}>进入院校对比</Link>
    </div>
  </AccessibleDialog>
}

export function AdvancedInteractionsProvider({ children, schools, scope }) {
  const location = useLocation()
  const [overlay, setOverlay] = useState(null)
  const [previewSchool, setPreviewSchool] = useState(null)
  const closeOverlay = useCallback(() => setOverlay(null), [])
  const openGlobalSearch = useCallback(() => setOverlay('search'), [])
  const openSchoolPreview = useCallback((school) => {
    setPreviewSchool(school)
    setOverlay('school-preview')
  }, [])

  useEffect(() => { setOverlay(null) }, [location.pathname])
  useEffect(() => {
    function openFromShortcut(event) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase('en-US') === 'k') {
        event.preventDefault()
        setOverlay('search')
      }
    }
    document.addEventListener('keydown', openFromShortcut)
    return () => document.removeEventListener('keydown', openFromShortcut)
  }, [])

  const value = useMemo(() => ({ openGlobalSearch, openSchoolPreview }), [openGlobalSearch, openSchoolPreview])
  return <AdvancedInteractionsContext.Provider value={value}>
    {children}
    <GlobalSearchDialog open={overlay === 'search'} onClose={closeOverlay} onPreview={openSchoolPreview} schools={schools} scope={scope} />
    <SchoolPreviewDialog school={overlay === 'school-preview' ? previewSchool : null} scope={scope} onClose={closeOverlay} />
  </AdvancedInteractionsContext.Provider>
}

function useAdvancedInteractions() {
  return useContext(AdvancedInteractionsContext)
}

export function GlobalSearchTrigger() {
  const { openGlobalSearch } = useAdvancedInteractions() || {}
  if (!openGlobalSearch) return null
  return <button className="global-search-trigger" type="button" onClick={openGlobalSearch} aria-keyshortcuts="Control+K Meta+K" aria-haspopup="dialog" aria-label="打开全站快速搜索（快捷键 Ctrl 或 Command 加 K）">
    <span aria-hidden="true">⌕</span><span>快速搜索</span><kbd>Ctrl K</kbd>
  </button>
}

export function SchoolQuickPreviewButton({ school }) {
  const { openSchoolPreview } = useAdvancedInteractions() || {}
  if (!openSchoolPreview) return null
  return <button className="school-quick-preview" type="button" onClick={() => openSchoolPreview(school)} aria-haspopup="dialog" aria-label={`快速预览${school.school_name}`}>快速预览</button>
}
