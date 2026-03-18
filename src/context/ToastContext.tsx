import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { Toast, ToastType } from '@/types'
import { generateId } from '@/utils/helpers'

interface ToastContextValue {
  toasts: Toast[]
  toast: (type: ToastType, title: string, message?: string, duration?: number) => void
  dismiss: (id: string) => void
  success: (title: string, message?: string) => void
  error: (title: string, message?: string) => void
  warning: (title: string, message?: string) => void
  info: (title: string, message?: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts(t => t.filter(toast => toast.id !== id))
  }, [])

  const toast = useCallback((type: ToastType, title: string, message?: string, duration = 3500) => {
    const id = generateId()
    const newToast: Toast = { id, type, title, message, duration }
    setToasts(t => [...t, newToast])
    setTimeout(() => dismiss(id), duration)
  }, [dismiss])

  const success = useCallback((title: string, message?: string) => toast('success', title, message), [toast])
  const error = useCallback((title: string, message?: string) => toast('error', title, message, 5000), [toast])
  const warning = useCallback((title: string, message?: string) => toast('warning', title, message), [toast])
  const info = useCallback((title: string, message?: string) => toast('info', title, message), [toast])

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss, success, error, warning, info }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
