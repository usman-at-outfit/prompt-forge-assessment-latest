import { Edit3, RefreshCw, Trash2 } from 'lucide-react'
import { TypewriterText } from '../ui/TypewriterText'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'

export function PromptCard({
  prompt,
  onRun,
  onEdit,
  onRegenerate,
  onDelete,
}) {
  if (!prompt) return null

  return (
    <Card className="space-y-5 border-[var(--border-strong)] bg-white p-5 shadow-[0_10px_28px_rgba(16,24,40,0.04)]">
      <div className="inline-flex rounded-full border border-[var(--border-strong)] bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
        Your AI Prompt
      </div>
      <div className="rounded-[20px] border border-black/8 bg-[#fcfaf7] p-5">
        <Badge variant="token" className="mb-4">
          ~{prompt.estimatedTokens} tokens
        </Badge>
        <TypewriterText text={prompt.promptText} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={onRun}>Run prompt</Button>
        <Button variant="secondary" onClick={onEdit}>
          <Edit3 className="h-4 w-4" />
          Edit
        </Button>
        <Button variant="secondary" onClick={onRegenerate}>
          <RefreshCw className="h-4 w-4" />
          Regenerate
        </Button>
        <Button variant="danger" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </div>
    </Card>
  )
}

