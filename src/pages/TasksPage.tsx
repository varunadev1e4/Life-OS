import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Edit2, Flag, Calendar, Check, AlertCircle } from 'lucide-react'
import { format, isToday, isPast, parseISO, isTomorrow } from 'date-fns'
import { useTasksStore } from '@/lib/store'
import { useToast } from '@/context/ToastContext'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button, Modal, Input, Textarea, Select, EmptyState, ConfirmDialog } from '@/components/ui'
import { TagInput } from '@/components/ui'
import type { Task, TaskInsert, TaskPriority } from '@/types'

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; bg: string; icon: string }> = {
  urgent: { label: 'Urgent', color: '#f87171', bg: 'rgba(248,113,113,0.12)', icon: '🔴' },
  high:   { label: 'High',   color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  icon: '🟠' },
  medium: { label: 'Medium', color: '#38bdf8', bg: 'rgba(56,189,248,0.12)',  icon: '🔵' },
  low:    { label: 'Low',    color: '#a8a8c0', bg: 'rgba(168,168,192,0.08)', icon: '⚪' },
}

function getDueDateLabel(date: string | null): { label: string; color: string } | null {
  if (!date) return null
  const d = parseISO(date)
  if (isPast(d) && !isToday(d)) return { label: 'Overdue', color: '#f87171' }
  if (isToday(d))               return { label: 'Today',   color: '#f59e0b' }
  if (isTomorrow(d))            return { label: 'Tomorrow', color: '#38bdf8' }
  return { label: format(d, 'MMM d'), color: 'var(--text-muted)' }
}

function QuickAddBar({ onAdd }: { onAdd: (title: string, priority: TaskPriority) => void }) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')

  const submit = () => {
    if (!title.trim()) return
    onAdd(title.trim(), priority)
    setTitle('')
  }

  return (
    <div className="flex gap-2 mb-5">
      <div className="flex-1 flex items-center gap-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 pr-2 focus-within:border-[var(--accent-violet)] transition-all">
        <Plus size={15} className="text-[var(--text-muted)] shrink-0" />
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="Add a task… (press Enter)"
          className="flex-1 py-2.5 bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none"
        />
        <div className="flex gap-1 shrink-0">
          {(['urgent', 'high', 'medium', 'low'] as TaskPriority[]).map(p => (
            <button
              key={p}
              onClick={() => setPriority(p)}
              title={PRIORITY_CONFIG[p].label}
              className="w-5 h-5 rounded-full flex items-center justify-center transition-all"
              style={{
                background: priority === p ? PRIORITY_CONFIG[p].color : 'var(--bg-overlay)',
                opacity: priority === p ? 1 : 0.4,
              }}
            >
              <Flag size={9} style={{ color: priority === p ? 'white' : PRIORITY_CONFIG[p].color }} className="fill-current" />
            </button>
          ))}
        </div>
      </div>
      <Button variant="primary" onClick={submit} disabled={!title.trim()}>Add</Button>
    </div>
  )
}

