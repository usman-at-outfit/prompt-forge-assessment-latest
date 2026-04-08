import clsx from 'clsx'
import { TokenBadge } from './TokenBadge'

export function MessageBubble({ message }) {
  return (
    <div
      className={clsx('flex', {
        'justify-end': message.role === 'user',
        'justify-center': message.role === 'system',
        'justify-start': message.role === 'assistant',
      })}
    >
      <div
        className={clsx('max-w-full rounded-[var(--radius-lg)] p-4 text-sm shadow-[var(--shadow-card)] sm:max-w-[85%]', {
          'bg-gradient-to-r from-[var(--accent)] to-[var(--accent-hover)] text-white': message.role === 'user',
          'card-surface': message.role === 'assistant',
          'border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)]': message.role === 'system',
        })}
      >
        <div className="whitespace-pre-wrap break-words leading-7">{message.content}</div>
        <div className="mt-3 flex justify-end">
          <TokenBadge tokens={message.tokens} />
        </div>
      </div>
    </div>
  )
}
