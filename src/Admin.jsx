import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { ADMIN_EMAIL, validateAnnouncement, validateResource } from './resourceValidation'
import { normalizeAcademicSchool, normalizeOffering, normalizeResource, normalizeSyllabusPoint, supabase, supabaseConfigured } from './supabase'
import { announcementStatus } from './announcements'
import { mapAvailableSchoolSlugs } from './data'
import { DEFAULT_SCOPE } from './contentScope'
import { ReviewDate } from './ReviewDate'
import { latestVerifiedDate } from './reviewFreshness'
import { canPublish, formatPublicationCheck, PUBLICATION_STATUS, publicationChecks } from './adminWorkflow'
import { applyPageMetadata } from './seo'
import {
  loadResourceAdminPage, loadSyllabusAdminPage, normalizeAdminPage,
  staleReviewLabel, totalAdminPages, isStaleReview, updateAdminSearchParams,
} from './adminPagination'

const emptyResource = {
  resource_id: '', topic_tags: [], title: '', platform: '哔哩哔哩', creator: '', url: '',
  resource_type: '系统课程', difficulty: '零基础', duration_text: '', recommendation_reason: '',
  priority: 1, verified_at: '', status: 'draft',
}
const emptyAnnouncement = { id: null, title: '', content: '', enabled: false, starts_at: '', ends_at: '' }
const emptyAcademicSchool = { school_id: '', school_slug: '', school_name: '', school_type: '公办', short_name: '', theme_color: '#1556a6', logo_url: '', active: true, has_study_map: false, sort_order: 1 }
const emptyOffering = { offering_id: '', year: 2026, province_slug: 'anhui', major_slug: 'computer-science', school_slug: '', training_site: '', eligible_major_categories: '', public_subjects: '高等数学|英语', professional_subjects: '', plan_count: 1, charter_url: '', syllabus_url: '', source_status: '等待新年度官方文件核验', verified_at: '', active: false, status: 'draft', sort_order: 1 }
const emptySyllabusPoint = { point_id: '', year: 2026, province_slug: 'anhui', major_slug: 'computer-science', school_slug: 'common', subject_slug: '', subject_name: '', section_order: 1, section_name: '', point_order: 1, point_title: '', canonical_topic: '', active: false, status: 'draft' }

function useAdminMeta() {
  const location = useLocation()
  useEffect(() => { applyPageMetadata(location.pathname) }, [location.pathname])
}

function PublicationBadge({ status }) {
  const config = PUBLICATION_STATUS[status] || PUBLICATION_STATUS.draft
  return <span className={`admin-status ${config.className}`}>{config.label}</span>
}

function useUnsavedWarning(dirty) {
  useEffect(() => {
    if (!dirty) return undefined
    const warn = (event) => { event.preventDefault(); event.returnValue = '' }
    const warnNavigation = (event) => {
      const link = event.target.closest?.('a')
      if (link?.getAttribute('href')?.startsWith('/admin') && !window.confirm('表单还有未保存修改，确定离开吗？')) event.preventDefault()
    }
    window.addEventListener('beforeunload', warn)
    document.addEventListener('click', warnNavigation, true)
    return () => { window.removeEventListener('beforeunload', warn); document.removeEventListener('click', warnNavigation, true) }
  }, [dirty])
}

function Message({ state }) {
  return state.text ? <p className={`admin-message ${state.type}`} role="status">{state.text}</p> : null
}

export function AdminLogin() {
  useAdminMeta()
  const [message, setMessage] = useState({ type: '', text: '' })
  const [sending, setSending] = useState(false)
  const [email, setEmail] = useState(ADMIN_EMAIL)
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (!supabase) return
    async function restoreAdminSession() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: membership } = await supabase.from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle()
      if (membership) navigate('/admin', { replace: true })
      else await supabase.auth.signOut()
    }
    restoreAdminSession()
  }, [navigate])

  async function login(event) {
    event.preventDefault()
    if (!supabase) return setMessage({ type: 'error', text: '后台服务尚未配置，请先完成 Supabase 环境变量。' })
    setSending(true); setMessage({ type: '', text: '' })
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
    if (error) { setSending(false); return setMessage({ type: 'error', text: '登录失败，请检查凭据或稍后再试。' }) }
    const { data: membership, error: membershipError } = await supabase.from('admin_users').select('user_id').eq('user_id', data.user.id).maybeSingle()
    if (membershipError || !membership) {
      await supabase.auth.signOut()
      setSending(false)
      return setMessage({ type: 'error', text: '该账号不在管理员成员表中，无法进入后台。' })
    }
    setSending(false)
    navigate('/admin', { replace: true })
  }

  async function resetPassword() {
    if (!supabase) return setMessage({ type: 'error', text: '后台服务尚未配置，请先完成 Supabase 环境变量。' })
    setSending(true); setMessage({ type: '', text: '' })
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    })
    setSending(false)
    setMessage(error
      ? { type: 'error', text: `发送失败：${error.message}` }
      : { type: 'success', text: '如果该邮箱存在且允许重置，将收到密码邮件。' })
  }

  return <div className="admin-login-page"><section className="admin-login-card">
    <span className="eyebrow">升本导航 · 管理后台</span><h1>管理员登录</h1>
    <p>后台仅供站长维护院校资料（含校徽）、招生计划、考纲知识点、学习资源和首页公告。请使用管理员邮箱和密码登录。</p>
    <form onSubmit={login}><label>管理员邮箱<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="username" /></label><label>密码<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength="8" required autoComplete="current-password" /></label><button className="admin-primary" disabled={sending}>{sending ? '请稍候…' : '登录后台'}</button><button type="button" onClick={resetPassword} disabled={sending}>首次设置或忘记密码</button></form>
    {!supabaseConfigured && <p className="admin-message error">当前部署尚未配置 Supabase。</p>}
    <Message state={message} /><a href="/">← 返回网站首页</a>
  </section></div>
}

export function AdminResetPassword() {
  useAdminMeta()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState({ type: '', text: '' })
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  async function savePassword(event) {
    event.preventDefault()
    if (!supabase) return setMessage({ type: 'error', text: '后台服务尚未配置。' })
    if (password.length < 8) return setMessage({ type: 'error', text: '密码至少需要 8 个字符。' })
    if (password !== confirmPassword) return setMessage({ type: 'error', text: '两次输入的密码不一致。' })
    setSaving(true); setMessage({ type: '', text: '' })
    const { error } = await supabase.auth.updateUser({ password })
    setSaving(false)
    if (error) return setMessage({ type: 'error', text: `密码设置失败：${error.message}` })
    setMessage({ type: 'success', text: '密码设置成功，正在进入后台…' })
    window.setTimeout(() => navigate('/admin', { replace: true }), 600)
  }

  return <div className="admin-login-page"><section className="admin-login-card">
    <span className="eyebrow">升本导航 · 管理后台</span><h1>设置新密码</h1>
    <p>请设置至少 8 个字符的密码。密码只会交给 Supabase 验证，不会保存到网站代码。</p>
    <form onSubmit={savePassword}><label>新密码<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength="8" required autoComplete="new-password" /></label><label>再次输入<input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength="8" required autoComplete="new-password" /></label><button className="admin-primary" disabled={saving}>{saving ? '保存中…' : '保存新密码'}</button></form>
    <Message state={message} /><a href="/admin/login">← 返回登录页</a>
  </section></div>
}

