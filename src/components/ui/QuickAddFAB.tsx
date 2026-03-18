import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Library, BookOpen, Target, CheckSquare } from 'lucide-react'

const ACTIONS = [
  { label: 'Add to Library', icon: Library, color: '#7c6af7', path: '/library' },
  { label: 'Journal Entry', icon: BookOpen, color: '#34d399', path: '/journal' },
  { label: 'New Goal', icon: Target, color: '#f59e0b', path: '/goals' },
  { label: 'New Habit', icon: CheckSquare, color: '#38bdf8', path: '/habits' },
]

export function QuickAddFAB() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  // Only show on mobile nav-less pages
  const hide = ['/analytics', '/settings'].includes(location.pathname)
  if (hide) return null

  return (
    <div className="fixed bottom-6 right-4 z-30 lg:hidden">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="relative flex flex-col items-end gap-2">
        <AnimatePresence>
          {open && ACTIONS.map((action, i) => {
            const Icon = action.icon
            return (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, scale: 0.7, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.7, y: 20 }}
                transition={{ delay: (ACTIONS.length - 1 - i) * 0.05 }}
                onClick={() => { navigate(action.path); setOpen(false) }}
                className="flex items-center gap-3 px-4 py-2.5 rounded-full shadow-modal"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
              >
                <span className="text-sm font-medium text-[var(--text-primary)] whitespace-nowrap">{action.label}</span>
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: `${action.color}20` }}>
                  <Icon size={15} style={{ color: action.color }} />
                </div>
              </motion.button>
            )
          })}
        </AnimatePresence>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setOpen(!open)}
          className="w-14 h-14 rounded-full flex items-center justify-center shadow-glow relative z-10"
          style={{ background: 'var(--accent-violet)' }}
        >
          <motion.div animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.2 }}>
            <Plus size={24} className="text-white" />
          </motion.div>
        </motion.button>
      </div>
    </div>
  )
}
