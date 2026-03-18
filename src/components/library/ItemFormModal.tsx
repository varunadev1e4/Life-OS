import { useState, useEffect } from 'react'
import { Modal, Button, Input, Textarea, Select, Slider, TagInput } from '@/components/ui'
import { useItemsStore } from '@/lib/store'
import { useToast } from '@/context/ToastContext'
import { ITEM_TYPES, ITEM_STATUSES, PROGRESS_UNITS } from '@/utils/constants'
import { ITEM_TYPE_CONFIG, today } from '@/utils/helpers'
import type { Item, ItemInsert, ItemType, ItemStatus, ProgressUnit } from '@/types'

interface ItemFormModalProps {
  isOpen: boolean
  onClose: () => void
  item?: Item | null
}

const defaultForm = (): ItemInsert => ({
  title: '',
  type: 'book',
  status: 'not_started',
  rating: null,
  cover_url: null,
  author_creator: null,
  year: null,
  genre: null,
  notes: null,
  highlights: null,
  tags: [],
  progress_current: 0,
  progress_total: null,
  progress_unit: 'pages',
  external_url: null,
  started_at: null,
  completed_at: null,
})

export function ItemFormModal({ isOpen, onClose, item }: ItemFormModalProps) {
  const { addItem, updateItem } = useItemsStore()
  const { success, error } = useToast()
  const [form, setForm] = useState<ItemInsert>(defaultForm())
  const [rating, setRating] = useState<number>(7)
  const [hasRating, setHasRating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (item) {
      setForm({
        title: item.title,
        type: item.type,
        status: item.status,
        rating: item.rating,
        cover_url: item.cover_url,
        author_creator: item.author_creator,
        year: item.year,
        genre: item.genre,
        notes: item.notes,
        highlights: item.highlights,
        tags: item.tags,
        progress_current: item.progress_current,
        progress_total: item.progress_total,
        progress_unit: item.progress_unit,
        external_url: item.external_url,
        started_at: item.started_at,
        completed_at: item.completed_at,
      })
      if (item.rating) { setRating(item.rating); setHasRating(true) }
    } else {
      setForm(defaultForm())
      setRating(7)
      setHasRating(false)
    }
  }, [item, isOpen])

  const set = (key: keyof ItemInsert, value: unknown) => setForm(f => ({ ...f, [key]: value }))

  // Auto-set progress_unit based on type
  const handleTypeChange = (type: ItemType) => {
    const config = ITEM_TYPE_CONFIG[type]
    set('type', type)
    set('progress_unit', config.progressUnit as ProgressUnit)
  }

  // Auto-set completed_at when status = completed
  const handleStatusChange = (status: ItemStatus) => {
    set('status', status)
    if (status === 'completed' && !form.completed_at) set('completed_at', today())
    if (status === 'in_progress' && !form.started_at) set('started_at', today())
  }

  const handleSubmit = async () => {
    if (!form.title.trim()) { error('Title is required'); return }
    setIsSaving(true)
    try {
      const payload = { ...form, rating: hasRating ? rating : null }
      if (item) {
        await updateItem(item.id, payload)
        success('Item updated')
      } else {
        await addItem(payload)
        success('Item added to library')
      }
      onClose()
    } catch {
      error('Failed to save item')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={item ? 'Edit Item' : 'Add to Library'} size="lg">
      <div className="p-6 space-y-5">
        {/* Title */}
        <Input
          label="Title *"
          placeholder="Enter title..."
          value={form.title}
          onChange={e => set('title', e.target.value)}
        />

        {/* Type + Status */}
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Type"
            value={form.type}
            onChange={e => handleTypeChange(e.target.value as ItemType)}
            options={ITEM_TYPES}
          />
          <Select
            label="Status"
            value={form.status}
            onChange={e => handleStatusChange(e.target.value as ItemStatus)}
            options={ITEM_STATUSES}
          />
        </div>

        {/* Author + Year */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Author / Creator"
            placeholder="Who made it?"
            value={form.author_creator ?? ''}
            onChange={e => set('author_creator', e.target.value || null)}
          />
          <Input
            label="Year"
            type="number"
            placeholder="2024"
            value={form.year ?? ''}
            onChange={e => set('year', e.target.value ? Number(e.target.value) : null)}
          />
        </div>

        {/* Genre + Cover URL */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Genre"
            placeholder="e.g. Sci-Fi, Self-Help"
            value={form.genre ?? ''}
            onChange={e => set('genre', e.target.value || null)}
          />
          <Input
            label="Cover Image URL"
            placeholder="https://..."
            value={form.cover_url ?? ''}
            onChange={e => set('cover_url', e.target.value || null)}
          />
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">Progress</label>
          <div className="grid grid-cols-3 gap-3">
            <Input
              placeholder="Current"
              type="number"
              value={form.progress_current || ''}
              onChange={e => set('progress_current', Number(e.target.value))}
            />
            <Input
              placeholder="Total"
              type="number"
              value={form.progress_total ?? ''}
              onChange={e => set('progress_total', e.target.value ? Number(e.target.value) : null)}
            />
            <Select
              value={form.progress_unit}
              onChange={e => set('progress_unit', e.target.value as ProgressUnit)}
              options={PROGRESS_UNITS}
            />
          </div>
        </div>

        {/* Rating */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">Rating</label>
            <button
              type="button"
              onClick={() => setHasRating(!hasRating)}
              className={`text-xs px-2 py-0.5 rounded-md border transition-colors ${hasRating ? 'text-[var(--accent-violet)] border-[rgba(124,106,247,0.4)] bg-[rgba(124,106,247,0.1)]' : 'text-[var(--text-muted)] border-[var(--border)]'}`}
            >
              {hasRating ? 'Remove rating' : 'Add rating'}
            </button>
          </div>
          {hasRating && (
            <Slider value={rating} onChange={setRating} min={1} max={10} label={`Rating: ${rating}/10`} />
          )}
        </div>

        {/* Dates */}
        {(form.status === 'in_progress' || form.status === 'completed') && (
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Started"
              type="date"
              value={form.started_at ?? ''}
              onChange={e => set('started_at', e.target.value || null)}
            />
            {form.status === 'completed' && (
              <Input
                label="Completed"
                type="date"
                value={form.completed_at ?? ''}
                onChange={e => set('completed_at', e.target.value || null)}
              />
            )}
          </div>
        )}

        {/* Notes */}
        <Textarea
          label="Notes"
          placeholder="Your thoughts, summary, key ideas..."
          value={form.notes ?? ''}
          onChange={e => set('notes', e.target.value || null)}
          rows={3}
        />

        {/* Highlights */}
        <Textarea
          label="Highlights"
          placeholder="Memorable quotes, key highlights..."
          value={form.highlights ?? ''}
          onChange={e => set('highlights', e.target.value || null)}
          rows={2}
        />

        {/* Tags */}
        <TagInput tags={form.tags} onChange={tags => set('tags', tags)} label="Tags" />

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-2 border-t border-[var(--border-subtle)]">
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={isSaving}>
            {item ? 'Save Changes' : 'Add to Library'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
