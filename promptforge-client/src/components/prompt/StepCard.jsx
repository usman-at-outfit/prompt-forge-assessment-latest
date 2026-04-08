import { Card } from '../ui/Card'

export function StepCard({ title, description, children }) {
  return (
    <Card className="space-y-5">
      <div>
        <h3 className="display-font text-2xl font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">{description}</p>
      </div>
      {children}
    </Card>
  )
}
