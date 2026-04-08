import { motion } from 'framer-motion'

export function PageWrapper({ children, className = '' }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.26, ease: 'easeOut' }}
      className={`page-shell w-full max-w-full ${className}`}
    >
      {children}
    </motion.section>
  )
}
