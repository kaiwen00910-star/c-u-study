import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ADMIN_EMAIL, validateAnnouncement, validateResource } from './resourceValidation'
import { normalizeAcademicSchool, normalizeOffering, normalizeResource, normalizeSyllabusPoint, supabase, supabaseConfigured } from './supabase'

const emptyResource = {
  resource_id: '', topic_tags: [], title: '', platform: '哔哩哔哩', creator: '', url: '',
  resource_type: '系统课程', difficulty: '零基础', duration_text: '', recommendation_reason: '',
  priority: 1, verified_at: new Date().toISOString().slice(0, 10), status: 'active',
}
const emptyAnnouncement = { id: null, title: '', content: '', enabled: false, starts_at: '', ends_at: '' }
const emptyAcademicSchool = { school_id: '', school_slug: '', school_name: '', school_type: '公办', short_name: '', theme_color: '#1556a6', logo_url: '', active: true, has_study_map: false, sort_order: 1 }
const emptyOffering = { offering_id: '', year: 2026, province_slug: 'anhui', major_slug: 'computer-science', school_slug: '', training_site: '', eligible_major_categories: '', public_subjects: '高等数学|英语', professional_subjects: '', plan_count: 1, charter_url: '', syllabus_url: '', source_status: '正式章程', verified_at: new Date().toISOString().slice(0, 10), active: true, sort_order: 1 }
const emptySyllabusPoint = { point_id: '', year: 2026, school_slug: 'common', subject_slug: '', subject_name: '', section_order: 1, section_name: '', point_order: 1, point_title: '', canonical_topic: '', active: true }

function Message({ state }) {
  return state.text ? <p className={`admin-message ${state.type}`} role="status">{state.text}</p> : null
}

export function AdminLogin() {
  const [message, setMessage] = useState({ type: '', text: '' })
  const [sending, setSending] = useState(false)
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (!supabase) return
    async function restoreAdminSession() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: membership } = await supabase.from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle()
      if (user.email?.toLowerCase() === ADMIN_EMAIL && membership) navigate('/admin', { replace: true })
      else await supabase.auth.signOut()
    }
    restoreAdminSession()
  }, [navigate])

  async function login(event) {
    event.preventDefault()
    if (!supabase) return setMessage({ type: 'error', text: '后台服务尚未配置，请先完成 Supabase 环境变量。' })
    setSending(true); setMessage({ type: '', text: '' })
    const { error } = await supabase.auth.signInWithPassword({ email: ADMIN_EMAIL, password })
    setSending(false)
    if (error) return setMessage({ type: 'error', text: '登录失败，请检查密码是否正确。' })
    navigate('/admin', { replace: true })
  }

  async function resetPassword() {
    if (!supabase) return setMessage({ type: 'error', text: '后台服务尚未配置，请先完成 Supabase 环境变量。' })
    setSending(true); setMessage({ type: '', text: '' })
    const { error } = await supabase.auth.resetPasswordForEmail(ADMIN_EMAIL, {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    })
    setSending(false)
    setMessage(error
      ? { type: 'error', text: `发送失败：${error.message}` }
      : { type: 'success', text: `设置/重置密码邮件已发送到 ${ADMIN_EMAIL}。` })
  }

  return <div className="admin-login-page"><section className="admin-login-card">
    <span className="eyebrow">升本导航 · 管理后台</span><h1>管理员登录</h1>
    <p>后台仅供站长维护院校资料（含校徽）、招生计划、考纲知识点、学习资源和首页公告。请使用管理员邮箱和密码登录。</p>
    <form onSubmit={login}><label>管理员邮箱<input value={ADMIN_EMAIL} readOnly /></label><label>密码<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength="8" required autoComplete="current-password" /></label><button className="admin-primary" disabled={sending}>{sending ? '请稍候…' : '登录后台'}</button><button type="button" onClick={resetPassword} disabled={sending}>首次设置或忘记密码</button></form>
    {!supabaseConfigured && <p className="admin-message error">当前部署尚未配置 Supabase。</p>}
    <Message state={message} /><a href="/">← 返回网站首页</a>
  </section></div>
}

