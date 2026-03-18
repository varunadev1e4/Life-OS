import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { format, parseISO, subDays } from 'date-fns'
import { TrendingUp, TrendingDown, Lightbulb, AlertTriangle, Star, Zap, RefreshCw } from 'lucide-react'
import {
  useItemsStore, useJournalStore, useHabitsStore,
  useGoalsStore, useExpensesStore, useTasksStore, useHealthStore
} from '@/lib/store'
import { PageHeader } from '@/components/ui/PageHeader'
import { Skeleton } from '@/components/ui'
import { MOOD_COLOR, calculateProgress } from '@/utils/helpers'

// ── Insight types ─────────────────────────────────────────────
type InsightLevel = 'good' | 'warning' | 'info' | 'tip'

interface Insight {
  id: string
  level: InsightLevel
  title: string
  body: string
  stat?: string
  icon: string
  category: string
}

const LEVEL_CONFIG: Record<InsightLevel, { color: string; bg: string; icon: typeof TrendingUp }> = {
  good:    { color: '#34d399', bg: 'rgba(52,211,153,0.08)',  icon: TrendingUp },
  warning: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  icon: AlertTriangle },
  info:    { color: '#38bdf8', bg: 'rgba(56,189,248,0.08)',  icon: Lightbulb },
  tip:     { color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', icon: Star },
}

// ── Insight Card ──────────────────────────────────────────────
function InsightCard({ insight, index }: { insight: Insight; index: number }) {
  const cfg = LEVEL_CONFIG[insight.level]
  const LevelIcon = cfg.icon
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="card p-4 flex gap-4"
      style={{ borderColor: `${cfg.color}30` }}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
        style={{ background: cfg.bg }}>
        {insight.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-sm font-semibold text-[var(--text-primary)] leading-snug">{insight.title}</p>
          {insight.stat && (
            <span className="text-sm font-bold font-mono shrink-0" style={{ color: cfg.color }}>
              {insight.stat}
            </span>
          )}
        </div>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{insight.body}</p>
        <span className="text-[10px] text-[var(--text-muted)] mt-1.5 inline-block uppercase tracking-wider font-medium">
          {insight.category}
        </span>
      </div>
    </motion.div>
  )
}

