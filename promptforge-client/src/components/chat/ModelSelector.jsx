export function ModelSelector({ models = [], value, onChange }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)] shadow-[var(--shadow-card)] outline-none transition focus:border-[var(--accent)]"
    >
      {models.map((model) => (
        <option key={model.modelId} value={model.modelId}>
          {model.name}
        </option>
      ))}
    </select>
  )
}
