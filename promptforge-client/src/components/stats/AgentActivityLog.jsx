export function AgentActivityLog({ stats = [] }) {
  return (
    <div className="space-y-2">
      {stats.slice(0, 10).map((entry) => (
        <div
          key={entry.id}
          className="grid grid-cols-[1fr_auto] gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-card)] p-3 text-sm"
        >
          <div>
            <div className="font-medium text-[var(--text-primary)]">
              {entry.agentName} · {entry.actionType}
            </div>
            <div className="text-xs text-[var(--text-muted)]">
              {new Date(entry.timestamp).toLocaleString()}
            </div>
          </div>
          <div className="text-right text-[var(--text-secondary)]">
            <div>{entry.totalTokens} tok</div>
            <div>${Number(entry.estimatedCostUSD ?? 0).toFixed(4)}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