// ── Main Page ─────────────────────────────────────────────────
export function InsightsPage() {
  const { items, fetchItems } = useItemsStore()
  const { logs: journal, fetchLogs } = useJournalStore()
  const { habits, getHabitsWithStats, fetchHabits, fetchLogs: fetchHabitLogs } = useHabitsStore()
  const { goals, fetchGoals } = useGoalsStore()
  const { expenses, fetchExpenses } = useExpensesStore()
  const { tasks, fetchTasks } = useTasksStore()
  const { entries: health, fetchRecent } = useHealthStore()
  const [refreshKey, setRefreshKey] = useState(0)
  // Fetch all data on mount or when user hits refresh
  useEffect(() => {
    fetchItems()
    fetchLogs(90)
    fetchHabits()
    fetchHabitLogs(30)
    fetchGoals()
    fetchExpenses()
    fetchTasks()
    fetchRecent(30)
  }, [refreshKey]) // eslint-disable-line react-hooks/exhaustive-deps





  const habitsWithStats = getHabitsWithStats()

  const insights: Insight[] = useMemo(() => {
    const result: Insight[] = []
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]

    // ── MOOD INSIGHTS ───────────────────────────────────────
    const last30Journal = journal.filter(l => l.date >= format(subDays(today, 30), 'yyyy-MM-dd'))
    const last7Journal  = journal.filter(l => l.date >= format(subDays(today, 7),  'yyyy-MM-dd'))

    const avg30Mood = last30Journal.filter(l => l.mood).length
      ? last30Journal.reduce((s, l) => s + (l.mood ?? 0), 0) / last30Journal.filter(l => l.mood).length
      : null

    const avg7Mood = last7Journal.filter(l => l.mood).length
      ? last7Journal.reduce((s, l) => s + (l.mood ?? 0), 0) / last7Journal.filter(l => l.mood).length
      : null

    if (avg30Mood && avg7Mood) {
      const diff = avg7Mood - avg30Mood
      if (diff > 1) result.push({
        id: 'mood-up', level: 'good', icon: '😊', category: 'Mood',
        title: 'Your mood is trending up this week',
        body: `This week's average mood (${avg7Mood.toFixed(1)}) is higher than your 30-day average (${avg30Mood.toFixed(1)}). Keep doing what you're doing!`,
        stat: `+${diff.toFixed(1)}`,
      })
      else if (diff < -1) result.push({
        id: 'mood-down', level: 'warning', icon: '😔', category: 'Mood',
        title: 'Your mood dipped this week',
        body: `This week's average (${avg7Mood.toFixed(1)}) is below your 30-day average (${avg30Mood.toFixed(1)}). Take a moment to check in with yourself — a habit reset or extra sleep often helps.`,
        stat: `${diff.toFixed(1)}`,
      })
    }

    // Mood + Exercise correlation
    const journalWithMood = last30Journal.filter(l => l.mood && l.tags)
    const exerciseDays    = journalWithMood.filter(l => l.tags.some(t => ['exercise','gym','run','workout','yoga'].includes(t)))
    const nonExerciseDays = journalWithMood.filter(l => !l.tags.some(t => ['exercise','gym','run','workout','yoga'].includes(t)))

    if (exerciseDays.length >= 3 && nonExerciseDays.length >= 3) {
      const exMood    = exerciseDays.reduce((s, l) => s + (l.mood ?? 0), 0) / exerciseDays.length
      const nonExMood = nonExerciseDays.reduce((s, l) => s + (l.mood ?? 0), 0) / nonExerciseDays.length
      if (exMood - nonExMood > 0.5) result.push({
        id: 'exercise-mood', level: 'good', icon: '💪', category: 'Pattern',
        title: 'Exercise boosts your mood significantly',
        body: `On days you tagged exercise, your average mood was ${exMood.toFixed(1)} vs ${nonExMood.toFixed(1)} on other days. That's a ${(exMood - nonExMood).toFixed(1)} point boost — a clear pattern.`,
        stat: `+${(exMood - nonExMood).toFixed(1)}`,
      })
    }

    // Journal streak
    const journalDates = new Set(journal.map(l => l.date))
    let journalStreak = 0
    for (let i = 0; i < 60; i++) {
      if (journalDates.has(format(subDays(today, i), 'yyyy-MM-dd'))) journalStreak++
      else break
    }
    if (journalStreak >= 7) result.push({
      id: 'journal-streak', level: 'good', icon: '📔', category: 'Journal',
      title: `${journalStreak}-day journaling streak`,
      body: `You've written in your journal every day for ${journalStreak} days. Consistent reflection is linked to better emotional regulation and self-awareness. Keep it going!`,
      stat: `${journalStreak}d`,
    })
    else if (journalStreak === 0 && journal.length > 0) result.push({
      id: 'no-journal', level: 'warning', icon: '📔', category: 'Journal',
      title: 'No journal entry today',
      body: `Even 2 minutes of writing — just your mood and one highlight — builds the habit. Open the Journal tab to write today's entry.`,
    })

    // ── HABIT INSIGHTS ──────────────────────────────────────
    const topHabit = [...habitsWithStats].sort((a, b) => b.streak - a.streak)[0]
    if (topHabit?.streak >= 7) result.push({
      id: 'top-streak', level: 'good', icon: topHabit.icon, category: 'Habits',
      title: `${topHabit.name} — ${topHabit.streak}-day streak`,
      body: `You're on a ${topHabit.streak}-day streak with "${topHabit.name}". Streaks this long become identity-level habits. At 66 days it's fully automatic.`,
      stat: `${topHabit.streak}🔥`,
    })

    const worstHabit = [...habitsWithStats].filter(h => h.completionRate < 40).sort((a, b) => a.completionRate - b.completionRate)[0]
    if (worstHabit) result.push({
      id: 'weak-habit', level: 'warning', icon: worstHabit.icon, category: 'Habits',
      title: `"${worstHabit.name}" needs attention`,
      body: `This habit has only a ${worstHabit.completionRate}% completion rate over 30 days. Consider reducing the friction — make it smaller, attach it to an existing habit, or adjust the goal.`,
      stat: `${worstHabit.completionRate}%`,
    })

    const todayHabits    = habitsWithStats.filter(h => h.completedToday).length
    const totalHabits    = habitsWithStats.length
    const todayHabitRate = totalHabits > 0 ? Math.round((todayHabits / totalHabits) * 100) : 0
    if (todayHabitRate === 100 && totalHabits > 0) result.push({
      id: 'perfect-day', level: 'good', icon: '🌟', category: 'Habits',
      title: 'Perfect habit day!',
      body: `You've completed all ${totalHabits} habits today. That's a perfect day. Write a journal entry to capture how you feel — perfect days are worth remembering.`,
      stat: '100%',
    })

    // ── LIBRARY INSIGHTS ────────────────────────────────────
    const thisYear   = today.getFullYear()
    const booksRead  = items.filter(i => i.type === 'book' && i.status === 'completed' && i.completed_at?.startsWith(String(thisYear))).length
    const booksGoal  = 24
    const weekOfYear = Math.floor((today.getTime() - new Date(thisYear, 0, 1).getTime()) / (7 * 86400000))
    const booksOnPace = Math.floor((weekOfYear / 52) * booksGoal)
    if (booksRead < booksOnPace - 2) result.push({
      id: 'reading-behind', level: 'warning', icon: '📚', category: 'Reading',
      title: `Reading pace is behind`,
      body: `You've read ${booksRead} books this year but should be at ~${booksOnPace} to hit 24. That's ${booksOnPace - booksRead} to catch up. Consider swapping one TV show session for reading.`,
      stat: `${booksRead}/${booksGoal}`,
    })
    else if (booksRead >= booksOnPace && booksRead > 0) result.push({
      id: 'reading-on-pace', level: 'good', icon: '📚', category: 'Reading',
      title: 'Reading pace is on track',
      body: `${booksRead} books completed this year — you're on pace or ahead for your 24-book goal. Keep the habit consistent even through busy weeks.`,
      stat: `${booksRead}/${booksGoal}`,
    })

    const highRatedItems = items.filter(i => i.rating && i.rating >= 9)
    if (highRatedItems.length >= 3) {
      const tags = highRatedItems.flatMap(i => i.tags)
      const tagCounts = tags.reduce((acc, t) => { acc[t] = (acc[t] || 0) + 1; return acc }, {} as Record<string, number>)
      const topTag = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])[0]
      if (topTag && topTag[1] >= 2) result.push({
        id: 'top-tag', level: 'tip', icon: '🏷️', category: 'Taste',
        title: `You love "${topTag[0]}" content`,
        body: `${topTag[1]} of your highest-rated items are tagged "${topTag[0]}". This is a strong signal of what resonates with you — consider prioritizing this genre or topic.`,
      })
    }

    // ── GOAL INSIGHTS ────────────────────────────────────────
    const staleGoals = goals.filter(g => {
      if (g.status !== 'active' || !g.target_value) return false
      const pct = calculateProgress(g.current_value, g.target_value)
      return pct < 10
    })
    if (staleGoals.length > 0) result.push({
      id: 'stale-goals', level: 'warning', icon: '🎯', category: 'Goals',
      title: `${staleGoals.length} goal${staleGoals.length > 1 ? 's' : ''} stuck at 0%`,
      body: `"${staleGoals[0].title}"${staleGoals.length > 1 ? ` and ${staleGoals.length - 1} other${staleGoals.length > 2 ? 's' : ''}` : ''} haven't moved. Break them into smaller weekly milestones or consider pausing them to focus on what's active.`,
    })

    const nearDoneGoals = goals.filter(g => {
      if (g.status !== 'active' || !g.target_value) return false
      return calculateProgress(g.current_value, g.target_value) >= 80
    })
    if (nearDoneGoals.length > 0) result.push({
      id: 'near-done', level: 'good', icon: '🏁', category: 'Goals',
      title: `Almost there — ${nearDoneGoals[0].title}`,
      body: `"${nearDoneGoals[0].title}" is ${calculateProgress(nearDoneGoals[0].current_value, nearDoneGoals[0].target_value ?? undefined)}% complete. One final push and you can mark this done. Schedule 2 focused sessions this week.`,
      stat: `${calculateProgress(nearDoneGoals[0].current_value, nearDoneGoals[0].target_value ?? undefined)}%`,
    })

    // ── EXPENSE INSIGHTS ─────────────────────────────────────
    const thisMonth  = today.getMonth() + 1
    const lastMonth  = thisMonth === 1 ? 12 : thisMonth - 1
    const thisMonthExp = expenses.filter(e => new Date(e.date).getMonth() + 1 === thisMonth && new Date(e.date).getFullYear() === thisYear)
    const lastMonthExp = expenses.filter(e => new Date(e.date).getMonth() + 1 === lastMonth)

    const thisTotal = thisMonthExp.reduce((s, e) => s + Number(e.amount), 0)
    const lastTotal = lastMonthExp.reduce((s, e) => s + Number(e.amount), 0)

    if (thisTotal > 0 && lastTotal > 0) {
      const diff = ((thisTotal - lastTotal) / lastTotal) * 100
      if (diff > 20) result.push({
        id: 'spending-up', level: 'warning', icon: '💸', category: 'Finance',
        title: 'Spending is up significantly this month',
        body: `You've spent ₹${Math.round(thisTotal).toLocaleString('en-IN')} vs ₹${Math.round(lastTotal).toLocaleString('en-IN')} last month — a ${diff.toFixed(0)}% increase. Check the Expenses page to see which category is driving this.`,
        stat: `+${diff.toFixed(0)}%`,
      })
      else if (diff < -10) result.push({
        id: 'spending-down', level: 'good', icon: '💰', category: 'Finance',
        title: 'Great job — spending is down this month',
        body: `You've spent ${Math.abs(diff).toFixed(0)}% less than last month. ₹${Math.round(lastTotal - thisTotal).toLocaleString('en-IN')} saved. Consider moving the difference to savings.`,
        stat: `-${Math.abs(diff).toFixed(0)}%`,
      })
    }

    // Recurring expenses
    const recurringTotal = expenses.filter(e => e.is_recurring).reduce((s, e) => s + Number(e.amount), 0)
    if (recurringTotal > 0) result.push({
      id: 'recurring', level: 'info', icon: '🔄', category: 'Finance',
      title: `₹${Math.round(recurringTotal).toLocaleString('en-IN')} in recurring expenses`,
      body: `You have recurring expenses every month. Review them occasionally — subscriptions you've forgotten about quietly drain money. When did you last audit your subscriptions?`,
      stat: `₹${Math.round(recurringTotal / 1000)}k/mo`,
    })

    // ── HEALTH INSIGHTS ──────────────────────────────────────
    const last7Health = health.filter(h => h.date >= format(subDays(today, 7), 'yyyy-MM-dd'))
    const avgWater    = last7Health.length ? last7Health.reduce((s, h) => s + h.water_ml, 0) / last7Health.length : 0
    const avgSteps    = last7Health.length ? last7Health.reduce((s, h) => s + h.steps, 0) / last7Health.length : 0

    if (avgWater > 0 && avgWater < 1500) result.push({
      id: 'low-water', level: 'warning', icon: '💧', category: 'Health',
      title: 'Water intake is consistently low',
      body: `Your 7-day average is ${Math.round(avgWater)}ml — well below the 2500ml goal. Dehydration directly impacts focus, mood, and energy. Try keeping a water bottle at your desk.`,
      stat: `${Math.round(avgWater)}ml`,
    })
    else if (avgWater >= 2500) result.push({
      id: 'good-water', level: 'good', icon: '💧', category: 'Health',
      title: 'Excellent hydration this week',
      body: `Averaging ${Math.round(avgWater)}ml daily — above the 2500ml goal. Proper hydration supports focus, mood, and physical performance. Solid habit.`,
      stat: `${Math.round(avgWater)}ml`,
    })

    if (avgSteps > 0 && avgSteps < 5000) result.push({
      id: 'low-steps', level: 'warning', icon: '🚶', category: 'Health',
      title: 'Step count is low this week',
      body: `Averaging ${Math.round(avgSteps).toLocaleString()} steps/day. Even a 20-minute walk adds 2000+ steps and improves mood and energy. Consider walking during phone calls.`,
      stat: `${(Math.round(avgSteps) / 1000).toFixed(1)}k`,
    })

    // ── TASKS INSIGHTS ───────────────────────────────────────
    const overdueTasks = tasks.filter(t => t.status === 'todo' && t.due_date && t.due_date < todayStr)
    if (overdueTasks.length >= 3) result.push({
      id: 'overdue-tasks', level: 'warning', icon: '⏰', category: 'Tasks',
      title: `${overdueTasks.length} overdue tasks piling up`,
      body: `You have ${overdueTasks.length} overdue tasks. This creates mental overhead. Spend 15 minutes this morning: either do them (if small), reschedule, or delete. A clean task list reduces anxiety.`,
      stat: `${overdueTasks.length}`,
    })

    // ── GENERAL TIPS ────────────────────────────────────────
    const inProgressItems = items.filter(i => i.status === 'in_progress')
    if (inProgressItems.length > 5) result.push({
      id: 'too-many-inprogress', level: 'tip', icon: '📖', category: 'Library',
      title: `${inProgressItems.length} things in progress at once`,
      body: `You're reading/watching ${inProgressItems.length} things simultaneously. Finishing one thing creates satisfaction. Consider focusing on just 1-2 until complete before starting something new.`,
      stat: `${inProgressItems.length}`,
    })

    // Not enough journal data
    if (journal.length < 5) result.push({
      id: 'start-journaling', level: 'tip', icon: '✍️', category: 'Getting Started',
      title: 'Start journaling daily for better insights',
      body: 'With more journal entries, Life OS can detect mood patterns, correlations with habits, and your best/worst day types. Even 2 minutes a day is enough to unlock powerful patterns.',
    })

    if (result.length === 0) result.push({
      id: 'all-good', level: 'good', icon: '🌟', category: 'Overview',
      title: 'Everything looks great!',
      body: 'No significant patterns or issues detected. Keep up your current habits and check back as you log more data — insights improve with more history.',
    })

    // Sort: warnings first, then good, then info, then tips
    const order: Record<InsightLevel, number> = { warning: 0, good: 1, info: 2, tip: 3 }
    return result.sort((a, b) => order[a.level] - order[b.level])
  }, [items, journal, habitsWithStats, goals, expenses, tasks, health, habits])

  // Group by category
  const categories = useMemo(() => {
    const cats: Record<string, Insight[]> = {}
    insights.forEach(i => {
      if (!cats[i.category]) cats[i.category] = []
      cats[i.category].push(i)
    })
    return cats
  }, [insights])

  const warningCount = insights.filter(i => i.level === 'warning').length
  const goodCount    = insights.filter(i => i.level === 'good').length

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <PageHeader
        title="Smart Insights"
        subtitle={`${goodCount} wins · ${warningCount} to review`}
        icon="🧠"
        action={
          <button
            onClick={() => setRefreshKey(k => k + 1)}
            className="p-2 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            title="Refresh insights"
          >
            <RefreshCw size={15} />
          </button>
        }
      />

      {/* Summary banner */}
      <div className="card p-4 mb-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
          style={{ background: warningCount === 0 ? 'rgba(52,211,153,0.12)' : 'rgba(245,158,11,0.12)' }}>
          {warningCount === 0 ? '✨' : '🔍'}
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {warningCount === 0
              ? 'Great week — no major concerns detected'
              : `${warningCount} thing${warningCount > 1 ? 's' : ''} worth your attention`}
          </p>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Based on your last 30 days of journal, habits, health, finances, and library data
          </p>
        </div>
        <div className="ml-auto flex items-center gap-3 shrink-0">
          <div className="text-center">
            <p className="text-xl font-display font-bold text-[var(--accent-emerald)]">{goodCount}</p>
            <p className="text-[10px] text-[var(--text-muted)]">Wins</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-display font-bold text-[var(--accent-amber)]">{warningCount}</p>
            <p className="text-[10px] text-[var(--text-muted)]">Review</p>
          </div>
        </div>
      </div>

      {/* Insights grouped by category */}
      <div className="space-y-6">
        {Object.entries(categories).map(([category, categoryInsights]) => (
          <div key={category}>
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">{category}</p>
            <div className="space-y-3">
              {categoryInsights.map((insight, i) => (
                <InsightCard key={insight.id} insight={insight} index={i} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-center text-[var(--text-muted)] mt-8">
        Insights update as you log more data · Refresh anytime with ↺
      </p>
    </div>
  )
}
