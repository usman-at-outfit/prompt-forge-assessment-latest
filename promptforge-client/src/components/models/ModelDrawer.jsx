import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Copy, Star, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { modelService } from '../../services/modelService'
import { runChatAction } from '../../store/chatStore'
import { useModelStore } from '../../store/modelStore'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { toast } from '../ui/Toast'
import { buildModelDrawerContent, modelDrawerTabs } from './modelDrawerContent'

function DetailPanel({ title, children, className = '' }) {
  return (
    <section
      className={`rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] p-5 ${className}`}
    >
      <div className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
        {title}
      </div>
      {children}
    </section>
  )
}

function CopyButton({ onClick, label = 'Copy' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
    >
      <Copy className="h-3.5 w-3.5" />
      {label}
    </button>
  )
}

function BenchmarkRow({ label, value }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-[var(--text-secondary)]">{label}</span>
        <span className="font-medium">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-[var(--bg-muted)]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-hover)]"
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  )
}

function RatingBar({ label, value }) {
  return (
    <div className="grid grid-cols-[48px_1fr_48px] items-center gap-3 text-sm">
      <span className="text-[var(--text-secondary)]">{label}</span>
      <div className="h-2 rounded-full bg-[var(--bg-muted)]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-hover)]"
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-right text-[var(--text-secondary)]">{value}%</span>
    </div>
  )
}

