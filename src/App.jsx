import { useState, useEffect, useCallback, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const ADJECTIVES = [
  'Swift', 'Bright', 'Calm', 'Bold', 'Keen', 'Wise', 'Warm', 'Cool', 'Quick', 'Quiet',
  'Sharp', 'Grand', 'Lucky', 'Merry', 'Noble', 'Proud', 'Silent', 'Gentle', 'Rapid', 'Emiliano',
  'Cosmic', 'Daring', 'Eager', 'Fancy', 'Golden', 'Happy', 'Jolly', 'Magic', 'Nimble', 'Pearl',
]

const STORAGE_PREFIX = 'kwiknote:'

function generateId() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const num = Math.floor(Math.random() * 900) + 100
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let rand = ''
  for (let i = 0; i < 5; i++) rand += chars[Math.floor(Math.random() * chars.length)]
  return `${adj}${num}${rand}`
}

function getNoteFromHash() {
  const hash = window.location.hash.slice(1)
  if (hash) return hash
  return null
}

function App() {
  const [noteId, setNoteId] = useState(() => getNoteFromHash() || generateId())
  const [content, setContent] = useState('')
  const [view, setView] = useState('edit')
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)
  const saveTimer = useRef(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_PREFIX + noteId)
      setContent(stored || '')
    } catch {
      setContent('')
    }

    if (!getNoteFromHash()) {
      history.replaceState(null, '', '#' + noteId)
    }
  }, [noteId])

  const saveNote = useCallback((text) => {
    try {
      localStorage.setItem(STORAGE_PREFIX + noteId, text)
      setSaved(true)
    } catch {
      setSaved(false)
    }
  }, [noteId])

  const handleChange = (e) => {
    const text = e.target.value
    setContent(text)
    setSaved(false)
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => saveNote(text), 400)
  }

  useEffect(() => {
    const handleHash = () => {
      const id = getNoteFromHash()
      if (id && id !== noteId) setNoteId(id)
    }
    window.addEventListener('hashchange', handleHash)
    return () => window.removeEventListener('hashchange', handleHash)
  }, [noteId])

  const newNote = () => {
    clearTimeout(saveTimer.current)
    const id = generateId()
    setNoteId(id)
    setContent('')
    setSaved(false)
    history.pushState(null, '', '#' + id)
  }

  const copyLink = async () => {
    const url = window.location.origin + window.location.pathname + '#' + noteId
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareUrl = window.location.origin + window.location.pathname + '#' + noteId

  return (
    <div className="app">
      <div className="toolbar">
        <div className="toolbar-left">
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

      <div className="main">
        {view === 'edit' ? (
          <div className="editor-pane">
            <textarea
              value={content}
              onChange={handleChange}
              placeholder="Start writing..."
              autoFocus
            />
          </div>
        ) : (
          <div className="preview-pane">
            {content ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            ) : (
              <div className="empty-hint">Nothing to preview yet. Start writing!</div>
            )}
          </div>
        )}
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
