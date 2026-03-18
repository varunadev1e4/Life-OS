import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit2, Trash2, Gift, Calendar, Bell, Check } from 'lucide-react'
import { format, differenceInDays, parseISO } from 'date-fns'
import { useOccasionsStore } from '@/lib/store'
import { useToast } from '@/context/ToastContext'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button, Modal, Input, Textarea, Select, EmptyState, Skeleton, ConfirmDialog } from '@/components/ui'
import type { Occasion, OccasionInsert, OccasionType } from '@/types'

// ── Config ────────────────────────────────────────────────────
const OCCASION_TYPES: { value: OccasionType; label: string; icon: string; color: string }[] = [
  { value: 'birthday',    label: 'Birthday',    icon: '🎂', color: '#f87171' },
  { value: 'anniversary', label: 'Anniversary', icon: '💝', color: '#f472b6' },
  { value: 'graduation',  label: 'Graduation',  icon: '🎓', color: '#7c6af7' },
  { value: 'wedding',     label: 'Wedding',     icon: '💒', color: '#fb923c' },
  { value: 'festival',    label: 'Festival',    icon: '🎉', color: '#f59e0b' },
  { value: 'meeting',     label: 'Meeting',     icon: '🤝', color: '#38bdf8' },
  { value: 'other',       label: 'Other',       icon: '📅', color: '#94a3b8' },
]

const getType = (v: string) => OCCASION_TYPES.find(t => t.value === v) || OCCASION_TYPES[OCCASION_TYPES.length - 1]

function getNextDate(occasion: Occasion): Date {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  let d = new Date(occasion.date)
  if (occasion.is_recurring) {
    d.setFullYear(today.getFullYear())
    if (d < today) d.setFullYear(today.getFullYear() + 1)
  }
  return d
}

function getDaysUntil(occasion: Occasion): number {
  return differenceInDays(getNextDate(occasion), new Date())
}

function getUrgencyColor(days: number): string {
  if (days <= 3)  return '#f87171'
  if (days <= 7)  return '#f59e0b'
  if (days <= 30) return '#38bdf8'
  return '#a8a8c0'
}

function getUrgencyLabel(days: number): string {
  if (days < 0)  return 'Past'
  if (days === 0) return 'Today!'
  if (days === 1) return 'Tomorrow!'
  if (days <= 7)  return `${days}d away`
  if (days <= 30) return `${days}d away`
  return format(new Date(Date.now() + days * 86400000), 'MMM d')
}

