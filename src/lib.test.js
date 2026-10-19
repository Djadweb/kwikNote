import { describe, it, expect, beforeEach } from 'vitest'
import { generateId, loadNote, saveNote, deleteNote, getHashId, listNotes, noteTitle, hasNote, ADJECTIVES, STORAGE_PREFIX } from './lib.js'

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

  it('reports whether a note exists', () => {
    expect(hasNote('Nope123abc')).toBe(false)
    saveNote('Yes123abcd', 'hi')
    expect(hasNote('Yes123abcd')).toBe(true)
    deleteNote('Yes123abcd')
    expect(hasNote('Yes123abcd')).toBe(false)
  })
})

describe('noteTitle', () => {
  it('uses the first non-empty line', () => {
    expect(noteTitle('\n\n  My first note  \nbody')).toBe('My first note')
  })

  it('strips markdown heading markers', () => {
    expect(noteTitle('# Grocery list')).toBe('Grocery list')
  })

  it('falls back to Untitled for empty content', () => {
    expect(noteTitle('')).toBe('Untitled')
    expect(noteTitle('   \n  ')).toBe('Untitled')
  })

  it('truncates long titles', () => {
    const title = noteTitle('x'.repeat(100))
    expect(title.length).toBeLessThanOrEqual(41)
    expect(title.endsWith('…')).toBe(true)
  })
})

describe('listNotes', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('lists saved notes with ids and titles', () => {
    saveNote('One123abc', 'First note')
    saveNote('Two456def', 'Second note')
    const notes = listNotes()
    expect(notes.map((n) => n.id).sort()).toEqual(['One123abc', 'Two456def'])
    expect(notes.find((n) => n.id === 'One123abc').title).toBe('First note')
  })

  it('sorts most recently saved first', () => {
    saveNote('Old123abc', 'old')
    const old = Number(localStorage.getItem(STORAGE_PREFIX + 'meta:Old123abc'))
    localStorage.setItem(STORAGE_PREFIX + 'meta:Old123abc', String(old - 5000))
    saveNote('New456def', 'new')
    expect(listNotes()[0].id).toBe('New456def')
  })

  it('includes legacy notes without metadata', () => {
    localStorage.setItem(STORAGE_PREFIX + 'Legacy123', 'legacy content')
    const notes = listNotes()
    expect(notes).toHaveLength(1)
    expect(notes[0]).toMatchObject({ id: 'Legacy123', title: 'legacy content', updatedAt: 0 })
  })

  it('does not include metadata keys as notes', () => {
    saveNote('One123abc', 'First note')
    expect(listNotes()).toHaveLength(1)
  })

  it('removes notes and their metadata on delete', () => {
    saveNote('One123abc', 'First note')
    deleteNote('One123abc')
    expect(listNotes()).toHaveLength(0)
    expect(localStorage.getItem(STORAGE_PREFIX + 'meta:One123abc')).toBeNull()
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