function ResourceEditor({ initial, onClose, onSaved, topics }) {
  const preparedInitial = initial ? { ...initial, topic_tags: [...initial.tags] } : { ...emptyResource, topic_tags: [] }
  const [form, setForm] = useState(preparedInitial)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [saving, setSaving] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const isEditing = Boolean(initial && !initial.duplicate)
  const dirty = JSON.stringify(form) !== JSON.stringify(preparedInitial)
  useUnsavedWarning(dirty)
  const close = () => { if (!dirty || window.confirm('表单还有未保存修改，确定关闭吗？')) onClose() }
  const set = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  function toggleTag(tag) {
    set('topic_tags', form.topic_tags.includes(tag) ? form.topic_tags.filter((item) => item !== tag) : [...form.topic_tags, tag])
  }

  async function save(event) {
    event.preventDefault()
    const validTopics = new Set(topics.map(([value]) => value))
    const errors = validateResource(form, validTopics)
    if (errors.length) return setMessage({ type: 'error', text: errors.join('；') })
    setSaving(true); setMessage({ type: '', text: '' })
    const payload = { ...form, priority: Number(form.priority), topic_tags: form.topic_tags, status: 'draft' }
    delete payload.tags; delete payload.created_at; delete payload.updated_at; delete payload.duplicate
    const query = isEditing
      ? supabase.from('resources').update(payload).eq('resource_id', initial.resource_id).select().single()
      : supabase.from('resources').insert(payload).select().single()
    const { data, error } = await query
    setSaving(false)
    if (error) return setMessage({ type: 'error', text: `保存失败：${error.message}` })
    onSaved(normalizeResource(data)); setMessage({ type: 'success', text: '资源已保存为草稿，发布前不会进入前台。' })
  }

  return <div className="admin-modal" role="dialog" aria-modal="true" aria-label={isEditing ? '编辑资源' : '新增资源'}><form className="admin-editor" onSubmit={save}>
    <header><div><span className="eyebrow">资源编辑</span><h2>{isEditing ? '编辑学习资源' : '新增学习资源'}</h2></div><button type="button" onClick={close} aria-label="关闭">×</button></header>
    <div className="admin-form-grid">
      <label>资源 ID<input value={form.resource_id} disabled={isEditing} onChange={(e) => set('resource_id', e.target.value.trim())} placeholder="res-c-3" /></label>
      <label>标题<input value={form.title} onChange={(e) => set('title', e.target.value)} /></label>
      <label>平台<select value={form.platform} onChange={(e) => set('platform', e.target.value)}><option>哔哩哔哩</option><option>中国大学MOOC</option><option>其他平台</option></select></label>
      <label>UP 主 / 创建者<input value={form.creator} onChange={(e) => set('creator', e.target.value)} /></label>
      <label className="wide">具体课程链接<input value={form.url} onChange={(e) => set('url', e.target.value.trim())} placeholder="https://..." /><a href={form.url || undefined} target="_blank" rel="noreferrer">打开链接检查 ↗</a></label>
      <label>资源类型<input value={form.resource_type} onChange={(e) => set('resource_type', e.target.value)} /></label>
      <label>难度<input value={form.difficulty} onChange={(e) => set('difficulty', e.target.value)} /></label>
      <label>时长<input value={form.duration_text} onChange={(e) => set('duration_text', e.target.value)} /></label>
      <label>优先级<input type="number" min="1" value={form.priority} onChange={(e) => set('priority', e.target.value)} /></label>
      <label>核验日期<input type="date" value={form.verified_at} onChange={(e) => set('verified_at', e.target.value)} /></label>
      <label>保存状态<input value="草稿（发布需在列表中确认）" readOnly /></label>
      <label className="wide">推荐理由<textarea value={form.recommendation_reason} onChange={(e) => set('recommendation_reason', e.target.value)} rows="3" /></label>
    </div>
    <fieldset><legend>对应知识点</legend><div className="admin-topic-grid">{topics.map(([value, label]) => <label key={value}><input type="checkbox" checked={form.topic_tags.includes(value)} onChange={() => toggleTag(value)} /><span>{label}</span></label>)}</div></fieldset>
    {previewing && <section className="admin-inline-preview"><h3>{form.title || '未填写标题'}</h3><p>{form.creator || '未填写创建者'} · {form.platform}</p><p>{form.recommendation_reason || '未填写推荐理由'}</p><small>此预览只在后台渲染，不会通过公开接口读取草稿。</small></section>}
    <Message state={message} /><footer><button type="button" onClick={close}>取消</button><button type="button" onClick={() => setPreviewing((value) => !value)}>{previewing ? '关闭预览' : '后台预览'}</button><button className="admin-primary" disabled={saving}>{saving ? '保存中…' : '保存草稿'}</button></footer>
  </form></div>
}

