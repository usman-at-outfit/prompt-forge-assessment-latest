import { motion } from 'framer-motion'
import clsx from 'clsx'

export function Card({ children, className, ...props }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={clsx(
        'card-surface rounded-[var(--radius-lg)] p-4 transition duration-200 hover:border-[var(--border-hover)] hover:shadow-[var(--shadow-glow)] sm:p-5',
        className,
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
}
