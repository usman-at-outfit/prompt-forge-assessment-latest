import { motion } from 'framer-motion'
import clsx from 'clsx'

export function Input({ label, error, className, ...props }) {
  return (
    <label className="flex flex-col gap-2 text-sm text-[var(--text-secondary)]">
      {label ? <span className="font-medium text-[var(--text-secondary)]">{label}</span> : null}
      <motion.input
        animate={error ? { x: [0, -6, 6, -6, 6, 0] } : { x: 0 }}
        transition={{ duration: 0.28 }}
        className={clsx(
          'field-surface min-h-11 rounded-[calc(var(--radius-md)-2px)] px-4 py-3 text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:bg-white focus:shadow-[0_0_0_4px_rgba(var(--accent-rgb),0.12)]',
          className,
        )}
        {...props}
      />
      {error ? <span className="text-sm text-rose-600">{error}</span> : null}
    </label>
  )
}
