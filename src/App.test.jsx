import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import App from './App.jsx'
import { STORAGE_PREFIX } from './lib.js'

describe('App component', () => {
  beforeEach(() => {
    localStorage.clear()
    window.location.hash = ''
    vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the toolbar with logo and buttons', () => {
    render(<App />)
    expect(screen.getByText('kwik')).toBeInTheDocument()
    expect(screen.getByText('Note').closest('.logo')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'New Note' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Write' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Preview' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Copy Link/ })).toBeInTheDocument()
  })

  it('shows the textarea editor by default', () => {
    render(<App />)
    expect(screen.getByPlaceholderText('Start writing...')).toBeInTheDocument()
  })

  it('assigns a hash id on first load', () => {
    render(<App />)
    expect(window.location.hash).toMatch(/^#[A-Z][a-zA-Z0-9]+$/)
  })

  it('persists typed content to localStorage after debounce', async () => {
    render(<App />)
    const editor = screen.getByPlaceholderText('Start writing...')
    fireEvent.change(editor, { target: { value: 'my note text' } })
    await act(() => {
      return new Promise((r) => setTimeout(r, 500))
    })
    const id = window.location.hash.slice(1)
    expect(localStorage.getItem(STORAGE_PREFIX + id)).toBe('my note text')
  })

  it('loads existing note from hash on mount', () => {
    localStorage.setItem(STORAGE_PREFIX + 'Swift123abcde', 'loaded content')
    window.location.hash = '#Swift123abcde'
    render(<App />)
    const editor = screen.getByPlaceholderText('Start writing...')
    expect(editor.value).toBe('loaded content')
  })

  it('switches to preview and renders markdown', async () => {
    render(<App />)
    const editor = screen.getByPlaceholderText('Start writing...')
    fireEvent.change(editor, { target: { value: '# Hello World' } })
    fireEvent.click(screen.getByRole('button', { name: 'Preview' }))
    expect(screen.getByRole('heading', { name: 'Hello World' })).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Start writing...')).not.toBeInTheDocument()
  })

  it('preview shows hint when content is empty', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Preview' }))
    expect(screen.getByText(/Nothing to preview yet/)).toBeInTheDocument()
  })

  it('creates a new note with a fresh id', async () => {
    render(<App />)
    const firstHash = window.location.hash
    fireEvent.click(screen.getByRole('button', { name: 'New Note' }))
    await waitFor(() => {
      expect(window.location.hash).not.toBe(firstHash)
      expect(window.location.hash).toMatch(/^#[A-Za-z0-9]+$/)
    })
  })

  it('shows character count in footer', () => {
    render(<App />)
    const editor = screen.getByPlaceholderText('Start writing...')
    fireEvent.change(editor, { target: { value: 'abcde' } })
    expect(screen.getByText(/5 characters/)).toBeInTheDocument()
  })

  it('copy link button changes text to Copied and calls clipboard', async () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /Copy Link/ }))
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Copied!' })).toBeInTheDocument()
    })
    expect(navigator.clipboard.writeText).toHaveBeenCalled()
  })

  it('Write and Preview buttons toggle active state', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: 'Write' })).toHaveClass('active')
    fireEvent.click(screen.getByRole('button', { name: 'Preview' }))
    expect(screen.getByRole('button', { name: 'Preview' })).toHaveClass('active')
    expect(screen.getByRole('button', { name: 'Write' })).not.toHaveClass('active')
  })

  it('opens and closes the notes sidebar', () => {
    render(<App />)
    expect(screen.queryByText('Saved notes')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Toggle notes sidebar' }))
    expect(screen.getByText('Saved notes')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Close sidebar' }))
    expect(screen.queryByText('Saved notes')).not.toBeInTheDocument()
  })

  it('lists saved notes in the sidebar', () => {
    localStorage.setItem(STORAGE_PREFIX + 'Alpha123', 'Alpha note')
    localStorage.setItem(STORAGE_PREFIX + 'Beta456', '# Beta note')
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Toggle notes sidebar' }))
    expect(screen.getByText('Alpha note')).toBeInTheDocument()
    expect(screen.getByText('Beta note')).toBeInTheDocument()
  })

  it('opens a note from the sidebar', async () => {
    localStorage.setItem(STORAGE_PREFIX + 'Alpha123', 'Alpha note content')
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Toggle notes sidebar' }))
    fireEvent.click(screen.getByText('Alpha note content'))
    await waitFor(() => {
      expect(window.location.hash).toBe('#Alpha123')
      expect(screen.getByPlaceholderText('Start writing...').value).toBe('Alpha note content')
    })
    expect(screen.queryByText('Saved notes')).not.toBeInTheDocument()
  })

  it('does not create an empty entry when leaving an untouched blank note', () => {
    localStorage.setItem(STORAGE_PREFIX + 'Alpha123', 'Alpha content')
    render(<App />)
    const blankId = window.location.hash.slice(1)
    fireEvent.click(screen.getByRole('button', { name: 'Toggle notes sidebar' }))
    fireEvent.click(screen.getByText('Alpha content'))
    fireEvent.click(screen.getByRole('button', { name: 'Toggle notes sidebar' }))
    expect(screen.queryByText('Untitled')).not.toBeInTheDocument()
    expect(localStorage.getItem(STORAGE_PREFIX + blankId)).toBeNull()
  })

  it('deletes a note from the sidebar', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    localStorage.setItem(STORAGE_PREFIX + 'Alpha123', 'Alpha note content')
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Toggle notes sidebar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Delete Alpha note content' }))
    await waitFor(() => {
      expect(screen.queryByText('Alpha note content')).not.toBeInTheDocument()
    })
    expect(localStorage.getItem(STORAGE_PREFIX + 'Alpha123')).toBeNull()
  })

  it('continues a hyphen list on Enter', () => {
    render(<App />)
    const editor = screen.getByPlaceholderText('Start writing...')
    fireEvent.change(editor, { target: { value: '- buy milk' } })
    editor.selectionStart = editor.selectionEnd = editor.value.length
    fireEvent.keyDown(editor, { key: 'Enter' })
    expect(editor.value).toBe('- buy milk\n- ')
  })

  it('continues an asterisk list on Enter', () => {
    render(<App />)
    const editor = screen.getByPlaceholderText('Start writing...')
    fireEvent.change(editor, { target: { value: '* task' } })
    editor.selectionStart = editor.selectionEnd = editor.value.length
    fireEvent.keyDown(editor, { key: 'Enter' })
    expect(editor.value).toBe('* task\n* ')
  })

  it('increments ordered lists on Enter', () => {
    render(<App />)
    const editor = screen.getByPlaceholderText('Start writing...')
    fireEvent.change(editor, { target: { value: '1. first' } })
    editor.selectionStart = editor.selectionEnd = editor.value.length
    fireEvent.keyDown(editor, { key: 'Enter' })
    expect(editor.value).toBe('1. first\n2. ')
  })

  it('ends a list when Enter is pressed on an empty item', () => {
    render(<App />)
    const editor = screen.getByPlaceholderText('Start writing...')
    fireEvent.change(editor, { target: { value: '- item\n- ' } })
    editor.selectionStart = editor.selectionEnd = editor.value.length
    fireEvent.keyDown(editor, { key: 'Enter' })
    expect(editor.value).toBe('- item\n')
  })
})