// ── Main Page ─────────────────────────────────────────────────
export function OccasionsPage() {
  const { occasions, isLoading, fetchOccasions, addOccasion, updateOccasion, deleteOccasion, getUpcoming } = useOccasionsStore()
  useEffect(() => { fetchOccasions() }, []) // eslint-disable-line
  const { success, error: showError } = useToast()

  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Occasion | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Occasion | null>(null)
  const [tab, setTab] = useState<'upcoming' | 'all'>('upcoming')


  const upcoming = getUpcoming(60)
  const soonest  = upcoming[0]

  const sortedAll = useMemo(() =>
    [...occasions].sort((a, b) => {
      const da = getDaysUntil(a)
      const db = getDaysUntil(b)
      return da - db
    }), [occasions]
  )

  const displayed = tab === 'upcoming' ? upcoming : sortedAll

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteOccasion(deleteTarget.id)
      success('Occasion deleted')
      setDeleteTarget(null)
    } catch { showError('Failed to delete') }
  }

  const handleComplete = async (occ: Occasion) => {
    try {
      await updateOccasion(occ.id, { is_completed: !occ.is_completed })
    } catch { showError('Failed to update') }
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <PageHeader
        title="Occasions"
        subtitle={`${upcoming.length} upcoming in 60 days`}
        icon="🎉"
        action={
          <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={() => setShowForm(true)}>
            Add Occasion
          </Button>
        }
      />

      {/* Upcoming banner */}
      {soonest && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-4 mb-5 flex items-center gap-4"
          style={{ borderColor: `${getUrgencyColor(getDaysUntil(soonest))}40` }}
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
            style={{ background: `${getType(soonest.occasion_type).color}15` }}>
            {getType(soonest.occasion_type).icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Bell size={12} style={{ color: getUrgencyColor(getDaysUntil(soonest)) }} />
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: getUrgencyColor(getDaysUntil(soonest)) }}>
                Next Up
              </span>
            </div>
            <p className="font-semibold text-[var(--text-primary)]">{soonest.person_name}'s {getType(soonest.occasion_type).label}</p>
            <p className="text-xs text-[var(--text-secondary)]">{format(getNextDate(soonest), 'EEEE, MMMM d')}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xl font-display font-bold" style={{ color: getUrgencyColor(getDaysUntil(soonest)) }}>
              {getUrgencyLabel(getDaysUntil(soonest))}
            </p>
            {soonest.budget && (
              <p className="text-xs text-[var(--text-muted)]">Budget: ₹{soonest.budget.toLocaleString('en-IN')}</p>
            )}
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] w-fit mb-5">
        {[
          { value: 'upcoming', label: `Upcoming (${upcoming.length})` },
          { value: 'all',      label: `All (${occasions.length})` },
        ].map(t => (
          <button
            key={t.value}
            onClick={() => setTab(t.value as typeof tab)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              tab === t.value ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-card' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : displayed.length === 0 ? (
        <EmptyState
          icon="🎉"
          title={tab === 'upcoming' ? 'No upcoming occasions' : 'No occasions yet'}
          description={tab === 'upcoming' ? 'Nothing in the next 60 days' : 'Track birthdays, anniversaries and more'}
          action={<Button variant="primary" leftIcon={<Plus size={14} />} onClick={() => setShowForm(true)}>Add occasion</Button>}
        />
      ) : (
        <div className="space-y-3">
          {displayed.map((occ, i) => {
            const typeConfig = getType(occ.occasion_type)
            const daysUntil  = getDaysUntil(occ)
            const urgency    = getUrgencyColor(daysUntil)
            const nextDate   = getNextDate(occ)

            return (
              <motion.div
                key={occ.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`card p-4 group transition-all hover:border-[var(--border-strong)] ${occ.is_completed ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{ background: `${typeConfig.color}15` }}>
                    {typeConfig.icon}
                  </div>

                  {/* Main */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`font-semibold text-[var(--text-primary)] ${occ.is_completed ? 'line-through' : ''}`}>
                        {occ.person_name}
                      </p>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: `${typeConfig.color}15`, color: typeConfig.color }}>
                        {typeConfig.label}
                      </span>
                      {occ.is_recurring && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--bg-overlay)] text-[var(--text-muted)]">yearly</span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                        <Calendar size={11} />
                        {format(nextDate, 'MMMM d, yyyy')}
                      </span>
                      {occ.budget && (
                        <span className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                          <Gift size={11} />
                          Budget: ₹{occ.budget.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>

                    {occ.gift_ideas && (
                      <p className="text-xs text-[var(--accent-amber)] mt-1.5 flex items-center gap-1">
                        <Gift size={11} /> {occ.gift_ideas}
                      </p>
                    )}

                    {occ.notes && (
                      <p className="text-xs text-[var(--text-muted)] mt-1">{occ.notes}</p>
                    )}
                  </div>

                  {/* Right: countdown + actions */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {!occ.is_completed && daysUntil >= 0 && (
                      <span className="text-sm font-bold font-mono" style={{ color: urgency }}>
                        {getUrgencyLabel(daysUntil)}
                      </span>
                    )}
                    {occ.is_completed && (
                      <span className="text-xs text-[var(--accent-emerald)] flex items-center gap-1">
                        <Check size={11} /> Done
                      </span>
                    )}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleComplete(occ)}
                        className={`p-1.5 rounded-lg transition-colors ${occ.is_completed ? 'text-[var(--accent-emerald)] bg-[rgba(52,211,153,0.1)]' : 'text-[var(--text-muted)] hover:text-[var(--accent-emerald)] hover:bg-[rgba(52,211,153,0.08)]'}`}
                        title={occ.is_completed ? 'Mark incomplete' : 'Mark done'}
                      >
                        <Check size={12} />
                      </button>
                      <button onClick={() => setEditTarget(occ)} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--accent-violet)] hover:bg-[rgba(124,106,247,0.08)] transition-colors">
                        <Edit2 size={12} />
                      </button>
                      <button onClick={() => setDeleteTarget(occ)} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--accent-rose)] hover:bg-[rgba(248,113,113,0.08)] transition-colors">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Days countdown bar */}
                {!occ.is_completed && daysUntil >= 0 && daysUntil <= 30 && (
                  <div className="mt-3 h-1 bg-[var(--bg-overlay)] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(5, 100 - (daysUntil / 30) * 100)}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ background: urgency }}
                    />
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Form */}
      <OccasionFormModal
        isOpen={showForm || !!editTarget}
        onClose={() => { setShowForm(false); setEditTarget(null) }}
        occasion={editTarget}
        onSave={async (data) => {
          if (editTarget) {
            await updateOccasion(editTarget.id, data)
            success('Occasion updated')
          } else {
            await addOccasion(data)
            success('Occasion added')
          }
          setShowForm(false)
          setEditTarget(null)
        }}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Occasion"
        message={`Delete "${deleteTarget?.person_name}'s ${deleteTarget?.occasion_type}"?`}
      />
    </div>
  )
}

// ── Occasion Form Modal ───────────────────────────────────────
function OccasionFormModal({ isOpen, onClose, occasion, onSave }: {
  isOpen: boolean
  onClose: () => void
  occasion: Occasion | null
  onSave: (data: OccasionInsert) => Promise<void>
}) {
  const [form, setForm] = useState<OccasionInsert>({
    person_name: '', occasion_type: 'birthday', date: '',
    is_recurring: true, notes: null, gift_ideas: null, budget: null, is_completed: false,
  })
  const [isSaving, setIsSaving] = useState(false)
  const { error: showError } = useToast()

  useEffect(() => {
    if (occasion) {
      setForm({
        person_name: occasion.person_name, occasion_type: occasion.occasion_type,
        date: occasion.date, is_recurring: occasion.is_recurring,
        notes: occasion.notes, gift_ideas: occasion.gift_ideas,
        budget: occasion.budget, is_completed: occasion.is_completed,
      })
    } else {
      setForm({ person_name: '', occasion_type: 'birthday', date: '', is_recurring: true, notes: null, gift_ideas: null, budget: null, is_completed: false })
    }
  }, [occasion, isOpen])

  const set = (k: keyof OccasionInsert, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.person_name.trim()) { showError('Person name required'); return }
    if (!form.date) { showError('Date required'); return }
    setIsSaving(true)
    try { await onSave(form) } finally { setIsSaving(false) }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={occasion ? 'Edit Occasion' : 'Add Occasion'} size="sm">
      <div className="p-5 space-y-4">
        <Input label="Person's Name *" placeholder="e.g. Mom, Best Friend" value={form.person_name} onChange={e => set('person_name', e.target.value)} />

        <Select
          label="Type *"
          value={form.occasion_type}
          onChange={e => set('occasion_type', e.target.value)}
          options={OCCASION_TYPES.map(t => ({ value: t.value, label: `${t.icon} ${t.label}` }))}
        />

        <Input label="Date *" type="date" value={form.date} onChange={e => set('date', e.target.value)} />

        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => set('is_recurring', !form.is_recurring)}
            className={`w-10 h-5 rounded-full transition-colors relative ${form.is_recurring ? 'bg-[var(--accent-violet)]' : 'bg-[var(--bg-overlay)]'}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.is_recurring ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </div>
          <div>
            <p className="text-sm text-[var(--text-primary)]">Yearly recurring</p>
            <p className="text-xs text-[var(--text-muted)]">Repeats every year on this date</p>
          </div>
        </label>

        {/* Budget */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">Gift Budget (₹)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] font-mono text-sm">₹</span>
            <input
              type="number" min="0"
              value={form.budget ?? ''}
              onChange={e => set('budget', e.target.value ? parseFloat(e.target.value) : null)}
              className="w-full pl-8 pr-4 py-2.5 text-sm bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-violet)] transition-colors font-mono"
              placeholder="Optional"
            />
          </div>
        </div>

        <Textarea label="🎁 Gift Ideas" placeholder="Brainstorm gift ideas here..." value={form.gift_ideas ?? ''} onChange={e => set('gift_ideas', e.target.value || null)} rows={2} />
        <Textarea label="Notes" placeholder="Any additional notes..." value={form.notes ?? ''} onChange={e => set('notes', e.target.value || null)} rows={2} />

        <div className="flex gap-3 justify-end pt-2 border-t border-[var(--border-subtle)]">
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} isLoading={isSaving}>
            {occasion ? 'Save Changes' : 'Add Occasion'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