export function ModelDrawer({
  isOpen,
  onClose,
  model,
  initialTab = 'overview',
  hideHeaderActions = false,
  agentCreationActions = null,
}) {
  const navigate = useNavigate()
  const selectModel = useModelStore((state) => state.actions.selectModel)
  const [resolvedModel, setResolvedModel] = useState(model)
  const [activeTab, setActiveTab] = useState(initialTab)

  useEffect(() => {
    if (!isOpen || !model?.modelId) return undefined

    let cancelled = false
    setResolvedModel(model)
    setActiveTab(initialTab)

    modelService
      .detail(model.modelId)
      .then((data) => {
        if (!cancelled && data?.modelId) {
          setResolvedModel(data)
        }
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [initialTab, isOpen, model])

  const drawerModel = resolvedModel ?? model
  const content = useMemo(
    () => (drawerModel ? buildModelDrawerContent(drawerModel) : null),
    [drawerModel],
  )

  if (!drawerModel || !content) return null

  async function copyText(value, label) {
    try {
      await navigator.clipboard.writeText(value)
      toast({
        title: `${label} copied`,
        message: 'The example has been copied to your clipboard.',
        type: 'success',
      })
    } catch {
      toast({
        title: 'Copy failed',
        message: 'Clipboard access was blocked. You can still copy it manually.',
        type: 'error',
      })
    }
  }

  async function openChatHub() {
    selectModel(drawerModel)
    await runChatAction('switchModel', drawerModel.modelId)
    onClose?.()
    navigate('/hub')
  }

  function openAgentBuilder() {
    selectModel(drawerModel)
    onClose?.()
    navigate('/agents', {
      state: {
        agentBuilder: {
          openBuilder: true,
          selectedModelId: drawerModel.modelId,
        },
      },
    })
  }

  function renderDrawerActions(actions) {
    return actions.map((action) => (
      <Button
        key={action.label}
        variant={action.variant ?? 'secondary'}
        onClick={action.onClick}
      >
        {action.label}
        {action.trailingIcon ? action.trailingIcon : null}
      </Button>
    ))
  }

  function renderOverview() {
    return (
      <div className="space-y-5">
        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <DetailPanel title="Description">
            <p className="text-base leading-7 text-[var(--text-secondary)]">
              {content.overview.description}
            </p>
          </DetailPanel>
          <DetailPanel title="Input / Output">
            <div className="space-y-3 text-sm text-[var(--text-secondary)]">
              <div>
                <span className="font-medium text-[var(--text-primary)]">Input:</span>{' '}
                {content.overview.inputTypes.join(', ')}
              </div>
              <div>
                <span className="font-medium text-[var(--text-primary)]">Output:</span>{' '}
                {content.overview.outputTypes.join(', ')}
              </div>
              <div>
                <span className="font-medium text-[var(--text-primary)]">Context:</span>{' '}
                {content.overview.contextWindow}
              </div>
              <div>
                <span className="font-medium text-[var(--text-primary)]">Max output:</span>{' '}
                {content.overview.maxOutput}
              </div>
              <div>
                <span className="font-medium text-[var(--text-primary)]">Latency:</span>{' '}
                {content.overview.latency}
              </div>
            </div>
          </DetailPanel>
        </div>

        <DetailPanel title="Use Cases">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {content.overview.useCases.map((entry) => {
              const Icon = entry.icon
              return (
                <div
                  key={entry.label}
                  className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-elevated)] p-4"
                >
                  <div className="mb-3 inline-flex rounded-2xl bg-[var(--accent-muted)] p-2 text-[var(--accent)]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="text-sm font-medium">{entry.label}</div>
                </div>
              )
            })}
          </div>
        </DetailPanel>

        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <DetailPanel title={content.overview.example.title}>
            <div className="space-y-4">
              <div>
                <div className="mb-2 text-sm font-semibold text-[var(--text-muted)]">User</div>
                <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[rgba(var(--accent-rgb),0.08)] px-4 py-3 text-sm text-[var(--text-secondary)]">
                  "{content.overview.example.userPrompt}"
                </div>
              </div>
              <div>
                <div className="mb-2 text-sm font-semibold text-[var(--text-muted)]">
                  {content.overview.example.outputLabel}
                </div>
                <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[rgba(69,134,224,0.08)] px-4 py-3 text-sm text-[var(--text-secondary)]">
                  <ul className="space-y-2">
                    {content.overview.example.outputLines.map((line) => (
                      <li key={line}>- {line}</li>
                    ))}
                  </ul>
                  <div className="mt-4 border-t border-[var(--border)] pt-4">
                    <div className="mb-2 text-sm font-medium text-[var(--text-primary)]">Follow-up questions</div>
                    <ol className="space-y-2 pl-4 text-sm">
                      {content.overview.example.followUp.map((line, index) => (
                        <li key={line}>
                          {index + 1}. {line}
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </DetailPanel>

          <DetailPanel title="Benchmark Scores">
            <div className="space-y-4">
              {content.overview.benchmarks.map(([label, value]) => (
                <BenchmarkRow key={label} label={label} value={value} />
              ))}
              <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
                <div className="mb-2 flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <Star className="h-4 w-4 fill-[var(--accent)] text-[var(--accent)]" />
                  Rating
                </div>
                <div className="text-3xl font-semibold">{drawerModel.rating.toFixed(1)}</div>
                <div className="mt-1 text-sm text-[var(--text-muted)]">
                  {content.meta.reviewCount} reviews
                </div>
              </div>
            </div>
          </DetailPanel>
        </div>
      </div>
    )
  }

  function renderHowToUse() {
    return (
      <div className="space-y-5">
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] p-5 sm:p-6">
          <h3 className="text-[1.75rem] font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
            {content.howToUse.title ?? 'How to Use This Model'}
          </h3>
          <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
            {content.howToUse.intro}
          </p>

          <div className="mt-6 space-y-6">
            {content.howToUse.steps.map((step, index) => (
              <div key={step.title} className="flex gap-4">
                <div className="flex-shrink-0 pt-0.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(var(--accent-rgb),0.28)] bg-[var(--accent-muted)] text-sm font-semibold text-[var(--accent)]">
                    {index + 1}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-lg font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
                    {step.title}
                  </div>
                  <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">
                    {step.description}
                  </p>

                  {step.code ? (
                    <div className="mt-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                          {step.codeTitle ?? 'Quick Start'}
                        </div>
                        <CopyButton
                          onClick={() => copyText(step.code, step.codeTitle ?? step.title)}
                        />
                      </div>
                      <pre className="overflow-x-auto text-sm leading-7 text-[var(--text-primary)]">
                        <code>{step.code}</code>
                      </pre>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <Button onClick={openChatHub}>
              {content.howToUse.playgroundLabel?.replace('->', '').trim() || 'Open Playground'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {content.howToUse.proTip ? (
            <div className="mt-6 rounded-[var(--radius-md)] border border-[rgba(87,179,145,0.28)] bg-[rgba(87,179,145,0.12)] px-4 py-4 text-sm leading-7 text-[#1e6c59]">
              <span className="font-semibold">Pro tip:</span>{' '}
              {content.howToUse.proTip.replace(/^Pro tip:\s*/i, '')}
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  function renderPricing() {
    return (
      <div className="space-y-5">
        <DetailPanel title="Pricing">
          <p className="text-sm leading-7 text-[var(--text-secondary)]">{content.pricing.headline}</p>
          <div className="mt-5 grid gap-4 xl:grid-cols-3">
            {content.pricing.plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-[var(--radius-lg)] border p-5 ${
                  plan.highlight
                    ? 'border-[var(--accent)] bg-[var(--accent-muted)]/40 shadow-[var(--shadow-glow)]'
                    : 'border-[var(--border)] bg-[var(--bg-elevated)]'
                }`}
              >
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  {plan.name}
                </div>
                <div className="mt-4 text-3xl font-semibold">{plan.price}</div>
                <div className="mt-1 text-sm text-[var(--text-secondary)]">{plan.sublabel}</div>
                <ul className="mt-5 space-y-2 text-sm text-[var(--text-secondary)]">
                  {plan.features.map((feature) => (
                    <li key={feature}>- {feature}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-elevated)] p-4 text-sm text-[var(--text-secondary)]">
            {drawerModel.isFree
              ? 'This model can be piloted at no API token cost, though hosting or infrastructure costs may still apply.'
              : 'Start with a narrow workflow first, then scale volume after you validate latency, quality, and monitoring.'}
          </div>
        </DetailPanel>
      </div>
    )
  }

  function renderPromptGuide() {
    return (
      <div className="space-y-5">
        <DetailPanel title={`Prompt Engineering for ${drawerModel.name}`}>
          <p className="text-sm leading-7 text-[var(--text-secondary)]">
            {content.promptGuide.intro}
          </p>
          <div className="mt-5 space-y-4">
            {content.promptGuide.principles.map((principle) => (
              <div
                key={principle.title}
                className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-elevated)] p-4"
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">{principle.title}</div>
                    <div className="mt-1 text-sm text-[var(--text-secondary)]">
                      {principle.description}
                    </div>
                  </div>
                  <CopyButton
                    onClick={() => copyText(principle.prompt, principle.title)}
                    label="Copy example"
                  />
                </div>
                <pre className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-elevated)] p-4 text-sm text-[var(--text-primary)]">
                  <code>{principle.prompt}</code>
                </pre>
              </div>
            ))}
          </div>
        </DetailPanel>

        <DetailPanel title="Pro Tips">
          <ul className="space-y-3 text-sm text-[var(--text-secondary)]">
            {content.promptGuide.tips.map((tip) => (
              <li key={tip}>- {tip}</li>
            ))}
          </ul>
        </DetailPanel>
      </div>
    )
  }

  function renderAgentCreation() {
    const defaultActions = [
      {
        label: 'Open Agent Builder',
        variant: 'primary',
        onClick: openAgentBuilder,
      },
      {
        label: 'Test in Chat Hub',
        variant: 'secondary',
        onClick: openChatHub,
      },
    ]
    const actions = agentCreationActions?.length ? agentCreationActions : defaultActions

    return (
      <div className="space-y-5">
        <DetailPanel title={`Create an Agent with ${drawerModel.name}`}>
          <p className="text-sm leading-7 text-[var(--text-secondary)]">
            {content.agentCreation.intro}
          </p>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {content.agentCreation.steps.map((step, index) => (
              <div
                key={step.title}
                className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-elevated)] p-4"
              >
                <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-muted)] text-sm font-semibold text-[var(--accent)]">
                  {index + 1}
                </div>
                <div className="font-medium">{step.title}</div>
                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            {renderDrawerActions(actions)}
          </div>
        </DetailPanel>
      </div>
    )
  }

  function renderReviews() {
    return (
      <div className="space-y-5">
        <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <DetailPanel title="Ratings Overview">
            <div className="flex items-end gap-3">
              <div className="text-4xl font-semibold">{drawerModel.rating.toFixed(1)}</div>
              <div className="pb-1 text-sm text-[var(--text-secondary)]">
                / 5 from {content.meta.reviewCount} reviews
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">
              {content.reviews.summary}
            </p>
            <div className="mt-5 space-y-3">
              <RatingBar label="5 star" value={content.reviews.breakdown.five} />
              <RatingBar label="4 star" value={content.reviews.breakdown.four} />
              <RatingBar label="3 star" value={content.reviews.breakdown.three} />
              <RatingBar label="1-2 star" value={content.reviews.breakdown.low} />
            </div>
          </DetailPanel>

          <DetailPanel title="Recent Reviews">
            <div className="space-y-4">
              {content.reviews.entries.map((review) => (
                <div
                  key={`${review.name}-${review.date}`}
                  className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-elevated)] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-medium">{review.name}</div>
                      <div className="text-sm text-[var(--text-secondary)]">{review.role}</div>
                    </div>
                    <div className="text-right text-sm text-[var(--text-secondary)]">
                      <div className="flex justify-end gap-1">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star
                            key={`${review.name}-${index}`}
                            className={`h-3.5 w-3.5 ${
                              index < review.rating
                                ? 'fill-[var(--accent)] text-[var(--accent)]'
                                : 'text-[rgba(96,88,75,0.28)]'
                            }`}
                          />
                        ))}
                      </div>
                      <div>{review.date}</div>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                    {review.body}
                  </p>
                </div>
              ))}
            </div>
          </DetailPanel>
        </div>
      </div>
    )
  }

  function renderActiveTab() {
    if (activeTab === 'how-to-use') return renderHowToUse()
    if (activeTab === 'pricing') return renderPricing()
    if (activeTab === 'prompt-guide') return renderPromptGuide()
    if (activeTab === 'agent-creation') return renderAgentCreation()
    if (activeTab === 'reviews') return renderReviews()
    return renderOverview()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} hideHeader className="max-w-6xl p-0">
      <div className="overflow-hidden">
        <div className="border-b border-[var(--border)] px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-muted)] text-lg font-semibold text-[var(--accent)]">
                {drawerModel.labIcon || drawerModel.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="display-font text-3xl font-semibold">{drawerModel.name}</h2>
                  <Badge variant="token">{content.status}</Badge>
                  {drawerModel.isLive ? <Badge variant="status">Live</Badge> : null}
                </div>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">{content.subtitle}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="lab">{drawerModel.lab}</Badge>
                  {drawerModel.category?.slice(0, 3).map((entry) => (
                    <Badge key={entry}>{entry}</Badge>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex w-full flex-wrap items-center justify-end gap-3 lg:w-auto">
              {!hideHeaderActions ? (
                <>
                  <Button className="w-full sm:w-auto" variant="secondary" onClick={openAgentBuilder}>
                    Build Agent
                  </Button>
                  <Button className="w-full sm:w-auto" onClick={openChatHub}>Use this model</Button>
                </>
              ) : null}
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {content.quickStats.map((entry) => (
              <div
                key={entry.label}
                className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3"
              >
                <div className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  {entry.label}
                </div>
                <div className="mt-2 text-lg font-medium">{entry.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-b border-[var(--border)] px-4 sm:px-6">
          <div className="flex gap-2 overflow-x-auto py-3">
            {modelDrawerTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm transition ${
                  activeTab === tab.id
                    ? 'bg-[var(--accent-muted)] text-[var(--accent-hover)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-5 p-4 sm:p-6">{renderActiveTab()}</div>
      </div>
    </Modal>
  )
}

