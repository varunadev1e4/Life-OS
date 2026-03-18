import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, X, ExternalLink, Trash2, Star, Check, BookOpen, Play, Wrench, Mic, FileText, Package } from 'lucide-react'
import { useBookmarksStore } from '@/lib/store'
import { useToast } from '@/context/ToastContext'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button, Modal, Input, Textarea, Select, EmptyState, Skeleton, ConfirmDialog } from '@/components/ui'
import { TagInput } from '@/components/ui'
import { formatRelative } from '@/utils/helpers'
import type { Bookmark, BookmarkInsert, BookmarkType } from '@/types'

const TYPES: { value: BookmarkType; label: string; Icon: typeof BookOpen; color: string }[] = [
  { value: 'article', label: 'Article',  Icon: BookOpen,  color: '#38bdf8' },
  { value: 'video',   label: 'Video',    Icon: Play,      color: '#f87171' },
  { value: 'tool',    label: 'Tool',     Icon: Wrench,    color: '#34d399' },
  { value: 'podcast', label: 'Podcast',  Icon: Mic,       color: '#f59e0b' },
  { value: 'paper',   label: 'Paper',    Icon: FileText,  color: '#7c6af7' },
  { value: 'other',   label: 'Other',    Icon: Package,   color: '#94a3b8' },
]

const getType = (v: string) => TYPES.find(t => t.value === v) || TYPES[TYPES.length - 1]

function extractDomain(url: string) {
  try { return new URL(url).hostname.replace('www.', '') } catch { return url }
}

