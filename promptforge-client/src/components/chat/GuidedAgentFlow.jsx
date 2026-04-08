import { Eye, Sparkles } from 'lucide-react'
import {
  agentAudienceIcons,
  agentAudienceOptions,
  getGuideRecommendations,
  getModelDeepDive,
} from '../../data/agentGuideData'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

function AssistantCard({ title, subtitle, children }) {
  return (
    <Card className="space-y-4">
      <div>
        {title ? (
          <div className="inline-flex rounded-full bg-[var(--accent-muted)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            {title}
          </div>
        ) : null}
        {subtitle ? <div className="mt-4 text-2xl font-semibold">{subtitle}</div> : null}
      </div>
      {children}
    </Card>
  )
}

function UserGuideBubble({ text }) {
  if (!text) return null

  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] rounded-[var(--radius-lg)] bg-[var(--accent)] px-5 py-4 text-sm font-medium text-white shadow-[var(--shadow-glow)]">
        {text}
      </div>
    </div>
  )
}

export function GuidedAgentFlow({
  flow,
  models,
  onAudienceSelect,
  onProceedModel,
  onQuestionSelect,
  onOpenDetails,
  onSelectVersion,
}) {
  if (flow?.mode !== 'agent-builder') return null

  const recommendations =
    flow.audience || flow.step !== 'audience'
      ? getGuideRecommendations({
          template: flow.template,
          models,
          audience: flow.audience,
        })
      : []

  const selectedModel =
    recommendations.find((entry) => entry.model.modelId === flow.selectedModelId)?.model ??
    models.find((entry) => entry.modelId === flow.selectedModelId) ??
    null

  const deepDive = selectedModel ? getModelDeepDive(selectedModel) : null
  const selectedQuestion =
    deepDive?.questions.find((entry) => entry.id === flow.selectedQuestionId) ?? null

  return (
    <div className="space-y-5">
      <UserGuideBubble text={flow.prompt} />

      <AssistantCard title="Who It's For" subtitle="Who will be using this AI?">
        <p className="text-sm text-[var(--text-secondary)]">This helps match the right tool style.</p>
        <div className="grid gap-3 md:grid-cols-2">
          {agentAudienceOptions.map((option) => {
            const Icon = agentAudienceIcons[option.id]

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onAudienceSelect(option.id)}
                className={`flex items-center gap-4 rounded-[var(--radius-md)] border px-4 py-4 text-left transition ${
                  flow.audience === option.id
                    ? 'active-glow border-[var(--accent)] bg-[var(--accent-muted)]/40'
                    : 'border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--accent)]'
                }`}
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--bg-elevated)] text-[var(--text-primary)]">
                  <Icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-medium">{option.label}</span>
                  <span className="block text-sm text-[var(--text-secondary)]">{option.description}</span>
                </span>
              </button>
            )
          })}
        </div>
        <div className="text-xs text-[var(--text-muted)]">PromptForge Hub - guided setup</div>
      </AssistantCard>

      {recommendations.length ? (
        <AssistantCard title="Recommended Models" subtitle="For building AI agents, these foundation models are the best:">
          <div className="space-y-3">
            {recommendations.map((entry) => (
              <div
                key={entry.model.modelId}
                className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[var(--accent-muted)] text-sm font-semibold text-[var(--accent)]">
                      {entry.model.labIcon || entry.model.name.charAt(0)}
                    </span>
                    <div>
                      <div className="font-medium">{entry.model.name}</div>
                      <div className="text-sm text-[var(--text-secondary)]">{entry.subtitle}</div>
                    </div>
                  </div>
                  <p className="mt-3 max-w-2xl text-sm text-[var(--text-secondary)]">{entry.reason}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="secondary" onClick={() => onOpenDetails(entry.model)}>
                    <Eye className="h-4 w-4" />
                    Details
                  </Button>
                  <Button onClick={() => onProceedModel(entry.model)}>Proceed</Button>
                </div>
              </div>
            ))}
          </div>
          <div className="text-xs text-[var(--text-muted)]">
            PromptForge Hub - {recommendations[0]?.model.name ?? 'Guide'}
          </div>
        </AssistantCard>
      ) : null}

      {selectedModel && deepDive ? (
        <>
          <UserGuideBubble text={`Proceed with ${selectedModel.name}`} />
          <AssistantCard title={`${selectedModel.name} Inspiration`} subtitle={deepDive.intro}>
            <div className="flex flex-wrap gap-3">
              {deepDive.questions.map((question) => (
                <button
                  key={question.id}
                  type="button"
                  onClick={() => onQuestionSelect(question.id)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    flow.selectedQuestionId === question.id
                      ? 'active-glow border-[var(--accent)] bg-[var(--accent-muted)]/40 text-[var(--text-primary)]'
                      : 'border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {question.label}
                </button>
              ))}
            </div>
            {selectedQuestion ? (
              <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
                <div className="mb-2 text-sm font-semibold">{selectedQuestion.label}</div>
                <p className="text-sm leading-7 text-[var(--text-secondary)]">{selectedQuestion.answer}</p>
              </div>
            ) : null}
          </AssistantCard>

          <AssistantCard subtitle="Ready to choose a version?">
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={() => onOpenDetails(selectedModel)}>
                View full details
              </Button>
              <Button onClick={() => onSelectVersion(selectedModel)}>Select a version</Button>
            </div>
            <div className="text-xs text-[var(--text-muted)]">
              PromptForge Hub - {selectedModel.name} overview
            </div>
          </AssistantCard>
        </>
      ) : null}

      {flow.step === 'deep-dive' && !selectedModel ? (
        <AssistantCard subtitle="Pick a model to continue">
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <Sparkles className="h-4 w-4 text-[var(--accent)]" />
            Select one of the recommended models above to continue the deep dive.
          </div>
        </AssistantCard>
      ) : null}
    </div>
  )
}
