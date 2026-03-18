import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Edit2, TrendingUp, TrendingDown, ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from 'date-fns'
import { useExpensesStore } from '@/lib/store'
import { useToast } from '@/context/ToastContext'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button, Modal, Input, Textarea, Select, EmptyState, Skeleton, ConfirmDialog } from '@/components/ui'
import { today } from '@/utils/helpers'
import type { Expense, ExpenseInsert, ExpenseCategory, PaymentMethod } from '@/types'

// ── Config ────────────────────────────────────────────────────
const CATEGORIES: { value: ExpenseCategory; label: string; icon: string; color: string }[] = [
  { value: 'food',          label: 'Food & Dining',    icon: '🍽️',  color: '#f59e0b' },
  { value: 'transport',     label: 'Transport',        icon: '🚗',  color: '#38bdf8' },
  { value: 'shopping',      label: 'Shopping',         icon: '🛍️',  color: '#f87171' },
  { value: 'health',        label: 'Health',           icon: '💪',  color: '#34d399' },
  { value: 'entertainment', label: 'Entertainment',    icon: '🎬',  color: '#a78bfa' },
  { value: 'bills',         label: 'Bills',            icon: '💡',  color: '#fb923c' },
  { value: 'education',     label: 'Education',        icon: '📚',  color: '#7c6af7' },
  { value: 'travel',        label: 'Travel',           icon: '✈️',  color: '#22d3ee' },
  { value: 'personal',      label: 'Personal',         icon: '🧴',  color: '#e879f9' },
  { value: 'other',         label: 'Other',            icon: '📦',  color: '#94a3b8' },
]

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: 'upi',        label: 'UPI',         icon: '📱' },
  { value: 'card',       label: 'Card',        icon: '💳' },
  { value: 'cash',       label: 'Cash',        icon: '💵' },
  { value: 'netbanking', label: 'Net Banking', icon: '🏦' },
  { value: 'other',      label: 'Other',       icon: '💰' },
]

const getCat = (v: string) => CATEGORIES.find(c => c.value === v) || CATEGORIES[CATEGORIES.length - 1]