export function TasksPage() {
  const { tasks, isLoading, fetchTasks, addTask, updateTask, deleteTask, toggleTask, getOverdue } = useTasksStore()
  const { success, error: showError } = useToast()

  const [filter, setFilter] = useState<'all' | 'today' | 'todo' | 'done'>('todo')
  const [editTarget, setEditTarget] = useState<Task | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null)

  useEffect(() => { fetchTasks() }, []) // eslint-disable-line

  const todayStr = new Date().toISOString().split('T')[0]
  const overdue  = getOverdue()

  const todoTasks  = useMemo(() => tasks.filter(t => t.status === 'todo'), [tasks])
  const doneTasks  = useMemo(() => tasks.filter(t => t.status === 'done'), [tasks])
  const todayTasks = useMemo(() =>
    tasks.filter(t => t.status === 'todo' && (!t.due_date || t.due_date <= todayStr))
  , [tasks, todayStr])

  const filtered = useMemo(() => {
    switch (filter) {
      case 'today': return todayTasks
      case 'todo':  return todoTasks
      case 'done':  return doneTasks
      default:      return tasks
    }
  }, [filter, tasks, todoTasks, todayTasks, doneTasks])

  const priorityOrder: Record<TaskPriority, number> = { urgent: 0, high: 1, medium: 2, low: 3 }
  const sorted = [...filtered].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'todo' ? -1 : 1
    const diff = (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2)
    if (diff !== 0) return diff
    if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date)
    if (a.due_date) return -1
    if (b.due_date) return 1
    return 0
  })

  const handleQuickAdd = async (title: string, priority: TaskPriority) => {
    try {
      await addTask({ title, priority, status: 'todo', notes: null, due_date: null, completed_at: null, order_index: tasks.length, tags: [] })
      success('Task added')
    } catch { showError('Failed to add task') }
  }

  const handleToggle = async (id: string) => {
    try { await toggleTask(id) } catch { showError('Failed to update') }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try { await deleteTask(deleteTarget.id); success('Task deleted'); setDeleteTarget(null) }
    catch { showError('Failed to delete') }
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <PageHeader
        title="Tasks"
        subtitle={`${todoTasks.length} remaining${overdue.length > 0 ? ` · ${overdue.length} overdue` : ''}`}
        icon="✅"
      />

      {/* Overdue warning */}
      {overdue.length > 0 && (
        <div
          className="mb-4 p-3 rounded-xl flex items-center gap-2"
          style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)' }}
        >
          <AlertCircle size={14} style={{ color: '#f87171' }} className="shrink-0" />
          <p className="text-sm text-[var(--accent-rose)]">
            <strong>{overdue.length}</strong> overdue {overdue.length === 1 ? 'task' : 'tasks'}
          </p>
        </div>
      )}

      <QuickAddBar onAdd={handleQuickAdd} />

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] w-fit mb-5">
        {[
          { value: 'todo',  label: `Todo (${todoTasks.length})` },
          { value: 'today', label: `Today (${todayTasks.length})` },
          { value: 'done',  label: `Done (${doneTasks.length})` },
          { value: 'all',   label: 'All' },
        ].map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value as typeof filter)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === f.value
                ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-card'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Task list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1,2,3,4].map(i => <div key={i} className="h-14 rounded-xl bg-[var(--bg-elevated)] animate-pulse" />)}
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={filter === 'done' ? '🎉' : '✅'}
          title={filter === 'done' ? 'No completed tasks yet' : 'No tasks here'}
          description={filter === 'todo' ? 'Add a task above to get started' : 'All clear!'}
        />
      ) : (
        <div className="space-y-2">
          {sorted.map((task, i) => {
            const pc  = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.medium
            const due = getDueDateLabel(task.due_date)
            const isDone = task.status === 'done'

            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className={`group flex items-start gap-3 p-3.5 rounded-xl border transition-all hover:border-[var(--border-strong)] ${isDone ? 'opacity-50' : ''}`}
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
              >
                {/* Check button */}
                <button
                  onClick={() => handleToggle(task.id)}
                  className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                    isDone
                      ? 'bg-[var(--accent-emerald)] border-[var(--accent-emerald)]'
                      : 'border-[var(--border-strong)] hover:border-[var(--accent-violet)]'
                  }`}
                >
                  {isDone && <Check size={11} className="text-white" strokeWidth={3} />}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium leading-snug ${isDone ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-primary)]'}`}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold"
                      style={{ color: pc.color, background: pc.bg }}>
                      {pc.label}
                    </span>
                    {due && (
                      <span className="flex items-center gap-1 text-[10px] font-medium" style={{ color: due.color }}>
                        <Calendar size={9} />{due.label}
                      </span>
                    )}
                    {task.tags?.map(t => (
                      <span key={t} className="text-[10px] px-1 py-0.5 rounded font-medium"
                        style={{ background: 'rgba(124,106,247,0.1)', color: '#a78bfa' }}>
                        {t}
                      </span>
                    ))}
                  </div>
                  {task.notes && <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-1">{task.notes}</p>}
                </div>

                {/* Actions */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button onClick={() => setEditTarget(task)}
                    className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--accent-violet)] hover:bg-[rgba(124,106,247,0.08)] transition-colors">
                    <Edit2 size={12} />
                  </button>
                  <button onClick={() => setDeleteTarget(task)}
                    className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--accent-rose)] hover:bg-[rgba(248,113,113,0.08)] transition-colors">
                    <Trash2 size={12} />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {editTarget && (
        <TaskFormModal
          isOpen={true}
          task={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={async (data) => {
            await updateTask(editTarget.id, data)
            success('Task updated')
            setEditTarget(null)
          }}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Task"
        message={`Delete "${deleteTarget?.title}"?`}
      />
    </div>
  )
}

function TaskFormModal({ isOpen, task, onClose, onSave }: {
  isOpen: boolean; task: Task; onClose: () => void
  onSave: (data: Partial<TaskInsert>) => Promise<void>
}) {
  const [title, setTitle]       = useState(task.title)
  const [notes, setNotes]       = useState(task.notes ?? '')
  const [priority, setPriority] = useState(task.priority)
  const [dueDate, setDueDate]   = useState(task.due_date ?? '')
  const [tags, setTags]         = useState(task.tags ?? [])
  const [isSaving, setIsSaving] = useState(false)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Task" size="sm">
      <div className="p-5 space-y-4">
        <Input label="Title" value={title} onChange={e => setTitle(e.target.value)} />
        <Select
          label="Priority"
          value={priority}
          onChange={e => setPriority(e.target.value as TaskPriority)}
          options={Object.entries(PRIORITY_CONFIG).map(([v, c]) => ({ value: v, label: `${c.icon} ${c.label}` }))}
        />
        <Input label="Due Date" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
        <Textarea label="Notes" value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
        <TagInput tags={tags} onChange={setTags} label="Tags" />
        <div className="flex gap-3 justify-end pt-2 border-t border-[var(--border-subtle)]">
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button variant="primary" isLoading={isSaving} onClick={async () => {
            setIsSaving(true)
            await onSave({ title, notes: notes || null, priority, due_date: dueDate || null, tags })
            setIsSaving(false)
          }}>
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  )
}
