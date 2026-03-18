import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, X } from 'lucide-react'
import { useRegisterSW } from 'virtual:pwa-register/react'

export function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // Periodic check every hour
      r && setInterval(() => r.update(), 60 * 60 * 1000)
    },
  })

  const close = () => setNeedRefresh(false)

  return (
    <AnimatePresence>
      {needRefresh && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-[100] p-4 rounded-2xl border"
          style={{
            background: 'var(--bg-surface)',
            borderColor: 'rgba(124,106,247,0.3)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(124,106,247,0.1)',
          }}
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'rgba(124,106,247,0.15)' }}>
              <RefreshCw size={16} style={{ color: 'var(--accent-violet)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--text-primary)]">Update available</p>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">A new version of Life OS is ready.</p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => updateServiceWorker(true)}
                  className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors"
                  style={{ background: 'var(--accent-violet)' }}
                >
                  Update now
                </button>
                <button
                  onClick={close}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors"
                >
                  Later
                </button>
              </div>
            </div>
            <button onClick={close} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
