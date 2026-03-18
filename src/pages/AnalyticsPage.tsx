import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts'
import { format, parseISO, eachMonthOfInterval, subMonths, eachDayOfInterval, startOfYear, endOfYear, getDay, isToday, parseISO as parseDateISO } from 'date-fns'
import { useItemsStore, useJournalStore, useHabitsStore, useGoalsStore } from '@/lib/store'
import { PageHeader } from '@/components/ui/PageHeader'
import { Skeleton } from '@/components/ui'
import { ITEM_TYPE_CONFIG, MOOD_COLOR, calculateProgress } from '@/utils/helpers'
import type { ItemType } from '@/types'

const CHART_COLORS = {
  book: '#f59e0b', movie: '#f87171', tv_show: '#38bdf8',
  course: '#7c6af7', article: '#34d399', podcast: '#f59e0b', custom: '#a8a8c0',
}

const TooltipStyle = {
  backgroundColor: '#1a1a22',
  border: '1px solid #26262e',
  borderRadius: '12px',
  color: '#f0f0f5',
  fontSize: '12px',
}

export function AnalyticsPage() {
  const { items, fetchItems, isLoading: itemsLoading } = useItemsStore()
  const { logs: journalLogs, fetchLogs: fetchJournal } = useJournalStore()
  const { getHabitsWithStats, fetchHabits, fetchLogs: fetchHabitLogs } = useHabitsStore()
  const { goals, fetchGoals } = useGoalsStore()
  const [activeTab, setActiveTab] = useState<'overview' | 'mood' | 'habits' | 'library' | 'year'>('overview')

  useEffect(() => {
    fetchItems()
    fetchJournal(365)
    fetchHabits()
    fetchHabitLogs(60)
    fetchGoals()
  }, [fetchItems, fetchJournal, fetchHabits, fetchHabitLogs, fetchGoals])

  const habitsWithStats = getHabitsWithStats()
  const isLoading = itemsLoading

  // ── Library analytics ───────────────────────────────────────
  const completedItems = useMemo(() => items.filter(i => i.status === 'completed' && i.completed_at), [items])

  const monthlyCompletions = useMemo(() => {
    const months = eachMonthOfInterval({ start: subMonths(new Date(), 11), end: new Date() })
    return months.map(month => {
      const label = format(month, 'MMM')
      const monthStr = format(month, 'yyyy-MM')
      const result: Record<string, string | number> = { month: label }
      ;(['book', 'movie', 'tv_show', 'course'] as ItemType[]).forEach(type => {
        result[type] = completedItems.filter(i =>
          i.type === type && i.completed_at?.startsWith(monthStr)
        ).length
      })
      return result
    })
  }, [completedItems])

  const typeDistribution = useMemo(() => {
    const counts: Record<string, number> = {}
    items.forEach(i => { counts[i.type] = (counts[i.type] || 0) + 1 })
    return Object.entries(counts).map(([type, count]) => ({
      name: ITEM_TYPE_CONFIG[type as ItemType]?.label || type,
      value: count,
      color: CHART_COLORS[type as ItemType] || '#a8a8c0',
    }))
  }, [items])

  const ratingDistribution = useMemo(() => {
    const rated = items.filter(i => i.rating != null)
    return Array.from({ length: 10 }, (_, i) => ({
      rating: i + 1,
      count: rated.filter(item => item.rating === i + 1).length,
    }))
  }, [items])

  // ── Mood analytics ────────────────────────────────────────
  const moodData = useMemo(() => {
    return journalLogs.slice(0, 30).reverse().map(log => ({
      date: format(parseISO(log.date), 'MMM d'),
      mood: log.mood ?? 0,
      energy: log.energy ?? 0,
    }))
  }, [journalLogs])

  const avgMood = useMemo(() => {
    const valid = journalLogs.filter(l => l.mood != null)
    if (!valid.length) return 0
    return (valid.reduce((s, l) => s + (l.mood ?? 0), 0) / valid.length).toFixed(1)
  }, [journalLogs])

  const avgEnergy = useMemo(() => {
    const valid = journalLogs.filter(l => l.energy != null)
    if (!valid.length) return 0
    return (valid.reduce((s, l) => s + (l.energy ?? 0), 0) / valid.length).toFixed(1)
  }, [journalLogs])

  // ── Habit analytics ───────────────────────────────────────
  const habitCompletionData = useMemo(() => {
    return habitsWithStats
      .map(h => ({ name: h.name, rate: h.completionRate, color: h.color, streak: h.streak }))
      .sort((a, b) => b.rate - a.rate)
  }, [habitsWithStats])

  // ── Goal analytics ────────────────────────────────────────
  const goalProgress = useMemo(() => {
    return goals.filter(g => g.target_value).map(g => ({
      name: g.title.length > 25 ? g.title.slice(0, 25) + '…' : g.title,
      pct: calculateProgress(g.current_value, g.target_value ?? undefined),
      status: g.status,
    }))
  }, [goals])

  const TABS = ['overview', 'library', 'mood', 'habits', 'year'] as const

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <PageHeader title="Analytics" subtitle="Insights into your life data" icon="📊" />

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] mb-6 w-fit">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
              activeTab === tab
                ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-card'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48" />)}
        </div>
      ) : (
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <>
              {/* Summary stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Total Items', value: items.length, icon: '📚', color: '#7c6af7' },
                  { label: 'Completed', value: completedItems.length, icon: '✅', color: '#34d399' },
                  { label: 'Journal Entries', value: journalLogs.length, icon: '📔', color: '#38bdf8' },
                  { label: 'Active Goals', value: goals.filter(g => g.status === 'active').length, icon: '🎯', color: '#f59e0b' },
                ].map(s => (
                  <div key={s.label} className="card p-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xl">{s.icon}</span>
                      <span className="text-2xl font-display font-bold" style={{ color: s.color }}>{s.value}</span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Monthly completions chart */}
              <div className="card p-5">
                <h3 className="font-display font-semibold text-sm text-[var(--text-primary)] mb-4">Items Completed — Last 12 Months</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={monthlyCompletions} barSize={12}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#26262e" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: '#606078', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#606078', fontSize: 11 }} axisLine={false} tickLine={false} width={20} />
                    <Tooltip contentStyle={TooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                    {(['book', 'movie', 'tv_show', 'course'] as ItemType[]).map(type => (
                      <Bar key={type} dataKey={type} stackId="a" fill={CHART_COLORS[type]}
                        name={ITEM_TYPE_CONFIG[type].label} radius={[0, 0, 0, 0]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Type distribution */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="card p-5">
                  <h3 className="font-display font-semibold text-sm text-[var(--text-primary)] mb-4">Library Breakdown</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={typeDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                        paddingAngle={3} dataKey="value">
                        {typeDistribution.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={TooltipStyle} />
                      <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ color: '#a8a8c0', fontSize: 11 }}>{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="card p-5">
                  <h3 className="font-display font-semibold text-sm text-[var(--text-primary)] mb-4">Rating Distribution</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={ratingDistribution} barSize={18}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#26262e" vertical={false} />
                      <XAxis dataKey="rating" tick={{ fill: '#606078', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#606078', fontSize: 11 }} axisLine={false} tickLine={false} width={20} />
                      <Tooltip contentStyle={TooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                      <Bar dataKey="count" name="Items" radius={[4, 4, 0, 0]}>
                        {ratingDistribution.map((entry, i) => (
                          <Cell key={i} fill={entry.rating >= 8 ? '#34d399' : entry.rating >= 6 ? '#38bdf8' : entry.rating >= 4 ? '#f59e0b' : '#f87171'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}

          {/* LIBRARY TAB */}
          {activeTab === 'library' && (
            <>
              <div className="card p-5">
                <h3 className="font-display font-semibold text-sm text-[var(--text-primary)] mb-4">Monthly Completions by Type</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={monthlyCompletions}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#26262e" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: '#606078', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#606078', fontSize: 11 }} axisLine={false} tickLine={false} width={20} />
                    <Tooltip contentStyle={TooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                    <Legend formatter={(v) => <span style={{ color: '#a8a8c0', fontSize: 11 }}>{ITEM_TYPE_CONFIG[v as ItemType]?.label || v}</span>} />
                    {(['book', 'movie', 'tv_show', 'course'] as ItemType[]).map(type => (
                      <Bar key={type} dataKey={type} fill={CHART_COLORS[type]} name={type}
                        stackId="a" radius={[0, 0, 0, 0]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Top rated items */}
              <div className="card p-5">
                <h3 className="font-display font-semibold text-sm text-[var(--text-primary)] mb-4">Top Rated Items</h3>
                <div className="space-y-2">
                  {items.filter(i => i.rating != null).sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 8).map(item => (
                    <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors">
                      <span className="text-lg shrink-0">{ITEM_TYPE_CONFIG[item.type].icon}</span>
                      <span className="flex-1 text-sm text-[var(--text-primary)] truncate">{item.title}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[#f59e0b]">★</span>
                        <span className="text-sm font-bold font-mono" style={{ color: '#f59e0b' }}>{item.rating}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* MOOD TAB */}
          {activeTab === 'mood' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="card p-4 text-center">
                  <p className="text-xs text-[var(--text-secondary)] mb-1">Avg Mood (30d)</p>
                  <p className="text-3xl font-display font-bold" style={{ color: MOOD_COLOR(Number(avgMood)) }}>{avgMood}</p>
                  <p className="text-2xl mt-1">{Number(avgMood) >= 7 ? '😄' : Number(avgMood) >= 5 ? '😐' : '😔'}</p>
                </div>
                <div className="card p-4 text-center">
                  <p className="text-xs text-[var(--text-secondary)] mb-1">Avg Energy (30d)</p>
                  <p className="text-3xl font-display font-bold text-[var(--accent-sky)]">{avgEnergy}</p>
                  <p className="text-2xl mt-1">{Number(avgEnergy) >= 7 ? '⚡' : Number(avgEnergy) >= 5 ? '😐' : '😴'}</p>
                </div>
              </div>

              <div className="card p-5">
                <h3 className="font-display font-semibold text-sm text-[var(--text-primary)] mb-4">Mood & Energy — Last 30 Days</h3>
                {moodData.length === 0 ? (
                  <div className="flex items-center justify-center h-40 text-[var(--text-muted)] text-sm">
                    No journal data yet — start writing daily!
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={moodData}>
                      <defs>
                        <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#26262e" vertical={false} />
                      <XAxis dataKey="date" tick={{ fill: '#606078', fontSize: 10 }} axisLine={false} tickLine={false}
                        interval={Math.floor(moodData.length / 6)} />
                      <YAxis domain={[0, 10]} tick={{ fill: '#606078', fontSize: 11 }} axisLine={false} tickLine={false} width={20} />
                      <Tooltip contentStyle={TooltipStyle} />
                      <Area type="monotone" dataKey="mood" stroke="#34d399" strokeWidth={2}
                        fill="url(#moodGrad)" name="Mood" dot={false} />
                      <Area type="monotone" dataKey="energy" stroke="#38bdf8" strokeWidth={2}
                        fill="url(#energyGrad)" name="Energy" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </>
          )}

          {/* HABITS TAB */}
          {activeTab === 'habits' && (
            <>
              <div className="card p-5">
                <h3 className="font-display font-semibold text-sm text-[var(--text-primary)] mb-4">30-Day Completion Rate</h3>
                {habitCompletionData.length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)] text-center py-8">No habits to show yet</p>
                ) : (
                  <div className="space-y-3">
                    {habitCompletionData.map(h => (
                      <div key={h.name} className="flex items-center gap-3">
                        <span className="text-xs text-[var(--text-secondary)] w-32 truncate shrink-0">{h.name}</span>
                        <div className="flex-1 h-6 bg-[var(--bg-overlay)] rounded-lg overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${h.rate}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            className="h-full rounded-lg flex items-center justify-end pr-2"
                            style={{ background: h.color }}
                          >
                            {h.rate > 15 && <span className="text-[10px] font-bold text-white">{h.rate}%</span>}
                          </motion.div>
                        </div>
                        {h.streak > 0 && (
                          <span className="text-xs font-bold text-[#f59e0b] w-12 text-right shrink-0">🔥 {h.streak}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Goal progress */}
              {goalProgress.length > 0 && (
                <div className="card p-5">
                  <h3 className="font-display font-semibold text-sm text-[var(--text-primary)] mb-4">Goal Progress</h3>
                  <ResponsiveContainer width="100%" height={Math.max(200, goalProgress.length * 44)}>
                    <BarChart data={goalProgress} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#26262e" horizontal={false} />
                      <XAxis type="number" domain={[0, 100]} tick={{ fill: '#606078', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fill: '#a8a8c0', fontSize: 11 }} axisLine={false} tickLine={false} width={140} />
                      <Tooltip contentStyle={TooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.04)' }} formatter={(v) => [`${v}%`, 'Progress']} />
                      <Bar dataKey="pct" name="Progress" radius={[0, 4, 4, 0]} barSize={14}>
                        {goalProgress.map((entry, i) => (
                          <Cell key={i} fill={entry.status === 'completed' ? '#34d399' : '#7c6af7'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}

          {/* YEAR IN PIXELS TAB */}
          {activeTab === 'year' && (
            <YearInPixels journalLogs={journalLogs} />
          )}
        </motion.div>
      )}
    </div>
  )
}


// ── Year in Pixels ────────────────────────────────────────────
interface YIPProps {
  journalLogs: import('@/types').JournalLog[]
}

function YearInPixels({ journalLogs }: YIPProps) {
  const [year, setYear] = useState(new Date().getFullYear())

  const days = eachDayOfInterval({
    start: startOfYear(new Date(year, 0, 1)),
    end: year === new Date().getFullYear() ? new Date() : endOfYear(new Date(year, 0, 1)),
  })

  const logMap = journalLogs.reduce((acc, l) => {
    acc[l.date] = l
    return acc
  }, {} as Record<string, import('@/types').JournalLog>)

  const getMoodColor = (mood: number | null | undefined) => {
    if (!mood) return 'var(--bg-overlay)'
    if (mood >= 9) return '#34d399'
    if (mood >= 7) return '#38bdf8'
    if (mood >= 5) return '#7c6af7'
    if (mood >= 3) return '#f59e0b'
    return '#f87171'
  }

  // Pad start with empty cells (start from Monday=0)
  const firstDayOfWeek = (getDay(days[0]) + 6) % 7 // Mon=0
  const paddedDays = [...Array(firstDayOfWeek).fill(null), ...days]

  const months = eachMonthOfInterval({
    start: startOfYear(new Date(year, 0, 1)),
    end: year === new Date().getFullYear() ? new Date() : endOfYear(new Date(year, 0, 1)),
  })

  const totalLogged = days.filter(d => logMap[format(d, 'yyyy-MM-dd')]).length
  const avgMood = (() => {
    const valid = days.map(d => logMap[format(d, 'yyyy-MM-dd')]?.mood).filter(Boolean) as number[]
    return valid.length ? (valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(1) : null
  })()

  return (
    <div className="space-y-6">
      {/* Year nav + stats */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-display font-semibold text-[var(--text-primary)]">{year} in Pixels</h3>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">
              {totalLogged} days logged · {avgMood ? `avg mood ${avgMood}` : 'no mood data yet'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setYear(y => y - 1)}
              className="px-3 py-1.5 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors border border-[var(--border)]"
            >←</button>
            <span className="text-sm font-semibold text-[var(--text-primary)] min-w-[40px] text-center">{year}</span>
            <button
              onClick={() => setYear(y => Math.min(y + 1, new Date().getFullYear()))}
              disabled={year >= new Date().getFullYear()}
              className="px-3 py-1.5 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors border border-[var(--border)] disabled:opacity-30"
            >→</button>
          </div>
        </div>

        {/* Month labels */}
        <div className="overflow-x-auto no-scrollbar">
          <div style={{ minWidth: 680 }}>
            <div className="grid mb-1" style={{ gridTemplateColumns: 'repeat(53, 1fr)', gap: 3 }}>
              {months.map(m => {
                const weekOfYear = Math.floor(
                  (eachDayOfInterval({ start: startOfYear(m), end: m }).length - 1 + firstDayOfWeek) / 7
                )
                return (
                  <div
                    key={m.toString()}
                    className="text-[9px] text-[var(--text-muted)] font-medium"
                    style={{ gridColumn: `${weekOfYear + 1} / span 4`, gridRow: 1 }}
                  >
                    {format(m, 'MMM')}
                  </div>
                )
              })}
            </div>

            {/* Day labels + grid */}
            <div className="flex gap-1">
              <div className="flex flex-col gap-[3px] mr-1 pt-[1px]">
                {['M', '', 'W', '', 'F', '', 'S'].map((d, i) => (
                  <div key={i} className="text-[9px] text-[var(--text-muted)] h-[13px] flex items-center">{d}</div>
                ))}
              </div>
              <div className="grid flex-1" style={{ gridTemplateColumns: 'repeat(53, 1fr)', gridTemplateRows: 'repeat(7, 1fr)', gap: 3 }}>
                {paddedDays.map((day, i) => {
                  if (!day) return <div key={`pad-${i}`} className="rounded-sm" style={{ width: 13, height: 13 }} />
                  const dateStr = format(day, 'yyyy-MM-dd')
                  const log = logMap[dateStr]
                  const moodColor = getMoodColor(log?.mood)
                  const isCurrentDay = isToday(day)

                  return (
                    <motion.div
                      key={dateStr}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.001, duration: 0.1 }}
                      title={`${format(day, 'MMM d')}${log ? ` · Mood ${log.mood ?? '?'}/10` : ' · No entry'}`}
                      className="rounded-sm cursor-default transition-transform hover:scale-125"
                      style={{
                        width: 13,
                        height: 13,
                        background: moodColor,
                        opacity: log ? 1 : 0.25,
                        outline: isCurrentDay ? `2px solid var(--accent-violet)` : 'none',
                        outlineOffset: 1,
                      }}
                    />
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 mt-4 flex-wrap">
          <span className="text-xs text-[var(--text-muted)]">Mood:</span>
          {[
            { label: '1-2', color: '#f87171' },
            { label: '3-4', color: '#f59e0b' },
            { label: '5-6', color: '#7c6af7' },
            { label: '7-8', color: '#38bdf8' },
            { label: '9-10', color: '#34d399' },
            { label: 'No entry', color: 'var(--bg-overlay)', dim: true },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ background: l.color, opacity: l.dim ? 0.4 : 1 }} />
              <span className="text-xs text-[var(--text-muted)]">{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly breakdown */}
      <div className="card p-5">
        <h3 className="font-display font-semibold text-sm text-[var(--text-primary)] mb-4">Monthly Mood Average</h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {months.map(m => {
            const monthStr = format(m, 'yyyy-MM')
            const monthLogs = Object.entries(logMap)
              .filter(([d]) => d.startsWith(monthStr))
              .map(([, l]) => l)
            const avg = monthLogs.filter(l => l.mood).length
              ? (monthLogs.reduce((s, l) => s + (l.mood ?? 0), 0) / monthLogs.filter(l => l.mood).length)
              : null
            return (
              <div key={m.toString()} className="text-center p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]">
                <p className="text-xs text-[var(--text-muted)] font-medium">{format(m, 'MMM')}</p>
                {avg ? (
                  <>
                    <p className="text-xl font-display font-bold mt-1" style={{ color: getMoodColor(Math.round(avg)) }}>
                      {avg.toFixed(1)}
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)]">{monthLogs.filter(l => l.mood).length}d</p>
                  </>
                ) : (
                  <p className="text-lg text-[var(--text-muted)] mt-1">—</p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}