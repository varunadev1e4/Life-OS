import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'

interface PinGateProps {
  isSetup: boolean
}

export function PinGate({ isSetup }: PinGateProps) {
  const { login, setupPin } = useAuth()
  const { error: showError } = useToast()

  const [step, setStep] = useState<'enter' | 'confirm'>('enter')
  const [shake, setShake] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [displayPin, setDisplayPin] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Refs hold the actual values — no stale closure possible
  const firstPinRef = useRef('')     // PIN saved after 'enter' step
  const currentInputRef = useRef('') // what the user is currently typing

  const PIN_LENGTH = 6

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [step])

  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 600)
  }

  const reset = () => {
    firstPinRef.current = ''
    currentInputRef.current = ''
    setDisplayPin('')
    setStep('enter')
  }

  const handleComplete = async (digits: string) => {
    if (isSetup) {
      // ── Login mode ──────────────────────────────────────────────
      setIsLoading(true)
      try {
        const ok = await login(digits)
        if (!ok) {
          triggerShake()
          showError('Wrong PIN', 'Please try again')
          currentInputRef.current = ''
          setDisplayPin('')
        }
      } finally {
        setIsLoading(false)
      }
      return
    }

    // ── First-time setup mode ────────────────────────────────────
    if (step === 'enter') {
      // Save the first PIN in a ref, then move to confirm step
      firstPinRef.current = digits
      currentInputRef.current = ''
      setDisplayPin('')
      setStep('confirm')
    } else {
      // 'digits' IS the confirm PIN right now — compare with saved first PIN
      if (digits !== firstPinRef.current) {
        triggerShake()
        showError("PINs don't match", 'Please try again')
        reset()
        return
      }
      setIsLoading(true)
      try {
        await setupPin(firstPinRef.current)
      } catch {
        showError('Setup failed', 'Please try again')
        reset()
        setIsLoading(false)
      }
    }
  }

  const handleInput = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, PIN_LENGTH)
    currentInputRef.current = digits
    setDisplayPin(digits)
    if (digits.length === PIN_LENGTH) {
      handleComplete(digits)
    }
  }

  const handlePadPress = (key: number | 'del') => {
    if (isLoading) return
    if (key === 'del') {
      handleInput(currentInputRef.current.slice(0, -1))
    } else {
      handleInput(currentInputRef.current + String(key))
    }
  }

  const subtitle = isSetup
    ? 'Enter your PIN to continue'
    : step === 'enter'
      ? 'Create a 6-digit PIN to secure your app'
      : 'Re-enter your PIN to confirm'

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[var(--bg-base)] px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(124,106,247,0.06) 0%, transparent 70%)' }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex flex-col items-center gap-10 w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7c6af7, #38bdf8)', boxShadow: '0 8px 32px rgba(124,106,247,0.3)' }}
          >
            <span className="text-2xl">◎</span>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold font-display text-[var(--text-primary)] tracking-tight">
              Life OS
            </h1>
            <motion.p
              key={subtitle}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-[var(--text-secondary)] mt-0.5"
            >
              {subtitle}
            </motion.p>
          </div>
        </div>

        {/* PIN dots */}
        <motion.div
          animate={shake ? { x: [-10, 10, -10, 10, -5, 5, 0] } : { x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex gap-4"
        >
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <motion.div
              key={i}
              animate={{ scale: displayPin.length === i ? [1, 1.25, 1] : 1 }}
              transition={{ duration: 0.12 }}
              className="w-4 h-4 rounded-full border-2 transition-all duration-150"
              style={{
                borderColor: i < displayPin.length ? 'var(--accent-violet)' : 'var(--border-strong)',
                background: i < displayPin.length ? 'var(--accent-violet)' : 'transparent',
                boxShadow: i < displayPin.length ? '0 0 10px rgba(124,106,247,0.45)' : 'none',
              }}
            />
          ))}
        </motion.div>

        {/* Hidden native input for keyboard support */}
        <input
          ref={inputRef}
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={PIN_LENGTH}
          value={displayPin}
          onChange={e => handleInput(e.target.value)}
          className="absolute opacity-0 w-0 h-0 pointer-events-none"
          disabled={isLoading}
          aria-label="PIN input"
          autoComplete="off"
        />

        {/* Number pad */}
        <div className="grid grid-cols-3 gap-3 w-full">
          {([1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'] as (number | null | 'del')[]).map((key, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => key !== null && handlePadPress(key as number | 'del')}
              disabled={isLoading || key === null}
              className={[
                'h-14 rounded-xl font-display font-semibold text-xl transition-all duration-100 select-none',
                key === null
                  ? 'opacity-0 pointer-events-none'
                  : 'active:scale-95 active:bg-[var(--bg-overlay)]',
              ].join(' ')}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                color: key === 'del' ? 'var(--text-secondary)' : 'var(--text-primary)',
              }}
            >
              {key === 'del' ? '⌫' : key}
            </button>
          ))}
        </div>

        {/* Step progress for setup mode */}
        {!isSetup && (
          <div className="flex gap-2">
            {(['enter', 'confirm'] as const).map(s => (
              <div
                key={s}
                className="h-1 rounded-full transition-all duration-300"
                style={{
                  width: step === s ? '24px' : '8px',
                  background: step === s ? 'var(--accent-violet)' : 'var(--border-strong)',
                }}
              />
            ))}
          </div>
        )}

        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-[var(--accent-violet)]"
                style={{ animation: `pulseSoft 1s ease-in-out ${i * 0.2}s infinite` }}
              />
            ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}