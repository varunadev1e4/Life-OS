import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Edit2, Trash2, ExternalLink, Star, Calendar, BookOpen } from 'lucide-react'
import { useItemsStore } from '@/lib/store'
import { useToast } from '@/context/ToastContext'
import { Button, ProgressBar, ConfirmDialog, Skeleton } from '@/components/ui'
import { ItemFormModal } from '@/components/library/ItemFormModal'
import { ITEM_TYPE_CONFIG, ITEM_STATUS_CONFIG, calculateProgress, formatDate, getRatingColor } from '@/utils/helpers'

export function ItemDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { items, fetchItems, deleteItem, isLoading } = useItemsStore()
  const { success, error } = useToast()
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (items.length === 0) fetchItems()
  }, [fetchItems, items.length])

  const item = items.find(i => i.id === id)

  const handleDelete = async () => {
    if (!item) return
    setIsDeleting(true)
    try {
      await deleteItem(item.id)
      success('Item deleted')
      navigate('/library')
    } catch {
      error('Failed to delete')
      setIsDeleting(false)
    }
  }

  if (isLoading && !item) {
    return (
      <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-32" />
      </div>
    )
  }

  if (!item) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-64 gap-4">
        <span className="text-4xl">🔍</span>
        <p className="text-[var(--text-secondary)]">Item not found</p>
        <Link to="/library"><Button variant="secondary">Back to Library</Button></Link>
      </div>
    )
  }

  const typeConfig = ITEM_TYPE_CONFIG[item.type]
  const statusConfig = ITEM_STATUS_CONFIG[item.status]
  const progress = calculateProgress(item.progress_current, item.progress_total)

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      {/* Back */}
      <Link to="/library" className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-6 transition-colors">
        <ArrowLeft size={14} /> Back to Library
      </Link>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        {/* Main card */}
        <div className="card overflow-hidden">
          <div className="h-1 w-full" style={{ background: typeConfig.color }} />
          <div className="p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-start gap-4">
                <span className="text-4xl">{typeConfig.icon}</span>
                <div>
                  <h1 className="font-display font-bold text-2xl text-[var(--text-primary)] leading-tight">{item.title}</h1>
                  {item.author_creator && (
                    <p className="text-[var(--text-secondary)] mt-1">{item.author_creator}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="badge" style={{ color: statusConfig.color, background: statusConfig.bg }}>
                      {statusConfig.label}
                    </span>
                    {item.genre && <span className="badge" style={{ color: 'var(--text-muted)', background: 'var(--bg-overlay)' }}>{item.genre}</span>}
                    {item.year && <span className="text-sm text-[var(--text-muted)]">{item.year}</span>}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="secondary" size="sm" leftIcon={<Edit2 size={13} />} onClick={() => setShowEdit(true)}>
                  Edit
                </Button>
                <Button variant="danger" size="sm" leftIcon={<Trash2 size={13} />} onClick={() => setShowDelete(true)}>
                  Delete
                </Button>
              </div>
            </div>

            {/* Rating */}
            {item.rating !== null && item.rating !== undefined && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex gap-0.5">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className="transition-colors"
                      style={{
                        color: i < item.rating! ? getRatingColor(item.rating!) : 'var(--border-strong)',
                        fill: i < item.rating! ? getRatingColor(item.rating!) : 'transparent',
                      }}
                    />
                  ))}
                </div>
                <span className="text-sm font-bold font-mono" style={{ color: getRatingColor(item.rating) }}>
                  {item.rating}/10
                </span>
              </div>
            )}

            {/* Progress */}
            {item.progress_total && (
              <div className="mb-4 p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-medium text-[var(--text-secondary)]">Progress</span>
                  <span className="text-xs font-bold font-mono" style={{ color: typeConfig.color }}>{progress}%</span>
                </div>
                <ProgressBar value={progress} color={typeConfig.color} />
                <p className="text-xs text-[var(--text-muted)] mt-1.5 font-mono">
                  {item.progress_current} / {item.progress_total} {item.progress_unit}
                </p>
              </div>
            )}

            {/* Dates */}
            {(item.started_at || item.completed_at) && (
              <div className="flex gap-4 mb-4 text-sm text-[var(--text-secondary)]">
                {item.started_at && (
                  <div className="flex items-center gap-1.5">
                    <Calendar size={13} />
                    <span>Started: {formatDate(item.started_at)}</span>
                  </div>
                )}
                {item.completed_at && (
                  <div className="flex items-center gap-1.5">
                    <Calendar size={13} className="text-[var(--accent-emerald)]" />
                    <span className="text-[var(--accent-emerald)]">Finished: {formatDate(item.completed_at)}</span>
                  </div>
                )}
              </div>
            )}

            {/* External link */}
            {item.external_url && (
              <a
                href={item.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-[var(--accent-violet)] hover:underline"
              >
                <ExternalLink size={12} /> View externally
              </a>
            )}
          </div>
        </div>

        {/* Notes */}
        {item.notes && (
          <div className="card p-5">
            <h2 className="font-display font-semibold text-sm text-[var(--text-primary)] mb-3 flex items-center gap-2">
              <BookOpen size={14} /> Notes
            </h2>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">{item.notes}</p>
          </div>
        )}

        {/* Highlights */}
        {item.highlights && (
          <div className="card p-5" style={{ borderColor: 'rgba(245,158,11,0.2)' }}>
            <h2 className="font-display font-semibold text-sm text-[var(--accent-amber)] mb-3 flex items-center gap-2">
              ✨ Highlights
            </h2>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">{item.highlights}</p>
          </div>
        )}

        {/* Tags */}
        {item.tags.length > 0 && (
          <div className="card p-5">
            <h2 className="font-display font-semibold text-sm text-[var(--text-secondary)] mb-3">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {item.tags.map(tag => (
                <span key={tag} className="px-3 py-1 rounded-lg text-xs font-medium"
                  style={{ background: 'rgba(124,106,247,0.12)', color: 'var(--accent-violet)' }}>
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      <ItemFormModal isOpen={showEdit} onClose={() => setShowEdit(false)} item={item} />
      <ConfirmDialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Delete Item"
        message={`Delete "${item.title}"? This action cannot be undone.`}
        isLoading={isDeleting}
      />
    </div>
  )
}