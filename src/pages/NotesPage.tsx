import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Pin, Archive, Trash2, X, Tag, Grid3X3, List, Palette } from 'lucide-react'
import { useNotesStore } from '@/lib/store'
import { useToast } from '@/context/ToastContext'
import { ConfirmDialog } from '@/components/ui'
import { formatRelative } from '@/utils/helpers'
import type { Note } from '@/types'

const NOTE_COLORS = [
  { label: 'Default',  bg: '#1a1a22', border: '#26262e' },
  { label: 'Green',    bg: '#0f1f0f', border: '#1a3a1a' },
  { label: 'Purple',   bg: '#1a1030', border: '#2d1f4a' },
  { label: 'Blue',     bg: '#0a1628', border: '#1a2d4a' },
  { label: 'Amber',    bg: '#1f1500', border: '#3a2800' },
  { label: 'Rose',     bg: '#1f0a0a', border: '#3a1515' },
  { label: 'Teal',     bg: '#001f1f', border: '#003a3a' },
  { label: 'Slate',    bg: '#111118', border: '#2a2a35' },
]

export function NotesPage() {
  const { notes, isLoading, fetchNotes, addNote, updateNote, deleteNote, pinNote, archiveNote } = useNotesStore()
  const { success, error: showError } = useToast()
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [layout, setLayout] = useState<'grid' | 'list'>('grid')
  const [deleteTarget, setDeleteTarget] = useState<Note | null>(null)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => { fetchNotes() }, [fetchNotes])

  // All unique tags across all notes
  const allTags = [...new Set(notes.flatMap(n => n.tags))].sort()

  const filtered = notes.filter(n => {
    const q = search.toLowerCase()
    const matchSearch = !q || n.title?.toLowerCase().includes(q) || n.content.toLowerCase().includes(q) || n.tags.some(t => t.includes(q))
    const matchTag = !activeTag || n.tags.includes(activeTag)
    return matchSearch && matchTag
  })

  const pinned = filtered.filter(n => n.is_pinned)
  const unpinned = filtered.filter(n => !n.is_pinned)

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteNote(deleteTarget.id)
      success('Note deleted')
      setDeleteTarget(null)
    } catch {
      showError('Failed to delete note')
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-[var(--text-primary)] tracking-tight">Notes</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">{notes.length} notes</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-95"
          style={{ background: 'var(--accent-violet)', boxShadow: '0 0 20px rgba(124,106,247,0.3)' }}
        >
          <Plus size={16} /> New Note
        </button>
      </div>

      {/* Search + toolbar */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search notes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-violet)] transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
              <X size={14} />
            </button>
          )}
        </div>
        <button
          onClick={() => setLayout(l => l === 'grid' ? 'list' : 'grid')}
          className="px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          {layout === 'grid' ? <List size={16} /> : <Grid3X3 size={16} />}
        </button>
      </div>

      {/* Tag filters */}
      {allTags.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mb-5">
          <button
            onClick={() => setActiveTag(null)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${!activeTag ? 'bg-[var(--accent-violet)] text-white' : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)] hover:text-[var(--text-primary)]'}`}
          >
            All
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${activeTag === tag ? 'bg-[var(--accent-violet)] text-white' : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)] hover:text-[var(--text-primary)]'}`}
            >
              <Tag size={9} />{tag}
            </button>
          ))}
        </div>
      )}

      {/* Pinned section */}
      {pinned.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Pin size={11} /> Pinned
          </p>
          <NotesGrid notes={pinned} layout={layout} onEdit={setEditingNote} onPin={pinNote} onArchive={archiveNote} onDelete={setDeleteTarget} />
        </div>
      )}

      {/* All notes */}
      {unpinned.length > 0 && (
        <div>
          {pinned.length > 0 && (
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Notes</p>
          )}
          <NotesGrid notes={unpinned} layout={layout} onEdit={setEditingNote} onPin={pinNote} onArchive={archiveNote} onDelete={setDeleteTarget} />
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <span className="text-5xl">📝</span>
          <p className="font-display font-semibold text-[var(--text-primary)]">
            {search ? 'No notes match your search' : 'No notes yet'}
          </p>
          <p className="text-sm text-[var(--text-secondary)]">
            {search ? 'Try different keywords' : 'Capture thoughts, ideas, lists — anything'}
          </p>
          {!search && (
            <button
              onClick={() => setIsCreating(true)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white mt-2"
              style={{ background: 'var(--accent-violet)' }}
            >
              Create your first note
            </button>
          )}
        </div>
      )}

      {/* Create / Edit modal */}
      <AnimatePresence>
        {(isCreating || editingNote) && (
          <NoteEditor
            note={editingNote}
            onClose={() => { setIsCreating(false); setEditingNote(null) }}
            onSave={async (data) => {
              try {
                if (editingNote) {
                  await updateNote(editingNote.id, data)
                  success('Note saved')
                } else {
                  await addNote({ ...data, is_pinned: false, is_archived: false })
                  success('Note created')
                }
                setIsCreating(false)
                setEditingNote(null)
              } catch {
                showError('Failed to save note')
              }
            }}
          />
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Note"
        message={`Delete "${deleteTarget?.title || 'this note'}"? This cannot be undone.`}
      />
    </div>
  )
}

// ── Notes Grid / List ─────────────────────────────────────────
function NotesGrid({ notes, layout, onEdit, onPin, onArchive, onDelete }: {
  notes: Note[]
  layout: 'grid' | 'list'
  onEdit: (n: Note) => void
  onPin: (id: string, pinned: boolean) => void
  onArchive: (id: string) => void
  onDelete: (n: Note) => void
}) {
  return (
    <div className={layout === 'grid'
      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3'
      : 'flex flex-col gap-2'
    }>
      {notes.map((note, i) => (
        <NoteCard
          key={note.id}
          note={note}
          index={i}
          layout={layout}
          onEdit={onEdit}
          onPin={onPin}
          onArchive={onArchive}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}

// ── Individual Note Card ──────────────────────────────────────
function NoteCard({ note, index, layout, onEdit, onPin, onArchive, onDelete }: {
  note: Note
  index: number
  layout: 'grid' | 'list'
  onEdit: (n: Note) => void
  onPin: (id: string, pinned: boolean) => void
  onArchive: (id: string) => void
  onDelete: (n: Note) => void
}) {
  const colorConfig = NOTE_COLORS.find(c => c.bg === note.color) || NOTE_COLORS[0]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={() => onEdit(note)}
      className={`group relative rounded-xl border cursor-pointer transition-all hover:scale-[1.01] hover:shadow-lg ${layout === 'list' ? 'flex items-start gap-4 p-4' : 'p-4 flex flex-col'}`}
      style={{ background: note.color, borderColor: colorConfig.border }}
    >
      {/* Actions */}
      <div
        className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={e => e.stopPropagation()}
      >
        <ActionBtn onClick={() => onPin(note.id, !note.is_pinned)} title={note.is_pinned ? 'Unpin' : 'Pin'}>
          <Pin size={13} className={note.is_pinned ? 'fill-current text-[var(--accent-amber)]' : ''} />
        </ActionBtn>
        <ActionBtn onClick={() => onArchive(note.id)} title="Archive">
          <Archive size={13} />
        </ActionBtn>
        <ActionBtn onClick={() => onDelete(note)} title="Delete" danger>
          <Trash2 size={13} />
        </ActionBtn>
      </div>

      {/* Pin indicator */}
      {note.is_pinned && (
        <Pin size={11} className="absolute top-3 left-3 text-[var(--accent-amber)] fill-current" />
      )}

      <div className={`flex-1 min-w-0 ${note.is_pinned ? 'pl-4' : ''}`}>
        {note.title && (
          <h3 className="font-semibold text-sm text-[var(--text-primary)] mb-1.5 pr-16 leading-tight line-clamp-1">
            {note.title}
          </h3>
        )}
        <p className={`text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap ${layout === 'grid' ? 'line-clamp-6' : 'line-clamp-2'}`}>
          {note.content || <span className="italic text-[var(--text-muted)]">Empty note</span>}
        </p>
      </div>

      <div className={`flex items-center justify-between ${layout === 'grid' ? 'mt-3 pt-2 border-t' : 'ml-auto pl-4 shrink-0 flex-col items-end gap-1'}`}
        style={{ borderColor: colorConfig.border }}>
        {note.tags.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {note.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                style={{ background: 'rgba(124,106,247,0.15)', color: '#a78bfa' }}>
                {tag}
              </span>
            ))}
          </div>
        )}
        <span className="text-[10px] text-[var(--text-muted)] shrink-0">
          {formatRelative(note.updated_at)}
        </span>
      </div>
    </motion.div>
  )
}

function ActionBtn({ onClick, title, danger, children }: {
  onClick: () => void
  title: string
  danger?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-lg backdrop-blur-sm transition-colors ${danger
        ? 'text-[var(--text-muted)] hover:text-[var(--accent-rose)] hover:bg-[rgba(248,113,113,0.15)]'
        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.1)]'}`}
    >
      {children}
    </button>
  )
}

