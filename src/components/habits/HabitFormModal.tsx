import { useState, useEffect } from 'react'
import { Modal, Button, Input, Textarea } from '@/components/ui'
import { useHabitsStore } from '@/lib/store'
import { useToast } from '@/context/ToastContext'
import { HABIT_ICONS, HABIT_COLORS } from '@/utils/constants'
import type { Habit, HabitInsert } from '@/types'

interface HabitFormModalProps {
  isOpen: boolean
  onClose: () => void
  habit?: Habit | null
}

const defaultForm = (): HabitInsert => ({
  name: '',
  description: null,
  icon: '✓',
  color: '#7c6af7',
  frequency: 'daily',
  frequency_days: [1, 2, 3, 4, 5, 6, 7],
  target_count: 1,
  is_active: true,
  order_index: 0,
})

export function HabitFormModal({ isOpen, onClose, habit }: HabitFormModalProps) {
  const { addHabit, updateHabit, deleteHabit, habits } = useHabitsStore()
  const { success, error } = useToast()
  const [form, setForm] = useState<HabitInsert>(defaultForm())
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (habit) {
      setForm({
        name: habit.name,
        description: habit.description,
        icon: habit.icon,
        color: habit.color,
        frequency: habit.frequency,
        frequency_days: habit.frequency_days,
        target_count: habit.target_count,
        is_active: habit.is_active,
        order_index: habit.order_index,
      })
    } else {
      setForm({ ...defaultForm(), order_index: habits.length })
    }
  }, [habit, isOpen, habits.length])

  const set = (key: keyof HabitInsert, value: unknown) => setForm(f => ({ ...f, [key]: value }))

  const handleSave = async () => {
    if (!form.name.trim()) { error('Name is required'); return }
    setIsSaving(true)
    try {
      if (habit) {
        await updateHabit(habit.id, form)
        success('Habit updated')
      } else {
        await addHabit(form)
        success('Habit created')
      }
      onClose()
    } catch {
      error('Failed to save habit')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!habit) return
    setIsDeleting(true)
    try {
      await deleteHabit(habit.id)
      success('Habit archived')
      onClose()
    } catch {
      error('Failed to delete habit')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={habit ? 'Edit Habit' : 'New Habit'} size="md">
      <div className="p-6 space-y-5">
        <Input
          label="Habit Name *"
          placeholder="e.g. Morning Pages, Exercise, Meditate"
          value={form.name}
          onChange={e => set('name', e.target.value)}
        />

        <Textarea
          label="Description"
          placeholder="What does this habit involve?"
          value={form.description ?? ''}
          onChange={e => set('description', e.target.value || null)}
          rows={2}
        />

        {/* Icon picker */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">Icon</label>
          <div className="flex flex-wrap gap-1.5">
            {HABIT_ICONS.map(icon => (
              <button
                key={icon}
                type="button"
                onClick={() => set('icon', icon)}
                className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${
                  form.icon === icon ? 'ring-2 ring-[var(--accent-violet)] bg-[rgba(124,106,247,0.12)]' : 'bg-[var(--bg-elevated)] hover:bg-[var(--bg-overlay)]'
                }`}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        {/* Color picker */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">Color</label>
          <div className="flex flex-wrap gap-2">
            {HABIT_COLORS.map(color => (
              <button
                key={color}
                type="button"
                onClick={() => set('color', color)}
                className={`w-7 h-7 rounded-full transition-all ${form.color === color ? 'ring-2 ring-offset-2 ring-offset-[var(--bg-surface)] ring-white' : 'hover:scale-110'}`}
                style={{ background: color }}
              />
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="p-3 rounded-xl border border-[var(--border)] flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl border-2"
            style={{ borderColor: form.color, background: `${form.color}1a` }}>
            {form.icon}
          </div>
          <span className="text-sm font-medium text-[var(--text-primary)]">{form.name || 'Your habit'}</span>
        </div>

        <div className="flex gap-3 justify-between pt-2 border-t border-[var(--border-subtle)]">
          {habit && (
            <Button variant="danger" onClick={handleDelete} isLoading={isDeleting} size="sm">
              Archive
            </Button>
          )}
          <div className={`flex gap-3 ${habit ? '' : 'ml-auto'}`}>
            <Button variant="ghost" onClick={onClose} disabled={isSaving || isDeleting}>Cancel</Button>
            <Button variant="primary" onClick={handleSave} isLoading={isSaving}>
              {habit ? 'Save Changes' : 'Create Habit'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
