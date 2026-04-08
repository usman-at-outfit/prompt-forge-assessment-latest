import { motion } from 'framer-motion'

function tokenColor(tokens) {
  if (tokens > 2000) return 'border border-rose-200 bg-rose-50 text-rose-700'
  if (tokens >= 500) return 'border border-[var(--accent)]/15 bg-[var(--accent-muted)] text-[var(--accent)]'
  return 'border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)]'
}

export function TokenBadge({ tokens = 0 }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex rounded-full px-2 py-1 text-[11px] font-medium ${tokenColor(tokens)}`}
    >
      ~{tokens} tok
    </motion.span>
  )
}
