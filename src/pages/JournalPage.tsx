import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns'
import { useJournalStore } from '@/lib/store'
import { useToast } from '@/context/ToastContext'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button, EmptyState, Skeleton, ConfirmDialog } from '@/components/ui'
import { JournalEntryModal } from '@/components/journal/JournalEntryModal'
import { today, formatDate, MOOD_EMOJI, MOOD_COLOR } from '@/utils/helpers'
import type { JournalLog } from '@/types'

export function JournalPage() {
  const { logs, isLoading, fetchLogs, deleteLog } = useJournalStore()
  useEffect(() => { fetchLogs(100) }, []) // eslint-disable-line
  const { success, error } = useToast()
  const [showForm, setShowForm] = useState(false)
  const [editEntry, setEditEntry] = useState<JournalLog | null>(null)
  const [deleteEntry, setDeleteEntry] = useState<JournalLog | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [viewDate, setViewDate] = useState(new Date())
  const [view, setView] = useState<'list' | 'calendar'>('list')


  const todayStr = today()
  const hasTodayEntry = logs.some(l => l.date === todayStr)

  const handleDelete = async () => {
    if (!deleteEntry) return
    setIsDeleting(true)
    try {
      await deleteLog(deleteEntry.id)
      success('Entry deleted')
      setDeleteEntry(null)
    } catch {
      error('Failed to delete entry')
    } finally {
      setIsDeleting(false)
    }
  }

  // Calendar view helpers
  const calendarDays = eachDayOfInterval({
    start: startOfMonth(viewDate),
    end: endOfMonth(viewDate),
  })
  const logMap = logs.reduce((acc, l) => { acc[l.date] = l; return acc }, {} as Record<string, JournalLog>)

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <PageHeader
        title="Journal"
        subtitle={`${logs.length} entries`}
        icon="📔"
        action={
          <div className="flex gap-2">
            <div className="flex rounded-xl border border-[var(--border)] overflow-hidden">
              {(['list', 'calendar'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                    view === v ? 'bg-[var(--accent-violet)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
            <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={() => setShowForm(true)}>
              {hasTodayEntry ? 'New Entry' : 'Write Today'}
            </Button>
          </div>
        }
      />

      {view === 'calendar' ? (
        <div className="space-y-4">
          {/* Month nav */}
          <div className="flex items-center justify-between">
            <button onClick={() => setViewDate(d => { const n = new Date(d); n.setMonth(n.getMonth() - 1); return n })}
              className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors text-[var(--text-secondary)]">
              <ChevronLeft size={18} />
            </button>
            <h2 className="font-display font-semibold text-[var(--text-primary)]">
              {format(viewDate, 'MMMM yyyy')}
            </h2>
            <button onClick={() => setViewDate(d => { const n = new Date(d); n.setMonth(n.getMonth() + 1); return n })}
              className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors text-[var(--text-secondary)]">
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Weekday labels */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
              <div key={d} className="text-center text-xs text-[var(--text-muted)] font-medium py-1">{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Offset for first day */}
            {Array.from({ length: (calendarDays[0].getDay() + 6) % 7 }).map((_, i) => <div key={i} />)}
            {calendarDays.map(day => {
              const dateStr = format(day, 'yyyy-MM-dd')
              const entry = logMap[dateStr]
              const isTodays = isToday(day)
              return (
                <button
                  key={dateStr}
                  onClick={() => entry ? setEditEntry(entry) : (isTodays && setShowForm(true))}
                  className={`aspect-square p-1 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all text-xs
                    ${!isSameMonth(day, viewDate) ? 'opacity-30' : ''}
                    ${isTodays ? 'ring-1 ring-[var(--accent-violet)]' : ''}
                    ${entry ? 'hover:ring-1 hover:ring-[var(--border-strong)] cursor-pointer' : isTodays ? 'hover:bg-[var(--bg-elevated)] cursor-pointer' : 'cursor-default'}
                  `}
                  style={entry ? { background: `${MOOD_COLOR(entry.mood ?? 5)}1a` } : {}}
                >
                  <span className={`font-medium ${isTodays ? 'text-[var(--accent-violet)]' : 'text-[var(--text-secondary)]'}`}>
                    {format(day, 'd')}
                  </span>
                  {entry && <span className="text-[10px]">{MOOD_EMOJI[entry.mood ?? 5]}</span>}
                  {isTodays && !entry && <span className="text-[8px] text-[var(--accent-violet)]">•</span>}
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        /* List view */
        <div className="space-y-4">
          {/* Today banner — always visible */}
          <motion.button
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => {
              const todayEntry = logs.find(l => l.date === todayStr)
              if (todayEntry) setEditEntry(todayEntry)
              else setShowForm(true)
            }}
            className="w-full p-4 rounded-xl border transition-all flex items-center gap-3 group"
            style={{
              borderColor: hasTodayEntry ? 'rgba(52,211,153,0.3)' : 'rgba(124,106,247,0.3)',
              background: hasTodayEntry ? 'rgba(52,211,153,0.04)' : 'rgba(124,106,247,0.04)',
            }}
          >
            <span className="text-2xl">{hasTodayEntry ? '✅' : '📝'}</span>
            <div className="text-left flex-1">
              <p className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--accent-violet)] transition-colors">
                {hasTodayEntry ? "Today's entry written" : "Write today's entry"}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">{format(new Date(), 'EEEE, MMMM d')}</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium shrink-0"
              style={{ color: hasTodayEntry ? 'var(--accent-emerald)' : 'var(--accent-violet)' }}>
              {hasTodayEntry ? 'Edit' : 'Write'}
              <Plus size={14} />
            </div>
          </motion.button>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
            </div>
          ) : logs.length === 0 ? (
            <EmptyState
              icon="📔"
              title="No journal entries yet"
              description="Start documenting your thoughts, moods and reflections daily"
              action={<Button variant="primary" leftIcon={<Plus size={14} />} onClick={() => setShowForm(true)}>Write first entry</Button>}
            />
          ) : (
            <div className="space-y-3">
              {logs.map((log, i) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="card p-4 group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {log.mood && (
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                          style={{ background: `${MOOD_COLOR(log.mood)}1a` }}>
                          {MOOD_EMOJI[log.mood]}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[var(--text-primary)]">
                            {formatDate(log.date)}
                          </span>
                          {log.title && <span className="text-sm text-[var(--text-secondary)]">— {log.title}</span>}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          {log.mood && (
                            <span className="text-xs font-mono" style={{ color: MOOD_COLOR(log.mood) }}>
                              Mood {log.mood}/10
                            </span>
                          )}
                          {log.energy && (
                            <span className="text-xs font-mono text-[var(--accent-sky)]">⚡ {log.energy}/10</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button onClick={() => setEditEntry(log)}
                        className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--accent-violet)] hover:bg-[rgba(124,106,247,0.08)] transition-colors">
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => setDeleteEntry(log)}
                        className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--accent-rose)] hover:bg-[rgba(248,113,113,0.08)] transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {log.notes && (
                    <p className="mt-3 text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-3 pl-13">
                      {log.notes}
                    </p>
                  )}
                  {log.highlights && (
                    <p className="mt-2 text-xs text-[var(--accent-amber)] pl-13">✨ {log.highlights}</p>
                  )}
                  {log.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2 pl-13">
                      {log.tags.map(t => (
                        <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-overlay)] text-[var(--text-muted)]">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      <JournalEntryModal isOpen={showForm} onClose={() => setShowForm(false)} />
      {editEntry && (
        <JournalEntryModal isOpen={!!editEntry} onClose={() => setEditEntry(null)} entry={editEntry} />
      )}
      <ConfirmDialog
        isOpen={!!deleteEntry}
        onClose={() => setDeleteEntry(null)}
        onConfirm={handleDelete}
        title="Delete Entry"
        message={`Delete journal entry from ${deleteEntry ? formatDate(deleteEntry.date) : ''}?`}
        isLoading={isDeleting}
      />
    </div>
  )
}
