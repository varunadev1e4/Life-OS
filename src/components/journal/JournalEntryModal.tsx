import { useState, useEffect } from 'react'
import { Modal, Button, Input, Textarea, Slider, TagInput } from '@/components/ui'
import { useJournalStore } from '@/lib/store'
import { useToast } from '@/context/ToastContext'
import { today, MOOD_EMOJI, MOOD_COLOR } from '@/utils/helpers'
import type { JournalLog, JournalInsert } from '@/types'
import { format } from 'date-fns'

interface JournalEntryModalProps {
  isOpen: boolean
  onClose: () => void
  entry?: JournalLog | null
}

const defaultForm = (date: string): JournalInsert => ({
  date,
  mood: 7,
  energy: 7,
  title: '',
  notes: '',
  highlights: '',
  gratitude: '',
  tags: [],
})

export function JournalEntryModal({ isOpen, onClose, entry }: JournalEntryModalProps) {
  const { upsertLog } = useJournalStore()
  const { success, error } = useToast()
  const [form, setForm] = useState<JournalInsert>(defaultForm(today()))
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (entry) {
      setForm({
        date: entry.date,
        mood: entry.mood ?? 7,
        energy: entry.energy ?? 7,
        title: entry.title ?? '',
        notes: entry.notes ?? '',
        highlights: entry.highlights ?? '',
        gratitude: entry.gratitude ?? '',
        tags: entry.tags,
      })
    } else {
      setForm(defaultForm(today()))
    }
  }, [entry, isOpen])

  const set = (key: keyof JournalInsert, value: unknown) => setForm(f => ({ ...f, [key]: value }))

  const handleSave = async () => {
    if (!form.notes && !form.mood && !form.energy) {
      error('Add at least a mood or some notes')
      return
    }
    setIsSaving(true)
    try {
      await upsertLog({
        ...form,
        title: form.title || null,
        notes: form.notes || null,
        highlights: form.highlights || null,
        gratitude: form.gratitude || null,
      })
      success(entry ? 'Entry updated' : 'Journal entry saved')
      onClose()
    } catch {
      error('Failed to save entry')
    } finally {
      setIsSaving(false)
    }
  }

  const mood = form.mood ?? 7
  const energy = form.energy ?? 7

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={entry ? `Edit — ${format(new Date(entry.date), 'MMMM d')}` : `Journal — ${format(new Date(), 'MMMM d, yyyy')}`}
      size="md"
    >
      <div className="p-6 space-y-5">
        {/* Mood & Energy sliders */}
        <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">Mood</span>
              <span className="text-2xl">{MOOD_EMOJI[mood]}</span>
            </div>
            <Slider
              value={mood}
              onChange={v => set('mood', v)}
              min={1}
              max={10}
              color={MOOD_COLOR(mood)}
            />
            <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
              <span>😭 Low</span>
              <span className="font-bold font-mono" style={{ color: MOOD_COLOR(mood) }}>{mood}/10</span>
              <span>Amazing 🤩</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">Energy</span>
              <span className="text-2xl">{energy <= 3 ? '😴' : energy <= 6 ? '😐' : energy <= 8 ? '⚡' : '🚀'}</span>
            </div>
            <Slider value={energy} onChange={v => set('energy', v)} min={1} max={10} color="#38bdf8" />
            <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
              <span>😴 Low</span>
              <span className="font-bold font-mono text-[var(--accent-sky)]">{energy}/10</span>
              <span>High 🚀</span>
            </div>
          </div>
        </div>

        {/* Title */}
        <Input
          label="Title (optional)"
          placeholder="A word to describe today..."
          value={form.title ?? ''}
          onChange={e => set('title', e.target.value)}
        />

        {/* Notes */}
        <Textarea
          label="Journal Entry"
          placeholder="How was your day? What's on your mind? Stream of consciousness welcome..."
          value={form.notes ?? ''}
          onChange={e => set('notes', e.target.value)}
          rows={5}
        />

        {/* Highlights */}
        <Textarea
          label="✨ Highlights"
          placeholder="What were the best moments today?"
          value={form.highlights ?? ''}
          onChange={e => set('highlights', e.target.value)}
          rows={2}
        />

        {/* Gratitude */}
        <Textarea
          label="🙏 Gratitude"
          placeholder="3 things you're grateful for today..."
          value={form.gratitude ?? ''}
          onChange={e => set('gratitude', e.target.value)}
          rows={2}
        />

        {/* Tags */}
        <TagInput tags={form.tags} onChange={tags => set('tags', tags)} label="Tags" placeholder="productive, social, creative..." />

        <div className="flex gap-3 justify-end pt-2 border-t border-[var(--border-subtle)]">
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} isLoading={isSaving}>
            {entry ? 'Update Entry' : 'Save Entry'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