function AnnouncementsPanel({ announcements, setAnnouncements }) {
  const [selectedId, setSelectedId] = useState(null)
  const selected = announcements.find((item) => item.id === selectedId)
  const [form, setForm] = useState(emptyAnnouncement)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [saving, setSaving] = useState(false)
  useEffect(() => { setForm(selected ? { ...selected } : { ...emptyAnnouncement }) }, [selectedId, selected])
  const announcementBaseline = selected ? { ...selected } : { ...emptyAnnouncement }
  useUnsavedWarning(JSON.stringify(form) !== JSON.stringify(announcementBaseline))
  const set = (field, value) => setForm((current) => ({ ...current, [field]: value }))
  const localDate = (value) => value ? new Date(value).toISOString().slice(0, 16) : ''

  async function save(event) {
    event.preventDefault()
    const errors = validateAnnouncement(form)
    if (errors.length) return setMessage({ type: 'error', text: errors.join('；') })
    setSaving(true)
    const payload = { title: form.title.trim(), content: form.content.trim(), enabled: form.enabled, starts_at: form.starts_at || null, ends_at: form.ends_at || null }
    const query = form.id ? supabase.from('announcements').update(payload).eq('id', form.id).select().single() : supabase.from('announcements').insert(payload).select().single()
    const { data, error } = await query
    setSaving(false)
    if (error) return setMessage({ type: 'error', text: `保存失败：${error.message}` })
    setAnnouncements((current) => [data, ...current.filter((item) => item.id !== data.id)].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)))
    setSelectedId(data.id); setMessage({ type: 'success', text: '公告已保存；系统会按时间范围计算真实状态。' })
  }

  return <section className="admin-panel"><div className="admin-panel-title"><div><span className="eyebrow">首页内容</span><h2>顶部公告栏</h2><p>启用的公告时间范围不可重叠，前台任一时刻最多展示一条。</p></div><button className="admin-primary" type="button" onClick={() => { setSelectedId(null); setForm({ ...emptyAnnouncement }); setMessage({ type: '', text: '' }) }}>＋ 新建草稿</button></div>
    <div className="admin-table-wrap announcement-list"><table className="admin-table"><thead><tr><th>标题</th><th>状态</th><th>时间范围</th><th>更新时间</th><th>操作</th></tr></thead><tbody>{announcements.map((item) => { const status = announcementStatus(item); return <tr key={item.id}><td><strong>{item.title}</strong></td><td><span className={`admin-status ${status.key}`}>{status.label}</span></td><td><small>{item.starts_at ? new Date(item.starts_at).toLocaleString('zh-CN') : '立即'} — {item.ends_at ? new Date(item.ends_at).toLocaleString('zh-CN') : '长期'}</small></td><td><small>{new Date(item.updated_at).toLocaleString('zh-CN')}</small></td><td><button type="button" onClick={() => setSelectedId(item.id)}>编辑</button></td></tr> })}</tbody></table>{!announcements.length && <p className="admin-empty">尚无公告，请先新建草稿。</p>}</div>
    <form className="announcement-form" onSubmit={save}><h3>{form.id ? '编辑公告' : '新建公告'}</h3><label>公告标题<input value={form.title} onChange={(e) => set('title', e.target.value)} /></label><label>公告内容<textarea rows="4" value={form.content} onChange={(e) => set('content', e.target.value)} /></label><div><label>开始时间<input type="datetime-local" value={localDate(form.starts_at)} onChange={(e) => set('starts_at', e.target.value ? new Date(e.target.value).toISOString() : '')} /></label><label>结束时间<input type="datetime-local" value={localDate(form.ends_at)} onChange={(e) => set('ends_at', e.target.value ? new Date(e.target.value).toISOString() : '')} /></label></div><label className="admin-switch"><input type="checkbox" checked={form.enabled} onChange={(e) => set('enabled', e.target.checked)} /><span>启用并按时间范围发布</span></label><Message state={message} /><button className="admin-primary" disabled={saving}>{saving ? '保存中…' : '保存公告'}</button></form>
  </section>
}

const schoolLogoTypes = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
}

