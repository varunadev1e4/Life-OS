import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, RotateCcw, X, Timer, Coffee, Brain } from 'lucide-react'

type Phase = 'focus' | 'break' | 'longbreak'

const DURATIONS: Record<Phase, number> = {
  focus:     25 * 60,
  break:      5 * 60,
  longbreak: 15 * 60,
}

const PHASE_CONFIG = {
  focus:     { label: 'Focus',       icon: Brain,  color: '#7c6af7', bg: 'rgba(124,106,247,0.15)' },
  break:     { label: 'Break',       icon: Coffee, color: '#34d399', bg: 'rgba(52,211,153,0.15)' },
  longbreak: { label: 'Long Break',  icon: Coffee, color: '#38bdf8', bg: 'rgba(56,189,248,0.15)' },
}

export function PomodoroTimer() {
  const [visible, setVisible] = useState(false)
  const [phase, setPhase] = useState<Phase>('focus')
  const [seconds, setSeconds] = useState(DURATIONS.focus)
  const [running, setRunning] = useState(false)
  const [sessions, setSessions] = useState(0)
  const [minimized, setMinimized] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const total = DURATIONS[phase]
  const progress = 1 - seconds / total
  const cfg = PHASE_CONFIG[phase]
  const Icon = cfg.icon

  const tick = useCallback(() => {
    setSeconds(s => {
      if (s <= 1) {
        setRunning(false)
        // Play sound
        try {
          const ctx = new AudioContext()
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.connect(gain); gain.connect(ctx.destination)
          osc.frequency.value = 800
          gain.gain.setValueAtTime(0.3, ctx.currentTime)
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8)
          osc.start(); osc.stop(ctx.currentTime + 0.8)
        } catch {}
        // Auto-advance
        setPhase(p => {
          if (p === 'focus') {
            setSessions(n => {
              const next = n + 1
              return next
            })
            setSessions(n => {
              return n
            })
            return 'break'
          }
          return 'focus'
        })
        setSessions(n => phase === 'focus' ? n + 1 : n)
        return 0
      }
      return s - 1
    })
  }, [phase])

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(tick, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running, tick])

  const changePhase = (p: Phase) => {
    setPhase(p)
    setSeconds(DURATIONS[p])
    setRunning(false)
  }

  const reset = () => { setSeconds(DURATIONS[phase]); setRunning(false) }

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')

  // Circle progress
  const R = 36
  const circ = 2 * Math.PI * R
  const dash = circ * (1 - progress)

  if (!visible) {
    return (
      <button
        onClick={() => setVisible(true)}
        className="fixed bottom-24 left-4 lg:bottom-6 lg:left-auto lg:right-20 z-30 w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}
        title="Open Pomodoro Timer"
      >
        <Timer size={18} className="text-[var(--text-secondary)]" />
        {running && <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-[var(--accent-violet)] animate-pulse" />}
      </button>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="fixed bottom-24 left-4 lg:bottom-6 lg:left-auto lg:right-20 z-30 rounded-2xl border"
      style={{
        background: 'var(--bg-surface)',
        borderColor: 'var(--border)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        width: minimized ? 'auto' : '220px',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <Timer size={13} style={{ color: cfg.color }} />
          <span className="text-xs font-semibold text-[var(--text-primary)]">{cfg.label}</span>
          {sessions > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: `${cfg.color}20`, color: cfg.color }}>
              {sessions} 🍅
            </span>
          )}
        </div>
        <div className="flex gap-1">
          <button onClick={() => setMinimized(!minimized)} className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
            {minimized ? '▲' : '▼'}
          </button>
          <button onClick={() => { setVisible(false); setRunning(false) }} className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--accent-rose)]">
            <X size={12} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {!minimized && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            {/* Phase selector */}
            <div className="flex gap-1 p-2">
              {(['focus', 'break', 'longbreak'] as Phase[]).map(p => (
                <button
                  key={p}
                  onClick={() => changePhase(p)}
                  className="flex-1 py-1 rounded-lg text-[10px] font-medium transition-all"
                  style={{
                    background: phase === p ? `${PHASE_CONFIG[p].color}20` : 'var(--bg-elevated)',
                    color: phase === p ? PHASE_CONFIG[p].color : 'var(--text-muted)',
                    border: `1px solid ${phase === p ? PHASE_CONFIG[p].color + '40' : 'transparent'}`,
                  }}
                >
                  {p === 'focus' ? '25m' : p === 'break' ? '5m' : '15m'}
                </button>
              ))}
            </div>

            {/* Timer circle */}
            <div className="flex flex-col items-center py-3 gap-3">
              <div className="relative">
                <svg width="100" height="100" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r={R} fill="none" stroke="var(--bg-overlay)" strokeWidth="5" />
                  <circle
                    cx="50" cy="50" r={R} fill="none"
                    stroke={cfg.color} strokeWidth="5"
                    strokeDasharray={circ}
                    strokeDashoffset={dash}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                    style={{ transition: 'stroke-dashoffset 1s linear' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-mono font-bold text-xl text-[var(--text-primary)]">{mm}:{ss}</span>
                  <Icon size={11} style={{ color: cfg.color }} className="mt-0.5" />
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3">
                <button onClick={reset} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors">
                  <RotateCcw size={14} />
                </button>
                <button
                  onClick={() => setRunning(!running)}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                  style={{ background: cfg.color, boxShadow: `0 0 16px ${cfg.color}50` }}
                >
                  {running ? <Pause size={16} className="text-white" /> : <Play size={16} className="text-white ml-0.5" />}
                </button>
                <div className="w-7" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}