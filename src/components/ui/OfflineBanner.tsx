import { AnimatePresence, motion } from 'framer-motion'
import { WifiOff, Wifi } from 'lucide-react'
import { useOffline } from '@/hooks'
import { useState, useEffect } from 'react'

export function OfflineBanner() {
  const isOffline = useOffline()
  const [showOnline, setShowOnline] = useState(false)

  useEffect(() => {
    if (!isOffline) {
      setShowOnline(true)
      const t = setTimeout(() => setShowOnline(false), 3000)
      return () => clearTimeout(t)
    }
  }, [isOffline])

  return (
    <AnimatePresence>
      {(isOffline || showOnline) && (
        <motion.div
          initial={{ y: -48 }}
          animate={{ y: 0 }}
          exit={{ y: -48 }}
          className="fixed top-0 left-0 right-0 z-[200] flex items-center justify-center gap-2 py-2 text-sm font-medium"
          style={{
            background: isOffline ? 'rgba(248,113,113,0.9)' : 'rgba(52,211,153,0.9)',
            backdropFilter: 'blur(8px)',
          }}
        >
          {isOffline ? (
            <><WifiOff size={14} /> You're offline — changes will sync when reconnected</>
          ) : (
            <><Wifi size={14} /> Back online</>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
