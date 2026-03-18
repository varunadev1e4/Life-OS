import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, LayoutDashboard, Library, BookOpen, CheckSquare,
  Target, BarChart2, Settings, StickyNote, Wallet, PartyPopper,
  Heart, Bookmark, Plus, ArrowRight, Clock, Hash,
} from 'lucide-react'
import { useItemsStore, useNotesStore, useBookmarksStore } from '@/lib/store'

// ── Types ─────────────────────────────────────────────────────
interface Command {
  id: string
  label: string
  sublabel?: string
  icon: React.ReactNode
  category: string
  action: () => void
  keywords?: string[]
}

// ── Hook to open/close from anywhere ─────────────────────────
let _setOpen: ((v: boolean) => void) | null = null
export function openCommandPalette() { _setOpen?.(true) }
export function closeCommandPalette() { _setOpen?.(false) }

// ── Main component ────────────────────────────────────────────
export function CommandPalette() {
  const [isOpen, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const { items } = useItemsStore()
  const { notes } = useNotesStore()
  const { bookmarks } = useBookmarksStore()

  // Expose open/close globally
  useEffect(() => { _setOpen = setOpen; return () => { _setOpen = null } }, [])

  // ⌘K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(o => !o)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelected(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Navigation commands
  const navCommands: Command[] = useMemo(() => [
    { id: 'nav-dash',      label: 'Dashboard',     icon: <LayoutDashboard size={15} />, category: 'Navigate', action: () => navigate('/'),          keywords: ['home'] },
    { id: 'nav-lib',       label: 'Library',        icon: <Library size={15} />,         category: 'Navigate', action: () => navigate('/library'),    keywords: ['books','movies'] },
    { id: 'nav-journal',   label: 'Journal',        icon: <BookOpen size={15} />,        category: 'Navigate', action: () => navigate('/journal'),    keywords: ['diary','log'] },
    { id: 'nav-habits',    label: 'Habits',         icon: <CheckSquare size={15} />,     category: 'Navigate', action: () => navigate('/habits'),     keywords: ['streak','routine'] },
    { id: 'nav-goals',     label: 'Goals',          icon: <Target size={15} />,          category: 'Navigate', action: () => navigate('/goals'),      keywords: ['targets'] },
    { id: 'nav-notes',     label: 'Notes',          icon: <StickyNote size={15} />,      category: 'Navigate', action: () => navigate('/notes'),      keywords: ['ideas'] },
    { id: 'nav-expenses',  label: 'Expenses',       icon: <Wallet size={15} />,          category: 'Navigate', action: () => navigate('/expenses'),   keywords: ['money','budget','spend'] },
    { id: 'nav-occasions', label: 'Occasions',      icon: <PartyPopper size={15} />,     category: 'Navigate', action: () => navigate('/occasions'),  keywords: ['birthday','events'] },
    { id: 'nav-health',    label: 'Health Tracker', icon: <Heart size={15} />,           category: 'Navigate', action: () => navigate('/health'),     keywords: ['water','steps','sleep'] },
    { id: 'nav-bookmarks', label: 'Bookmarks',      icon: <Bookmark size={15} />,        category: 'Navigate', action: () => navigate('/bookmarks'),  keywords: ['links','readlater'] },
    { id: 'nav-analytics', label: 'Analytics',      icon: <BarChart2 size={15} />,       category: 'Navigate', action: () => navigate('/analytics'),  keywords: ['stats','charts'] },
    { id: 'nav-settings',  label: 'Settings',       icon: <Settings size={15} />,        category: 'Navigate', action: () => navigate('/settings'),   keywords: ['theme','pin'] },
  ], [navigate])

  const quickAddCommands: Command[] = useMemo(() => [
    { id: 'add-item',      label: 'Add to Library',     sublabel: 'Book, movie, course…', icon: <Plus size={15} />, category: 'Quick Add', action: () => { navigate('/library?add=1'); setOpen(false) }, keywords: ['book','movie','course','add'] },
    { id: 'add-journal',   label: 'Write Journal Entry', sublabel: "Today's entry",       icon: <Plus size={15} />, category: 'Quick Add', action: () => { navigate('/journal?add=1'); setOpen(false) }, keywords: ['journal','write','diary'] },
    { id: 'add-note',      label: 'New Note',            sublabel: 'Capture a thought',   icon: <Plus size={15} />, category: 'Quick Add', action: () => { navigate('/notes?add=1'); setOpen(false) }, keywords: ['note','idea','capture'] },
    { id: 'add-expense',   label: 'Log Expense',         sublabel: 'Quick expense entry', icon: <Plus size={15} />, category: 'Quick Add', action: () => { navigate('/expenses?add=1'); setOpen(false) }, keywords: ['expense','spend','money'] },
    { id: 'add-bookmark',  label: 'Save Bookmark',       sublabel: 'Save a URL',          icon: <Plus size={15} />, category: 'Quick Add', action: () => { navigate('/bookmarks?add=1'); setOpen(false) }, keywords: ['bookmark','link','save'] },
  ], [navigate])

  // Search across real content
  const contentCommands: Command[] = useMemo(() => {
    if (!query || query.length < 2) return []
    const q = query.toLowerCase()
    const results: Command[] = []

    items.filter(i => i.title.toLowerCase().includes(q)).slice(0, 4).forEach(item => {
      results.push({
        id: `item-${item.id}`, label: item.title,
        sublabel: item.type + (item.status !== 'not_started' ? ` · ${item.status}` : ''),
        icon: <Library size={15} />, category: 'Library',
        action: () => { navigate(`/library/${item.id}`); setOpen(false) },
      })
    })

    notes.filter(n => n.title?.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)).slice(0, 3).forEach(note => {
      results.push({
        id: `note-${note.id}`, label: note.title || 'Untitled note',
        sublabel: note.content.slice(0, 60),
        icon: <StickyNote size={15} />, category: 'Notes',
        action: () => { navigate('/notes'); setOpen(false) },
      })
    })

    bookmarks.filter(b => b.title.toLowerCase().includes(q) || b.url.toLowerCase().includes(q)).slice(0, 3).forEach(bm => {
      results.push({
        id: `bm-${bm.id}`, label: bm.title,
        sublabel: bm.url.replace(/^https?:\/\//, '').slice(0, 50),
        icon: <Bookmark size={15} />, category: 'Bookmarks',
        action: () => { window.open(bm.url, '_blank'); setOpen(false) },
      })
    })

    return results
  }, [query, items, notes, bookmarks, navigate])

  // Filter nav + quick add commands
  const filteredCommands = useMemo(() => {
    const q = query.toLowerCase()
    if (!q) return [...quickAddCommands, ...navCommands]
    const matches = [...quickAddCommands, ...navCommands].filter(c =>
      c.label.toLowerCase().includes(q) ||
      c.sublabel?.toLowerCase().includes(q) ||
      c.keywords?.some(k => k.includes(q))
    )
    return [...contentCommands, ...matches]
  }, [query, navCommands, quickAddCommands, contentCommands])

  // Keyboard nav
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, filteredCommands.length - 1)) }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
      if (e.key === 'Enter' && filteredCommands[selected]) {
        filteredCommands[selected].action()
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, filteredCommands, selected])

  useEffect(() => { setSelected(0) }, [query])

  // Group by category
  const grouped = useMemo(() => {
    const groups: Record<string, Command[]> = {}
    filteredCommands.forEach(c => {
      if (!groups[c.category]) groups[c.category] = []
      groups[c.category].push(c)
    })
    return groups
  }, [filteredCommands])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[12vh] px-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="relative w-full max-w-xl rounded-2xl overflow-hidden"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
            }}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border-subtle)]">
              <Search size={16} className="text-[var(--text-muted)] shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search or jump to..."
                className="flex-1 bg-transparent text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm outline-none"
              />
              <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono text-[var(--text-muted)] border border-[var(--border)]">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-[420px] overflow-y-auto py-2">
              {filteredCommands.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-sm text-[var(--text-muted)]">No results for "{query}"</p>
                </div>
              ) : (
                Object.entries(grouped).map(([category, cmds]) => {
                  return (
                    <div key={category}>
                      <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                        {category}
                      </p>
                      {cmds.map((cmd) => {
                        const globalIdx = filteredCommands.indexOf(cmd)
                        const isSelected = globalIdx === selected
                        return (
                          <button
                            key={cmd.id}
                            onClick={() => { cmd.action(); setOpen(false) }}
                            onMouseEnter={() => setSelected(globalIdx)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left"
                            style={{ background: isSelected ? 'var(--bg-elevated)' : 'transparent' }}
                          >
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                              style={{ background: isSelected ? 'rgba(124,106,247,0.15)' : 'var(--bg-overlay)', color: isSelected ? 'var(--accent-violet)' : 'var(--text-secondary)' }}>
                              {cmd.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate" style={{ color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                                {cmd.label}
                              </p>
                              {cmd.sublabel && (
                                <p className="text-xs text-[var(--text-muted)] truncate">{cmd.sublabel}</p>
                              )}
                            </div>
                            {isSelected && <ArrowRight size={14} className="text-[var(--accent-violet)] shrink-0" />}
                          </button>
                        )
                      })}
                    </div>
                  )
                })
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 px-4 py-2.5 border-t border-[var(--border-subtle)]">
              {[['↑↓', 'Navigate'], ['↵', 'Select'], ['esc', 'Close']].map(([key, label]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono text-[var(--text-muted)] border border-[var(--border)] bg-[var(--bg-elevated)]">{key}</kbd>
                  <span className="text-[10px] text-[var(--text-muted)]">{label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}