export function AdminResetPassword() {
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
  const [form, setForm] = useState(initial ? { ...initial, topic_tags: [...initial.tags] } : emptyResource)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [saving, setSaving] = useState(false)
  const isEditing = Boolean(initial && !initial.duplicate)
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
    const payload = { ...form, priority: Number(form.priority), topic_tags: form.topic_tags }
    delete payload.tags; delete payload.created_at; delete payload.updated_at; delete payload.duplicate
    const query = isEditing
      ? supabase.from('resources').update(payload).eq('resource_id', initial.resource_id).select().single()
      : supabase.from('resources').insert(payload).select().single()
    const { data, error } = await query
    setSaving(false)
    if (error) return setMessage({ type: 'error', text: `保存失败：${error.message}` })
    onSaved(normalizeResource(data)); setMessage({ type: 'success', text: '资源已保存并立即生效。' })
  }

  return <div className="admin-modal" role="dialog" aria-modal="true" aria-label={isEditing ? '编辑资源' : '新增资源'}><form className="admin-editor" onSubmit={save}>
    <header><div><span className="eyebrow">资源编辑</span><h2>{isEditing ? '编辑学习资源' : '新增学习资源'}</h2></div><button type="button" onClick={onClose} aria-label="关闭">×</button></header>
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
      <label>状态<select value={form.status} onChange={(e) => set('status', e.target.value)}><option value="active">启用</option><option value="inactive">已下架</option></select></label>
      <label className="wide">推荐理由<textarea value={form.recommendation_reason} onChange={(e) => set('recommendation_reason', e.target.value)} rows="3" /></label>
    </div>
    <fieldset><legend>对应知识点</legend><div className="admin-topic-grid">{topics.map(([value, label]) => <label key={value}><input type="checkbox" checked={form.topic_tags.includes(value)} onChange={() => toggleTag(value)} /><span>{label}</span></label>)}</div></fieldset>
    <Message state={message} /><footer><button type="button" onClick={onClose}>取消</button><button className="admin-primary" disabled={saving}>{saving ? '保存中…' : '保存资源'}</button></footer>
  </form></div>
}