// ── Note Editor Modal ─────────────────────────────────────────
function NoteEditor({ note, onClose, onSave }: {
  note: Note | null
  onClose: () => void
  onSave: (data: { title: string | null; content: string; color: string; tags: string[] }) => Promise<void>
}) {
  const [title, setTitle] = useState(note?.title ?? '')
  const [content, setContent] = useState(note?.content ?? '')
  const [color, setColor] = useState(note?.color ?? '#1a1a22')
  const [tags, setTags] = useState<string[]>(note?.tags ?? [])
  const [tagInput, setTagInput] = useState('')
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const contentRef = useRef<HTMLTextAreaElement>(null)

  const colorConfig = NOTE_COLORS.find(c => c.bg === color) || NOTE_COLORS[0]

  useEffect(() => {
    setTimeout(() => contentRef.current?.focus(), 50)
  }, [])

  const handleSave = useCallback(async () => {
    if (!content.trim() && !title.trim()) { onClose(); return }
    setIsSaving(true)
    await onSave({ title: title.trim() || null, content, color, tags })
    setIsSaving(false)
  }, [content, title, color, tags, onSave, onClose])

  // Auto-save on Ctrl/Cmd+S
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleSave, onClose])

  const addTag = (value: string) => {
    const t = value.trim().toLowerCase()
    if (t && !tags.includes(t)) setTags([...tags, t])
    setTagInput('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleSave}
      />
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        className="relative w-full sm:max-w-xl rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: color,
          border: `1px solid ${colorConfig.border}`,
          maxHeight: '85dvh',
          boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="sm:hidden mx-auto mt-3 w-10 h-1 rounded-full bg-[rgba(255,255,255,0.1)] shrink-0" />

        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ borderBottom: `1px solid ${colorConfig.border}` }}>
          <div className="flex items-center gap-1">
            {/* Color picker */}
            <div className="relative">
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="p-2 rounded-lg hover:bg-[rgba(255,255,255,0.08)] transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                title="Change color"
              >
                <Palette size={15} />
              </button>
              <AnimatePresence>
                {showColorPicker && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute top-full left-0 mt-1 p-2 rounded-xl border z-50 grid grid-cols-4 gap-1.5"
                    style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
                  >
                    {NOTE_COLORS.map(c => (
                      <button
                        key={c.bg}
                        onClick={() => { setColor(c.bg); setShowColorPicker(false) }}
                        className="w-7 h-7 rounded-lg border-2 transition-all hover:scale-110"
                        style={{
                          background: c.bg,
                          borderColor: color === c.bg ? 'var(--accent-violet)' : c.border,
                          boxShadow: color === c.bg ? '0 0 0 2px rgba(124,106,247,0.4)' : 'none',
                        }}
                        title={c.label}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-muted)]">⌘S to save · Esc to close</span>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all"
              style={{ background: 'var(--accent-violet)' }}
            >
              {isSaving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.08)] transition-colors">
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto">
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-5 pt-4 pb-1 bg-transparent text-lg font-semibold text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none"
          />
          <textarea
            ref={contentRef}
            placeholder="Take a note…"
            value={content}
            onChange={e => setContent(e.target.value)}
            className="w-full px-5 pb-4 bg-transparent text-sm text-[var(--text-secondary)] placeholder-[var(--text-muted)] outline-none resize-none leading-relaxed"
            style={{ minHeight: '160px' }}
            rows={8}
          />
        </div>

        {/* Tags footer */}
        <div className="px-4 py-3 shrink-0" style={{ borderTop: `1px solid ${colorConfig.border}` }}>
          <div className="flex flex-wrap gap-1.5 items-center">
            {tags.map(tag => (
              <span key={tag} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg font-medium"
                style={{ background: 'rgba(124,106,247,0.2)', color: '#a78bfa' }}>
                {tag}
                <button onClick={() => setTags(tags.filter(t => t !== tag))} className="hover:text-white">×</button>
              </span>
            ))}
            <input
              type="text"
              placeholder="Add tag…"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput) }
              }}
              className="text-xs bg-transparent text-[var(--text-secondary)] placeholder-[var(--text-muted)] outline-none min-w-[80px] flex-1"
            />
          </div>
        </div>
      </motion.div>
    </div>
  )
}