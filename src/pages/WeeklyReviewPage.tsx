import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { format, startOfWeek, endOfWeek, subWeeks, parseISO, eachDayOfInterval } from 'date-fns'
import { ChevronLeft, ChevronRight, Save, Star } from 'lucide-react'
import {
  useItemsStore, useJournalStore, useHabitsStore,
  useGoalsStore, useTasksStore, useExpensesStore, useWeeklyReviewStore
} from '@/lib/store'
import { useToast } from '@/context/ToastContext'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button, Textarea, Skeleton } from '@/components/ui'
import { MOOD_COLOR, MOOD_EMOJI, calculateProgress } from '@/utils/helpers'
import type { WeeklyReviewInsert } from '@/types'

// ── Stat Card ─────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color }: {
  icon: string; label: string; value: string | number; sub?: string; color?: string
}) {
  return (
    <div className="card p-4 flex items-center gap-3">
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="text-xl font-display font-bold" style={{ color: color || 'var(--text-primary)' }}>{value}</p>
        <p className="text-xs text-[var(--text-secondary)]">{label}</p>
        {sub && <p className="text-[10px] text-[var(--text-muted)]">{sub}</p>}
      </div>
    </div>
  )
}

// ── Mini sparkline ────────────────────────────────────────────
function MoodSparkline({ data }: { data: Array<{ date: string; mood: number | null }> }) {
  if (!data.length) return <p className="text-xs text-[var(--text-muted)]">No journal entries this week</p>
  return (
    <div className="flex items-end gap-1 h-10">
      {data.map((d, i) => {
        const mood = d.mood ?? 0
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
            <div
              className="w-full rounded-t-sm"
              style={{ height: mood ? `${(mood / 10) * 36}px` : '3px', background: mood ? MOOD_COLOR(mood) : 'var(--bg-overlay)', opacity: mood ? 1 : 0.4 }}
              title={mood ? `${MOOD_EMOJI[mood]} ${d.date}` : d.date}
            />
            <span className="text-[8px] text-[var(--text-muted)]">{format(parseISO(d.date), 'E')[0]}</span>
          </div>
        )
      })}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────
export function WeeklyReviewPage() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [isSaving, setIsSaving] = useState(false)


  const { items, fetchItems } = useItemsStore()
  const { logs: journalLogs, fetchLogs } = useJournalStore()
  const { habits, getHabitsWithStats, fetchHabits, fetchLogs: fetchHabitLogs } = useHabitsStore()
  const { goals, fetchGoals } = useGoalsStore()
  const { tasks, fetchTasks } = useTasksStore()
  const { expenses, fetchExpenses, getMonthlyTotal } = useExpensesStore()
  const { reviews, fetchReviews, upsertReview, getCurrentWeekReview } = useWeeklyReviewStore()

  // Fetch all data needed for this page on mount
  useEffect(() => {
    fetchItems()
    fetchLogs(60)
    fetchHabits()
    fetchHabitLogs(30)
    fetchGoals()
    fetchTasks()
    fetchExpenses()
    fetchReviews()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const { success, error: showError } = useToast()


  // Week range
  const weekStart = startOfWeek(subWeeks(new Date(), weekOffset), { weekStartsOn: 1 })
  const weekEnd   = endOfWeek(weekStart, { weekStartsOn: 1 })
  const weekDays  = eachDayOfInterval({ start: weekStart, end: weekEnd })
  const wsStr     = format(weekStart, 'yyyy-MM-dd')
  const weStr     = format(weekEnd, 'yyyy-MM-dd')
  const isCurrentWeek = weekOffset === 0

  const existingReview = reviews.find(r => r.week_start === wsStr)

  const [form, setForm] = useState({
    reflection: '',
    highlights: '',
    improvements: '',
    next_week_focus: '',
    rating: 0,
  })

  useEffect(() => {
    if (existingReview) {
      setForm({
        reflection:      existingReview.reflection      ?? '',
        highlights:      existingReview.highlights      ?? '',
        improvements:    existingReview.improvements    ?? '',
        next_week_focus: existingReview.next_week_focus ?? '',
        rating:          existingReview.rating          ?? 0,
      })
    } else {
      setForm({ reflection: '', highlights: '', improvements: '', next_week_focus: '', rating: 0 })
    }
  }, [existingReview, wsStr])

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  // ── Week stats ─────────────────────────────────────────────
  const stats = useMemo(() => {
    const inRange = (date: string) => date >= wsStr && date <= weStr

    // Journal
    const weekJournal = journalLogs.filter(l => inRange(l.date))
    const avgMood = weekJournal.filter(l => l.mood).length
      ? weekJournal.reduce((s, l) => s + (l.mood ?? 0), 0) / weekJournal.filter(l => l.mood).length
      : null
    const avgEnergy = weekJournal.filter(l => l.energy).length
      ? weekJournal.reduce((s, l) => s + (l.energy ?? 0), 0) / weekJournal.filter(l => l.energy).length
      : null

    // Mood by day
    const moodByDay = weekDays.map(d => {
      const ds = format(d, 'yyyy-MM-dd')
      const log = weekJournal.find(l => l.date === ds)
      return { date: ds, mood: log?.mood ?? null }
    })

    // Habits
    const habitsWithStats = getHabitsWithStats()
    const habitRate = habits.length > 0
      ? Math.round(habitsWithStats.reduce((s, h) => {
          const weekLogs = h.completionRate // already 30-day, approximate
          return s + weekLogs
        }, 0) / habits.length)
      : 0

    // Items completed
    const completedItems = items.filter(i => i.completed_at && inRange(i.completed_at))

    // Tasks
    const completedTasks = tasks.filter(t => t.completed_at && t.completed_at.startsWith(wsStr.slice(0, 7)))

    // Expenses
    const weekExpenses = expenses.filter(e => inRange(e.date))
    const weekSpend = weekExpenses.reduce((s, e) => s + Number(e.amount), 0)

    // Goals progress
    const activeGoals = goals.filter(g => g.status === 'active')
    const avgGoalPct = activeGoals.length
      ? Math.round(activeGoals.reduce((s, g) => s + calculateProgress(g.current_value, g.target_value ?? undefined), 0) / activeGoals.length)
      : 0

    return {
      journalCount: weekJournal.length,
      avgMood, avgEnergy, moodByDay,
      habitRate, habitsWithStats,
      completedItems, completedTasks,
      weekSpend, weekExpenses: weekExpenses.length,
      activeGoals, avgGoalPct,
    }
  }, [wsStr, weStr, journalLogs, habits, getHabitsWithStats, items, tasks, expenses, goals, weekDays])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await upsertReview({
        week_start:      wsStr,
        week_end:        weStr,
        reflection:      form.reflection      || null,
        highlights:      form.highlights      || null,
        improvements:    form.improvements    || null,
        next_week_focus: form.next_week_focus || null,
        rating:          form.rating          || null,
      })
      success('Weekly review saved')
    } catch { showError('Failed to save review') }
    finally { setIsSaving(false) }
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <PageHeader title="Weekly Review" icon="🔍" subtitle="Reflect on your week" />

      {/* Week navigator */}
      <div className="flex items-center justify-between mb-6 card p-3">
        <button
          onClick={() => setWeekOffset(w => w + 1)}
          className="p-2 rounded-xl hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="text-center">
          <p className="font-display font-semibold text-[var(--text-primary)]">
            {isCurrentWeek ? 'This Week' : format(weekStart, 'MMM d')} — {format(weekEnd, 'MMM d, yyyy')}
          </p>
          {isCurrentWeek && (
            <p className="text-xs text-[var(--accent-violet)]">Current week</p>
          )}
        </div>
        <button
          onClick={() => setWeekOffset(w => Math.max(0, w - 1))}
          disabled={weekOffset === 0}
          className="p-2 rounded-xl hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] transition-colors disabled:opacity-30"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Auto-generated stats */}
      <div className="space-y-4 mb-6">
        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Week at a Glance</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon="📔" label="Journal entries" value={stats.journalCount}
            sub={stats.avgMood ? `Avg mood ${stats.avgMood.toFixed(1)}` : 'No mood data'}
            color={stats.avgMood ? MOOD_COLOR(Math.round(stats.avgMood)) : undefined} />
          <StatCard icon="✅" label="Habit rate" value={`${stats.habitRate}%`}
            sub={`${habits.length} active habits`}
            color={stats.habitRate >= 80 ? '#34d399' : stats.habitRate >= 50 ? '#f59e0b' : '#f87171'} />
          <StatCard icon="📚" label="Items completed" value={stats.completedItems.length}
            sub={stats.completedItems.map(i => i.title).join(', ').slice(0, 30) || 'None'} />
          <StatCard icon="💸" label="Spent this week" value={`₹${Math.round(stats.weekSpend / 100) / 10}k`}
            sub={`${stats.weekExpenses} transactions`} />
        </div>

        {/* Mood sparkline */}
        <div className="card p-4">
          <p className="text-xs font-medium text-[var(--text-secondary)] mb-3">Mood this week</p>
          <MoodSparkline data={stats.moodByDay} />
        </div>

        {/* Habit breakdown */}
        {stats.habitsWithStats.length > 0 && (
          <div className="card p-4">
            <p className="text-xs font-medium text-[var(--text-secondary)] mb-3">Habit performance</p>
            <div className="space-y-2">
              {stats.habitsWithStats.slice(0, 6).map(h => (
                <div key={h.id} className="flex items-center gap-3">
                  <span className="text-base w-6">{h.icon}</span>
                  <span className="text-xs text-[var(--text-secondary)] flex-1 truncate">{h.name}</span>
                  {/* Day dots */}
                  <div className="flex gap-1">
                    {weekDays.map((d, i) => {
                      const ds = format(d, 'yyyy-MM-dd')
                      // Check if completed — approximate from streak data
                      const done = h.streak > 0 && i >= 7 - h.streak
                      return (
                        <div key={i} className="w-3.5 h-3.5 rounded-sm"
                          style={{ background: done ? h.color : 'var(--bg-overlay)', opacity: done ? 1 : 0.3 }}
                          title={format(d, 'EEE')}
                        />
                      )
                    })}
                  </div>
                  <span className="text-[10px] font-bold w-8 text-right" style={{ color: h.color }}>
                    {h.streak}🔥
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Goals */}
        {stats.activeGoals.length > 0 && (
          <div className="card p-4">
            <p className="text-xs font-medium text-[var(--text-secondary)] mb-3">
              Goals — avg {stats.avgGoalPct}% complete
            </p>
            <div className="space-y-2">
              {stats.activeGoals.map(g => {
                const pct = calculateProgress(g.current_value, g.target_value ?? undefined)
                return (
                  <div key={g.id} className="flex items-center gap-3">
                    <span className="text-xs text-[var(--text-secondary)] flex-1 truncate">{g.title}</span>
                    <div className="w-24 h-1.5 bg-[var(--bg-overlay)] rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-[var(--accent-violet)]" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] font-mono w-8 text-right text-[var(--text-muted)]">{pct}%</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Reflection form */}
      <div className="space-y-4">
        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Your Reflection</p>

        {/* Week rating */}
        <div className="card p-4">
          <p className="text-sm font-medium text-[var(--text-primary)] mb-3">How was this week overall?</p>
          <div className="flex gap-2">
            {[1,2,3,4,5,6,7,8,9,10].map(r => (
              <button
                key={r}
                onClick={() => set('rating', r)}
                className="flex-1 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105"
                style={{
                  background: form.rating === r ? 'var(--accent-violet)' : 'var(--bg-elevated)',
                  color: form.rating === r ? 'white' : 'var(--text-muted)',
                  border: `1px solid ${form.rating === r ? 'var(--accent-violet)' : 'var(--border)'}`,
                }}
              >
                {r}
              </button>
            ))}
          </div>
          {form.rating > 0 && (
            <p className="text-xs text-[var(--text-secondary)] mt-2 text-center">
              {form.rating >= 9 ? '🚀 Exceptional week!' : form.rating >= 7 ? '😊 Solid week' : form.rating >= 5 ? '😐 Average week' : '😔 Tough week — that\'s okay'}
            </p>
          )}
        </div>

        <Textarea
          label="✍️ Reflection — What happened this week?"
          placeholder="Stream of consciousness — what did you do, feel, learn, experience?"
          value={form.reflection}
          onChange={e => set('reflection', e.target.value)}
          rows={4}
        />

        <Textarea
          label="✨ Highlights — What went well?"
          placeholder="Wins, progress, moments to remember..."
          value={form.highlights}
          onChange={e => set('highlights', e.target.value)}
          rows={3}
        />

        <Textarea
          label="🔧 Improvements — What could be better?"
          placeholder="What held you back? What would you do differently?"
          value={form.improvements}
          onChange={e => set('improvements', e.target.value)}
          rows={3}
        />

        <Textarea
          label="🎯 Next Week Focus — Top 3 priorities"
          placeholder="The 3 most important things to focus on next week..."
          value={form.next_week_focus}
          onChange={e => set('next_week_focus', e.target.value)}
          rows={3}
        />

        <Button
          variant="primary"
          className="w-full"
          leftIcon={<Save size={14} />}
          isLoading={isSaving}
          onClick={handleSave}
        >
          {existingReview ? 'Update Review' : 'Save Review'}
        </Button>

        {existingReview && (
          <p className="text-xs text-center text-[var(--text-muted)]">
            Last saved {format(parseISO(existingReview.updated_at), 'MMM d \'at\' h:mm a')}
          </p>
        )}
      </div>

      {/* Past reviews */}
      {reviews.filter(r => r.week_start !== wsStr && r.reflection).length > 0 && (
        <div className="mt-8 space-y-3">
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Past Reviews</p>
          {reviews.filter(r => r.week_start !== wsStr && r.reflection).slice(0, 3).map(r => (
            <button
              key={r.id}
              onClick={() => setWeekOffset(Math.round((new Date().getTime() - new Date(r.week_start).getTime()) / (7 * 86400000)))}
              className="w-full card p-4 text-left hover:border-[var(--border-strong)] transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {format(parseISO(r.week_start), 'MMM d')} — {format(parseISO(r.week_end), 'MMM d, yyyy')}
                </span>
                {r.rating && (
                  <span className="flex items-center gap-1 text-xs font-bold text-[var(--accent-amber)]">
                    <Star size={11} className="fill-current" />{r.rating}/10
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--text-secondary)] line-clamp-2">{r.reflection}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
