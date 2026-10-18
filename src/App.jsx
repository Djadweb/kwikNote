import { useState, useEffect, useCallback, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { generateId, loadNote, saveNote, getHashId, STORAGE_PREFIX } from './lib.js'

function App() {
  const [noteId, setNoteId] = useState(() => getHashId() || generateId())
  const [content, setContent] = useState('')
  const [view, setView] = useState('edit')
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)
  const saveTimer = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [content, view])

  useEffect(() => {
    setContent(loadNote(noteId))
    if (!getHashId()) {
      history.replaceState(null, '', '#' + noteId)
    }
  }, [noteId])

  const persist = useCallback((text) => {
    const ok = saveNote(noteId, text)
    setSaved(ok)
  }, [noteId])

  const handleChange = (e) => {
    const text = e.target.value
    setContent(text)
    setSaved(false)
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => persist(text), 400)
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
              ref={textareaRef}
              value={content}
              onChange={handleChange}
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