function AnnouncementsPanel({ announcements, setAnnouncements }) {
  const [form, setForm] = useState(announcements[0] ?? emptyAnnouncement)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [saving, setSaving] = useState(false)
  useEffect(() => { setForm(announcements[0] ?? emptyAnnouncement) }, [announcements])
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
    setAnnouncements([data]); setMessage({ type: 'success', text: '公告已保存，符合有效时间时会立即显示。' })
  }

  return <section className="admin-panel"><div className="admin-panel-title"><div><span className="eyebrow">首页内容</span><h2>顶部公告栏</h2></div><span className={form.enabled ? 'admin-status active' : 'admin-status'}>{form.enabled ? '已启用' : '未启用'}</span></div>
    <form className="announcement-form" onSubmit={save}><label>公告标题<input value={form.title} onChange={(e) => set('title', e.target.value)} /></label><label>公告内容<textarea rows="4" value={form.content} onChange={(e) => set('content', e.target.value)} /></label><div><label>开始时间<input type="datetime-local" value={localDate(form.starts_at)} onChange={(e) => set('starts_at', e.target.value ? new Date(e.target.value).toISOString() : '')} /></label><label>结束时间<input type="datetime-local" value={localDate(form.ends_at)} onChange={(e) => set('ends_at', e.target.value ? new Date(e.target.value).toISOString() : '')} /></label></div><label className="admin-switch"><input type="checkbox" checked={form.enabled} onChange={(e) => set('enabled', e.target.checked)} /><span>在有效时间内展示公告</span></label><Message state={message} /><button className="admin-primary" disabled={saving}>{saving ? '保存中…' : '保存公告'}</button></form>
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
  const [form, setForm] = useState(prepared ? { ...prepared } : { ...defaults, school_slug: kind !== 'school' ? (schools[0]?.school_slug || defaults.school_slug) : defaults.school_slug })
  const [message, setMessage] = useState({ type: '', text: '' })
  const [saving, setSaving] = useState(false)
  const [logoFile, setLogoFile] = useState(null)
  const editing = Boolean(initial)
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
      payload = { ...form, year: Number(form.year), plan_count: Number(form.plan_count), sort_order: Number(form.sort_order), public_subjects: form.public_subjects.split('|').map((item) => item.trim()).filter(Boolean), professional_subjects: form.professional_subjects.split('|').map((item) => item.trim()).filter(Boolean) }
      delete payload.publicSubjects; delete payload.professionalSubjects
    } else {
      table = 'syllabus_points'; key = 'point_id'; normalize = normalizeSyllabusPoint
      payload = { ...form, year: Number(form.year), section_order: Number(form.section_order), point_order: Number(form.point_order) }
    }
    delete payload.created_at; delete payload.updated_at; delete payload.has_study_map
    const query = editing
      ? supabase.from(table).update(payload).eq(key, initial[key]).select().single()
      : supabase.from(table).insert(payload).select().single()
    const { data, error } = await query
    setSaving(false)
    if (error) return setMessage({ type: 'error', text: `保存失败：${error.message}` })
    onSaved(kind, normalize(data)); onClose()
  }

  const title = kind === 'school' ? '院校资料' : kind === 'offering' ? '招生计划' : '考纲知识点'
  return <div className="admin-modal" role="dialog" aria-modal="true" aria-label={`编辑${title}`}><form className="admin-editor" onSubmit={save}>
    <header><div><span className="eyebrow">院校内容管理</span><h2>{editing ? `编辑${title}` : `新增${title}`}</h2></div><button type="button" onClick={onClose} aria-label="关闭">×</button></header>
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
      <label className="wide">招生章程链接<input type="url" required value={form.charter_url} onChange={(e) => set('charter_url', e.target.value.trim())} /></label>
      <label className="wide">考试大纲链接<input type="url" required value={form.syllabus_url} onChange={(e) => set('syllabus_url', e.target.value.trim())} /></label>
      <label>资料状态<input required value={form.source_status} onChange={(e) => set('source_status', e.target.value)} /></label>
      <label>核验日期<input type="date" required value={form.verified_at} onChange={(e) => set('verified_at', e.target.value)} /></label>
      <label>排序<input type="number" min="1" required value={form.sort_order} onChange={(e) => set('sort_order', e.target.value)} /></label>
      <label className="admin-switch"><input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} /><span>前台启用</span></label>
    </div>}
    {kind === 'point' && <div className="admin-form-grid">
      <label>知识点 ID<input required pattern="[a-z0-9-]+" value={form.point_id} disabled={editing} onChange={(e) => set('point_id', e.target.value.trim())} /></label>
      <label>适用院校<select value={form.school_slug} onChange={(e) => set('school_slug', e.target.value)}><option value="common">公共课（所有院校）</option>{schools.map((school) => <option key={school.school_slug} value={school.school_slug}>{school.school_name}</option>)}</select></label>
      <label>年份<input type="number" min="2020" max="2100" required value={form.year} onChange={(e) => set('year', e.target.value)} /></label>
      <label>科目标识<input required pattern="[a-z0-9-]+" value={form.subject_slug} onChange={(e) => set('subject_slug', e.target.value.trim())} /></label>
      <label>科目名称<input required value={form.subject_name} onChange={(e) => set('subject_name', e.target.value)} /></label>
      <label>章节顺序<input type="number" min="1" required value={form.section_order} onChange={(e) => set('section_order', e.target.value)} /></label>
      <label>章节名称<input required value={form.section_name} onChange={(e) => set('section_name', e.target.value)} /></label>
      <label>知识点顺序<input type="number" min="1" required value={form.point_order} onChange={(e) => set('point_order', e.target.value)} /></label>
      <label className="wide">知识点标题<input required value={form.point_title} onChange={(e) => set('point_title', e.target.value)} /></label>
      <label className="wide">资源匹配标签<input required pattern="[a-z0-9-]+" value={form.canonical_topic} onChange={(e) => set('canonical_topic', e.target.value.trim())} placeholder="c-language-pointer" /></label>
      <label className="admin-switch"><input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} /><span>前台启用</span></label>
    </div>}
    <Message state={message} /><footer><button type="button" onClick={onClose}>取消</button><button className="admin-primary" disabled={saving}>{saving ? '保存中…' : '保存并生效'}</button></footer>
  </form></div>
}

