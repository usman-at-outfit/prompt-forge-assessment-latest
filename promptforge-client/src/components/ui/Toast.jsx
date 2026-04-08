import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'

let emitter = null

export function toast(payload) {
  emitter?.(payload)
}

const borderByType = {
  success: 'border-emerald-400/50',
  error: 'border-rose-400/50',
  info: 'border-[var(--accent)]/50',
}

export function ToastViewport() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    emitter = (payload) => {
      const nextToast = {
        id: crypto.randomUUID(),
        type: payload.type ?? 'info',
        title: payload.title,
        message: payload.message,
      }
      setToasts((current) => [nextToast, ...current].slice(0, 4))
      window.setTimeout(() => {
        setToasts((current) => current.filter((entry) => entry.id !== nextToast.id))
      }, 4000)
    }

    return () => {
      emitter = null
    }
  }, [])

  return (
    <div className="pointer-events-none fixed right-4 top-20 z-[1200] flex w-full max-w-sm flex-col gap-3">
      <AnimatePresence>
        {toasts.map((entry) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className={`pointer-events-auto overflow-hidden rounded-[var(--radius-md)] border bg-[var(--bg-card)] p-4 shadow-[var(--shadow-card)] ${borderByType[entry.type]}`}
          >
            <div className="text-sm font-semibold">{entry.title}</div>
            <div className="mt-1 text-sm text-[var(--text-secondary)]">{entry.message}</div>
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-[var(--bg-muted)]">
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 4, ease: 'linear' }}
                className="h-full bg-[var(--accent)]"
              />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
