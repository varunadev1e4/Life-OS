import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type TextareaHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type KeyboardEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2 } from 'lucide-react'
import { cls } from '@/utils/helpers'

// ─── Button ─────────────────────────────────────────────────
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'secondary', size = 'md', isLoading, leftIcon, rightIcon, children, className, disabled, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-150 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none select-none'
    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2.5 text-sm',
      lg: 'px-5 py-3 text-base',
    }
    const variants = {
      primary: 'bg-[var(--accent-violet)] hover:bg-[#8f7ef9] text-white shadow-glow',
      secondary: 'bg-[var(--bg-elevated)] hover:bg-[var(--bg-overlay)] text-[var(--text-primary)] border border-[var(--border)]',
      ghost: 'hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
      danger: 'bg-[rgba(248,113,113,0.12)] hover:bg-[rgba(248,113,113,0.2)] text-[var(--accent-rose)] border border-[rgba(248,113,113,0.2)]',
      success: 'bg-[rgba(52,211,153,0.12)] hover:bg-[rgba(52,211,153,0.2)] text-[var(--accent-emerald)] border border-[rgba(52,211,153,0.2)]',
    }

    return (
      <button ref={ref} className={cls(base, sizes[size], variants[variant], className)} disabled={disabled || isLoading} {...props}>
        {isLoading ? <Loader2 size={14} className="animate-spin" /> : leftIcon}
        {children}
        {!isLoading && rightIcon}
      </button>
    )
  }
)
Button.displayName = 'Button'

// ─── Input ──────────────────────────────────────────────────
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  leftIcon?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, className, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">{label}</label>}
      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">{leftIcon}</span>
        )}
        <input
          ref={ref}
          className={cls(
            'w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)]',
            'focus:outline-none focus:border-[var(--accent-violet)] focus:ring-1 focus:ring-[var(--accent-violet)] transition-colors',
            error && 'border-[var(--accent-rose)] focus:border-[var(--accent-rose)] focus:ring-[var(--accent-rose)]',
            leftIcon ? 'pl-10' : undefined,
            className
          )}
          {...props}
        />
      </div>
      {error && <span className="text-xs text-[var(--accent-rose)]">{error}</span>}
    </div>
  )
)
Input.displayName = 'Input'

// ─── Textarea ───────────────────────────────────────────────
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">{label}</label>}
      <textarea
        ref={ref}
        className={cls(
          'w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] resize-none',
          'focus:outline-none focus:border-[var(--accent-violet)] focus:ring-1 focus:ring-[var(--accent-violet)] transition-colors',
          error && 'border-[var(--accent-rose)]',
          className
        )}
        {...props}
      />
      {error && <span className="text-xs text-[var(--accent-rose)]">{error}</span>}
    </div>
  )
)
Textarea.displayName = 'Textarea'

// ─── Select ─────────────────────────────────────────────────
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: { value: string; label: string }[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, className, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">{label}</label>}
      <select
        ref={ref}
        className={cls(
          'w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)]',
          'focus:outline-none focus:border-[var(--accent-violet)] focus:ring-1 focus:ring-[var(--accent-violet)] transition-colors',
          'appearance-none cursor-pointer',
          className
        )}
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'%3E%3Cpath stroke='%23606078' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px' }}
        {...props}
      >
        {options.map(o => <option key={o.value} value={o.value} style={{ background: '#1a1a22' }}>{o.label}</option>)}
      </select>
    </div>
  )
)
Select.displayName = 'Select'

// ─── Modal ──────────────────────────────────────────────────
interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className={cls(
              'relative w-full rounded-t-2xl sm:rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] overflow-hidden',
              'max-h-[90dvh] flex flex-col',
              sizes[size]
            )}
            style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.7)' }}
          >
            {/* Drag handle for mobile */}
            <div className="sm:hidden mx-auto mt-3 w-10 h-1 rounded-full bg-[var(--border-strong)]" />

            {title && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] shrink-0">
                <h2 className="font-display font-semibold text-[var(--text-primary)]">{title}</h2>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                  <X size={16} />
                </button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

// ─── Badge ──────────────────────────────────────────────────
interface BadgeProps {
  children: ReactNode
  color?: string
  bg?: string
  className?: string
}

