import { useState, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Library, BookOpen, CheckSquare,
  Target, BarChart2, Settings, Menu, LogOut
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { QuickAddFAB } from '@/components/ui/QuickAddFAB'

const NAV = [
  { path: '/', label: 'Dashboard', Icon: LayoutDashboard },
  { path: '/library', label: 'Library', Icon: Library },
  { path: '/journal', label: 'Journal', Icon: BookOpen },
  { path: '/habits', label: 'Habits', Icon: CheckSquare },
  { path: '/goals', label: 'Goals', Icon: Target },
  { path: '/analytics', label: 'Analytics', Icon: BarChart2 },
  { path: '/settings', label: 'Settings', Icon: Settings },
]

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { logout } = useAuth()
  const location = useLocation()

  return (
    <div className="flex h-dvh overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-56 xl:w-60 shrink-0 border-r border-[var(--border)] bg-[var(--bg-surface)]">
        <SidebarContent onLogout={logout} onNav={() => {}} />
      </aside>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 35 }}
              className="fixed inset-y-0 left-0 z-50 w-64 border-r border-[var(--border)] bg-[var(--bg-surface)] lg:hidden"
            >
              <SidebarContent onLogout={logout} onNav={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center justify-between px-4 h-14 border-b border-[var(--border)] bg-[var(--bg-surface)] shrink-0">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors">
            <Menu size={20} />
          </button>
          <span className="font-display font-bold text-[var(--accent-violet)]">Life OS</span>
          <div className="w-9" />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
        <QuickAddFAB />
      </div>
    </div>
  )
}

function SidebarContent({ onLogout, onNav }: { onLogout: () => void; onNav: () => void }) {
  return (
    <div className="flex flex-col h-full pt-safe">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-[var(--border-subtle)]">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #7c6af7, #38bdf8)' }}>
          <span className="text-sm font-bold text-white">◎</span>
        </div>
        <span className="font-display font-bold text-[var(--text-primary)] tracking-tight">Life OS</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto no-scrollbar">
        {NAV.map(({ path, label, Icon }) => (
          <NavLink
            key={path}
            to={path}
            onClick={onNav}
            end={path === '/'}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
              transition-all duration-150 group
              ${isActive
                ? 'bg-[rgba(124,106,247,0.12)] text-[var(--accent-violet)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
              }
            `}
          >
            {({ isActive }) => (
              <>
                <Icon size={17} className={isActive ? 'text-[var(--accent-violet)]' : 'text-current opacity-70 group-hover:opacity-100'} />
                {label}
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--accent-violet)]"
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-[var(--border-subtle)] pb-safe">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--accent-rose)] hover:bg-[rgba(248,113,113,0.08)] transition-all w-full"
        >
          <LogOut size={17} className="opacity-70" />
          Lock App
        </button>
      </div>
    </div>
  )
}
