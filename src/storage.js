import { DEFAULT_SCOPE, normalizeScope } from './contentScope'

const KEYS = {
  progress: 'zsb:v1:progress', favorites: 'zsb:v1:favorites', lastSelection: 'zsb:v1:lastSelection',
}

function read(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback }
}

export function getProgress() { return read(KEYS.progress, {}) }
export function saveProgress(value) { localStorage.setItem(KEYS.progress, JSON.stringify(value)) }
export function getFavorites() { return read(KEYS.favorites, []) }
export function saveFavorites(value) { localStorage.setItem(KEYS.favorites, JSON.stringify(value)) }
export function saveLastSelection(value) { localStorage.setItem(KEYS.lastSelection, JSON.stringify(value)) }

export function progressKey(scope = DEFAULT_SCOPE, schoolSlug, pointId) {
  const normalized = normalizeScope(scope)
  return `${normalized.year}:${normalized.provinceSlug}:${normalized.majorSlug}:${schoolSlug}:${pointId}`
}