export function Badge({ children, color, bg, className }: BadgeProps) {
  return (
    <span
      className={cls('badge', className)}
      style={{ color: color || 'var(--text-secondary)', background: bg || 'var(--bg-overlay)' }}
    >
      {children}
    </span>
  )
}

// ─── Slider ─────────────────────────────────────────────────
interface SliderProps {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  label?: string
  color?: string
}

export function Slider({ value, onChange, min = 1, max = 10, label, color = 'var(--accent-violet)' }: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <div className="flex justify-between items-center">
          <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">{label}</span>
          <span className="text-sm font-bold font-mono" style={{ color }}>{value}</span>
        </div>
      )}
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{ background: `linear-gradient(to right, ${color} ${pct}%, var(--bg-overlay) ${pct}%)` }}
        />
      </div>
    </div>
  )
}

// ─── Empty State ─────────────────────────────────────────────
interface EmptyStateProps {
  icon: string
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="font-display font-semibold text-[var(--text-primary)] mb-2">{title}</h3>
      {description && <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-xs">{description}</p>}
      {action}
    </motion.div>
  )
}

// ─── Skeleton ───────────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return <div className={cls('skeleton rounded-xl', className)} />
}

// ─── Progress Bar ────────────────────────────────────────────
interface ProgressBarProps {
  value: number
  max?: number
  color?: string
  className?: string
  showLabel?: boolean
}

export function ProgressBar({ value, max = 100, color = 'var(--accent-violet)', className, showLabel }: ProgressBarProps) {
  const pct = Math.min(Math.round((value / max) * 100), 100)
  return (
    <div className={cls('flex items-center gap-3', className)}>
      <div className="progress-bar flex-1">
        <div className="progress-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      {showLabel && <span className="text-xs font-mono text-[var(--text-secondary)] w-8 text-right">{pct}%</span>}
    </div>
  )
}

// ─── Star Rating ─────────────────────────────────────────────
interface StarRatingProps {
  value: number | null
  onChange?: (v: number) => void
  max?: number
  size?: number
  readonly?: boolean
}

export function StarRating({ value, onChange, max = 10, size = 16, readonly }: StarRatingProps) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <button
          key={i}
          onClick={() => !readonly && onChange?.(i + 1)}
          className={cls('transition-colors', readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110 active:scale-95')}
          style={{ fontSize: size }}
        >
          <span className={i < (value ?? 0) ? 'star-filled' : 'star-empty'}>★</span>
        </button>
      ))}
    </div>
  )
}

// ─── Confirm Dialog ──────────────────────────────────────────
interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  isLoading?: boolean
}

export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Delete', isLoading }: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="p-6 flex flex-col gap-4">
        <div>
          <h3 className="font-display font-semibold text-[var(--text-primary)] mb-1">{title}</h3>
          <p className="text-sm text-[var(--text-secondary)]">{message}</p>
        </div>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm} isLoading={isLoading}>{confirmLabel}</Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Tag Input ──────────────────────────────────────────────
interface TagInputProps {
  tags: string[]
  onChange: (tags: string[]) => void
  label?: string
  placeholder?: string
}

export function TagInput({ tags, onChange, label, placeholder = 'Add tag...' }: TagInputProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const value = (e.target as HTMLInputElement).value.trim().toLowerCase()
      if (value && !tags.includes(value)) {
        onChange([...tags, value])
        ;(e.target as HTMLInputElement).value = ''
      }
    } else if (e.key === 'Backspace' && !(e.target as HTMLInputElement).value) {
      onChange(tags.slice(0, -1))
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">{label}</label>}
      <div className="min-h-[44px] flex flex-wrap gap-1.5 items-center bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-3 py-2 focus-within:border-[var(--accent-violet)] focus-within:ring-1 focus-within:ring-[var(--accent-violet)] transition-colors">
        {tags.map(tag => (
          <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium"
            style={{ background: 'rgba(124,106,247,0.15)', color: 'var(--accent-violet)' }}>
            {tag}
            <button type="button" onClick={() => onChange(tags.filter(t => t !== tag))} className="hover:text-white transition-colors ml-0.5">×</button>
          </span>
        ))}
        <input
          type="text"
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[80px] bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none"
        />
      </div>
      <p className="text-xs text-[var(--text-muted)]">Press Enter or comma to add</p>
    </div>
  )
}