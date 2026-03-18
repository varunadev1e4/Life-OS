import { Modal, Button, ProgressBar } from '@/components/ui'
import { useGoalsStore } from '@/lib/store'
import { useToast } from '@/context/ToastContext'
import { GOAL_CATEGORY_CONFIG, calculateProgress, formatDate } from '@/utils/helpers'
import { Edit2, Calendar, Check } from 'lucide-react'
import { useState } from 'react'
import type { Goal } from '@/types'

interface GoalDetailModalProps {
  isOpen: boolean
  onClose: () => void
  goal: Goal
  onEdit: (goal: Goal) => void
}

export function GoalDetailModal({ isOpen, onClose, goal, onEdit }: GoalDetailModalProps) {
  const { updateGoal } = useGoalsStore()
  const { success, error } = useToast()
  const [saving, setSaving] = useState<string | null>(null)
  const [progressValue, setProgressValue] = useState(String(goal.current_value))

  const catConfig = GOAL_CATEGORY_CONFIG[goal.category]
  const pct = calculateProgress(goal.current_value, goal.target_value ?? undefined)

  const toggleMilestone = async (milestoneId: string) => {
    setSaving(milestoneId)
    try {
      const updated = goal.milestones.map(m =>
        m.id === milestoneId ? { ...m, completed: !m.completed } : m
      )
      await updateGoal(goal.id, { milestones: updated })
      // Check if all milestones done → prompt complete?
    } catch {
      error('Failed to update milestone')
    } finally {
      setSaving(null)
    }
  }

  const updateProgress = async () => {
    const val = Number(progressValue)
    if (isNaN(val)) return
    try {
      await updateGoal(goal.id, {
        current_value: val,
        status: goal.target_value && val >= goal.target_value ? 'completed' : goal.status,
      })
      success('Progress updated')
    } catch {
      error('Failed to update progress')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{catConfig.icon}</span>
            <div>
              <h2 className="font-display font-bold text-lg text-[var(--text-primary)] leading-tight">{goal.title}</h2>
              <span className="text-sm" style={{ color: catConfig.color }}>{catConfig.label}</span>
            </div>
          </div>
          <Button variant="secondary" size="sm" leftIcon={<Edit2 size={13} />} onClick={() => onEdit(goal)}>
            Edit
          </Button>
        </div>

        {goal.description && (
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{goal.description}</p>
        )}

        {/* Progress */}
        {goal.target_value && (
          <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">Progress</span>
              <span className="text-xl font-display font-bold" style={{ color: catConfig.color }}>{pct}%</span>
            </div>
            <ProgressBar value={pct} color={catConfig.color} />
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={progressValue}
                onChange={e => setProgressValue(e.target.value)}
                className="w-24 bg-[var(--bg-base)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-violet)] transition-colors"
              />
              <span className="text-sm text-[var(--text-muted)]">/ {goal.target_value} {goal.unit}</span>
              <Button variant="primary" size="sm" onClick={updateProgress} className="ml-auto">Update</Button>
            </div>
          </div>
        )}

        {/* Deadline */}
        {goal.deadline && (
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <Calendar size={14} />
            <span>Due {formatDate(goal.deadline)}</span>
          </div>
        )}

        {/* Milestones */}
        {goal.milestones.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">
              Milestones — {goal.milestones.filter(m => m.completed).length}/{goal.milestones.length}
            </h3>
            <div className="space-y-1.5">
              {goal.milestones.map(m => (
                <button
                  key={m.id}
                  onClick={() => toggleMilestone(m.id)}
                  disabled={saving === m.id}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-overlay)] transition-colors text-left"
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                    m.completed ? 'bg-[var(--accent-emerald)] border-[var(--accent-emerald)]' : 'border-[var(--border-strong)]'
                  }`}>
                    {m.completed && <Check size={11} className="text-white" />}
                  </div>
                  <span className={`text-sm flex-1 ${m.completed ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-primary)]'}`}>
                    {m.title}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {goal.notes && (
          <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]">
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{goal.notes}</p>
          </div>
        )}

        {/* Tags */}
        {goal.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {goal.tags.map(t => (
              <span key={t} className="text-xs px-2 py-0.5 rounded-lg"
                style={{ background: 'rgba(124,106,247,0.1)', color: 'var(--accent-violet)' }}>
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
