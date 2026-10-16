import { describe, it, expect, beforeEach } from 'vitest'
import { generateId, loadNote, saveNote, deleteNote, getHashId, ADJECTIVES, STORAGE_PREFIX } from './lib.js'

describe('generateId', () => {
  it('produces non-empty strings', () => {
    for (let i = 0; i < 100; i++) {
      expect(generateId().length).toBeGreaterThan(0)
    }
  })

  it('starts with a known adjective', () => {
    for (let i = 0; i < 100; i++) {
      const id = generateId()
      const startsWithAdj = ADJECTIVES.some((a) => id.startsWith(a))
      expect(startsWithAdj).toBe(true)
    }
  })

  it('contains a 3-digit number between 100 and 999', () => {
    for (let i = 0; i < 100; i++) {
      const id = generateId()
      const match = id.match(/\d{3}/)
      expect(match).not.toBeNull()
      const num = parseInt(match[0], 10)
      expect(num).toBeGreaterThanOrEqual(100)
      expect(num).toBeLessThanOrEqual(999)
    }
  })

  it('ends with 5 random alphanumeric characters', () => {
    for (let i = 0; i < 100; i++) {
      const id = generateId()
      const tail = id.slice(-5)
      expect(tail).toMatch(/^[a-zA-Z2-9]{5}$/)
    }
  })

  it('generates mostly unique ids', () => {
    const ids = new Set(Array.from({ length: 200 }, () => generateId()))
    expect(ids.size).toBeGreaterThan(190)
  })
})

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('saves and loads a note', () => {
    saveNote('Test123abc', 'hello world')
    expect(loadNote('Test123abc')).toBe('hello world')
  })

  it('returns empty string for missing notes', () => {
    expect(loadNote('nope')).toBe('')
  })

  it('overwrites existing notes', () => {
    saveNote('Test123abc', 'first')
    saveNote('Test123abc', 'second')
    expect(loadNote('Test123abc')).toBe('second')
  })

  it('uses the kwiknote: prefix', () => {
    saveNote('Test123abc', 'data')
    expect(localStorage.getItem(STORAGE_PREFIX + 'Test123abc')).toBe('data')
  })

  it('deletes notes', () => {
    saveNote('Test123abc', 'data')
    deleteNote('Test123abc')
    expect(loadNote('Test123abc')).toBe('')
  })

  it('saves empty content', () => {
    saveNote('Empty999abc', '')
    expect(loadNote('Empty999abc')).toBe('')
  })
})

describe('getHashId', () => {
  it('returns null when hash is empty', () => {
    window.location.hash = ''
    expect(getHashId()).toBeNull()
  })

  it('returns the id without the #', () => {
    window.location.hash = '#Swift123abcd'
    expect(getHashId()).toBe('Swift123abcd')
  })
})
