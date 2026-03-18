import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useItemsStore, useJournalStore, useHabitsStore, useGoalsStore, useExpensesStore, useOccasionsStore } from '@/lib/store'
import { today, MOOD_EMOJI, MOOD_COLOR, calculateProgress, ITEM_TYPE_CONFIG } from '@/utils/helpers'
import { Skeleton, ProgressBar } from '@/components/ui'
import { QuoteOfTheDay } from '@/components/dashboard/QuoteOfTheDay'
import { format } from 'date-fns'

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06 } }
}
const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 }
}

export function DashboardPage() {
  const { items, fetchItems, isLoading: itemsLoading } = useItemsStore()
  const { logs: journalLogs, fetchLogs: fetchJournal } = useJournalStore()
  const { getHabitsWithStats, fetchHabits, fetchLogs: fetchHabitLogs, getTodayCompletionRate } = useHabitsStore()
  const { goals, fetchGoals } = useGoalsStore()

  const { getMonthlyTotal } = useExpensesStore()
  const { getUpcoming, fetchOccasions } = useOccasionsStore()
  const { fetchExpenses } = useExpensesStore()

  useEffect(() => {
    fetchItems()
    fetchJournal(7)
    fetchHabits()
    fetchHabitLogs()
    fetchGoals()
    fetchExpenses()
    fetchOccasions()
  }, [fetchItems, fetchJournal, fetchHabits, fetchHabitLogs, fetchGoals, fetchExpenses, fetchOccasions])

  const todayStr = today()
  const todayJournal = journalLogs.find(l => l.date === todayStr)
  const habitsWithStats = getHabitsWithStats()
  const habitCompletionRate = getTodayCompletionRate()

  const stats = useMemo(() => {
    const thisYear = new Date().getFullYear()
    const completed = items.filter(i => i.status === 'completed')
    const booksThisYear = completed.filter(i => i.type === 'book' && i.completed_at?.startsWith(String(thisYear))).length
    const moviesThisYear = completed.filter(i => i.type === 'movie' && i.completed_at?.startsWith(String(thisYear))).length
    const inProgress = items.filter(i => i.status === 'in_progress')
    const activeGoals = goals.filter(g => g.status === 'active')
    const topStreak = habitsWithStats.reduce((max, h) => Math.max(max, h.streak), 0)
    const now = new Date()
    const monthlySpend = getMonthlyTotal(now.getFullYear(), now.getMonth() + 1)
    const upcomingOccasions = getUpcoming(14)
    return { booksThisYear, moviesThisYear, inProgress, activeGoals, topStreak, monthlySpend, upcomingOccasions }
  }, [items, goals, habitsWithStats])

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div {...fadeUp} className="mb-8">
        <p className="text-sm text-[var(--text-secondary)] font-medium mb-0.5">
          {format(new Date(), 'EEEE, MMMM d')}
        </p>
        <h1 className="font-display font-bold text-3xl text-[var(--text-primary)] tracking-tight">
          {greeting()} 👋
        </h1>
      </motion.div>

      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
        {/* Quote of the Day */}
        <motion.div variants={fadeUp}>
          <QuoteOfTheDay />
        </motion.div>

        {/* Quick Stats Row */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Books This Year', value: stats.booksThisYear, icon: '📚', color: '#f59e0b' },
            { label: 'Movies This Year', value: stats.moviesThisYear, icon: '🎬', color: '#f87171' },
            { label: 'Top Streak', value: `${stats.topStreak}d`, icon: '🔥', color: '#f59e0b' },
            { label: 'Active Goals', value: stats.activeGoals.length, icon: '🎯', color: '#7c6af7' },
            { label: 'This Month Spent', value: `₹${Math.round(stats.monthlySpend / 1000)}k`, icon: '💸', color: '#34d399' },
            { label: 'Upcoming Events', value: stats.upcomingOccasions.length, icon: '🎉', color: '#f472b6' },
          ].map(stat => (
            <div key={stat.label} className="card p-4 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-lg">{stat.icon}</span>
                <span className="text-2xl font-display font-bold" style={{ color: stat.color }}>{stat.value}</span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Main grid */}
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Today's Journal */}
          <motion.div variants={fadeUp} className="lg:col-span-1">
            <div className="card p-4 h-full">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display font-semibold text-sm text-[var(--text-primary)]">Today's Journal</h2>
                <Link to="/journal" className="text-xs text-[var(--accent-violet)] hover:underline flex items-center gap-1">
                  Open <ArrowRight size={12} />
                </Link>
              </div>

              {todayJournal ? (
                <div className="space-y-3">
                  {todayJournal.mood && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--text-secondary)]">Mood</span>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{MOOD_EMOJI[todayJournal.mood]}</span>
                        <div className="w-16 progress-bar">
                          <div className="progress-bar-fill" style={{ width: `${todayJournal.mood * 10}%`, background: MOOD_COLOR(todayJournal.mood) }} />
                        </div>
                        <span className="text-xs font-mono font-bold" style={{ color: MOOD_COLOR(todayJournal.mood) }}>{todayJournal.mood}/10</span>
                      </div>
                    </div>
                  )}
                  {todayJournal.energy && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--text-secondary)]">Energy</span>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">⚡</span>
                        <div className="w-16 progress-bar">
                          <div className="progress-bar-fill" style={{ width: `${todayJournal.energy * 10}%`, background: '#38bdf8' }} />
                        </div>
                        <span className="text-xs font-mono font-bold text-[var(--accent-sky)]">{todayJournal.energy}/10</span>
                      </div>
                    </div>
                  )}
                  {todayJournal.notes && (
                    <p className="text-xs text-[var(--text-secondary)] line-clamp-3 leading-relaxed border-t border-[var(--border-subtle)] pt-3">
                      {todayJournal.notes}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 gap-3">
                  <span className="text-3xl">📔</span>
                  <p className="text-xs text-[var(--text-secondary)] text-center">No entry yet today</p>
                  <Link to="/journal">
                    <button className="text-xs px-3 py-1.5 rounded-lg font-medium text-[var(--accent-violet)] border border-[rgba(124,106,247,0.3)] hover:bg-[rgba(124,106,247,0.08)] transition-colors">
                      Write now
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>

          {/* In Progress Items */}
          <motion.div variants={fadeUp} className="lg:col-span-2">
            <div className="card p-4 h-full">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display font-semibold text-sm text-[var(--text-primary)]">In Progress</h2>
                <Link to="/library?status=in_progress" className="text-xs text-[var(--accent-violet)] hover:underline flex items-center gap-1">
                  All <ArrowRight size={12} />
                </Link>
              </div>

              {itemsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-14" />)}
                </div>
              ) : stats.inProgress.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <span className="text-3xl">🌟</span>
                  <p className="text-xs text-[var(--text-secondary)]">Nothing in progress — start something!</p>
                  <Link to="/library">
                    <button className="text-xs px-3 py-1.5 rounded-lg font-medium text-[var(--accent-violet)] border border-[rgba(124,106,247,0.3)] hover:bg-[rgba(124,106,247,0.08)] transition-colors">
                      Add to library
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {stats.inProgress.slice(0, 4).map(item => {
                    const config = ITEM_TYPE_CONFIG[item.type]
                    const pct = calculateProgress(item.progress_current, item.progress_total)
                    return (
                      <Link key={item.id} to={`/library/${item.id}`}>
                        <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[var(--bg-elevated)] transition-colors group">
                          <span className="text-xl shrink-0">{config.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[var(--text-primary)] truncate group-hover:text-[var(--accent-violet)] transition-colors">
                              {item.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <ProgressBar value={pct} className="flex-1" color={config.color} />
                              <span className="text-xs font-mono text-[var(--text-muted)] shrink-0">
                                {item.progress_current}/{item.progress_total} {item.progress_unit}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Habits Today */}
        <motion.div variants={fadeUp}>
          <div className="card p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display font-semibold text-sm text-[var(--text-primary)]">Today's Habits</h2>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">{habitCompletionRate}% complete</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-24">
                  <ProgressBar value={habitCompletionRate} color="#34d399" />
                </div>
                <Link to="/habits" className="text-xs text-[var(--accent-violet)] hover:underline flex items-center gap-1">
                  All <ArrowRight size={12} />
                </Link>
              </div>
            </div>

            {habitsWithStats.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-xs text-[var(--text-secondary)] mb-2">No habits yet</p>
                <Link to="/habits">
                  <button className="text-xs px-3 py-1.5 rounded-lg font-medium text-[var(--accent-violet)] border border-[rgba(124,106,247,0.3)] hover:bg-[rgba(124,106,247,0.08)] transition-colors">
                    Add habits
                  </button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
                {habitsWithStats.slice(0, 6).map(habit => (
                  <Link key={habit.id} to="/habits">
                    <div className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                      habit.completedToday
                        ? 'border-[rgba(52,211,153,0.3)] bg-[rgba(52,211,153,0.06)]'
                        : 'border-[var(--border)] hover:border-[var(--border-strong)]'
                    }`}>
                      <span className="text-xl">{habit.icon}</span>
                      <span className="text-xs text-center text-[var(--text-secondary)] leading-tight line-clamp-1">{habit.name}</span>
                      {habit.streak > 0 && (
                        <span className="text-xs font-bold text-[#f59e0b]">🔥 {habit.streak}</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Active Goals */}
        <motion.div variants={fadeUp}>
          <div className="card p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-sm text-[var(--text-primary)]">Active Goals</h2>
              <Link to="/goals" className="text-xs text-[var(--accent-violet)] hover:underline flex items-center gap-1">
                All <ArrowRight size={12} />
              </Link>
            </div>

            {stats.activeGoals.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-xs text-[var(--text-secondary)]">Set your first goal</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {stats.activeGoals.slice(0, 3).map(goal => {
                  const pct = calculateProgress(goal.current_value, goal.target_value ?? undefined)
                  return (
                    <Link key={goal.id} to="/goals">
                      <div className="p-3 rounded-xl border border-[var(--border)] hover:border-[var(--border-strong)] transition-colors">
                        <p className="text-sm font-medium text-[var(--text-primary)] mb-2 line-clamp-1">{goal.title}</p>
                        <ProgressBar value={pct} color="#7c6af7" showLabel className="mb-1" />
                        {goal.target_value && (
                          <p className="text-xs text-[var(--text-muted)]">
                            {goal.current_value} / {goal.target_value} {goal.unit}
                          </p>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}