// ── Main Page ─────────────────────────────────────────────────
export function ExpensesPage() {
  const { expenses, isLoading, fetchExpenses, addExpense, updateExpense, deleteExpense, getMonthlyTotal, getCategoryTotals } = useExpensesStore()
  const { success, error: showError } = useToast()

  const [viewDate, setViewDate] = useState(new Date())
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Expense | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState<ExpenseCategory | 'all'>('all')
  const [view, setView] = useState<'list' | 'calendar'>('list')

  useEffect(() => { fetchExpenses() }, [fetchExpenses])

  const year  = viewDate.getFullYear()
  const month = viewDate.getMonth() + 1

  const monthExpenses = useMemo(() =>
    expenses.filter(e => {
      const d = new Date(e.date)
      return d.getFullYear() === year && d.getMonth() + 1 === month
    }), [expenses, year, month]
  )

  const filtered = useMemo(() => {
    let list = monthExpenses
    if (catFilter !== 'all') list = list.filter(e => e.category === catFilter)
    if (search) list = list.filter(e => e.title.toLowerCase().includes(search.toLowerCase()) || e.notes?.toLowerCase().includes(search.toLowerCase()))
    return list
  }, [monthExpenses, catFilter, search])

  const total       = getMonthlyTotal(year, month)
  const catTotals   = getCategoryTotals(year, month)
  const topCategory = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0]

  // Previous month comparison
  const prevDate  = new Date(year, month - 2, 1)
  const prevTotal = getMonthlyTotal(prevDate.getFullYear(), prevDate.getMonth() + 1)
  const diff      = prevTotal ? ((total - prevTotal) / prevTotal) * 100 : 0

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteExpense(deleteTarget.id)
      success('Expense deleted')
      setDeleteTarget(null)
    } catch { showError('Failed to delete') }
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Expenses"
        subtitle={`₹${total.toLocaleString('en-IN')} this month`}
        icon="💸"
        action={
          <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={() => setShowForm(true)}>
            Add Expense
          </Button>
        }
      />

      {/* Month navigator */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
          className="p-2 rounded-xl border border-[var(--border)] hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="text-center">
          <h2 className="font-display font-semibold text-[var(--text-primary)]">
            {format(viewDate, 'MMMM yyyy')}
          </h2>
          <p className="text-xs text-[var(--text-muted)]">{monthExpenses.length} transactions</p>
        </div>
        <button
          onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
          disabled={month === new Date().getMonth() + 1 && year === new Date().getFullYear()}
          className="p-2 rounded-xl border border-[var(--border)] hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] transition-colors disabled:opacity-30"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="card p-4 sm:col-span-2">
          <p className="text-xs text-[var(--text-secondary)] mb-1">Total Spent</p>
          <p className="text-3xl font-display font-bold text-[var(--text-primary)]">
            ₹{total.toLocaleString('en-IN')}
          </p>
          {prevTotal > 0 && (
            <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${diff > 0 ? 'text-[var(--accent-rose)]' : 'text-[var(--accent-emerald)]'}`}>
              {diff > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(diff).toFixed(1)}% vs last month
            </div>
          )}
        </div>

        <div className="card p-4">
          <p className="text-xs text-[var(--text-secondary)] mb-1">Transactions</p>
          <p className="text-2xl font-display font-bold text-[var(--accent-violet)]">
            {monthExpenses.length}
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            avg ₹{monthExpenses.length ? Math.round(total / monthExpenses.length).toLocaleString('en-IN') : 0}
          </p>
        </div>

        <div className="card p-4">
          <p className="text-xs text-[var(--text-secondary)] mb-1">Top Category</p>
          {topCategory ? (
            <>
              <p className="text-xl mt-1">{getCat(topCategory[0]).icon}</p>
              <p className="text-xs font-medium text-[var(--text-primary)] mt-0.5">{getCat(topCategory[0]).label}</p>
              <p className="text-xs text-[var(--text-muted)]">₹{Number(topCategory[1]).toLocaleString('en-IN')}</p>
            </>
          ) : <p className="text-[var(--text-muted)] text-sm mt-2">—</p>}
        </div>
      </div>

      {/* Category breakdown bar */}
      {Object.keys(catTotals).length > 0 && (
        <div className="card p-4 mb-5">
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Breakdown</p>
          <div className="space-y-2.5">
            {Object.entries(catTotals)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, amt]) => {
                const cfg = getCat(cat)
                const pct = total > 0 ? (amt / total) * 100 : 0
                return (
                  <div key={cat} className="flex items-center gap-3">
                    <span className="text-base w-6 shrink-0">{cfg.icon}</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[var(--text-secondary)]">{cfg.label}</span>
                        <span className="font-mono font-medium text-[var(--text-primary)]">₹{Number(amt).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="h-1.5 bg-[var(--bg-overlay)] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                          className="h-full rounded-full"
                          style={{ background: cfg.color }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-[var(--text-muted)] w-10 text-right">{pct.toFixed(0)}%</span>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* Search + filter */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search expenses..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-violet)] transition-colors"
          />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"><X size={13} /></button>}
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-4 pb-1">
        <button
          onClick={() => setCatFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${catFilter === 'all' ? 'bg-[var(--accent-violet)] text-white' : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)]'}`}
        >
          All
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat.value}
            onClick={() => setCatFilter(catFilter === cat.value ? 'all' : cat.value)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${catFilter === cat.value ? 'text-white' : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)]'}`}
            style={catFilter === cat.value ? { background: cat.color } : {}}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* Expense list */}
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="💸"
          title="No expenses found"
          description={search || catFilter !== 'all' ? 'Try different filters' : `No expenses logged for ${format(viewDate, 'MMMM yyyy')}`}
          action={<Button variant="primary" leftIcon={<Plus size={14} />} onClick={() => setShowForm(true)}>Add expense</Button>}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((expense, i) => {
            const cat = getCat(expense.category)
            const pm  = PAYMENT_METHODS.find(p => p.value === expense.payment_method)
            return (
              <motion.div
                key={expense.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="card p-3.5 flex items-center gap-3 group hover:border-[var(--border-strong)] transition-all"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                  style={{ background: `${cat.color}20` }}>
                  {cat.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{expense.title}</p>
                    {expense.is_recurring && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--bg-overlay)] text-[var(--text-muted)]">recurring</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-[var(--text-muted)]">{format(parseISO(expense.date), 'MMM d')}</span>
                    <span className="text-[10px] text-[var(--text-muted)]">·</span>
                    <span className="text-xs text-[var(--text-muted)]">{pm?.icon} {pm?.label}</span>
                    {expense.notes && <span className="text-[10px] text-[var(--text-muted)] truncate">· {expense.notes}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono font-bold text-sm text-[var(--text-primary)]">
                    ₹{Number(expense.amount).toLocaleString('en-IN')}
                  </span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditTarget(expense)} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--accent-violet)] hover:bg-[rgba(124,106,247,0.08)] transition-colors">
                      <Edit2 size={12} />
                    </button>
                    <button onClick={() => setDeleteTarget(expense)} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--accent-rose)] hover:bg-[rgba(248,113,113,0.08)] transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Form modal */}
      <ExpenseFormModal
        isOpen={showForm || !!editTarget}
        onClose={() => { setShowForm(false); setEditTarget(null) }}
        expense={editTarget}
        onSave={async (data) => {
          if (editTarget) {
            await updateExpense(editTarget.id, data)
            success('Expense updated')
          } else {
            await addExpense(data)
            success('Expense added')
          }
          setShowForm(false)
          setEditTarget(null)
        }}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Expense"
        message={`Delete "${deleteTarget?.title}"?`}
      />
    </div>
  )
}

