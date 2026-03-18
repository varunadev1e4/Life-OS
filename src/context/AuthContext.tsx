import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { settingsApi } from '@/lib/supabase'
import { hashPin, verifyPin } from '@/utils/helpers'
import { AUTH_SESSION_KEY, AUTH_TIMEOUT_MS } from '@/utils/constants'
import type { AppSettings } from '@/types'

interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  settings: AppSettings | null
  hasSetup: boolean
}

interface AuthContextValue extends AuthState {
  login: (pin: string) => Promise<boolean>
  logout: () => void
  setupPin: (pin: string) => Promise<void>
  changePin: (currentPin: string, newPin: string) => Promise<boolean>
}

const AuthContext = createContext<AuthContextValue | null>(null)

interface SessionData {
  authenticated: boolean
  timestamp: number
}

function getSession(): SessionData | null {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as SessionData
    if (Date.now() - data.timestamp > AUTH_TIMEOUT_MS) {
      localStorage.removeItem(AUTH_SESSION_KEY)
      return null
    }
    return data
  } catch {
    return null
  }
}

function setSession(authenticated: boolean) {
  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({ authenticated, timestamp: Date.now() }))
}

function clearSession() {
  localStorage.removeItem(AUTH_SESSION_KEY)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    settings: null,
    hasSetup: false,
  })

  // Check session and load settings on mount
  useEffect(() => {
    const init = async () => {
      try {
        const settings = await settingsApi.get()
        const session = getSession()
        setState({
          isAuthenticated: !!(session?.authenticated && settings),
          isLoading: false,
          settings,
          hasSetup: !!settings,
        })
      } catch (err) {
        console.error('Auth init error:', err)
        setState(s => ({ ...s, isLoading: false }))
      }
    }
    init()
  }, [])

  const login = useCallback(async (pin: string): Promise<boolean> => {
    const { settings } = state
    if (!settings) return false
    const valid = await verifyPin(pin, settings.pin_hash)
    if (valid) {
      setSession(true)
      setState(s => ({ ...s, isAuthenticated: true }))
    }
    return valid
  }, [state])

  const logout = useCallback(() => {
    clearSession()
    setState(s => ({ ...s, isAuthenticated: false }))
  }, [])

  const setupPin = useCallback(async (pin: string) => {
    const pinHash = await hashPin(pin)
    const settings = await settingsApi.create(pinHash)
    setSession(true)
    setState({ isAuthenticated: true, isLoading: false, settings, hasSetup: true })
  }, [])

  const changePin = useCallback(async (currentPin: string, newPin: string): Promise<boolean> => {
    const { settings } = state
    if (!settings) return false
    const valid = await verifyPin(currentPin, settings.pin_hash)
    if (!valid) return false
    const newHash = await hashPin(newPin)
    const updated = await settingsApi.updatePin(settings.id, newHash)
    setState(s => ({ ...s, settings: updated }))
    return true
  }, [state])

  return (
    <AuthContext.Provider value={{ ...state, login, logout, setupPin, changePin }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
