import { useState, useEffect, useCallback, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { generateId, loadNote, saveNote, deleteNote, getHashId, listNotes, hasNote } from './lib.js'

const INDENT = '  '
const LIST_LINE = /^\s*([-*+]|\d+[.)])(\s|$)/
const MARKER_ONLY = /^\s*([-*+]|\d+[.)])\s*$/

function isListLine(line) {
  return LIST_LINE.test(line)
}

function relativeTime(ts) {
  if (!ts) return ''
  const minutes = Math.floor((Date.now() - ts) / 60000)
  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function App() {
  const [noteId, setNoteId] = useState(() => getHashId() || generateId())
  const [content, setContent] = useState('')
  const [view, setView] = useState('edit')
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)
  const [notes, setNotes] = useState([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [query, setQuery] = useState('')
  const saveTimer = useRef(null)
  const textareaRef = useRef(null)
  const pendingSelection = useRef(null)

  const refreshNotes = useCallback(() => setNotes(listNotes()), [])

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [content, view])

  useEffect(() => {
    if (pendingSelection.current == null || !textareaRef.current) return
    const el = textareaRef.current
    const { start, end } = pendingSelection.current
    el.selectionStart = start
    el.selectionEnd = end
    pendingSelection.current = null
  }, [content])

  useEffect(() => {
    setContent(loadNote(noteId))
    if (!getHashId()) {
      history.replaceState(null, '', '#' + noteId)
    }
  }, [noteId])

  useEffect(() => {
    refreshNotes()
  }, [refreshNotes])

  const persist = useCallback((text) => {
    const ok = saveNote(noteId, text)
    setSaved(ok)
    refreshNotes()
  }, [noteId, refreshNotes])

  const updateContent = useCallback(
    (text) => {
      setContent(text)
      setSaved(false)
      clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => persist(text), 400)
    },
    [persist]
  )

  const handleChange = (e) => {
    updateContent(e.target.value)
  }

  useEffect(() => {
    const handleHash = () => {
      const id = getHashId()
      if (id && id !== noteId) setNoteId(id)
    }
    window.addEventListener('hashchange', handleHash)
    return () => window.removeEventListener('hashchange', handleHash)
  }, [noteId])

  useEffect(() => () => clearTimeout(saveTimer.current), [])

  const handleTab = (e) => {
    const el = e.currentTarget
    const value = el.value
    const selStart = el.selectionStart
    const selEnd = el.selectionEnd

    const lineStart = value.lastIndexOf('\n', selStart - 1) + 1
    let lineEnd = value.indexOf('\n', selEnd)
    if (lineEnd === -1) lineEnd = value.length

    const lines = value.slice(lineStart, lineEnd).split('\n')
    if (!lines.every(isListLine)) return

    e.preventDefault()

    const outdent = e.shiftKey
    const newLines = []
    const shifts = []
    for (const line of lines) {
      if (outdent) {
        const lead = line.match(/^[ \t]+/)
        const removed = lead ? Math.min(lead[0].length, INDENT.length) : 0
        newLines.push(line.slice(removed).replace(/^([-*+]|\d+[.)])[ \t]+$/, '$1'))
        shifts.push(-removed)
      } else {
        const markerOnly = MARKER_ONLY.test(line)
        newLines.push(INDENT + (markerOnly && !/\s$/.test(line) ? line + ' ' : line))
        shifts.push(INDENT.length)
      }
    }

    const offsets = []
    let acc = 0
    for (const line of lines) {
      offsets.push(acc)
      acc += line.length + 1
    }
    const newOffsets = []
    let newAcc = 0
    for (const line of newLines) {
      newOffsets.push(newAcc)
      newAcc += line.length + 1
    }

    const locate = (pos) => {
      const p = Math.max(0, Math.min(pos, acc - 1))
      let i = 0
      while (i < lines.length - 1 && offsets[i + 1] <= p) i++
      return { i, off: p - offsets[i] }
    }

    const map = ({ i, off }) => {
      let within
      if (outdent) {
        within = Math.max(0, off + shifts[i])
      } else if (MARKER_ONLY.test(lines[i])) {
        within = newLines[i].length
      } else {
        within = off + shifts[i]
      }
      return newOffsets[i] + Math.min(within, newLines[i].length)
    }

    const next = value.slice(0, lineStart) + newLines.join('\n') + value.slice(lineEnd)
    pendingSelection.current = {
      start: lineStart + map(locate(selStart - lineStart)),
      end: lineStart + map(locate(selEnd - lineStart)),
    }
    updateContent(next)
  }

  const handleKeyDown = (e) => {
    if (e.nativeEvent?.isComposing) return
    if (e.key === 'Tab') {
      handleTab(e)
      return
    }
    if (e.key !== 'Enter' || e.shiftKey) return
    const el = e.currentTarget
    if (el.selectionStart !== el.selectionEnd) return

    const value = el.value
    const caret = el.selectionStart
    const lineStart = value.lastIndexOf('\n', caret - 1) + 1
    const lineEnd = value.indexOf('\n', caret)
    const line = value.slice(lineStart, lineEnd === -1 ? value.length : lineEnd)
    const match = line.match(/^(\s*)([-*+]|\d+[.)])\s+(.*)$/)
    if (!match) return

    const [, indent, marker, rest] = match
    e.preventDefault()

    let next
    let nextCaret
    if (rest.trim() === '') {
      next = value.slice(0, lineStart) + value.slice(caret)
      nextCaret = lineStart
    } else {
      const ordered = marker.match(/^(\d+)([.)])$/)
      const nextMarker = ordered ? `${Number(ordered[1]) + 1}${ordered[2]}` : marker
      const insert = `\n${indent}${nextMarker} `
      next = value.slice(0, caret) + insert + value.slice(caret)
      nextCaret = caret + insert.length
    }

    pendingSelection.current = { start: nextCaret, end: nextCaret }
    updateContent(next)
  }

  const newNote = () => {
    clearTimeout(saveTimer.current)
    const id = generateId()
    setNoteId(id)
    setContent('')
    setSaved(false)
    history.pushState(null, '', '#' + id)
  }

  const selectNote = (id) => {
    setSidebarOpen(false)
    if (id === noteId) return
    clearTimeout(saveTimer.current)
    if (content || hasNote(noteId)) {
      saveNote(noteId, content)
      refreshNotes()
    }
    setNoteId(id)
    setSaved(true)
    history.pushState(null, '', '#' + id)
  }

  const removeNote = (id) => {
    if (!window.confirm('Delete this note?')) return
    deleteNote(id)
    if (id === noteId) {
      clearTimeout(saveTimer.current)
      const freshId = generateId()
      setNoteId(freshId)
      setContent('')
      setSaved(false)
      history.pushState(null, '', '#' + freshId)
    }
    refreshNotes()
  }

  const copyLink = async () => {
    const url = window.location.origin + window.location.pathname + '#' + noteId
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareUrl = window.location.origin + window.location.pathname + '#' + noteId
  const search = query.trim().toLowerCase()
  const filteredNotes = search
    ? notes.filter((note) => `${note.title} ${note.preview}`.toLowerCase().includes(search))
    : notes

  return (
    <div className="app">
      <div className="toolbar">
        <div className="toolbar-left">
          <button
            className="btn notes-toggle"
            onClick={() => setSidebarOpen((open) => !open)}
            aria-label="Toggle notes sidebar"
            aria-expanded={sidebarOpen}
            aria-controls="notes-sidebar"
          >
            ☰
          </button>
          <div className="logo">kwik<span>Note</span></div>
          <div className={'status' + (saved ? ' saved' : '')}>{saved ? 'Saved' : 'Editing...'}</div>
        </div>
        <div className="toolbar-right">
          <button className="btn" onClick={newNote}>New Note</button>
          <button
            className={'btn' + (view === 'edit' ? ' active' : '')}
            onClick={() => setView('edit')}
          >Write</button>
          <button
            className={'btn' + (view === 'preview' ? ' active' : '')}
            onClick={() => setView('preview')}
          >Preview</button>
          <button className="btn btn-primary" onClick={copyLink}>
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>

      <div className="layout">
        {sidebarOpen && (
          <aside id="notes-sidebar" className="sidebar">
            <div className="sidebar-header">
              <button
                className="icon-btn"
                aria-label="Close sidebar"
                onClick={() => setSidebarOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="sidebar-search">
              <span className="search-icon" aria-hidden="true">⌕</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search notes"
                aria-label="Search notes"
              />
            </div>
            <div className="sidebar-list">
              {filteredNotes.length === 0 ? (
                <div className="sidebar-empty">
                  {notes.length === 0 ? 'No saved notes yet.' : 'No notes match your search.'}
                </div>
              ) : (
                filteredNotes.map((note) => (
                  <div
                    key={note.id}
                    className={'note-row' + (note.id === noteId ? ' active' : '')}
                  >
                    <button className="note-row-main" onClick={() => selectNote(note.id)}>
                      <span className="note-row-meta">
                        <span className="note-time">{relativeTime(note.updatedAt)}</span>
                      </span>
                      <span className="note-title">{note.title}</span>
                      {note.preview && <span className="note-preview">{note.preview}</span>}
                    </button>
                    <button
                      className="note-delete"
                      aria-label={`Delete ${note.title}`}
                      onClick={() => removeNote(note.id)}
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          </aside>
        )}

        <div className="main">
          {view === 'edit' ? (
            <div className="editor-pane">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="Start writing..."
                autoFocus
              />
            </div>
          ) : (
            <div className="preview-pane">
              <div className="preview-content">
                {content ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                ) : (
                  <div className="empty-hint">Nothing to preview yet. Start writing!</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="footer">
        <span>kwikNote — notes saved in your browser</span>
        <span>
          <a href={shareUrl} target="_blank" rel="noreferrer">Share link</a>
          {' · '}
          {content.length} characters
        </span>
      </div>
    </div>
  )
}

export default App
