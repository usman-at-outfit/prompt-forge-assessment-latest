import { motion } from 'framer-motion'
import clsx from 'clsx'

const variants = {
  primary:
    'border border-[var(--accent)] bg-gradient-to-r from-[var(--accent)] to-[var(--accent-hover)] text-white shadow-[var(--shadow-glow)] hover:shadow-[0_20px_42px_rgba(var(--accent-rgb),0.22)]',
  secondary:
    'border border-[var(--border)] bg-[rgba(255,253,248,0.96)] text-[var(--text-primary)] shadow-[var(--shadow-soft)] hover:border-[var(--border-strong)] hover:bg-white',
  ghost:
    'border border-transparent bg-transparent text-[var(--text-secondary)] hover:border-[var(--border)] hover:bg-[rgba(255,253,248,0.88)] hover:text-[var(--text-primary)]',
  danger: 'bg-[#ef4444] text-white shadow-[0_0_24px_rgba(239,68,68,0.18)]',
}

const sizes = {
  default: 'min-h-11 px-4 py-2.5 text-sm',
  sm: 'min-h-9 px-3 py-2 text-sm',
}

export function Button({
  children,
  className,
  variant = 'primary',
  size = 'default',
  as: Component = 'button',
  ...props
}) {
  return (
    <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
      <Component
        className={clsx(
          'inline-flex min-w-0 items-center justify-center gap-2 rounded-[calc(var(--radius-md)-2px)] text-center font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-50',
          variants[variant],
          sizes[size] ?? sizes.default,
          className,
        )}
        {...props}
      >
        {children}
      </Component>
    </motion.div>
  )
}
