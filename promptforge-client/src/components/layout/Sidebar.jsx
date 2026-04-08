import clsx from 'clsx'

export function Sidebar({ title, children, className = '' }) {
  return (
    <aside
      className={clsx(
        'card-surface h-fit rounded-[var(--radius-lg)] p-4',
        className,
      )}
    >
      {title ? (
        <div className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--text-muted)]">
          {title}
        </div>
      ) : null}
      {children}
    </aside>
  )
}