function AcademicDataPanel({ schools, setSchools, offerings, setOfferings, syllabusPoints, setSyllabusPoints }) {
  const [editor, setEditor] = useState(null)
  const schoolNames = new Map(schools.map((school) => [school.school_slug, school.school_name]))

  async function refreshSchools() {
    const { data } = await supabase.from('academic_schools').select('*').order('sort_order').order('school_id')
    if (data) setSchools(data.map(normalizeAcademicSchool))
  }

  function saved(kind, row) {
    if (kind === 'school') setSchools((current) => [...current.filter((item) => item.school_id !== row.school_id), row].sort((a, b) => a.sort_order - b.sort_order || a.school_id.localeCompare(b.school_id)))
    if (kind === 'offering') setOfferings((current) => [...current.filter((item) => item.offering_id !== row.offering_id), row].sort((a, b) => a.sort_order - b.sort_order))
    if (kind === 'point') setSyllabusPoints((current) => [...current.filter((item) => item.point_id !== row.point_id), row].sort((a, b) => a.school_slug.localeCompare(b.school_slug) || a.subject_slug.localeCompare(b.subject_slug) || a.section_order - b.section_order || a.point_order - b.point_order))
    if (kind !== 'school') void refreshSchools()
  }

  return <section className="admin-panel admin-academic-data">
    <div className="admin-panel-title"><div><span className="eyebrow">前台内容</span><h2>院校资料与考纲</h2><p>院校资料是首页校徽墙、已整理院校、对比页、学习地图和资料来源页的统一数据源</p></div></div>
    <div className="admin-data-section"><header><div><h3>院校资料</h3><span>{schools.length} 所 · {schools.filter((school) => school.has_study_map).length} 所已开放学习地图</span></div></header><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>院校</th><th>校徽</th><th>排序</th><th>学习地图</th><th>状态</th><th>操作</th></tr></thead><tbody>{schools.map((school) => <tr key={school.school_id}><td><strong>{school.school_name}</strong><small>{school.school_id} · {school.short_name} · {school.school_type}</small></td><td><span className="admin-table-logo">{school.logo_url ? <img src={school.logo_url} alt="" /> : school.short_name}</span></td><td>{school.sort_order}</td><td><span className={`admin-status ${school.has_study_map ? 'active' : ''}`}>{school.has_study_map ? '已开放' : '未开放'}</span></td><td><span className={`admin-status ${school.active ? 'active' : ''}`}>{school.active ? '启用' : '停用'}</span></td><td><div className="admin-actions"><button onClick={() => setEditor({ kind: 'school', initial: school })}>编辑</button></div></td></tr>)}</tbody></table></div></div>
    <div className="admin-data-section"><header><div><h3>招生计划</h3><span>{offerings.length} 条</span></div><button className="admin-primary" onClick={() => setEditor({ kind: 'offering', initial: null })}>＋ 新增计划</button></header><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>院校与地点</th><th>考试科目</th><th>计划数</th><th>状态</th><th>操作</th></tr></thead><tbody>{offerings.map((item) => <tr key={item.offering_id}><td><strong>{schoolNames.get(item.school_slug) || item.school_slug}</strong><small>{item.training_site}</small></td><td><span>{item.publicSubjects.join(' · ')}</span><small>{item.professionalSubjects.join(' · ')}</small></td><td>{item.plan_count} 人</td><td><span className={`admin-status ${item.active ? 'active' : ''}`}>{item.active ? '启用' : '停用'}</span></td><td><div className="admin-actions"><button onClick={() => setEditor({ kind: 'offering', initial: item })}>编辑</button></div></td></tr>)}</tbody></table></div></div>
    <div className="admin-data-section"><header><div><h3>考纲知识点</h3><span>{syllabusPoints.length} 条</span></div><button className="admin-primary" onClick={() => setEditor({ kind: 'point', initial: null })}>＋ 新增知识点</button></header><div className="admin-table-wrap admin-points-table"><table className="admin-table"><thead><tr><th>科目</th><th>章节与知识点</th><th>适用院校</th><th>资源标签</th><th>操作</th></tr></thead><tbody>{syllabusPoints.map((point) => <tr key={point.point_id}><td><strong>{point.subject_name}</strong><small>{point.subject_slug}</small></td><td><strong>{point.point_title}</strong><small>{point.section_name} · {point.section_order}-{point.point_order}</small></td><td>{point.school_slug === 'common' ? '所有院校' : schoolNames.get(point.school_slug) || point.school_slug}</td><td>{point.canonical_topic}</td><td><div className="admin-actions"><button onClick={() => setEditor({ kind: 'point', initial: point })}>编辑</button></div></td></tr>)}</tbody></table></div></div>
    {editor && <AcademicEditor kind={editor.kind} initial={editor.initial} schools={schools} onClose={() => setEditor(null)} onSaved={saved} />}
  </section>
}

