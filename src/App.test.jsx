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
})
