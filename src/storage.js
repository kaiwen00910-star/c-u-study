import { DEFAULT_SCOPE, normalizeScope } from './contentScope'

const KEYS = {
  progress: 'zsb:v1:progress', favorites: 'zsb:v1:favorites', lastSelection: 'zsb:v1:lastSelection',
  countdownTarget: 'zsb:v1:countdownTarget',
}

export const BACKUP_SCHEMA_VERSION = 1

function read(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback }
}

export function getProgress() { return read(KEYS.progress, {}) }
export function saveProgress(value) { localStorage.setItem(KEYS.progress, JSON.stringify(value)) }
export function getFavorites() { return read(KEYS.favorites, []) }
export function saveFavorites(value) { localStorage.setItem(KEYS.favorites, JSON.stringify(value)) }
export function getLastSelection() { return read(KEYS.lastSelection, null) }
export function saveLastSelection(value) { localStorage.setItem(KEYS.lastSelection, JSON.stringify(value)) }
export function getCountdownTarget() { return localStorage.getItem(KEYS.countdownTarget) || '' }
export function saveCountdownTarget(value) { localStorage.setItem(KEYS.countdownTarget, value) }

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export function createLocalBackup() {
  return {
    app: 'anhui-zsb-navigation',
    version: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      progress: getProgress(),
      favorites: getFavorites(),
      targetDate: getCountdownTarget() || null,
      lastSelection: getLastSelection(),
    },
  }
}

export function validateLocalBackup(input) {
  if (!isPlainObject(input) || input.app !== 'anhui-zsb-navigation') throw new Error('这不是升本导航备份文件')
  if (input.version !== BACKUP_SCHEMA_VERSION) throw new Error(`暂不支持备份版本 ${String(input.version)}`)
  if (!isPlainObject(input.data) || !isPlainObject(input.data.progress) || !Array.isArray(input.data.favorites)) throw new Error('备份数据结构不完整')
  const progress = {}
  for (const [key, value] of Object.entries(input.data.progress)) {
    if (!/^[0-9]{4}:[a-z0-9-]+:[a-z0-9-]+:[a-z0-9-]+:[a-z0-9-]+$/.test(key) || typeof value !== 'boolean') throw new Error('学习进度包含不受支持的字段')
    progress[key] = value
  }
  const favorites = [...new Set(input.data.favorites)]
  if (favorites.length > 2000 || favorites.some((id) => typeof id !== 'string' || !/^[a-z0-9-]{1,100}$/.test(id))) throw new Error('收藏列表格式无效')
  const targetDate = input.data.targetDate
  if (targetDate !== null && (typeof targetDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(targetDate))) throw new Error('目标日期格式无效')
  const selection = input.data.lastSelection
  if (selection !== null && (!isPlainObject(selection)
    || !Number.isInteger(Number(selection.year))
    || !/^[a-z0-9-]+$/.test(selection.provinceSlug || selection.province_slug || '')
    || !/^[a-z0-9-]+$/.test(selection.majorSlug || selection.major_slug || '')
    || (selection.school != null && !/^[a-z0-9-]+$/.test(selection.school)))) throw new Error('最后选择格式无效')
  return { progress, favorites, targetDate, lastSelection: selection }
}

export function importLocalBackup(input) {
  const validated = validateLocalBackup(input)
  const serialized = {
    progress: JSON.stringify(validated.progress),
    favorites: JSON.stringify(validated.favorites),
    lastSelection: JSON.stringify(validated.lastSelection),
  }
  localStorage.setItem(KEYS.progress, serialized.progress)
  localStorage.setItem(KEYS.favorites, serialized.favorites)
  localStorage.setItem(KEYS.lastSelection, serialized.lastSelection)
  if (validated.targetDate) localStorage.setItem(KEYS.countdownTarget, validated.targetDate)
  else localStorage.removeItem(KEYS.countdownTarget)
  return validated
}

export function progressKey(scope = DEFAULT_SCOPE, schoolSlug, pointId) {
  const normalized = normalizeScope(scope)
  return `${normalized.year}:${normalized.provinceSlug}:${normalized.majorSlug}:${schoolSlug}:${pointId}`
}
