import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Settings2, Flame, Check } from 'lucide-react'
import { format, subDays } from 'date-fns'
import { useHabitsStore } from '@/lib/store'
import { useToast } from '@/context/ToastContext'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button, EmptyState, Skeleton } from '@/components/ui'
import { HabitFormModal } from '@/components/habits/HabitFormModal'
import { today } from '@/utils/helpers'
import type { HabitWithStreak } from '@/types'

// Sub-component to avoid hook-in-loop anti-pattern
function HabitHistory({ habitId, color, last7 }: { habitId: string; color: string; last7: string[] }) {
  const logs = useHabitsStore(s => s.logs)
  return (
    <div className="flex gap-1 mt-2">
      {last7.map(date => {
        const log = logs.find(l => l.habit_id === habitId && l.date === date)
        return (
          <div
            key={date}
            title={format(new Date(date), 'MMM d')}
            className="w-4 h-4 rounded-sm transition-all"
            style={{
              background: log?.completed ? color : 'var(--bg-overlay)',
              opacity: log?.completed ? 1 : 0.35,
            }}
          />
        )
      })}
      <span className="text-[10px] text-[var(--text-muted)] ml-1 self-center">7d</span>
    </div>
  )
}

export function HabitsPage() {
  const { habits, isLoading, fetchHabits, fetchLogs, getHabitsWithStats, toggleHabit, getTodayCompletionRate } = useHabitsStore()
  const { success, error } = useToast()
  const [showForm, setShowForm] = useState(false)
  const [editHabit, setEditHabit] = useState<HabitWithStreak | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)

  useEffect(() => {
    fetchHabits()
    fetchLogs()
  }, [fetchHabits, fetchLogs])

  const habitsWithStats = getHabitsWithStats()
  const completionRate = getTodayCompletionRate()
  const todayStr = today()

  // Last 7 days for mini history grid
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i)
    return format(d, 'yyyy-MM-dd')
  })

  const handleToggle = async (habit: HabitWithStreak) => {
    if (toggling) return
    setToggling(habit.id)
    try {
      await toggleHabit(habit.id, todayStr, !habit.completedToday)
    } catch {
      error('Failed to update habit')
    } finally {
      setToggling(null)
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <PageHeader
        title="Habits"
        subtitle={`${habitsWithStats.filter(h => h.completedToday).length} of ${habits.length} done today`}
        icon="✅"
        action={
          <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={() => setShowForm(true)}>
            Add Habit
          </Button>
        }
      />

      {/* Progress bar for today */}
      {habits.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-4 mb-6"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[var(--text-primary)]">Today's completion</span>
            <span className="text-2xl font-display font-bold" style={{ color: completionRate === 100 ? '#34d399' : '#7c6af7' }}>
              {completionRate}%
            </span>
          </div>
          <div className="h-2.5 bg-[var(--bg-overlay)] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completionRate}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ background: completionRate === 100 ? 'linear-gradient(90deg, #34d399, #38bdf8)' : 'var(--accent-violet)' }}
            />
          </div>
          {completionRate === 100 && (
            <p className="text-xs text-[var(--accent-emerald)] mt-2 flex items-center gap-1">
              <Check size={12} /> All habits completed today! 🎉
            </p>
          )}
        </motion.div>
      )}

      {/* Habits list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : habits.length === 0 ? (
        <EmptyState
          icon="🌱"
          title="No habits yet"
          description="Build habits that stick with daily tracking and streaks"
          action={<Button variant="primary" leftIcon={<Plus size={14} />} onClick={() => setShowForm(true)}>Create your first habit</Button>}
        />
      ) : (
        <div className="space-y-3">
          {habitsWithStats.map((habit, i) => (
            <motion.div
              key={habit.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`card p-4 transition-all ${habit.completedToday ? 'border-[rgba(52,211,153,0.25)]' : ''}`}
              style={habit.completedToday ? { background: 'rgba(52,211,153,0.04)' } : {}}
            >
              <div className="flex items-center gap-4">
                {/* Check button */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleToggle(habit)}
                  disabled={toggling === habit.id}
                  className={`w-11 h-11 rounded-full flex items-center justify-center text-xl border-2 transition-all shrink-0 ${
                    habit.completedToday
                      ? 'border-[var(--accent-emerald)] bg-[rgba(52,211,153,0.15)]'
                      : 'border-[var(--border)] hover:border-[var(--border-strong)]'
                  }`}
                  style={habit.completedToday ? {} : { borderColor: habit.color + '40' }}
                >
                  {toggling === habit.id ? (
                    <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  ) : habit.completedToday ? (
                    <Check size={18} style={{ color: '#34d399' }} />
                  ) : (
                    <span>{habit.icon}</span>
                  )}
                </motion.button>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-[var(--text-primary)]">{habit.name}</span>
                    {habit.streak > 0 && (
                      <span className="flex items-center gap-0.5 text-xs font-bold text-[#f59e0b]">
                        <Flame size={11} /> {habit.streak}
                      </span>
                    )}
                  </div>
                  {habit.description && (
                    <p className="text-xs text-[var(--text-muted)] truncate">{habit.description}</p>
                  )}

                  {/* 7-day history dots */}
                  <HabitHistory habitId={habit.id} color={habit.color} last7={last7} />
                </div>

                {/* Stats */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-xs text-[var(--text-muted)]">{habit.completionRate}%</span>
                  <div className="w-12 h-1 bg-[var(--bg-overlay)] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${habit.completionRate}%`, background: habit.color }} />
                  </div>
                  <button
                    onClick={() => setEditHabit(habit)}
                    className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors"
                  >
                    <Settings2 size={12} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <HabitFormModal isOpen={showForm} onClose={() => setShowForm(false)} />
      {editHabit && (
        <HabitFormModal isOpen={!!editHabit} onClose={() => setEditHabit(null)} habit={editHabit} />
      )}
    </div>
  )
}