export function BookmarksPage() {
  const { bookmarks, isLoading, fetchBookmarks, addBookmark, updateBookmark, deleteBookmark, toggleRead, toggleFavorite } = useBookmarksStore()
  const { success, error: showError } = useToast()

  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Bookmark | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Bookmark | null>(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<BookmarkType | 'all'>('all')
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all')

  useEffect(() => { fetchBookmarks() }, [fetchBookmarks])

  const filtered = bookmarks.filter(b => {
    const q = search.toLowerCase()
    const matchSearch = !q || b.title.toLowerCase().includes(q) || b.url.toLowerCase().includes(q) || b.tags.some(t => t.includes(q)) || b.description?.toLowerCase().includes(q)
    const matchType = typeFilter === 'all' || b.type === typeFilter
    const matchRead = readFilter === 'all' || (readFilter === 'read' ? b.is_read : !b.is_read)
    return matchSearch && matchType && matchRead
  })

  const unreadCount = bookmarks.filter(b => !b.is_read).length

  const handleDelete = async () => {
    if (!deleteTarget) return
    try { await deleteBookmark(deleteTarget.id); success('Bookmark deleted'); setDeleteTarget(null) }
    catch { showError('Failed to delete') }
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <PageHeader
        title="Bookmarks"
        subtitle={`${unreadCount} unread · ${bookmarks.length} total`}
        icon="🔖"
        action={
          <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={() => setShowForm(true)}>
            Save Link
          </Button>
        }
      />

      {/* Search */}
      <div className="relative mb-4">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          type="text" placeholder="Search bookmarks…" value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-violet)] transition-colors"
        />
        {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"><X size={13} /></button>}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap mb-5">
        <div className="flex rounded-xl border border-[var(--border)] overflow-hidden">
          {(['all', 'unread', 'read'] as const).map(f => (
            <button key={f} onClick={() => setReadFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium capitalize transition-colors ${readFilter === f ? 'bg-[var(--accent-violet)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'}`}>
              {f === 'all' ? `All (${bookmarks.length})` : f === 'unread' ? `Unread (${unreadCount})` : `Read`}
            </button>
          ))}
        </div>
        {TYPES.map(t => (
          <button key={t.value} onClick={() => setTypeFilter(typeFilter === t.value ? 'all' : t.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${typeFilter === t.value ? 'text-white border-transparent' : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border)]'}`}
            style={typeFilter === t.value ? { background: t.color } : {}}>
            <t.Icon size={11} /> {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="🔖"
          title="No bookmarks found"
          description={search ? 'Try different keywords' : 'Save articles, videos, tools and papers to read later'}
          action={<Button variant="primary" leftIcon={<Plus size={14} />} onClick={() => setShowForm(true)}>Save your first link</Button>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {filtered.map((bm, i) => {
            const typeConfig = getType(bm.type)
            const TypeIcon = typeConfig.Icon
            return (
              <motion.div key={bm.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`card p-4 group flex flex-col gap-2 transition-all hover:border-[var(--border-strong)] ${bm.is_read ? 'opacity-70' : ''}`}
              >
                {/* Header */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${typeConfig.color}15` }}>
                    <TypeIcon size={14} style={{ color: typeConfig.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <a href={bm.url} target="_blank" rel="noopener noreferrer"
                      className="text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--accent-violet)] transition-colors line-clamp-2 leading-snug"
                      onClick={e => { e.preventDefault(); window.open(bm.url, '_blank') }}>
                      {bm.title}
                    </a>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5 flex items-center gap-1">
                      <ExternalLink size={9} />{extractDomain(bm.url)}
                    </p>
                  </div>
                </div>

                {bm.description && (
                  <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">{bm.description}</p>
                )}

                {/* Tags */}
                {bm.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {bm.tags.map(tag => (
                      <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                        style={{ background: 'rgba(124,106,247,0.1)', color: '#a78bfa' }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-[var(--border-subtle)]">
                  <span className="text-[10px] text-[var(--text-muted)]">{formatRelative(bm.created_at)}</span>
                  <div className="flex gap-1">
                    {/* Mark read */}
                    <button onClick={() => toggleRead(bm.id)}
                      className={`p-1.5 rounded-lg transition-colors ${bm.is_read ? 'text-[var(--accent-emerald)] bg-[rgba(52,211,153,0.1)]' : 'text-[var(--text-muted)] hover:text-[var(--accent-emerald)] hover:bg-[rgba(52,211,153,0.08)]'}`}
                      title={bm.is_read ? 'Mark unread' : 'Mark read'}>
                      <Check size={13} />
                    </button>
                    {/* Favorite */}
                    <button onClick={() => toggleFavorite(bm.id)}
                      className={`p-1.5 rounded-lg transition-colors ${bm.is_favorite ? 'text-[var(--accent-amber)]' : 'text-[var(--text-muted)] hover:text-[var(--accent-amber)]'}`}
                      title="Favorite">
                      <Star size={13} className={bm.is_favorite ? 'fill-current' : ''} />
                    </button>
                    {/* Open */}
                    <a href={bm.url} target="_blank" rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--accent-violet)] hover:bg-[rgba(124,106,247,0.08)] transition-colors">
                      <ExternalLink size={13} />
                    </a>
                    {/* Edit */}
                    <button onClick={() => setEditTarget(bm)}
                      className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--accent-violet)] hover:bg-[rgba(124,106,247,0.08)] transition-colors opacity-0 group-hover:opacity-100">
                      <span className="text-[11px]">✏️</span>
                    </button>
                    {/* Delete */}
                    <button onClick={() => setDeleteTarget(bm)}
                      className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--accent-rose)] hover:bg-[rgba(248,113,113,0.08)] transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      <BookmarkFormModal
        isOpen={showForm || !!editTarget}
        onClose={() => { setShowForm(false); setEditTarget(null) }}
        bookmark={editTarget}
        onSave={async (data) => {
          if (editTarget) { await updateBookmark(editTarget.id, data); success('Bookmark updated') }
          else { await addBookmark(data); success('Bookmark saved') }
          setShowForm(false); setEditTarget(null)
        }}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Bookmark"
        message={`Delete "${deleteTarget?.title}"?`}
      />
    </div>
  )
}

function BookmarkFormModal({ isOpen, onClose, bookmark, onSave }: {
  isOpen: boolean; onClose: () => void
  bookmark: Bookmark | null
  onSave: (data: BookmarkInsert) => Promise<void>
}) {
  const [form, setForm] = useState<BookmarkInsert>({ url: '', title: '', description: null, type: 'article', is_read: false, is_favorite: false, tags: [], notes: null })
  const [isSaving, setIsSaving] = useState(false)
  const { error: showError } = useToast()

  useEffect(() => {
    if (bookmark) setForm({ url: bookmark.url, title: bookmark.title, description: bookmark.description, type: bookmark.type, is_read: bookmark.is_read, is_favorite: bookmark.is_favorite, tags: bookmark.tags, notes: bookmark.notes })
    else setForm({ url: '', title: '', description: null, type: 'article', is_read: false, is_favorite: false, tags: [], notes: null })
  }, [bookmark, isOpen])

  const set = (k: keyof BookmarkInsert, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.url.trim()) { showError('URL required'); return }
    if (!form.title.trim()) { showError('Title required'); return }
    setIsSaving(true)
    try { await onSave(form) } finally { setIsSaving(false) }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={bookmark ? 'Edit Bookmark' : 'Save Bookmark'} size="md">
      <div className="p-5 space-y-4">
        <Input label="URL *" placeholder="https://..." value={form.url} onChange={e => set('url', e.target.value)} />
        <Input label="Title *" placeholder="What is this?" value={form.title} onChange={e => set('title', e.target.value)} />
        <Textarea label="Description" placeholder="Brief summary..." value={form.description ?? ''} onChange={e => set('description', e.target.value || null)} rows={2} />
        <Select label="Type" value={form.type} onChange={e => set('type', e.target.value)}
          options={TYPES.map(t => ({ value: t.value, label: t.label }))} />
        <TagInput tags={form.tags} onChange={tags => set('tags', tags)} label="Tags" />
        <Textarea label="Notes" placeholder="Your notes on this..." value={form.notes ?? ''} onChange={e => set('notes', e.target.value || null)} rows={2} />
        <div className="flex gap-3 justify-end pt-2 border-t border-[var(--border-subtle)]">
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} isLoading={isSaving}>{bookmark ? 'Save Changes' : 'Save Bookmark'}</Button>
        </div>
      </div>
    </Modal>
  )
}