// ── Expense Form Modal ────────────────────────────────────────
function ExpenseFormModal({ isOpen, onClose, expense, onSave }: {
  isOpen: boolean
  onClose: () => void
  expense: Expense | null
  onSave: (data: ExpenseInsert) => Promise<void>
}) {
  const [form, setForm] = useState<ExpenseInsert>({
    title: '', amount: 0, category: 'food', date: today(),
    notes: null, is_recurring: false, payment_method: 'upi',
  })
  const [isSaving, setIsSaving] = useState(false)
  const { error: showError } = useToast()

  useEffect(() => {
    if (expense) {
      setForm({
        title: expense.title, amount: expense.amount, category: expense.category,
        date: expense.date, notes: expense.notes, is_recurring: expense.is_recurring,
        payment_method: expense.payment_method,
      })
    } else {
      setForm({ title: '', amount: 0, category: 'food', date: today(), notes: null, is_recurring: false, payment_method: 'upi' })
    }
  }, [expense, isOpen])

  const set = (k: keyof ExpenseInsert, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.title.trim()) { showError('Title required'); return }
    if (!form.amount || form.amount <= 0) { showError('Enter a valid amount'); return }
    setIsSaving(true)
    try { await onSave(form) } finally { setIsSaving(false) }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={expense ? 'Edit Expense' : 'Add Expense'} size="sm">
      <div className="p-5 space-y-4">
        <Input label="Title *" placeholder="What did you spend on?" value={form.title} onChange={e => set('title', e.target.value)} />

        {/* Amount */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">Amount (₹) *</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] font-mono text-sm">₹</span>
            <input
              type="number" min="0" step="0.01"
              value={form.amount || ''}
              onChange={e => set('amount', parseFloat(e.target.value) || 0)}
              className="w-full pl-8 pr-4 py-2.5 text-sm bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-violet)] transition-colors font-mono"
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Category"
            value={form.category}
            onChange={e => set('category', e.target.value)}
            options={CATEGORIES.map(c => ({ value: c.value, label: `${c.icon} ${c.label}` }))}
          />
          <Select
            label="Paid via"
            value={form.payment_method}
            onChange={e => set('payment_method', e.target.value)}
            options={PAYMENT_METHODS.map(p => ({ value: p.value, label: `${p.icon} ${p.label}` }))}
          />
        </div>

        <Input label="Date" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
        <Textarea label="Notes" placeholder="Optional note..." value={form.notes ?? ''} onChange={e => set('notes', e.target.value || null)} rows={2} />

        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => set('is_recurring', !form.is_recurring)}
            className={`w-10 h-5 rounded-full transition-colors relative ${form.is_recurring ? 'bg-[var(--accent-violet)]' : 'bg-[var(--bg-overlay)]'}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.is_recurring ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </div>
          <span className="text-sm text-[var(--text-secondary)]">Recurring expense</span>
        </label>

        <div className="flex gap-3 justify-end pt-2 border-t border-[var(--border-subtle)]">
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} isLoading={isSaving}>
            {expense ? 'Save Changes' : 'Add Expense'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}