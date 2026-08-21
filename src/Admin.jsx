import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { syllabus, subjectNames } from './data'
import { ADMIN_EMAIL, validateAnnouncement, validateResource } from './resourceValidation'
import { normalizeResource, supabase, supabaseConfigured } from './supabase'
import { mergeSchoolLogos } from './schoolWallData'

const emptyResource = {
  resource_id: '', topic_tags: [], title: '', platform: '哔哩哔哩', creator: '', url: '',
  resource_type: '系统课程', difficulty: '零基础', duration_text: '', recommendation_reason: '',
  priority: 1, verified_at: new Date().toISOString().slice(0, 10), status: 'active',
}
const emptyAnnouncement = { id: null, title: '', content: '', enabled: false, starts_at: '', ends_at: '' }
const topics = [...new Map(syllabus.map((point) => [point.canonical_topic, `${subjectNames[point.subject_slug]} · ${point.point_title}`])).entries()]
const validTopics = new Set(topics.map(([value]) => value))

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
    <p>后台仅供站长维护学习资源、首页公告和院校校徽。请使用管理员邮箱和密码登录。</p>
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

function ResourceEditor({ initial, onClose, onSaved }) {
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

function SchoolLogosPanel({ logoRows, setLogoRows }) {
  const [query, setQuery] = useState('')
  const [uploading, setUploading] = useState('')
  const [savingName, setSavingName] = useState('')
  const [message, setMessage] = useState({ type: '', text: '' })
  const schools = useMemo(() => mergeSchoolLogos(logoRows), [logoRows])
  const filtered = schools.filter((school) => school.name.includes(query.trim()))
  const readyCount = schools.filter((school) => school.logo).length

  async function uploadLogo(school, event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const extension = schoolLogoTypes[file.type]
    if (!extension) return setMessage({ type: 'error', text: '校徽仅支持 PNG、JPG 或 WebP 图片。' })
    if (file.size > 2 * 1024 * 1024) return setMessage({ type: 'error', text: '校徽图片不能超过 2MB。' })

    setUploading(school.id); setMessage({ type: '', text: '' })
    const objectPath = `${school.id}/logo-${Date.now()}.${extension}`
    const { error: uploadError } = await supabase.storage.from('school-logos').upload(objectPath, file, {
      cacheControl: '31536000',
      contentType: file.type,
    })
    if (uploadError) {
      setUploading('')
      return setMessage({ type: 'error', text: `上传失败：${uploadError.message}` })
    }

    const { data: publicUrlData } = supabase.storage.from('school-logos').getPublicUrl(objectPath)
    const { data, error } = await supabase.from('school_logos').upsert({
      school_id: school.id,
      logo_url: publicUrlData.publicUrl,
      display_name: school.customName,
    }, { onConflict: 'school_id' }).select().single()
    setUploading('')
    if (error) return setMessage({ type: 'error', text: `保存失败：${error.message}` })
    setLogoRows((current) => [data, ...current.filter((item) => item.school_id !== school.id)])
    setMessage({ type: 'success', text: `“${school.name}”校徽已更新，首页刷新后立即生效。` })
  }

  async function saveSchoolName(school, value) {
    const displayName = value.replace(/\s+/g, ' ').trim()
    if (!displayName) return setMessage({ type: 'error', text: '学校名称不能为空。' })
    if (displayName.length > 40) return setMessage({ type: 'error', text: '学校名称不能超过 40 个字符。' })
    if (displayName === school.name) return setMessage({ type: 'success', text: '学校名称未变化。' })

    setSavingName(school.id); setMessage({ type: '', text: '' })
    const { data, error } = await supabase.from('school_logos').upsert({
      school_id: school.id,
      logo_url: school.databaseLogo,
      display_name: displayName === school.defaultName ? null : displayName,
    }, { onConflict: 'school_id' }).select().single()
    setSavingName('')
    if (error) return setMessage({ type: 'error', text: `保存失败：${error.message}` })
    setLogoRows((current) => [data, ...current.filter((item) => item.school_id !== school.id)])
    setMessage({ type: 'success', text: displayName === school.defaultName ? '已恢复默认学校名称。' : `“${displayName}”已保存，首页刷新后立即生效。` })
  }

  return <section className="admin-panel admin-school-logos">
    <div className="admin-panel-title"><div><span className="eyebrow">首页内容</span><h2>院校校徽</h2><p>{readyCount} / {schools.length} 所已有校徽，可为缺失院校上传图片</p></div><input className="admin-logo-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索院校" /></div>
    <Message state={message} />
    <div className="admin-logo-grid">{filtered.map((school) => <SchoolLogoCard key={school.id} school={school} uploading={uploading} savingName={savingName} onUpload={uploadLogo} onSaveName={saveSchoolName} />)}</div>
    {!filtered.length && <p className="admin-empty">没有匹配的院校。</p>}
  </section>
}

function SchoolLogoCard({ school, uploading, savingName, onUpload, onSaveName }) {
  const [name, setName] = useState(school.name)
  useEffect(() => { setName(school.name) }, [school.name])
  const busy = Boolean(uploading || savingName)
  return <article className="admin-logo-card">
    <span className="admin-logo-preview">{school.logo ? <img src={school.logo} alt={`${school.name}校徽`} /> : <b>{school.shortName}</b>}</span>
    <div className="admin-logo-details"><label className="admin-logo-name">学校名称<input value={name} maxLength="40" disabled={busy} onChange={(event) => setName(event.target.value)} /></label><span className={`admin-status ${school.logoSource !== 'missing' ? 'active' : ''}`}>{school.logoSource === 'database' ? '后台校徽' : school.logoSource === 'local' ? '内置校徽' : '待补充'}</span></div>
    <div className="admin-logo-actions"><button type="button" className="admin-logo-name-save" disabled={busy || name.trim() === school.name} onClick={() => onSaveName(school, name)}>{savingName === school.id ? '保存中…' : '保存名称'}</button><label className="admin-logo-upload">{uploading === school.id ? '上传中…' : school.logo ? '替换图片' : '上传校徽'}<input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={(event) => onUpload(school, event)} /></label></div>
  </article>
}

export function AdminDashboard() {
  const [authState, setAuthState] = useState({ loading: true, allowed: false, email: '' })
  const [resources, setResources] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [schoolLogos, setSchoolLogos] = useState([])
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
      const [{ data: resourceRows, error: resourceError }, { data: announcementRows, error: announcementError }, { data: logoRows, error: logoError }] = await Promise.all([
        supabase.from('resources').select('*').order('updated_at', { ascending: false }),
        supabase.from('announcements').select('*').order('updated_at', { ascending: false }).limit(1),
        supabase.from('school_logos').select('*').order('school_id'),
      ])
      if (resourceError || announcementError || logoError) return setMessage({ type: 'error', text: `读取后台数据失败：${resourceError?.message || announcementError?.message || logoError?.message}` })
      setResources(resourceRows.map(normalizeResource)); setAnnouncements(announcementRows); setSchoolLogos(logoRows)
    }
    initialize()
  }, [])

  const filtered = useMemo(() => resources.filter((item) => {
    const matchesText = `${item.title}${item.creator}${item.resource_id}`.toLowerCase().includes(query.trim().toLowerCase())
    return matchesText && (platform === 'all' || item.platform === platform) && (status === 'all' || item.status === status)
  }), [resources, query, platform, status])

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
    </section><AnnouncementsPanel announcements={announcements} setAnnouncements={setAnnouncements} /><SchoolLogosPanel logoRows={schoolLogos} setLogoRows={setSchoolLogos} /></main>
    {editor && <ResourceEditor initial={editor === 'new' ? null : editor} onClose={() => setEditor(null)} onSaved={saved} />}
  </div>
}