function AcademicEditor({ kind, initial, schools, onClose, onSaved }) {
  const defaults = kind === 'school' ? emptyAcademicSchool : kind === 'offering' ? emptyOffering : emptySyllabusPoint
  const prepared = initial && kind === 'offering'
    ? { ...initial, public_subjects: (initial.public_subjects || initial.publicSubjects || []).join('|'), professional_subjects: (initial.professional_subjects || initial.professionalSubjects || []).join('|') }
    : initial
  const initialForm = prepared ? { ...prepared } : { ...defaults, school_slug: kind !== 'school' ? (schools[0]?.school_slug || defaults.school_slug) : defaults.school_slug }
  const [form, setForm] = useState(initialForm)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [saving, setSaving] = useState(false)
  const [logoFile, setLogoFile] = useState(null)
  const [previewing, setPreviewing] = useState(false)
  const editing = Boolean(initial)
  const dirty = JSON.stringify(form) !== JSON.stringify(initialForm) || Boolean(logoFile)
  useUnsavedWarning(dirty)
  const close = () => { if (!dirty || window.confirm('表单还有未保存修改，确定关闭吗？')) onClose() }
  const set = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  function chooseLogo(event) {
    const file = event.target.files?.[0]
    if (!file) return setLogoFile(null)
    if (!schoolLogoTypes[file.type]) {
      event.target.value = ''
      setLogoFile(null)
      return setMessage({ type: 'error', text: '校徽仅支持 PNG、JPG 或 WebP 图片。' })
    }
    if (file.size > 2 * 1024 * 1024) {
      event.target.value = ''
      setLogoFile(null)
      return setMessage({ type: 'error', text: '校徽图片不能超过 2MB。' })
    }
    setMessage({ type: '', text: '' })
    setLogoFile(file)
  }

  async function save(event) {
    event.preventDefault()
    setSaving(true); setMessage({ type: '', text: '' })
    let table; let key; let payload; let normalize
    if (kind === 'school') {
      table = 'academic_schools'; key = 'school_id'; normalize = normalizeAcademicSchool
      let logoUrl = form.logo_url || null
      if (logoFile) {
        const extension = schoolLogoTypes[logoFile.type]
        const objectPath = `${form.school_id}/logo-${Date.now()}.${extension}`
        const { error: uploadError } = await supabase.storage.from('school-logos').upload(objectPath, logoFile, {
          cacheControl: '31536000',
          contentType: logoFile.type,
        })
        if (uploadError) {
          setSaving(false)
          return setMessage({ type: 'error', text: `上传失败：${uploadError.message}` })
        }
        const { data: publicUrlData } = supabase.storage.from('school-logos').getPublicUrl(objectPath)
        logoUrl = publicUrlData.publicUrl
      }
      payload = {
        school_name: form.school_name.replace(/\s+/g, ' ').trim(),
        short_name: form.short_name.replace(/\s+/g, ' ').trim(),
        school_type: form.school_type.trim(),
        theme_color: form.theme_color,
        logo_url: logoUrl,
        active: form.active,
        sort_order: Number(form.sort_order),
      }
    } else if (kind === 'offering') {
      table = 'admission_offerings'; key = 'offering_id'; normalize = normalizeOffering
      payload = { ...form, year: Number(form.year), plan_count: Number(form.plan_count), sort_order: Number(form.sort_order), public_subjects: form.public_subjects.split('|').map((item) => item.trim()).filter(Boolean), professional_subjects: form.professional_subjects.split('|').map((item) => item.trim()).filter(Boolean), charter_url: form.charter_url || null, syllabus_url: form.syllabus_url || null, verified_at: form.verified_at || null, active: false, status: 'draft' }
      delete payload.publicSubjects; delete payload.professionalSubjects
    } else {
      table = 'syllabus_points'; key = 'point_id'; normalize = normalizeSyllabusPoint
      payload = { ...form, year: Number(form.year), section_order: Number(form.section_order), point_order: Number(form.point_order), active: false, status: 'draft' }
    }
    delete payload.created_at; delete payload.updated_at; delete payload.has_study_map
    let query
    if (editing) {
      query = supabase.from(table).update(payload).eq(key, initial[key])
      if (kind === 'point') query = query.eq('year', initial.year).eq('province_slug', initial.province_slug).eq('major_slug', initial.major_slug)
    } else {
      query = supabase.from(table).insert(payload)
    }
    const { data, error } = await query.select().single()
    setSaving(false)
    if (error) return setMessage({ type: 'error', text: `保存失败：${error.message}` })
    onSaved(kind, normalize(data)); onClose()
  }

  const title = kind === 'school' ? '院校资料' : kind === 'offering' ? '招生计划' : '考纲知识点'
  return <div className="admin-modal" role="dialog" aria-modal="true" aria-label={`编辑${title}`}><form className="admin-editor" onSubmit={save}>
    <header><div><span className="eyebrow">院校内容管理</span><h2>{editing ? `编辑${title}` : `新增${title}`}</h2></div><button type="button" onClick={close} aria-label="关闭">×</button></header>
    {kind === 'school' && <div className="admin-form-grid">
      <label>固定院校 ID<input value={form.school_id} disabled /></label>
      <label>系统路由标识<input value={form.school_slug} disabled /></label>
      <label>学校名称<input required value={form.school_name} onChange={(e) => set('school_name', e.target.value)} /></label>
      <label>简称<input required value={form.short_name} onChange={(e) => set('short_name', e.target.value)} /></label>
      <label>办学类型<input required value={form.school_type} onChange={(e) => set('school_type', e.target.value)} /></label>
      <label>主题色<input type="color" value={form.theme_color} onChange={(e) => set('theme_color', e.target.value)} /></label>
      <div className="admin-school-logo-field wide"><span className="admin-logo-preview">{form.logo_url ? <img src={form.logo_url} alt={`${form.school_name}校徽`} /> : <b>{form.short_name || '院校'}</b>}</span><label>校徽图片<span>{logoFile ? `已选择：${logoFile.name}` : form.logo_url ? '当前校徽已保存；选择新图片即可替换' : '选择图片后将在保存时上传'}</span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={chooseLogo} /></label></div>
      <label>排序<input type="number" min="1" required value={form.sort_order} onChange={(e) => set('sort_order', e.target.value)} /></label>
      <label className="admin-switch"><input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} /><span>前台启用</span></label>
      <p className="admin-system-note wide">学习地图：{form.has_study_map ? '已开放（招生计划与学校考纲均已配置）' : '未开放（系统将在两类数据齐全后自动启用）'}</p>
    </div>}
    {kind === 'offering' && <div className="admin-form-grid">
      <label>计划 ID<input required pattern="[a-z0-9-]+" value={form.offering_id} disabled={editing} onChange={(e) => set('offering_id', e.target.value.trim())} /></label>
      <label>院校<select required value={form.school_slug} onChange={(e) => set('school_slug', e.target.value)}>{schools.map((school) => <option key={school.school_slug} value={school.school_slug}>{school.school_name}</option>)}</select></label>
      <label>年份<input type="number" min="2020" max="2100" required value={form.year} onChange={(e) => set('year', e.target.value)} /></label>
      <label>计划人数<input type="number" min="1" required value={form.plan_count} onChange={(e) => set('plan_count', e.target.value)} /></label>
      <label className="wide">培养地点<input required value={form.training_site} onChange={(e) => set('training_site', e.target.value)} /></label>
      <label className="wide">招生范围<input required value={form.eligible_major_categories} onChange={(e) => set('eligible_major_categories', e.target.value)} /></label>
      <label>公共课（用 | 分隔）<input required value={form.public_subjects} onChange={(e) => set('public_subjects', e.target.value)} /></label>
      <label>专业课（用 | 分隔）<input required value={form.professional_subjects} onChange={(e) => set('professional_subjects', e.target.value)} /></label>
      <label className="wide">招生章程链接<input type="url" value={form.charter_url || ''} onChange={(e) => set('charter_url', e.target.value.trim())} />{form.charter_url && <a href={form.charter_url} target="_blank" rel="noreferrer">打开招生章程检查 ↗</a>}</label>
      <label className="wide">考试大纲链接<input type="url" value={form.syllabus_url || ''} onChange={(e) => set('syllabus_url', e.target.value.trim())} />{form.syllabus_url && <a href={form.syllabus_url} target="_blank" rel="noreferrer">打开考试大纲检查 ↗</a>}</label>
      <label>资料状态<input required value={form.source_status} onChange={(e) => set('source_status', e.target.value)} /></label>
      <label>核验日期<input type="date" value={form.verified_at || ''} onChange={(e) => set('verified_at', e.target.value)} /></label>
      <label>排序<input type="number" min="1" required value={form.sort_order} onChange={(e) => set('sort_order', e.target.value)} /></label>
      <p className="admin-system-note">保存后状态：草稿（发布需通过完整性检查）</p>
    </div>}
    {kind === 'point' && <div className="admin-form-grid">
      <label>知识点 ID<input required pattern="[a-z0-9-]+" value={form.point_id} disabled={editing} onChange={(e) => set('point_id', e.target.value.trim())} /></label>
      <label>适用院校<select value={form.school_slug} onChange={(e) => set('school_slug', e.target.value)}><option value="common">公共课（所有院校）</option>{schools.map((school) => <option key={school.school_slug} value={school.school_slug}>{school.school_name}</option>)}</select></label>
      <label>年份<input type="number" min="2020" max="2100" required value={form.year} onChange={(e) => set('year', e.target.value)} /></label>
      <label>省份标识<input required pattern="[a-z0-9-]+" value={form.province_slug} onChange={(e) => set('province_slug', e.target.value.trim())} /></label>
      <label>专业标识<input required pattern="[a-z0-9-]+" value={form.major_slug} onChange={(e) => set('major_slug', e.target.value.trim())} /></label>
      <label>科目标识<input required pattern="[a-z0-9-]+" value={form.subject_slug} onChange={(e) => set('subject_slug', e.target.value.trim())} /></label>
      <label>科目名称<input required value={form.subject_name} onChange={(e) => set('subject_name', e.target.value)} /></label>
      <label>章节顺序<input type="number" min="1" required value={form.section_order} onChange={(e) => set('section_order', e.target.value)} /></label>
      <label>章节名称<input required value={form.section_name} onChange={(e) => set('section_name', e.target.value)} /></label>
      <label>知识点顺序<input type="number" min="1" required value={form.point_order} onChange={(e) => set('point_order', e.target.value)} /></label>
      <label className="wide">知识点标题<input required value={form.point_title} onChange={(e) => set('point_title', e.target.value)} /></label>
      <label className="wide">资源匹配标签<input required pattern="[a-z0-9-]+" value={form.canonical_topic} onChange={(e) => set('canonical_topic', e.target.value.trim())} placeholder="c-language-pointer" /></label>
      <p className="admin-system-note">保存后状态：草稿（发布需通过完整性检查）</p>
    </div>}
    {previewing && kind !== 'school' && <section className="admin-inline-preview"><h3>{kind === 'offering' ? (schools.find((school) => school.school_slug === form.school_slug)?.school_name || form.school_slug) : form.point_title || '未填写知识点'}</h3><p>{kind === 'offering' ? `${form.year} · ${form.training_site || '未填写培养地点'} · ${form.plan_count} 人` : `${form.subject_name || '未填写科目'} · ${form.section_name || '未填写章节'}`}</p><small>此预览只使用当前后台表单，不会通过公开接口暴露草稿。</small></section>}
    <Message state={message} /><footer><button type="button" onClick={close}>取消</button>{kind !== 'school' && <button type="button" onClick={() => setPreviewing((value) => !value)}>{previewing ? '关闭预览' : '后台预览'}</button>}<button className="admin-primary" disabled={saving}>{saving ? '保存中…' : kind === 'school' ? '保存院校' : '保存草稿'}</button></footer>
  </form></div>
}

