import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Trash2 } from 'lucide-react'
import type { Item } from '@/types'
import { ITEM_TYPE_CONFIG, ITEM_STATUS_CONFIG, calculateProgress, getRatingColor } from '@/utils/helpers'
import { ProgressBar, ConfirmDialog } from '@/components/ui'
import { useState } from 'react'

interface ItemCardProps {
  item: Item
  onDelete: (id: string) => void
}

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
}

export function ItemCard({ item, onDelete }: ItemCardProps) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const typeConfig = ITEM_TYPE_CONFIG[item.type]
  const statusConfig = ITEM_STATUS_CONFIG[item.status]
  const progress = calculateProgress(item.progress_current, item.progress_total)

  const handleDelete = async () => {
    setIsDeleting(true)
    await onDelete(item.id)
    setIsDeleting(false)
    setShowConfirm(false)
  }

  return (
    <>
      <motion.div variants={cardVariants} className="card card-interactive group relative flex flex-col overflow-hidden">
        {/* Color accent bar */}
        <div className="h-0.5 w-full" style={{ background: typeConfig.color }} />

        <div className="p-4 flex flex-col flex-1 gap-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-lg shrink-0">{typeConfig.icon}</span>
              <div className="min-w-0">
                <Link to={`/library/${item.id}`}>
                  <h3 className="font-semibold text-sm text-[var(--text-primary)] leading-tight group-hover:text-[var(--accent-violet)] transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                </Link>
                {item.author_creator && (
                  <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">{item.author_creator}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowConfirm(true)}
              className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-[var(--accent-rose)] hover:bg-[rgba(248,113,113,0.08)] transition-all shrink-0"
            >
              <Trash2 size={13} />
            </button>
          </div>

          {/* Status badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="badge text-[10px]"
              style={{ color: statusConfig.color, background: statusConfig.bg }}
            >
              {statusConfig.label}
            </span>
            {item.genre && (
              <span className="badge text-[10px]" style={{ color: 'var(--text-muted)', background: 'var(--bg-overlay)' }}>
                {item.genre}
              </span>
            )}
          </div>

          {/* Progress */}
          {item.progress_total && item.status === 'in_progress' && (
            <div className="space-y-1">
              <ProgressBar value={progress} color={typeConfig.color} />
              <div className="flex justify-between text-[10px] text-[var(--text-muted)] font-mono">
                <span>{item.progress_current} / {item.progress_total} {item.progress_unit}</span>
                <span>{progress}%</span>
              </div>
            </div>
          )}

          {/* Rating */}
          {item.rating !== null && item.rating !== undefined && (
            <div className="flex items-center gap-1.5 mt-auto">
              <Star size={11} className="fill-current" style={{ color: getRatingColor(item.rating) }} />
              <span className="text-xs font-bold font-mono" style={{ color: getRatingColor(item.rating) }}>{item.rating}/10</span>
            </div>
          )}

          {/* Tags */}
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-auto">
              {item.tags.slice(0, 3).map(tag => (
                <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-md font-medium"
                  style={{ background: 'rgba(124,106,247,0.1)', color: 'var(--accent-violet)' }}>
                  {tag}
                </span>
              ))}
              {item.tags.length > 3 && (
                <span className="text-[10px] text-[var(--text-muted)]">+{item.tags.length - 3}</span>
              )}
            </div>
          )}
        </div>

        {/* Hover link overlay */}
        <Link
          to={`/library/${item.id}`}
          className="absolute inset-0 z-0"
          aria-label={`View ${item.title}`}
        />
      </motion.div>

      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Item"
        message={`Delete "${item.title}"? This cannot be undone.`}
        isLoading={isDeleting}
      />
    </>
  )
}