export function AdminDashboard() {
  const [authState, setAuthState] = useState({ loading: true, allowed: false, email: '' })
  const [resources, setResources] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [academicSchools, setAcademicSchools] = useState([])
  const [offerings, setOfferings] = useState([])
  const [syllabusPoints, setSyllabusPoints] = useState([])
  const [query, setQuery] = useState('')
  const [platform, setPlatform] = useState('all')
  const [status, setStatus] = useState('all')
  const [editor, setEditor] = useState(null)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    if (!supabase) return setAuthState({ loading: false, allowed: false, email: '' })
    async function initialize() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL) return setAuthState({ loading: false, allowed: false, email: user?.email ?? '' })
      const { data: membership } = await supabase.from('admin_users').select('user_id,email').eq('user_id', user.id).maybeSingle()
      if (!membership) return setAuthState({ loading: false, allowed: false, email: user.email })
      setAuthState({ loading: false, allowed: true, email: user.email })
      const [
        { data: resourceRows, error: resourceError },
        { data: announcementRows, error: announcementError },
        { data: academicSchoolRows, error: academicSchoolError },
        { data: offeringRows, error: offeringError },
        { data: syllabusRows, error: syllabusError },
      ] = await Promise.all([
        supabase.from('resources').select('*').order('updated_at', { ascending: false }),
        supabase.from('announcements').select('*').order('updated_at', { ascending: false }).limit(1),
        supabase.from('academic_schools').select('*').order('sort_order').order('school_id'),
        supabase.from('admission_offerings').select('*').order('sort_order'),
        supabase.from('syllabus_points').select('*').order('school_slug').order('subject_slug').order('section_order').order('point_order'),
      ])
      const loadError = resourceError || announcementError || academicSchoolError || offeringError || syllabusError
      if (loadError) return setMessage({ type: 'error', text: `读取后台数据失败：${loadError.message}` })
      setResources(resourceRows.map(normalizeResource)); setAnnouncements(announcementRows)
      setAcademicSchools(academicSchoolRows.map(normalizeAcademicSchool)); setOfferings(offeringRows.map(normalizeOffering)); setSyllabusPoints(syllabusRows.map(normalizeSyllabusPoint))
    }
    initialize()
  }, [])

  const filtered = useMemo(() => resources.filter((item) => {
    const matchesText = `${item.title}${item.creator}${item.resource_id}`.toLowerCase().includes(query.trim().toLowerCase())
    return matchesText && (platform === 'all' || item.platform === platform) && (status === 'all' || item.status === status)
  }), [resources, query, platform, status])
  const topics = useMemo(() => [...new Map(syllabusPoints.map((point) => [point.canonical_topic, `${point.subject_name} · ${point.point_title}`])).entries()], [syllabusPoints])

  function saved(item) {
    setResources((current) => [item, ...current.filter((resource) => resource.resource_id !== item.resource_id)])
    setEditor(null); setMessage({ type: 'success', text: `“${item.title}”已保存。` })
  }
  async function toggleStatus(item) {
    const next = item.status === 'active' ? 'inactive' : 'active'
    const { data, error } = await supabase.from('resources').update({ status: next }).eq('resource_id', item.resource_id).select().single()
    if (error) return setMessage({ type: 'error', text: `操作失败：${error.message}` })
    saved(normalizeResource(data))
  }
  function duplicate(item) {
    setEditor({ ...item, resource_id: '', title: `${item.title}（副本）`, duplicate: true })
  }
  async function signOut() { await supabase.auth.signOut(); window.location.assign('/admin/login') }

  if (authState.loading) return <div className="admin-loading">正在验证管理员身份…</div>
  if (!authState.allowed) return <Navigate to="/admin/login" replace />
  return <div className="admin-shell"><header className="admin-header"><div><span className="eyebrow">升本导航</span><h1>内容管理后台</h1><p>{authState.email}</p></div><div><a href="/" target="_blank" rel="noreferrer">查看网站 ↗</a><button onClick={signOut}>安全退出</button></div></header>
    <Message state={message} />
    <main className="admin-main"><section className="admin-panel admin-resources"><div className="admin-panel-title"><div><span className="eyebrow">学习内容</span><h2>课程资源</h2><p>{resources.length} 条资源 · {resources.filter((item) => item.status === 'active').length} 条启用</p></div><button className="admin-primary" onClick={() => setEditor('new')}>＋ 新增资源</button></div>
      <div className="admin-filters"><input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索标题、UP 主或资源 ID" /><select value={platform} onChange={(e) => setPlatform(e.target.value)}><option value="all">全部平台</option>{[...new Set(resources.map((item) => item.platform))].map((item) => <option key={item}>{item}</option>)}</select><select value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">全部状态</option><option value="active">启用</option><option value="inactive">已下架</option></select></div>
      <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>资源</th><th>平台与标签</th><th>优先级</th><th>状态</th><th>操作</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.resource_id}><td><strong>{item.title}</strong><small>{item.resource_id} · {item.creator}</small></td><td><span>{item.platform}</span><small>{item.tags.join(' · ')}</small></td><td>{item.priority}</td><td><span className={`admin-status ${item.status === 'active' ? 'active' : ''}`}>{item.status === 'active' ? '启用' : '已下架'}</span></td><td><div className="admin-actions"><button onClick={() => setEditor(item)}>编辑</button><button onClick={() => duplicate(item)}>复制</button><button onClick={() => toggleStatus(item)}>{item.status === 'active' ? '下架' : '恢复'}</button></div></td></tr>)}</tbody></table>{!filtered.length && <p className="admin-empty">没有匹配的资源。</p>}</div>
    </section><AnnouncementsPanel announcements={announcements} setAnnouncements={setAnnouncements} /><AcademicDataPanel schools={academicSchools} setSchools={setAcademicSchools} offerings={offerings} setOfferings={setOfferings} syllabusPoints={syllabusPoints} setSyllabusPoints={setSyllabusPoints} /></main>
    {editor && <ResourceEditor initial={editor === 'new' ? null : editor} onClose={() => setEditor(null)} onSaved={saved} topics={topics} />}
  </div>
}
