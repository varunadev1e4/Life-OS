import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'

interface PinGateProps {
  isSetup: boolean
}

type SetupStep = 'enter' | 'confirm'

export function PinGate({ isSetup }: PinGateProps) {
  const { login, setupPin } = useAuth()
  const { error: showError } = useToast()
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [step, setStep] = useState<SetupStep>('enter')
  const [shake, setShake] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const PIN_LENGTH = 6

  useEffect(() => {
    inputRef.current?.focus()
  }, [step])

  const triggerShake = useCallback(() => {
    setShake(true)
    setTimeout(() => setShake(false), 600)
  }, [])

  const handleLogin = useCallback(async (value: string) => {
    if (value.length !== PIN_LENGTH) return
    setIsLoading(true)
    try {
      const success = await login(value)
      if (!success) {
        triggerShake()
        setPin('')
        showError('Wrong PIN', 'Please try again')
      }
    } finally {
      setIsLoading(false)
    }
  }, [login, showError, triggerShake])

  const handleSetup = useCallback(async () => {
    if (step === 'enter') {
      if (pin.length !== PIN_LENGTH) return
      setStep('confirm')
      setConfirmPin('')
    } else {
      if (confirmPin !== pin) {
        triggerShake()
        setConfirmPin('')
        showError('PINs don\'t match', 'Please try again')
        setStep('enter')
        setPin('')
        return
      }
      setIsLoading(true)
      try {
        await setupPin(pin)
      } catch {
        showError('Setup failed', 'Please try again')
        setIsLoading(false)
      }
    }
  }, [step, pin, confirmPin, setupPin, showError, triggerShake])

  const handlePinInput = useCallback((value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, PIN_LENGTH)
    if (!isSetup) {
      if (step === 'enter') {
        setPin(digits)
        if (digits.length === PIN_LENGTH) {
          setTimeout(() => handleSetup(), 100)
        }
      } else {
        setConfirmPin(digits)
        if (digits.length === PIN_LENGTH) {
          setTimeout(() => handleSetup(), 100)
        }
      }
    } else {
      setPin(digits)
      if (digits.length === PIN_LENGTH) {
        handleLogin(digits)
      }
    }
  }, [isSetup, step, handleSetup, handleLogin])

  const currentPin = !isSetup && step === 'confirm' ? confirmPin : pin

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[var(--bg-base)] px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(124,106,247,0.06) 0%, transparent 70%)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex flex-col items-center gap-10 w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7c6af7, #38bdf8)', boxShadow: '0 8px 32px rgba(124,106,247,0.3)' }}>
            <span className="text-2xl">◎</span>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold font-display text-[var(--text-primary)] tracking-tight">Life OS</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">
              {!isSetup
                ? step === 'enter'
                  ? 'Create a 6-digit PIN to secure your app'
                  : 'Confirm your PIN'
                : 'Enter your PIN to continue'
              }
            </p>
          </div>
        </div>

        {/* PIN dots */}
        <motion.div
          animate={shake ? { x: [-8, 8, -8, 8, -4, 4, 0] } : { x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex gap-3"
        >
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <motion.div
              key={i}
              animate={{
                scale: currentPin.length === i ? [1, 1.2, 1] : 1,
              }}
              transition={{ duration: 0.15 }}
              className="w-4 h-4 rounded-full border-2 transition-all duration-200"
              style={{
                borderColor: i < currentPin.length ? 'var(--accent-violet)' : 'var(--border-strong)',
                background: i < currentPin.length ? 'var(--accent-violet)' : 'transparent',
                boxShadow: i < currentPin.length ? '0 0 8px rgba(124,106,247,0.4)' : 'none',
              }}
            />
          ))}
        </motion.div>

        {/* Hidden real input */}
        <input
          ref={inputRef}
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={PIN_LENGTH}
          value={currentPin}
          onChange={(e) => handlePinInput(e.target.value)}
          className="absolute opacity-0 w-0 h-0"
          disabled={isLoading}
          aria-label="PIN input"
        />

        {/* Number pad */}
        <div className="grid grid-cols-3 gap-3 w-full">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'].map((key, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (key === null) return
                if (key === 'del') {
                  const newPin = currentPin.slice(0, -1)
                  if (!isSetup || step === 'enter') setPin(newPin)
                  else setConfirmPin(newPin)
                } else {
                  handlePinInput(currentPin + String(key))
                }
              }}
              disabled={isLoading || key === null}
              className={`
                h-14 rounded-xl font-display font-semibold text-xl
                transition-all duration-150 select-none
                ${key === null
                  ? 'opacity-0 pointer-events-none'
                  : 'active:scale-95 active:bg-[var(--bg-overlay)]'
                }
              `}
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

        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-[var(--accent-violet)]"
                style={{ animation: `pulseSoft 1s ease-in-out ${i * 0.2}s infinite` }} />
            ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
