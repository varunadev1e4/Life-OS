import { useState, useEffect } from 'react'
import { Modal, Button, Input, Textarea, Select, TagInput } from '@/components/ui'
import { useGoalsStore } from '@/lib/store'
import { useToast } from '@/context/ToastContext'
import { GOAL_CATEGORIES, GOAL_STATUSES } from '@/utils/constants'
import { generateId } from '@/utils/helpers'
import type { Goal, GoalInsert, GoalMilestone } from '@/types'
import { Plus, X, Check } from 'lucide-react'

interface GoalFormModalProps {
  isOpen: boolean
  onClose: () => void
  goal?: Goal | null
}

const defaultForm = (): GoalInsert => ({
  title: '',
  description: null,
  category: 'personal',
  status: 'active',
  target_value: null,
  current_value: 0,
  unit: null,
  deadline: null,
  milestones: [],
  notes: null,
  tags: [],
  is_pinned: false,
})

export function GoalFormModal({ isOpen, onClose, goal }: GoalFormModalProps) {
  const { addGoal, updateGoal, deleteGoal } = useGoalsStore()
  const { success, error } = useToast()
  const [form, setForm] = useState<GoalInsert>(defaultForm())
  const [milestoneText, setMilestoneText] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (goal) {
      setForm({
        title: goal.title,
        description: goal.description,
        category: goal.category,
        status: goal.status,
        target_value: goal.target_value,
        current_value: goal.current_value,
        unit: goal.unit,
        deadline: goal.deadline,
        milestones: goal.milestones,
        notes: goal.notes,
        tags: goal.tags,
        is_pinned: goal.is_pinned,
      })
    } else {
      setForm(defaultForm())
    }
    setMilestoneText('')
  }, [goal, isOpen])

  const set = (key: keyof GoalInsert, value: unknown) => setForm(f => ({ ...f, [key]: value }))

  const addMilestone = () => {
    const text = milestoneText.trim()
    if (!text) return
    const milestone: GoalMilestone = { id: generateId(), title: text, completed: false }
    set('milestones', [...form.milestones, milestone])
    setMilestoneText('')
  }

  const toggleMilestone = (id: string) => {
    set('milestones', form.milestones.map(m => m.id === id ? { ...m, completed: !m.completed } : m))
  }

  const removeMilestone = (id: string) => {
    set('milestones', form.milestones.filter(m => m.id !== id))
  }

  const handleSave = async () => {
    if (!form.title.trim()) { error('Title is required'); return }
    setIsSaving(true)
    try {
      if (goal) {
        await updateGoal(goal.id, form)
        success('Goal updated')
      } else {
        await addGoal(form)
        success('Goal created')
      }
      onClose()
    } catch {
      error('Failed to save goal')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!goal) return
    setIsDeleting(true)
    try {
      await deleteGoal(goal.id)
      success('Goal deleted')
      onClose()
    } catch {
      error('Failed to delete goal')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={goal ? 'Edit Goal' : 'New Goal'} size="lg">
      <div className="p-6 space-y-5">
        <Input
          label="Goal Title *"
          placeholder="What do you want to achieve?"
          value={form.title}
          onChange={e => set('title', e.target.value)}
        />

        <Textarea
          label="Description"
          placeholder="Why is this goal important to you?"
          value={form.description ?? ''}
          onChange={e => set('description', e.target.value || null)}
          rows={2}
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Category"
            value={form.category}
            onChange={e => set('category', e.target.value)}
            options={GOAL_CATEGORIES}
          />
          <Select
            label="Status"
            value={form.status}
            onChange={e => set('status', e.target.value)}
            options={GOAL_STATUSES}
          />
        </div>

        {/* Progress tracking */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">Progress</label>
          <div className="grid grid-cols-3 gap-3">
            <Input
              placeholder="Current"
              type="number"
              value={form.current_value || ''}
              onChange={e => set('current_value', Number(e.target.value))}
            />
            <Input
              placeholder="Target"
              type="number"
              value={form.target_value ?? ''}
              onChange={e => set('target_value', e.target.value ? Number(e.target.value) : null)}
            />
            <Input
              placeholder="Unit (e.g. books)"
              value={form.unit ?? ''}
              onChange={e => set('unit', e.target.value || null)}
            />
          </div>
        </div>

        <Input
          label="Deadline"
          type="date"
          value={form.deadline ?? ''}
          onChange={e => set('deadline', e.target.value || null)}
        />

        {/* Milestones */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">
            Milestones ({form.milestones.filter(m => m.completed).length}/{form.milestones.length})
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add a milestone..."
              value={milestoneText}
              onChange={e => setMilestoneText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addMilestone())}
              className="flex-1 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-violet)] transition-colors"
            />
            <Button variant="secondary" size="md" onClick={addMilestone} leftIcon={<Plus size={14} />}>Add</Button>
          </div>
          {form.milestones.length > 0 && (
            <div className="space-y-1.5 mt-2">
              {form.milestones.map(m => (
                <div key={m.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-[var(--bg-elevated)] group">
                  <button
                    onClick={() => toggleMilestone(m.id)}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      m.completed ? 'bg-[var(--accent-emerald)] border-[var(--accent-emerald)]' : 'border-[var(--border-strong)] hover:border-[var(--accent-violet)]'
                    }`}
                  >
                    {m.completed && <Check size={11} className="text-white" />}
                  </button>
                  <span className={`flex-1 text-sm ${m.completed ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-primary)]'}`}>
                    {m.title}
                  </span>
                  <button
                    onClick={() => removeMilestone(m.id)}
                    className="p-1 text-[var(--text-muted)] hover:text-[var(--accent-rose)] opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Textarea
          label="Notes"
          placeholder="Strategy, resources, reflections..."
          value={form.notes ?? ''}
          onChange={e => set('notes', e.target.value || null)}
          rows={2}
        />

        <TagInput tags={form.tags} onChange={tags => set('tags', tags)} label="Tags" />

        <div className="flex gap-3 justify-between pt-2 border-t border-[var(--border-subtle)]">
          {goal && (
            <Button variant="danger" onClick={handleDelete} isLoading={isDeleting} size="sm">Delete</Button>
          )}
          <div className={`flex gap-3 ${goal ? '' : 'ml-auto'}`}>
            <Button variant="ghost" onClick={onClose} disabled={isSaving}>Cancel</Button>
            <Button variant="primary" onClick={handleSave} isLoading={isSaving}>
              {goal ? 'Save Changes' : 'Create Goal'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
