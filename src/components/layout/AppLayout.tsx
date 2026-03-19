import { useState, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Library, BookOpen, CheckSquare,
  Target, BarChart2, Settings, LogOut, ChevronRight, StickyNote, Sun, Moon,
  Wallet, PartyPopper, Heart, Bookmark, ListTodo, ClipboardList, Brain,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { openCommandPalette } from '@/components/ui/CommandPalette'
import { QuickAddFAB } from '@/components/ui/QuickAddFAB'

const NAV = [
  { path: '/',          label: 'Dashboard', Icon: LayoutDashboard, color: '#7c6af7' },
  { path: '/library',   label: 'Library',   Icon: Library,         color: '#38bdf8' },
  { path: '/journal',   label: 'Journal',   Icon: BookOpen,        color: '#34d399' },
  { path: '/habits',    label: 'Habits',    Icon: CheckSquare,     color: '#f59e0b' },
  { path: '/goals',     label: 'Goals',     Icon: Target,          color: '#f87171' },
  { path: '/notes',     label: 'Notes',     Icon: StickyNote,      color: '#fbbf24' },
  { path: '/expenses',  label: 'Expenses',  Icon: Wallet,          color: '#34d399' },
  { path: '/occasions', label: 'Occasions', Icon: PartyPopper,     color: '#f472b6' },
  { path: '/health',    label: 'Health',    Icon: Heart,           color: '#f87171' },
  { path: '/bookmarks', label: 'Bookmarks', Icon: Bookmark,        color: '#38bdf8' },
  { path: '/tasks',     label: 'Tasks',     Icon: ListTodo,        color: '#34d399' },
  { path: '/review',    label: 'Review',    Icon: ClipboardList,   color: '#f472b6' },
  { path: '/insights',  label: 'Insights',  Icon: Brain,           color: '#a78bfa' },
  { path: '/analytics', label: 'Analytics', Icon: BarChart2,       color: '#60a5fa' },
  { path: '/settings',  label: 'Settings',  Icon: Settings,        color: '#a8a8c0' },
]

// Bottom nav shows 5 key pages on mobile
// Dashboard, Library, Journal, Tasks, Habits
const MOBILE_NAV = [NAV[0], NAV[1], NAV[2], NAV[4], NAV[12]]


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
        <nav className="flex-1 py-3 flex flex-col gap-0.5 px-2 overflow-y-auto no-scrollbar">
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
            <span className="text-sm font-bold text-white leading-none">◎</span>
            <span className="font-display font-bold text-[var(--text-primary)] tracking-tight">Life OS</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={openCommandPalette}
              className="p-2 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              title="Command Palette (⌘K)"
            >
              <span className="text-[11px] font-mono font-bold">⌘K</span>
            </button>
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

      {/* ── Mobile: bottom tab bar ───────────────────────────── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex border-t border-[var(--border)]"
        style={{ background: 'var(--bg-surface)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {MOBILE_NAV.map(({ path, label, Icon, color }) => {
          const isActive = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)
          return (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className="flex-1 flex flex-col items-center justify-center py-3 gap-1"
            >
              <div className="relative flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-200"
                style={{ background: isActive ? `${color}18` : 'transparent' }}>
                <Icon size={20} style={{ color: isActive ? color : 'var(--text-muted)' }} />
              </div>
              <span className="text-[9px] font-semibold tracking-wide"
                style={{ color: isActive ? color : 'var(--text-muted)' }}>
                {label}
              </span>
            </NavLink>
          )
        })}
        <MobileMoreMenu logout={logout} />
      </nav>

      <QuickAddFAB />
    </div>
  )
}

// ── Mobile "more" popover ──────────────────────────────────────
function MobileMoreMenu({ logout }: { logout: () => void }) {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const extraNav = NAV.slice(5)
  const isExtraActive = extraNav.some(n => location.pathname.startsWith(n.path))

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-3 gap-1 relative">
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-30"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className="absolute bottom-full right-0 mb-2 rounded-2xl border border-[var(--border)] p-1.5 min-w-[180px] z-40"
              style={{ background: 'var(--bg-surface)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
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
        className="flex flex-col items-center gap-1"
      >
        <div className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200"
          style={{ background: isExtraActive || open ? 'rgba(168,168,192,0.15)' : 'transparent' }}>
          <div className="flex gap-[3px]">
            {[0,1,2].map(i => (
              <div key={i} className="w-1 h-1 rounded-full"
                style={{ background: isExtraActive || open ? 'var(--text-primary)' : 'var(--text-muted)' }} />
            ))}
          </div>
        </div>
        <span className="text-[9px] font-semibold tracking-wide"
          style={{ color: isExtraActive || open ? 'var(--text-primary)' : 'var(--text-muted)' }}>
          More
        </span>
      </button>
    </div>
  )
}