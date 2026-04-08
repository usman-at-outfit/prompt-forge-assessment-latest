import { useMemo } from 'react'
import { useTokenStore } from '../../store/tokenStore'
import { Card } from '../ui/Card'
import { Modal } from '../ui/Modal'
import { AgentActivityLog } from './AgentActivityLog'

export function TokenStatsPanel({ isOpen, onClose, embedded = false }) {
  const stats = useTokenStore((state) => state.stats)
  const totalTokens = useTokenStore((state) => state.totalTokens)
  const totalCost = useTokenStore((state) => state.totalCost)
  const byAgent = useTokenStore((state) => state.byAgent)

  const rows = useMemo(
    () =>
      Object.entries(byAgent).sort(([, left], [, right]) => right.tokens - left.tokens),
    [byAgent],
  )

  const content = (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="text-sm uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Session Token Usage
          </div>
          <div className="mt-3 text-[clamp(2rem,8vw,2.5rem)] font-semibold">{totalTokens.toLocaleString()}</div>
          <div className="mt-2 text-sm text-[var(--text-secondary)]">
            Estimated cost: ${Number(totalCost ?? 0).toFixed(4)}
          </div>
        </Card>
        <Card>
          <div className="text-sm uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Per-Agent Breakdown
          </div>
          <div className="mt-4 space-y-3">
            {rows.map(([agentName, values]) => (
              <div key={agentName} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{agentName}</span>
                  <span className="text-[var(--text-secondary)]">{values.tokens} tok</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-muted)]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-hover)]"
                    style={{
                      width: `${Math.max(
                        8,
                        (values.tokens / Math.max(totalTokens, 1)) * 100,
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <div>
        <div className="mb-3 text-sm uppercase tracking-[0.2em] text-[var(--text-muted)]">
          Recent Activity
        </div>
        <AgentActivityLog stats={stats} />
      </div>
    </div>
  )

  if (embedded) return content

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Session Token Usage">
      {content}
    </Modal>
  )
}
