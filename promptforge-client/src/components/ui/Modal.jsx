import { AnimatePresence, motion } from 'framer-motion'

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  className = '',
  hideHeader = false,
}) {
  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center bg-[rgba(34,29,22,0.32)] px-3 py-3 backdrop-blur-md sm:px-4 sm:py-6 md:items-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2 }}
            className={`card-surface max-h-[92vh] w-full max-w-4xl overflow-auto rounded-[24px] p-4 sm:rounded-[var(--radius-lg)] sm:p-6 ${className}`}
            onClick={(event) => event.stopPropagation()}
          >
            {!hideHeader ? (
              <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                <h3 className="display-font text-[clamp(1.6rem,7vw,2rem)] font-semibold">{title}</h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-11 rounded-full border border-transparent px-3 py-1.5 text-sm text-[var(--text-muted)] transition hover:border-[var(--border)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                >
                  Close
                </button>
              </div>
            ) : null}
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