function AcademicDataPanel({ module, schools, setSchools, offerings, setOfferings, syllabusPoints, setSyllabusPoints }) {
  const [editor, setEditor] = useState(null)
  const [params, setParams] = useSearchParams()
  const [syllabusCount, setSyllabusCount] = useState(0)
  const [syllabusLoading, setSyllabusLoading] = useState(false)
  const [syllabusError, setSyllabusError] = useState('')
  const [syllabusRevision, setSyllabusRevision] = useState(0)
  const schoolNames = new Map(schools.map((school) => [school.school_slug, school.school_name]))
  const defaultMapSchools = mapAvailableSchoolSlugs(offerings, syllabusPoints, DEFAULT_SCOPE)
  const offeringSourcesForSchool = (schoolSlug, point) => offerings.filter((item) => item.school_slug === schoolSlug
    && (!point || (item.year === point.year && item.province_slug === point.province_slug && item.major_slug === point.major_slug)))
  const reviewItemsForPoint = (point) => point.school_slug === 'common'
    ? offerings.filter((item) => item.year === point.year && item.province_slug === point.province_slug && item.major_slug === point.major_slug)
    : offeringSourcesForSchool(point.school_slug, point)
  const sourceForPoint = (point) => reviewItemsForPoint(point)[0]
  const query = params.get('q') || ''
  const statusFilter = params.get('status') || 'all'
  const issueFilter = params.get('filter') || ''
  const page = normalizeAdminPage(params.get('page'))
  const pageCount = totalAdminPages(syllabusCount)
  const visibleOfferings = offerings.filter((item) =>
    (issueFilter !== 'missing-charter' || (item.status !== 'archived' && !/^https:\/\//.test(item.charter_url || '')))
    && (issueFilter !== 'missing-syllabus' || (item.status !== 'archived' && !/^https:\/\//.test(item.syllabus_url || '')))
    && (issueFilter !== 'stale' || (item.status !== 'archived' && isStaleReview(item.verified_at)))
    && (issueFilter !== 'no-syllabus' || (item.status === 'published' && !syllabusPoints.some((point) => point.school_slug === item.school_slug && point.year === item.year && point.province_slug === item.province_slug && point.major_slug === item.major_slug && point.status === 'published')))
    && (issueFilter !== 'draft-no-syllabus' || (item.status === 'draft' && !syllabusPoints.some((point) => point.school_slug === item.school_slug && point.year === item.year && point.province_slug === item.province_slug && point.major_slug === item.major_slug && ['draft', 'published'].includes(point.status))))
  )
  const setParam = (key, value) => setParams(updateAdminSearchParams(params, key, value), { replace: true })

  useEffect(() => {
    if (module !== 'syllabus') return undefined
    let active = true
    setSyllabusLoading(true); setSyllabusError('')
    loadSyllabusAdminPage(supabase, { query, status: statusFilter, issueFilter, page })
      .then(({ rows, count }) => {
        if (!active) return
        const lastPage = totalAdminPages(count)
        setSyllabusCount(count)
        if (page > lastPage) {
          const next = new URLSearchParams()
          if (query) next.set('q', query)
          if (statusFilter !== 'all') next.set('status', statusFilter)
          if (issueFilter) next.set('filter', issueFilter)
          if (lastPage > 1) next.set('page', String(lastPage))
          setParams(next, { replace: true })
          return
        }
        setSyllabusPoints(rows.map(normalizeSyllabusPoint))
      })
      .catch((error) => { if (active) setSyllabusError(error.message) })
      .finally(() => { if (active) setSyllabusLoading(false) })
    return () => { active = false }
  }, [module, query, statusFilter, issueFilter, page, syllabusRevision, setParams, setSyllabusPoints])

  async function refreshSchools() {
    const { data } = await supabase.from('academic_schools').select('*').order('sort_order').order('school_id')
    if (data) setSchools(data.map(normalizeAcademicSchool))
  }

  function saved(kind, row) {
    if (kind === 'school') setSchools((current) => [...current.filter((item) => item.school_id !== row.school_id), row].sort((a, b) => a.sort_order - b.sort_order || a.school_id.localeCompare(b.school_id)))
    if (kind === 'offering') setOfferings((current) => [...current.filter((item) => item.offering_id !== row.offering_id), row].sort((a, b) => a.sort_order - b.sort_order))
    if (kind === 'point') setSyllabusRevision((value) => value + 1)
    if (kind !== 'school') void refreshSchools()
  }

  async function changeStatus(kind, item, nextStatus) {
    const checks = publicationChecks(kind, item)
    if (nextStatus === 'published' && !canPublish(checks)) return window.alert(`发布检查未通过：\n${formatPublicationCheck(checks)}`)
    const action = nextStatus === 'published' ? '发布' : '下架'
    if (!window.confirm(`${formatPublicationCheck(checks)}\n\n确定${action}这条内容吗？`)) return
    const table = kind === 'offering' ? 'admission_offerings' : 'syllabus_points'
    let request = supabase.from(table).update({ status: nextStatus }).eq(kind === 'offering' ? 'offering_id' : 'point_id', kind === 'offering' ? item.offering_id : item.point_id)
    if (kind === 'point') request = request.eq('year', item.year).eq('province_slug', item.province_slug).eq('major_slug', item.major_slug)
    const { data, error } = await request.select().single()
    if (error) return window.alert(`操作失败：${error.message}`)
    saved(kind, kind === 'offering' ? normalizeOffering(data) : normalizeSyllabusPoint(data))
  }

  return <section className="admin-panel admin-academic-data">
    <div className="admin-panel-title"><div><span className="eyebrow">前台内容</span><h2>{module === 'schools' ? '院校' : module === 'offerings' ? '招生计划' : '考纲'}</h2><p>新建与编辑内容先保存为草稿，发布时执行完整性检查并再次确认。</p></div></div>
    {module === 'schools' && <div className="admin-data-section"><header><div><h3>院校资料</h3><span>{schools.length} 所 · 默认范围 {defaultMapSchools.size} 所已开放学习地图</span></div></header><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>院校</th><th>校徽</th><th>排序</th><th>学习地图</th><th>最后核验</th><th>状态</th><th>操作</th></tr></thead><tbody>{schools.map((school) => { const hasMap = defaultMapSchools.has(school.school_slug); const reviewDate = latestVerifiedDate(offeringSourcesForSchool(school.school_slug)); return <tr key={school.school_id}><td><strong>{school.school_name}</strong><small>{school.school_id} · {school.short_name} · {school.school_type}</small></td><td><span className="admin-table-logo">{school.logo_url ? <img src={school.logo_url} alt="" /> : school.short_name}</span></td><td>{school.sort_order}</td><td><span className={`admin-status ${hasMap ? 'active' : ''}`}>{hasMap ? '已开放' : '资料整理中'}</span></td><td><ReviewDate date={reviewDate} /></td><td><span className={`admin-status ${school.active ? 'active' : ''}`}>{school.active ? '启用' : '停用'}</span></td><td><div className="admin-actions"><button onClick={() => setEditor({ kind: 'school', initial: school })}>编辑</button></div></td></tr> })}</tbody></table></div></div>}
    {module === 'offerings' && <div className="admin-data-section"><header><div><h3>招生计划</h3><span>{visibleOfferings.length} / {offerings.length} 条</span></div><button className="admin-primary" onClick={() => setEditor({ kind: 'offering', initial: null })}>＋ 新增计划</button></header><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>院校与地点</th><th>考试科目</th><th>计划数</th><th>官方来源</th><th>最后核验</th><th>状态</th><th>操作</th></tr></thead><tbody>{visibleOfferings.map((item) => <tr key={item.offering_id}><td><strong>{schoolNames.get(item.school_slug) || item.school_slug}</strong><small>{item.year} · {item.training_site}</small></td><td><span>{item.publicSubjects.join(' · ')}</span><small>{item.professionalSubjects.join(' · ')}</small></td><td>{item.plan_count} 人</td><td>{item.charter_url ? <a href={item.charter_url} target="_blank" rel="noreferrer">招生章程 ↗</a> : <small>缺少章程</small>}{item.syllabus_url ? <a href={item.syllabus_url} target="_blank" rel="noreferrer">考试大纲 ↗</a> : <small>缺少考纲</small>}</td><td><ReviewDate date={item.verified_at} />{staleReviewLabel(item) && <small className="review-kind">{staleReviewLabel(item)}</small>}</td><td><PublicationBadge status={item.status} /></td><td><div className="admin-actions"><button onClick={() => setEditor({ kind: 'offering', initial: item })}>编辑</button>{item.status !== 'published' && <button onClick={() => changeStatus('offering', item, 'published')}>发布</button>}{item.status !== 'archived' && <button onClick={() => changeStatus('offering', item, 'archived')}>下架</button>}</div></td></tr>)}</tbody></table>{!visibleOfferings.length && <p className="admin-empty">{issueFilter === 'stale' ? '没有待复核的招生计划。' : '没有匹配的招生计划。'}</p>}</div></div>}
    {module === 'syllabus' && <div className="admin-data-section"><header><div><h3>考纲知识点</h3><span>{syllabusCount} 条</span></div><button className="admin-primary" onClick={() => setEditor({ kind: 'point', initial: null })}>＋ 新增知识点</button></header><div className="admin-filters"><input type="search" value={query} onChange={(event) => setParam('q', event.target.value)} placeholder="搜索科目、知识点或 canonical_topic" /><select value={statusFilter} onChange={(event) => setParam('status', event.target.value)}><option value="all">全部状态</option><option value="draft">草稿</option><option value="published">已发布</option><option value="archived">已下架</option></select></div>{syllabusError && <p className="admin-message error">读取考纲失败：{syllabusError}</p>}{syllabusLoading && <p className="admin-loading">正在加载当前页…</p>}<div className="admin-table-wrap admin-points-table"><table className="admin-table"><thead><tr><th>科目</th><th>章节与知识点</th><th>适用范围</th><th>来源与核验</th><th>资源标签</th><th>状态与操作</th></tr></thead><tbody>{syllabusPoints.map((point) => { const source = sourceForPoint(point); return <tr key={`${point.year}:${point.province_slug}:${point.major_slug}:${point.point_id}`}><td><strong>{point.subject_name}</strong><small>{point.subject_slug}</small></td><td><strong>{point.point_title}</strong><small>{point.section_name} · {point.section_order}-{point.point_order}</small></td><td>{point.year} · {point.province_slug} · {point.major_slug}<small>{point.school_slug === 'common' ? '所有院校' : schoolNames.get(point.school_slug) || point.school_slug}</small></td><td>{source?.syllabus_url && <a href={source.syllabus_url} target="_blank" rel="noreferrer">考试大纲 ↗</a>}<ReviewDate date={latestVerifiedDate(reviewItemsForPoint(point))} /></td><td>{point.canonical_topic}</td><td><PublicationBadge status={point.status} /><div className="admin-actions"><button onClick={() => setEditor({ kind: 'point', initial: point })}>编辑</button>{point.status !== 'published' && <button onClick={() => changeStatus('point', point, 'published')}>发布</button>}{point.status !== 'archived' && <button onClick={() => changeStatus('point', point, 'archived')}>下架</button>}</div></td></tr> })}</tbody></table>{!syllabusLoading && !syllabusPoints.length && <p className="admin-empty">没有匹配的考纲知识点。</p>}</div><div className="admin-pagination"><button disabled={page <= 1 || syllabusLoading} onClick={() => setParam('page', String(page - 1))}>上一页</button><span>第 {page} / {pageCount} 页</span><button disabled={page >= pageCount || syllabusLoading} onClick={() => setParam('page', String(page + 1))}>下一页</button></div></div>}
    {editor && <AcademicEditor kind={editor.kind} initial={editor.initial} schools={schools} onClose={() => setEditor(null)} onSaved={saved} />}
  </section>
}

function OverviewPanel() {
  const [health, setHealth] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => { supabase.rpc('admin_data_health').then(({ data, error: rpcError }) => { if (rpcError) setError(rpcError.message); else setHealth(data) }) }, [])
  const cards = (issues = []) => <div className="health-grid">{issues.map((issue) => <Link key={issue.key} to={issue.href}><strong>{issue.count}</strong><span>{issue.label}</span><small>查看并处理 →</small></Link>)}</div>
  return <section className="admin-panel"><div className="admin-panel-title"><div><span className="eyebrow">数据体检</span><h2>概览</h2><p>这里只读取汇总 RPC，不会在进入后台时加载所有大表。</p></div></div>{error && <p className="admin-message error">读取体检结果失败：{error}</p>}{health && <><div className="admin-status-cards"><article><strong>{health.statuses?.draft || 0}</strong><span>草稿</span></article><article><strong>{health.statuses?.published || 0}</strong><span>已发布</span></article><article><strong>{health.statuses?.archived || 0}</strong><span>已下架</span></article></div><h3>常规数据质量</h3>{cards(health.issues)}<h3>公开内容完整性</h3><p className="admin-system-note">这里只用已发布内容互相核对，草稿不会掩盖公开数据问题。</p>{cards(health.publishedIssues)}<h3>草稿准备情况</h3><p className="admin-system-note">草稿单独统计，不计入公开完整性。</p>{cards(health.draftIssues)}</>}</section>
}

function MaintenancePanel() {
  const [sourceYear, setSourceYear] = useState(2026)
  const [preview, setPreview] = useState(null)
  const [message, setMessage] = useState('')
  const targetYear = sourceYear + 1
  async function inspect() {
    setMessage('')
    const { data, error } = await supabase.rpc('preview_academic_year_copy', { p_source_year: sourceYear, p_target_year: targetYear, p_province_slug: 'anhui', p_major_slug: 'computer-science' })
    if (error) return setMessage(`预检失败：${error.message}`)
    setPreview(data)
  }
  async function copy() {
    if (!preview) return
    if (!window.confirm(`将向 ${targetYear} 年新增 ${preview.offerings.add} 条招生计划和 ${preview.syllabus.add} 条考纲；跳过 ${preview.offerings.skip + preview.syllabus.skip} 条，冲突 ${preview.offerings.conflict + preview.syllabus.conflict} 条。所有新记录均为草稿且清空核验结果。确定执行吗？`)) return
    const { data, error } = await supabase.rpc('copy_academic_year', { p_source_year: sourceYear, p_target_year: targetYear, p_province_slug: 'anhui', p_major_slug: 'computer-science' })
    if (error) return setMessage(`复制失败，事务已回滚：${error.message}`)
    setMessage(`复制完成：新增 ${data.inserted.offerings} 条招生计划、${data.inserted.syllabus} 条考纲；全部等待新年度官方文件核验。`)
    await inspect()
  }
  return <section className="admin-panel"><div className="admin-panel-title"><div><span className="eyebrow">年度维护</span><h2>年度复制向导</h2><p>复制招生计划与考纲到下一年度；不复制旧核验日期和官方链接，新数据默认草稿。</p></div></div><p className="admin-system-note">新年份至少有一条招生计划发布后，前台年份选择器和 /anhui 会自动识别；sitemap 由构建时的公开快照生成，因此发布新年份后必须重新部署 Production。</p><div className="year-copy-form"><label>源年份<input type="number" min="2020" max="2099" value={sourceYear} onChange={(event) => { setSourceYear(Number(event.target.value)); setPreview(null) }} /></label><label>目标年份<input value={targetYear} readOnly /></label><button className="admin-primary" onClick={inspect}>预检新增、跳过与冲突</button></div>{preview && <div className="copy-preview"><article><h3>招生计划</h3><p>新增 {preview.offerings.add} · 跳过 {preview.offerings.skip} · 冲突 {preview.offerings.conflict}</p></article><article><h3>考纲</h3><p>新增 {preview.syllabus.add} · 跳过 {preview.syllabus.skip} · 冲突 {preview.syllabus.conflict}</p></article><button disabled={preview.offerings.conflict + preview.syllabus.conflict > 0} onClick={copy}>事务性复制为草稿</button></div>}{message && <p className="admin-message" role="status">{message}</p>}</section>
}

function ResourcesPanel({ message, setMessage }) {
  const [params, setParams] = useSearchParams()
  const [editor, setEditor] = useState(null)
  const [resources, setResources] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [revision, setRevision] = useState(0)
  const [filterOptions, setFilterOptions] = useState({ platforms: [], topics: [] })
  const query = params.get('q') || ''
  const platform = params.get('platform') || 'all'
  const status = params.get('status') || 'all'
  const issueFilter = params.get('filter') || ''
  const page = normalizeAdminPage(params.get('page'))
  const pageCount = totalAdminPages(total)
  const topics = useMemo(() => filterOptions.topics.map((topic) => [topic.value, topic.label]), [filterOptions.topics])
  const validTopics = useMemo(() => new Set(topics.map(([value]) => value)), [topics])
  const setParam = (key, value) => setParams(updateAdminSearchParams(params, key, value), { replace: true })

  useEffect(() => {
    let active = true
    supabase.rpc('admin_content_filter_options').then(({ data, error }) => {
      if (!active) return
      if (error) setLoadError(error.message)
      else setFilterOptions({ platforms: data?.platforms || [], topics: data?.topics || [] })
    })
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true
    setLoading(true); setLoadError('')
    loadResourceAdminPage(supabase, { query, platform, status, issueFilter, page })
      .then(({ rows, count }) => {
        if (!active) return
        const lastPage = totalAdminPages(count)
        setTotal(count)
        if (page > lastPage) {
          const next = new URLSearchParams()
          if (query) next.set('q', query)
          if (platform !== 'all') next.set('platform', platform)
          if (status !== 'all') next.set('status', status)
          if (issueFilter) next.set('filter', issueFilter)
          if (lastPage > 1) next.set('page', String(lastPage))
          setParams(next, { replace: true })
          return
        }
        setResources(rows.map(normalizeResource))
      })
      .catch((error) => { if (active) setLoadError(error.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [query, platform, status, issueFilter, page, revision, setParams])

  function saved(item) { setEditor(null); setRevision((value) => value + 1); setMessage({ type: 'success', text: `“${item.title}”已保存为草稿。` }) }
  async function changeStatus(item, nextStatus) {
    const checks = publicationChecks('resource', item, validTopics)
    if (nextStatus === 'published' && !canPublish(checks)) return window.alert(`发布检查未通过：\n${formatPublicationCheck(checks)}`)
    const action = nextStatus === 'published' ? '发布' : '下架'
    if (!window.confirm(`${formatPublicationCheck(checks)}\n\n确定${action}“${item.title}”吗？`)) return
    const { data, error } = await supabase.from('resources').update({ status: nextStatus }).eq('resource_id', item.resource_id).select().single()
    if (error) return setMessage({ type: 'error', text: `操作失败：${error.message}` })
    setRevision((value) => value + 1)
    setMessage({ type: 'success', text: `“${data.title}”状态已更新。` })
  }
  return <section className="admin-panel admin-resources"><div className="admin-panel-title"><div><span className="eyebrow">学习内容</span><h2>学习资源</h2><p>{total} 条 · 每页 20 条 · 新建默认草稿</p></div><button className="admin-primary" onClick={() => setEditor('new')}>＋ 新增资源</button></div><Message state={message} />{loadError && <p className="admin-message error">读取资源失败：{loadError}</p>}<div className="admin-filters"><input type="search" value={query} onChange={(event) => setParam('q', event.target.value)} placeholder="搜索标题、创建者或资源 ID" /><select value={platform} onChange={(event) => setParam('platform', event.target.value)}><option value="all">全部平台</option>{filterOptions.platforms.map((item) => <option key={item}>{item}</option>)}</select><select value={status} onChange={(event) => setParam('status', event.target.value)}><option value="all">全部状态</option><option value="draft">草稿</option><option value="published">已发布</option><option value="archived">已下架</option></select></div>{loading && <p className="admin-loading">正在加载当前页…</p>}<div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>资源</th><th>平台与标签</th><th>来源</th><th>最后核验</th><th>状态</th><th>操作</th></tr></thead><tbody>{resources.map((item) => <tr key={item.resource_id}><td><strong>{item.title}</strong><small>{item.resource_id} · {item.creator}</small></td><td><span>{item.platform}</span><small>{item.tags.join(' · ')}</small></td><td><a href={item.url} target="_blank" rel="noreferrer">打开资源 ↗</a></td><td><ReviewDate date={item.verified_at} />{staleReviewLabel(item) && <small className="review-kind">{staleReviewLabel(item)}</small>}</td><td><PublicationBadge status={item.status} /></td><td><div className="admin-actions"><button onClick={() => setEditor(item)}>编辑</button><button onClick={() => setEditor({ ...item, resource_id: '', title: `${item.title}（副本）`, duplicate: true })}>复制</button>{item.status !== 'published' && <button onClick={() => changeStatus(item, 'published')}>发布</button>}{item.status !== 'archived' && <button onClick={() => changeStatus(item, 'archived')}>下架</button>}</div></td></tr>)}</tbody></table>{!loading && !resources.length && <p className="admin-empty">{issueFilter === 'stale' ? '没有待复核的学习资源。' : '没有匹配的资源。'}</p>}</div><div className="admin-pagination"><button disabled={page <= 1 || loading} onClick={() => setParam('page', String(page - 1))}>上一页</button><span>第 {page} / {pageCount} 页</span><button disabled={page >= pageCount || loading} onClick={() => setParam('page', String(page + 1))}>下一页</button></div>{editor && <ResourceEditor initial={editor === 'new' ? null : editor} onClose={() => setEditor(null)} onSaved={saved} topics={topics} />}</section>
}

const ADMIN_MODULES = [
  ['overview', '概览'], ['schools', '院校'], ['offerings', '招生计划'], ['syllabus', '考纲'],
  ['resources', '学习资源'], ['announcements', '公告'], ['maintenance', '数据体检 / 年度维护'],
]

export function AdminDashboard() {
  useAdminMeta()
  const location = useLocation()
  const module = location.pathname.split('/')[2] || 'overview'
  const validModule = ADMIN_MODULES.some(([key]) => key === module)
  const [authState, setAuthState] = useState({ loading: true, allowed: false, email: '' })
  const [announcements, setAnnouncements] = useState([])
  const [academicSchools, setAcademicSchools] = useState([])
  const [offerings, setOfferings] = useState([])
  const [syllabusPoints, setSyllabusPoints] = useState([])
  const [loadingModule, setLoadingModule] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    if (!supabase) return setAuthState({ loading: false, allowed: false, email: '' })
    async function authenticate() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return setAuthState({ loading: false, allowed: false, email: '' })
      const { data: membership } = await supabase.from('admin_users').select('user_id,email').eq('user_id', user.id).maybeSingle()
      setAuthState({ loading: false, allowed: Boolean(membership), email: user.email || '' })
    }
    authenticate()
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => { if (event === 'SIGNED_OUT' || event === 'USER_DELETED') setAuthState({ loading: false, allowed: false, email: '' }) })
    return () => authListener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!authState.allowed || !validModule || ['overview', 'maintenance'].includes(module)) return
    let active = true
    async function loadModule() {
      setLoadingModule(true); setMessage({ type: '', text: '' })
      const requests = []
      if (module === 'announcements') requests.push(['announcements', supabase.from('announcements').select('*').order('updated_at', { ascending: false })])
      if (['schools', 'offerings', 'syllabus'].includes(module)) requests.push(['schools', supabase.from('academic_schools').select('*').order('sort_order').order('school_id')])
      if (['schools', 'offerings', 'syllabus'].includes(module)) requests.push(['offerings', supabase.from('admission_offerings').select('*').order('year', { ascending: false }).order('sort_order')])
      if (['schools', 'offerings'].includes(module)) requests.push(['syllabus', supabase.from('syllabus_points').select('*').order('year', { ascending: false }).order('school_slug').order('subject_slug').order('section_order').order('point_order')])
      const results = await Promise.all(requests.map(async ([key, request]) => [key, await request]))
      if (!active) return
      const failed = results.find(([, result]) => result.error)
      if (failed) setMessage({ type: 'error', text: `读取${failed[0]}失败：${failed[1].error.message}` })
      results.forEach(([key, result]) => {
        if (!result.data) return
        if (key === 'announcements') setAnnouncements(result.data)
        if (key === 'schools') setAcademicSchools(result.data.map(normalizeAcademicSchool))
        if (key === 'offerings') setOfferings(result.data.map(normalizeOffering))
        if (key === 'syllabus') setSyllabusPoints(result.data.map(normalizeSyllabusPoint))
      })
      setLoadingModule(false)
    }
    loadModule()
    return () => { active = false }
  }, [authState.allowed, module, validModule])

  async function signOut() { await supabase.auth.signOut(); window.location.assign('/admin/login') }
  if (!validModule) return <Navigate to="/admin/overview" replace />
  if (authState.loading) return <div className="admin-loading">正在验证管理员身份…</div>
  if (!authState.allowed) return <Navigate to="/admin/login" replace />
  return <div className="admin-shell"><header className="admin-header"><div><span className="eyebrow">升本导航</span><h1>内容管理后台</h1><p>{authState.email}</p></div><div><a href="/" target="_blank" rel="noreferrer">查看网站 ↗</a><button onClick={signOut}>安全退出</button></div></header><nav className="admin-module-nav" aria-label="后台模块">{ADMIN_MODULES.map(([key, label]) => <NavLink key={key} to={`/admin/${key}`}>{label}</NavLink>)}</nav><main className="admin-main">{loadingModule && <div className="admin-loading">正在加载当前模块…</div>}{!loadingModule && module === 'overview' && <OverviewPanel />}{!loadingModule && module === 'maintenance' && <MaintenancePanel />}{!loadingModule && module === 'resources' && <ResourcesPanel message={message} setMessage={setMessage} />}{!loadingModule && module === 'announcements' && <AnnouncementsPanel announcements={announcements} setAnnouncements={setAnnouncements} />}{!loadingModule && ['schools', 'offerings', 'syllabus'].includes(module) && <><Message state={message} /><AcademicDataPanel module={module} schools={academicSchools} setSchools={setAcademicSchools} offerings={offerings} setOfferings={setOfferings} syllabusPoints={syllabusPoints} setSyllabusPoints={setSyllabusPoints} /></>}</main></div>
}
