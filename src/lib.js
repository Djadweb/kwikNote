export const ADJECTIVES = [
  'Swift', 'Bright', 'Calm', 'Bold', 'Keen', 'Wise', 'Warm', 'Cool', 'Quick', 'Quiet',
  'Sharp', 'Grand', 'Lucky', 'Merry', 'Noble', 'Proud', 'Silent', 'Gentle', 'Rapid', 'Emiliano',
  'Cosmic', 'Daring', 'Eager', 'Fancy', 'Golden', 'Happy', 'Jolly', 'Magic', 'Nimble', 'Pearl',
]

export const STORAGE_PREFIX = 'kwiknote:'

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
    return true
  } catch {
    return false
  }
}

export function deleteNote(id) {
  try {
    localStorage.removeItem(STORAGE_PREFIX + id)
  } catch {}
}

export function getHashId() {
  return window.location.hash.slice(1) || null
}
