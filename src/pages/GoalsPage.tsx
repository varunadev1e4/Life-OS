import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Pin, Target, CheckCircle2, Pause, X } from 'lucide-react'
import { useGoalsStore } from '@/lib/store'
import { useToast } from '@/context/ToastContext'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button, EmptyState, Skeleton, ProgressBar } from '@/components/ui'
import { GoalFormModal } from '@/components/goals/GoalFormModal'
import { GoalDetailModal } from '@/components/goals/GoalDetailModal'
import { GOAL_CATEGORY_CONFIG, calculateProgress, formatDate } from '@/utils/helpers'
import type { Goal } from '@/types'

const STATUS_ICONS: Record<string, typeof CheckCircle2> = {
  active: Target,
  completed: CheckCircle2,
  paused: Pause,
  abandoned: X,
}

const STATUS_COLORS: Record<string, string> = {
  active: '#7c6af7',
  completed: '#34d399',
  paused: '#f59e0b',
  abandoned: '#f87171',
}

export function GoalsPage() {
  const { goals, isLoading, fetchGoals, updateGoal } = useGoalsStore()
  const { error } = useToast()
  const [showForm, setShowForm] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)
  const [editGoal, setEditGoal] = useState<Goal | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('active')

  useEffect(() => { fetchGoals() }, [fetchGoals])

  const filtered = goals.filter(g => statusFilter === 'all' ? true : g.status === statusFilter)
  const activeCount = goals.filter(g => g.status === 'active').length
  const completedCount = goals.filter(g => g.status === 'completed').length

  const handlePin = async (goal: Goal) => {
    try {
      await updateGoal(goal.id, { is_pinned: !goal.is_pinned })
    } catch {
      error('Failed to update goal')
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <PageHeader
        title="Goals"
        subtitle={`${activeCount} active · ${completedCount} completed`}
        icon="🎯"
        action={
          <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={() => setShowForm(true)}>
            New Goal
          </Button>
        }
      />

      {/* Status filter */}
      <div className="flex gap-2 mb-6">
        {[
          { value: 'active', label: `Active (${activeCount})` },
          { value: 'completed', label: `Completed (${completedCount})` },
          { value: 'all', label: 'All' },
        ].map(f => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value as typeof statusFilter)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              statusFilter === f.value
                ? 'bg-[var(--accent-violet)] text-white'
                : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)] hover:text-[var(--text-primary)]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="🎯"
          title={statusFilter === 'active' ? 'No active goals' : 'No goals found'}
          description="Break your ambitions into measurable, trackable goals"
          action={<Button variant="primary" leftIcon={<Plus size={14} />} onClick={() => setShowForm(true)}>Create a goal</Button>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map((goal, i) => {
            const catConfig = GOAL_CATEGORY_CONFIG[goal.category]
            const pct = calculateProgress(goal.current_value, goal.target_value ?? undefined)
            const StatusIcon = STATUS_ICONS[goal.status] || Target
            const completedMilestones = goal.milestones.filter(m => m.completed).length

            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="card p-5 group cursor-pointer hover:border-[var(--border-strong)] transition-all"
                onClick={() => setSelectedGoal(goal)}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{catConfig.icon}</span>
                    <div>
                      <h3 className="font-semibold text-sm text-[var(--text-primary)] leading-tight line-clamp-2 group-hover:text-[var(--accent-violet)] transition-colors">
                        {goal.title}
                      </h3>
                      <span className="text-xs" style={{ color: catConfig.color }}>{catConfig.label}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={e => { e.stopPropagation(); handlePin(goal) }}
                      className={`p-1.5 rounded-lg transition-colors ${goal.is_pinned ? 'text-[var(--accent-amber)]' : 'text-[var(--text-muted)] opacity-0 group-hover:opacity-100'}`}
                    >
                      <Pin size={12} className={goal.is_pinned ? 'fill-current' : ''} />
                    </button>
                    <div className="p-1.5 rounded-lg" style={{ background: `${STATUS_COLORS[goal.status]}1a` }}>
                      <StatusIcon size={13} style={{ color: STATUS_COLORS[goal.status] }} />
                    </div>
                  </div>
                </div>

                {/* Progress */}
                {goal.target_value && (
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--text-muted)] font-mono">
                        {goal.current_value} / {goal.target_value} {goal.unit}
                      </span>
                      <span className="text-xs font-bold font-mono" style={{ color: catConfig.color }}>{pct}%</span>
                    </div>
                    <ProgressBar value={pct} color={catConfig.color} />
                  </div>
                )}

                {/* Milestones count */}
                {goal.milestones.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                    <CheckCircle2 size={11} />
                    {completedMilestones}/{goal.milestones.length} milestones
                  </div>
                )}

                {/* Deadline */}
                {goal.deadline && (
                  <p className="text-xs text-[var(--text-muted)] mt-2">
                    Due {formatDate(goal.deadline)}
                  </p>
                )}
              </motion.div>
            )
          })}
        </div>
      )}

      <GoalFormModal isOpen={showForm} onClose={() => setShowForm(false)} />
      {editGoal && <GoalFormModal isOpen={!!editGoal} onClose={() => setEditGoal(null)} goal={editGoal} />}
      {selectedGoal && (
        <GoalDetailModal
          isOpen={!!selectedGoal}
          onClose={() => setSelectedGoal(null)}
          goal={selectedGoal}
          onEdit={g => { setSelectedGoal(null); setEditGoal(g) }}
        />
      )}
    </div>
  )
}