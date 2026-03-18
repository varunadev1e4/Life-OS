import { useState, type ReactNode } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { Shield, Download, LogOut, Info, ChevronRight, Sun, Moon, Monitor } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { useItemsStore, useJournalStore, useHabitsStore, useGoalsStore } from '@/lib/store'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button, Input, Modal } from '@/components/ui'
import { exportToJSON, exportToCSV } from '@/utils/helpers'

export function SettingsPage() {
  const { logout, changePin } = useAuth()
  const { success, error } = useToast()
  const { items } = useItemsStore()
  const { logs: journalLogs } = useJournalStore()
  const { habits } = useHabitsStore()
  const { goals } = useGoalsStore()

  const [showPinChange, setShowPinChange] = useState(false)
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmNewPin, setConfirmNewPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [isChangingPin, setIsChangingPin] = useState(false)

  const handlePinChange = async () => {
    setPinError('')
    if (currentPin.length < 4) { setPinError('Current PIN is required'); return }
    if (newPin.length < 4) { setPinError('New PIN must be at least 4 digits'); return }
    if (newPin !== confirmNewPin) { setPinError('New PINs do not match'); return }

    setIsChangingPin(true)
    try {
      const ok = await changePin(currentPin, newPin)
      if (!ok) {
        setPinError('Current PIN is incorrect')
      } else {
        success('PIN changed successfully')
        setShowPinChange(false)
        setCurrentPin(''); setNewPin(''); setConfirmNewPin('')
      }
    } catch {
      error('Failed to change PIN')
    } finally {
      setIsChangingPin(false)
    }
  }

  const exportData = (format: 'json' | 'csv') => {
    if (format === 'json') {
      const allData = {
        items,
        journal: journalLogs,
        habits,
        goals,
        exportedAt: new Date().toISOString(),
      }
      exportToJSON([allData] as unknown[], 'life-os-export')
    } else {
      exportToCSV(items.map(i => ({
        title: i.title,
        type: i.type,
        status: i.status,
        rating: i.rating ?? '',
        author: i.author_creator ?? '',
        year: i.year ?? '',
        genre: i.genre ?? '',
        tags: i.tags.join(', '),
        completed_at: i.completed_at ?? '',
        notes: i.notes ?? '',
      })), 'life-os-library')
    }
    success(`Data exported as ${format.toUpperCase()}`)
  }

  const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0'

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <PageHeader title="Settings" icon="⚙️" />

      <div className="space-y-4">
        {/* Appearance */}
        <AppearanceSection />

        {/* Security */}
        <section>
          <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2 px-1">Security</h2>
          <div className="card divide-y divide-[var(--border-subtle)]">
            <SettingRow
              icon={<Shield size={16} />}
              title="Change PIN"
              description="Update your access PIN"
              action={<ChevronRight size={16} className="text-[var(--text-muted)]" />}
              onClick={() => setShowPinChange(true)}
            />
            <SettingRow
              icon={<LogOut size={16} />}
              title="Lock App"
              description="Sign out and lock with PIN"
              action={<Button variant="danger" size="sm" onClick={logout}>Lock</Button>}
            />
          </div>
        </section>

        {/* Data */}
        <section>
          <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2 px-1">Data</h2>
          <div className="card divide-y divide-[var(--border-subtle)]">
            <SettingRow
              icon={<Download size={16} />}
              title="Export as JSON"
              description={`All ${items.length + journalLogs.length + habits.length + goals.length} records`}
              action={<Button variant="secondary" size="sm" onClick={() => exportData('json')}>Export</Button>}
            />
            <SettingRow
              icon={<Download size={16} />}
              title="Export Library as CSV"
              description={`${items.length} library items`}
              action={<Button variant="secondary" size="sm" onClick={() => exportData('csv')}>Export</Button>}
            />
          </div>
        </section>

        {/* Stats overview */}
        <section>
          <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2 px-1">Your Data</h2>
          <div className="card p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Library Items', value: items.length, icon: '📚' },
                { label: 'Journal Entries', value: journalLogs.length, icon: '📔' },
                { label: 'Habits', value: habits.length, icon: '✅' },
                { label: 'Goals', value: goals.length, icon: '🎯' },
              ].map(s => (
                <div key={s.label} className="text-center p-3 rounded-xl bg-[var(--bg-elevated)]">
                  <div className="text-2xl mb-1">{s.icon}</div>
                  <div className="text-xl font-display font-bold text-[var(--accent-violet)]">{s.value}</div>
                  <div className="text-xs text-[var(--text-muted)]">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* About */}
        <section>
          <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2 px-1">About</h2>
          <div className="card divide-y divide-[var(--border-subtle)]">
            <SettingRow
              icon={<Info size={16} />}
              title="Life OS"
              description={`Version ${APP_VERSION} • Built with React + Supabase`}
            />
          </div>
        </section>
      </div>

      {/* Change PIN Modal */}
      <Modal isOpen={showPinChange} onClose={() => setShowPinChange(false)} title="Change PIN" size="sm">
        <div className="p-6 space-y-4">
          <Input
            label="Current PIN"
            type="password"
            inputMode="numeric"
            placeholder="Enter current PIN"
            value={currentPin}
            onChange={e => setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
          />
          <Input
            label="New PIN"
            type="password"
            inputMode="numeric"
            placeholder="4-6 digit PIN"
            value={newPin}
            onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
          />
          <Input
            label="Confirm New PIN"
            type="password"
            inputMode="numeric"
            placeholder="Repeat new PIN"
            value={confirmNewPin}
            onChange={e => setConfirmNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
            error={pinError}
          />
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setShowPinChange(false)}>Cancel</Button>
            <Button variant="primary" onClick={handlePinChange} isLoading={isChangingPin}>Update PIN</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}


function AppearanceSection() {
  const { theme, setTheme } = useTheme()

  const options: { value: 'dark' | 'light' | 'system'; label: string; icon: typeof Sun; desc: string }[] = [
    { value: 'dark',   label: 'Dark',   icon: Moon,    desc: 'Always dark' },
    { value: 'light',  label: 'Light',  icon: Sun,     desc: 'Always light' },
    { value: 'system', label: 'System', icon: Monitor, desc: 'Follows your OS' },
  ]

  return (
    <section>
      <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2 px-1">Appearance</h2>
      <div className="card p-4">
        <p className="text-sm font-medium text-[var(--text-primary)] mb-3">Theme</p>
        <div className="grid grid-cols-3 gap-2">
          {options.map(({ value, label, icon: Icon, desc }) => {
            const active = theme === value
            return (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all"
                style={{
                  borderColor: active ? 'var(--accent-violet)' : 'var(--border)',
                  background: active ? 'rgba(124,106,247,0.08)' : 'var(--bg-elevated)',
                }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: active ? 'rgba(124,106,247,0.15)' : 'var(--bg-overlay)' }}>
                  <Icon size={18} style={{ color: active ? 'var(--accent-violet)' : 'var(--text-secondary)' }} />
                </div>
                <div className="text-center">
                  <p className="text-xs font-semibold" style={{ color: active ? 'var(--accent-violet)' : 'var(--text-primary)' }}>
                    {label}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)]">{desc}</p>
                </div>
                {active && (
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-violet)]" />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}

interface SettingRowProps {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
  onClick?: () => void
}

function SettingRow({ icon, title, description, action, onClick }: SettingRowProps) {
  return (
    <div
      className={`flex items-center justify-between gap-4 p-4 ${onClick ? 'cursor-pointer hover:bg-[var(--bg-elevated)] transition-colors' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[var(--bg-elevated)] flex items-center justify-center text-[var(--text-secondary)] shrink-0">
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">{title}</p>
          <p className="text-xs text-[var(--text-secondary)]">{description}</p>
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}