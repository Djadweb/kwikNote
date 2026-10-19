export const ADJECTIVES = [
  'Swift', 'Bright', 'Calm', 'Bold', 'Keen', 'Wise', 'Warm', 'Cool', 'Quick', 'Quiet',
  'Sharp', 'Grand', 'Lucky', 'Merry', 'Noble', 'Proud', 'Silent', 'Gentle', 'Rapid', 'Emiliano',
  'Cosmic', 'Daring', 'Eager', 'Fancy', 'Golden', 'Happy', 'Jolly', 'Magic', 'Nimble', 'Pearl',
]

export const STORAGE_PREFIX = 'kwiknote:'
const META_PREFIX = STORAGE_PREFIX + 'meta:'

export function generateId() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const num = Math.floor(Math.random() * 900) + 100
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let rand = ''
  for (let i = 0; i < 5; i++) rand += chars[Math.floor(Math.random() * chars.length)]
  return `${adj}${num}${rand}`
}

export function loadNote(id) {
  try {
    return localStorage.getItem(STORAGE_PREFIX + id) || ''
  } catch {
    return ''
  }
}

export function saveNote(id, text) {
  try {
    localStorage.setItem(STORAGE_PREFIX + id, text)
    localStorage.setItem(META_PREFIX + id, String(Date.now()))
    return true
  } catch {
    return false
  }
}

export function deleteNote(id) {
  try {
    localStorage.removeItem(STORAGE_PREFIX + id)
    localStorage.removeItem(META_PREFIX + id)
  } catch {}
}

export function hasNote(id) {
  try {
    return localStorage.getItem(STORAGE_PREFIX + id) !== null
  } catch {
    return false
  }
}

export function noteTitle(text) {
  const line = (text || '')
    .split('\n')
    .map((l) => l.trim())
    .find(Boolean)
  if (!line) return 'Untitled'
  const cleaned = line.replace(/^#+\s*/, '').replace(/^[-*+]\s+/, '')
  return cleaned.length > 40 ? cleaned.slice(0, 40).trimEnd() + '…' : cleaned
}

export function listNotes() {
  const notes = []
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key || !key.startsWith(STORAGE_PREFIX) || key.startsWith(META_PREFIX)) continue
      const id = key.slice(STORAGE_PREFIX.length)
      notes.push({
        id,
        title: noteTitle(localStorage.getItem(key)),
        updatedAt: Number(localStorage.getItem(META_PREFIX + id)) || 0,
      })
    }
  } catch {}
  return notes.sort((a, b) => b.updatedAt - a.updatedAt)
}

export function getHashId() {
  return window.location.hash.slice(1) || null
}
