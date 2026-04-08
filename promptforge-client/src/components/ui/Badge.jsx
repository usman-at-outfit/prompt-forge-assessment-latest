import clsx from 'clsx'

const badgeVariants = {
  lab: 'border border-[var(--border-strong)] bg-[var(--accent-soft)] text-[var(--accent)]',
  category: 'border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)]',
  token: 'border border-[var(--accent)]/15 bg-[var(--accent-muted)] text-[var(--accent)]',
  status: 'border border-emerald-200 bg-emerald-50 text-emerald-700',
}

export function Badge({ children, variant = 'category', className }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
        badgeVariants[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
