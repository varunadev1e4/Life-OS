import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Droplets, Footprints, Scale, Moon, Plus, Minus, TrendingUp } from 'lucide-react'
import { format, subDays, parseISO } from 'date-fns'
import { useHealthStore } from '@/lib/store'
import { useToast } from '@/context/ToastContext'
import { PageHeader } from '@/components/ui/PageHeader'
import { Skeleton } from '@/components/ui'
import { today } from '@/utils/helpers'
import type { HealthInsert } from '@/types'

const WATER_GOAL  = 2500 // ml
const STEPS_GOAL  = 10000

export function HealthPage() {
  const { entries, isLoading, fetchRecent, upsertEntry, getToday } = useHealthStore()
  const { success, error: showError } = useToast()
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => { fetchRecent(14) }, [fetchRecent])

  const todayEntry = getToday()

  const upsert = async (updates: Partial<HealthInsert>) => {
    const base: HealthInsert = {
      date: today(),
      water_ml: todayEntry?.water_ml ?? 0,
      steps: todayEntry?.steps ?? 0,
      weight_kg: todayEntry?.weight_kg ?? null,
      sleep_hours: todayEntry?.sleep_hours ?? null,
      sleep_quality: todayEntry?.sleep_quality ?? null,
      ...updates,
    }
    try {
      await upsertEntry(base)
    } catch { showError('Failed to save') }
  }

  const addWater = async (ml: number) => {
    setSaving('water')
    await upsert({ water_ml: Math.max(0, (todayEntry?.water_ml ?? 0) + ml) })
    setSaving(null)
  }

  const addSteps = async (n: number) => {
    setSaving('steps')
    await upsert({ steps: Math.max(0, (todayEntry?.steps ?? 0) + n) })
    setSaving(null)
  }

  const water   = todayEntry?.water_ml ?? 0
  const steps   = todayEntry?.steps ?? 0
  const waterPct = Math.min(100, Math.round((water / WATER_GOAL) * 100))
  const stepsPct = Math.min(100, Math.round((steps / STEPS_GOAL) * 100))

  // Last 7 days for sparklines
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd')
    return entries.find(e => e.date === d)
  })

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <PageHeader title="Health Tracker" subtitle="Track water, steps, sleep & weight" icon="💪" />

      {/* Today header */}
      <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-4">
        Today — {format(new Date(), 'EEEE, MMMM d')}
      </p>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Water */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Droplets size={18} className="text-[var(--accent-sky)]" />
                <span className="font-semibold text-sm text-[var(--text-primary)]">Water</span>
              </div>
              <span className="text-xs text-[var(--text-muted)]">Goal: {WATER_GOAL}ml</span>
            </div>

            <div className="flex items-end gap-2 mb-3">
              <span className="text-3xl font-display font-bold text-[var(--accent-sky)]">{water}</span>
              <span className="text-sm text-[var(--text-muted)] mb-1">ml</span>
              <span className="text-sm font-medium ml-auto" style={{ color: waterPct >= 100 ? '#34d399' : 'var(--text-muted)' }}>
                {waterPct}%
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-3 bg-[var(--bg-overlay)] rounded-full overflow-hidden mb-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${waterPct}%` }}
                transition={{ duration: 0.5 }}
                className="h-full rounded-full"
                style={{ background: waterPct >= 100 ? '#34d399' : '#38bdf8' }}
              />
            </div>

            {/* Water level visual */}
            <div className="flex items-center justify-center gap-1.5 mb-4">
              {[250, 500, 250, 500, 250, 500, 250, 500].map((ml, i) => (
                <button
                  key={i}
                  onClick={() => addWater(ml)}
                  disabled={saving === 'water'}
                  className="flex flex-col items-center gap-0.5 group"
                  title={`+${ml}ml`}
                >
                  <span className="text-[10px] text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity">+{ml}</span>
                  <div className="w-5 rounded-sm transition-all group-hover:scale-110"
                    style={{
                      height: ml === 500 ? '28px' : '20px',
                      background: i * (ml === 500 ? 500 : 250) < water
                        ? '#38bdf8'
                        : 'var(--bg-overlay)',
                      opacity: i * (ml === 500 ? 500 : 250) < water ? 1 : 0.4,
                    }}
                  />
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              {[250, 500].map(ml => (
                <button
                  key={ml}
                  onClick={() => addWater(ml)}
                  disabled={saving === 'water'}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: 'rgba(56,189,248,0.12)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.2)' }}
                >
                  +{ml}ml
                </button>
              ))}
              <button
                onClick={() => addWater(-250)}
                disabled={saving === 'water' || water === 0}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--accent-rose)] hover:bg-[rgba(248,113,113,0.08)] transition-colors border border-[var(--border)]"
              >
                <Minus size={13} />
              </button>
            </div>
          </div>

          {/* Steps */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Footprints size={18} className="text-[var(--accent-emerald)]" />
                <span className="font-semibold text-sm text-[var(--text-primary)]">Steps</span>
              </div>
              <span className="text-xs text-[var(--text-muted)]">Goal: {STEPS_GOAL.toLocaleString()}</span>
            </div>

            <div className="flex items-end gap-2 mb-3">
              <span className="text-3xl font-display font-bold text-[var(--accent-emerald)]">{steps.toLocaleString()}</span>
              <span className="text-xs text-[var(--text-muted)] mb-1">steps</span>
              <span className="text-sm font-medium ml-auto" style={{ color: stepsPct >= 100 ? '#34d399' : 'var(--text-muted)' }}>
                {stepsPct}%
              </span>
            </div>

            <div className="h-3 bg-[var(--bg-overlay)] rounded-full overflow-hidden mb-4">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stepsPct}%` }}
                transition={{ duration: 0.5 }}
                className="h-full rounded-full"
                style={{ background: stepsPct >= 100 ? '#f59e0b' : '#34d399' }}
              />
            </div>

            <div className="flex gap-2 mb-2">
              {[1000, 2000, 5000].map(n => (
                <button
                  key={n}
                  onClick={() => addSteps(n)}
                  disabled={saving === 'steps'}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}
                >
                  +{(n / 1000).toFixed(0)}k
                </button>
              ))}
              <button
                onClick={() => addSteps(-500)}
                disabled={saving === 'steps' || steps === 0}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--accent-rose)] hover:bg-[rgba(248,113,113,0.08)] transition-colors border border-[var(--border)]"
              >
                <Minus size={13} />
              </button>
            </div>

            <NumberInput
              label="Or set exact steps"
              value={steps}
              onChange={v => { setSaving('steps'); upsert({ steps: v }).then(() => setSaving(null)) }}
              placeholder="Enter exact count"
            />
          </div>

          {/* Sleep */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Moon size={18} className="text-[var(--accent-violet)]" />
              <span className="font-semibold text-sm text-[var(--text-primary)]">Last Night's Sleep</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[var(--text-muted)] mb-1.5 block">Hours</label>
                <div className="flex gap-1">
                  {[5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9].map(h => (
                    <button
                      key={h}
                      onClick={() => upsert({ sleep_hours: h })}
                      className="flex-1 py-1.5 rounded-lg text-[9px] font-bold transition-all"
                      style={{
                        background: todayEntry?.sleep_hours === h ? 'var(--accent-violet)' : 'var(--bg-overlay)',
                        color: todayEntry?.sleep_hours === h ? 'white' : 'var(--text-muted)',
                      }}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-[var(--text-muted)] mb-1.5 block">Quality</label>
                <div className="flex gap-1">
                  {[1,2,3,4,5,6,7,8,9,10].map(q => (
                    <button
                      key={q}
                      onClick={() => upsert({ sleep_quality: q })}
                      className="flex-1 aspect-square rounded text-[9px] font-bold transition-all"
                      style={{
                        background: todayEntry?.sleep_quality === q ? '#7c6af7' : 'var(--bg-overlay)',
                        color: todayEntry?.sleep_quality === q ? 'white' : 'var(--text-muted)',
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {(todayEntry?.sleep_hours || todayEntry?.sleep_quality) && (
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[var(--border-subtle)]">
                {todayEntry.sleep_hours && (
                  <span className="text-sm font-bold text-[var(--accent-violet)]">{todayEntry.sleep_hours}h sleep</span>
                )}
                {todayEntry.sleep_quality && (
                  <span className="text-sm text-[var(--text-secondary)]">Quality: {todayEntry.sleep_quality}/10</span>
                )}
              </div>
            )}
          </div>

          {/* Weight */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Scale size={18} className="text-[var(--accent-amber)]" />
              <span className="font-semibold text-sm text-[var(--text-primary)]">Weight</span>
            </div>

            <NumberInput
              label="Today's weight (kg)"
              value={todayEntry?.weight_kg ?? ''}
              onChange={v => upsert({ weight_kg: v || null })}
              placeholder="e.g. 70.5"
              step="0.1"
            />

            {/* Weight trend - last 7 days */}
            <div className="mt-4">
              <p className="text-xs text-[var(--text-muted)] mb-2 flex items-center gap-1">
                <TrendingUp size={11} /> Last 7 days
              </p>
              <div className="flex items-end gap-1.5 h-10">
                {last7.map((e, i) => {
                  const w = e?.weight_kg
                  const allWeights = last7.filter(x => x?.weight_kg).map(x => x!.weight_kg!) 
                  const min = allWeights.length ? Math.min(...allWeights) - 0.5 : 0
                  const max = allWeights.length ? Math.max(...allWeights) + 0.5 : 100
                  const pct = w ? ((w - min) / (max - min)) * 100 : 0
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full rounded-sm transition-all"
                        style={{
                          height: w ? `${Math.max(8, pct * 0.36)}px` : '4px',
                          background: w ? '#f59e0b' : 'var(--bg-overlay)',
                          opacity: w ? 1 : 0.3,
                        }}
                        title={w ? `${w}kg` : 'No data'}
                      />
                      <span className="text-[8px] text-[var(--text-muted)]">{format(subDays(new Date(), 6 - i), 'E')}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7-day overview */}
      {entries.length > 0 && (
        <div className="card p-5 mt-4">
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-4">7-Day Overview</p>
          <div className="space-y-3">
            {last7.map((e, i) => {
              const date = subDays(new Date(), 6 - i)
              const wPct = e ? Math.min(100, Math.round((e.water_ml / WATER_GOAL) * 100)) : 0
              const sPct = e ? Math.min(100, Math.round((e.steps / STEPS_GOAL) * 100)) : 0
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-[var(--text-muted)] w-8 shrink-0">{format(date, 'EEE')}</span>
                  <div className="flex-1 flex gap-2">
                    <div className="flex-1 h-1.5 bg-[var(--bg-overlay)] rounded-full overflow-hidden">
                      <div className="h-full bg-[#38bdf8] rounded-full" style={{ width: `${wPct}%` }} />
                    </div>
                    <div className="flex-1 h-1.5 bg-[var(--bg-overlay)] rounded-full overflow-hidden">
                      <div className="h-full bg-[#34d399] rounded-full" style={{ width: `${sPct}%` }} />
                    </div>
                  </div>
                  <div className="flex gap-2 text-[10px] text-[var(--text-muted)] w-28 shrink-0 justify-end">
                    <span>{e ? `${Math.round(e.water_ml / 100) / 10}L` : '-'}</span>
                    <span>{e ? `${(e.steps / 1000).toFixed(1)}k` : '-'}</span>
                    {e?.sleep_hours && <span>{e.sleep_hours}h</span>}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex gap-4 mt-3 pt-3 border-t border-[var(--border-subtle)]">
            <div className="flex items-center gap-1.5"><div className="w-3 h-1.5 rounded-full bg-[#38bdf8]" /><span className="text-[10px] text-[var(--text-muted)]">Water</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-1.5 rounded-full bg-[#34d399]" /><span className="text-[10px] text-[var(--text-muted)]">Steps</span></div>
          </div>
        </div>
      )}
    </div>
  )
}

function NumberInput({ label, value, onChange, placeholder, step = '1' }: {
  label: string
  value: number | string
  onChange: (v: number) => void
  placeholder?: string
  step?: string
}) {
  return (
    <div>
      <label className="text-xs text-[var(--text-muted)] mb-1.5 block">{label}</label>
      <input
        type="number"
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        placeholder={placeholder}
        className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-violet)] transition-colors font-mono"
      />
    </div>
  )
}