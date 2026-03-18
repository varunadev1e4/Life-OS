import { useState, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Library, BookOpen, CheckSquare,
  Target, BarChart2, Settings, LogOut, ChevronRight, StickyNote, Sun, Moon,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { QuickAddFAB } from '@/components/ui/QuickAddFAB'

const NAV = [
  { path: '/',          label: 'Dashboard', Icon: LayoutDashboard, color: '#7c6af7' },
  { path: '/library',   label: 'Library',   Icon: Library,         color: '#38bdf8' },
  { path: '/journal',   label: 'Journal',   Icon: BookOpen,        color: '#34d399' },
  { path: '/habits',    label: 'Habits',    Icon: CheckSquare,     color: '#f59e0b' },
  { path: '/goals',     label: 'Goals',     Icon: Target,          color: '#f87171' },
  { path: '/notes',     label: 'Notes',     Icon: StickyNote,      color: '#fbbf24' },
  { path: '/analytics', label: 'Analytics', Icon: BarChart2,       color: '#a78bfa' },
  { path: '/settings',  label: 'Settings',  Icon: Settings,        color: '#a8a8c0' },
]

// Bottom nav shows 5 key pages on mobile
const MOBILE_NAV = [NAV[0], NAV[1], NAV[2], NAV[4], NAV[5]] // Dashboard, Library, Journal, Goals, Notes


function ThemeToggleButton() {
  const { resolvedTheme, setTheme } = useTheme()
  return (
    <button
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
      title="Toggle theme"
    >
      {resolvedTheme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  )
}

interface AppLayoutProps { children: ReactNode }

export function AppLayout({ children }: AppLayoutProps) {
  const [expanded, setExpanded] = useState(false)
  const { logout } = useAuth()
  const location = useLocation()

  const activeNav = NAV.find(n => n.path === '/'
    ? location.pathname === '/'
    : location.pathname.startsWith(n.path)
  )

  return (
    <div className="flex h-dvh overflow-hidden bg-[var(--bg-base)]">

      {/* ── Desktop: slim icon sidebar ─────────────────────────── */}
      <motion.aside
        animate={{ width: expanded ? 200 : 64 }}
        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        className="hidden lg:flex flex-col shrink-0 border-r border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden relative z-20"
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        {/* Logo */}
        <div className="flex items-center h-14 px-4 border-b border-[var(--border-subtle)] shrink-0 overflow-hidden">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #7c6af7, #38bdf8)' }}
          >
            <span className="text-sm font-bold text-white leading-none">◎</span>
          </div>
          <AnimatePresence>
            {expanded && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                className="ml-3 font-display font-bold text-[var(--text-primary)] whitespace-nowrap tracking-tight"
              >
                Life OS
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-3 flex flex-col gap-0.5 px-2 overflow-hidden">
          {NAV.map(({ path, label, Icon, color }) => {
            const isActive = path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(path)
            return (
              <NavLink
                key={path}
                to={path}
                end={path === '/'}
                className="relative flex items-center h-10 rounded-xl overflow-hidden transition-all duration-150 group"
                style={{
                  background: isActive ? `${color}18` : 'transparent',
                }}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <motion.div
                    layoutId="desktop-active-bar"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                    style={{ background: color }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <div
                  className="w-10 h-10 flex items-center justify-center shrink-0"
                >
                  <Icon
                    size={18}
                    style={{ color: isActive ? color : 'var(--text-muted)' }}
                    className="group-hover:text-[var(--text-primary)] transition-colors"
                  />
                </div>
                <AnimatePresence>
                  {expanded && (
                    <motion.span
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -6 }}
                      transition={{ duration: 0.12 }}
                      className="text-sm font-medium whitespace-nowrap"
                      style={{ color: isActive ? color : 'var(--text-secondary)' }}
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </NavLink>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="px-2 pb-4 shrink-0">
          <button
            onClick={logout}
            className="relative flex items-center h-10 w-full rounded-xl overflow-hidden hover:bg-[rgba(248,113,113,0.08)] transition-colors group"
          >
            <div className="w-10 h-10 flex items-center justify-center shrink-0">
              <LogOut size={17} className="text-[var(--text-muted)] group-hover:text-[var(--accent-rose)] transition-colors" />
            </div>
            <AnimatePresence>
              {expanded && (
                <motion.span
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.12 }}
                  className="text-sm font-medium text-[var(--text-secondary)] group-hover:text-[var(--accent-rose)] transition-colors whitespace-nowrap"
                >
                  Lock App
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>

      {/* ── Main content ───────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center justify-between px-4 h-14 border-b border-[var(--border)] bg-[var(--bg-surface)] shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #7c6af7, #38bdf8)' }}
            >
              <span className="text-xs font-bold text-white">◎</span>
            </div>
            <span className="font-display font-bold text-[var(--text-primary)] tracking-tight">Life OS</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggleButton />
            <span className="text-xs font-medium text-[var(--text-secondary)] px-2.5 py-1 rounded-lg bg-[var(--bg-elevated)]">
              {activeNav?.label ?? 'Home'}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto pb-24 lg:pb-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* ── Mobile: floating bottom pill nav ──────────────────── */}
      <div className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-40">
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30, delay: 0.1 }}
          className="flex items-center gap-1 px-2 py-2 rounded-2xl border border-[var(--border)]"
          style={{
            background: 'rgba(19,19,24,0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)',
          }}
        >
          {MOBILE_NAV.map(({ path, label, Icon, color }) => {
            const isActive = path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(path)
            return (
              <NavLink
                key={path}
                to={path}
                end={path === '/'}
                className="relative flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-150"
                style={{ background: isActive ? `${color}20` : 'transparent' }}
              >
                {isActive && (
                  <motion.div
                    layoutId="mobile-pill"
                    className="absolute inset-0 rounded-xl"
                    style={{ background: `${color}18`, border: `1px solid ${color}30` }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon
                  size={20}
                  className="relative z-10 transition-all duration-150"
                  style={{ color: isActive ? color : 'var(--text-muted)' }}
                />
                <span
                  className="relative z-10 text-[9px] font-semibold mt-0.5 transition-colors duration-150 tracking-wide"
                  style={{ color: isActive ? color : 'var(--text-muted)' }}
                >
                  {label}
                </span>
              </NavLink>
            )
          })}

          {/* More button → Settings & Analytics */}
          <MobileMoreMenu logout={logout} />
        </motion.div>
      </div>

      <QuickAddFAB />
    </div>
  )
}

// ── Mobile "more" popover ──────────────────────────────────────
function MobileMoreMenu({ logout }: { logout: () => void }) {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const extraNav = NAV.slice(5) // Analytics + Settings

  const isExtraActive = extraNav.some(n => location.pathname.startsWith(n.path))

  return (
    <div className="relative">
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-30"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 8 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className="absolute bottom-full right-0 mb-3 rounded-2xl border border-[var(--border)] p-1.5 min-w-[160px] z-40"
              style={{
                background: 'rgba(19,19,24,0.95)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              }}
            >
              {extraNav.map(({ path, label, Icon, color }) => (
                <NavLink
                  key={path}
                  to={path}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--bg-elevated)] transition-colors"
                >
                  <Icon size={16} style={{ color }} />
                  <span className="text-sm font-medium text-[var(--text-primary)]">{label}</span>
                </NavLink>
              ))}
              <div className="h-px bg-[var(--border-subtle)] my-1" />
              <button
                onClick={() => { setOpen(false); logout() }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[rgba(248,113,113,0.08)] transition-colors"
              >
                <LogOut size={16} className="text-[var(--accent-rose)]" />
                <span className="text-sm font-medium text-[var(--accent-rose)]">Lock App</span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen(!open)}
        className="relative flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all"
        style={{ background: isExtraActive || open ? 'rgba(168,168,192,0.12)' : 'transparent' }}
      >
        <div className="flex gap-0.5">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              animate={{ scale: open ? [1, 1.3, 1] : 1 }}
              transition={{ delay: i * 0.05 }}
              className="w-1 h-1 rounded-full"
              style={{ background: isExtraActive || open ? 'var(--text-primary)' : 'var(--text-muted)' }}
            />
          ))}
        </div>
        <span
          className="text-[9px] font-semibold mt-1.5 tracking-wide"
          style={{ color: isExtraActive || open ? 'var(--text-primary)' : 'var(--text-muted)' }}
        >
          More
        </span>
      </button>
    </div>
  )
}