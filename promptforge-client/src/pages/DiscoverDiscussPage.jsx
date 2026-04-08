import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Building2,
  ChevronLeft,
  CircleDollarSign,
  Eye,
  Gift,
  Sparkles,
  Zap,
} from 'lucide-react'
import { ModelDrawer } from '../components/models/ModelDrawer'
import { PageWrapper } from '../components/layout/PageWrapper'
import { Button } from '../components/ui/Button'
import { toast } from '../components/ui/Toast'
import { fallbackModels } from '../data/fallbackData'
import { discoverService } from '../services/discoverService'
import { modelService } from '../services/modelService'

const budgetTiers = [
  {
    id: 'free',
    label: 'Free only',
    subtitle: 'No credit card',
    Icon: Gift,
    tone: 'bg-[#eef8ee] text-[#328052]',
  },
  {
    id: 'paygo',
    label: 'Pay as I go',
    subtitle: 'Small monthly costs OK',
    Icon: CircleDollarSign,
    tone: 'bg-[#f8f3e4] text-[#a07a15]',
  },
  {
    id: 'fixed',
    label: 'Fixed plan',
    subtitle: 'Predictable monthly bill',
    Icon: Zap,
    tone: 'bg-[#fff0ea] text-[#d17841]',
  },
  {
    id: 'enterprise',
    label: 'Enterprise',
    subtitle: 'Scale, SLAs, support',
    Icon: Building2,
    tone: 'bg-[#f5eafb] text-[#8652a8]',
  },
]

const questionSets = {
  'gpt-5': [
    {
      id: 'best-at',
      label: 'What is GPT-5 best at?',
      answer:
        'GPT-5 is strongest when you need reliable agent-style execution, long-context reasoning, structured plans, and high-precision professional tasks.',
    },
    {
      id: 'latency',
      label: 'How fast is it and what affects latency?',
      answer:
        'Latency is usually strong for its capability tier, but longer prompts, tool-heavy flows, and large outputs will slow it down.',
    },
    {
      id: 'cost',
      label: 'What does it cost at small vs large scale?',
      answer:
        'It is a premium frontier model, so it fits best when quality matters enough to replace retries or weaker fallback chains.',
    },
    {
      id: 'tools',
      label: 'Does it support function/tool calling?',
      answer:
        'Yes. It performs well in tool-using workflows and is a strong fit for assistants that need to recover from failures and continue with structured reasoning.',
    },
    {
      id: 'formats',
      label: 'What input/output formats work best?',
      answer:
        'Text with clear structure works best. Use headings, numbered steps, schema hints, and explicit evaluation criteria for predictable results.',
    },
    {
      id: 'compare',
      label: 'How does GPT-5 compare to alternatives?',
      answer:
        'Compared with value-oriented models, GPT-5 trades higher cost for stronger execution quality, better long-context planning, and more reliable agentic behavior.',
    },
  ],
}

function formatContext(value) {
  if (!value) return '--'
  if (value >= 1000000) return `${(value / 1000000).toFixed(2).replace(/\.00$/, '')}M`
  return `${Math.round(value / 1000)}K`
}

function formatPrice(model) {
  if (!model) return '--'
  if (model.isFree) return 'Free'
  return `$${Number(model.inputPricePer1M ?? 0).toFixed(2)}/$${Number(model.outputPricePer1M ?? 0).toFixed(2)}/1M`
}

function matchesBudget(model, budgetId) {
  if (!budgetId) return true
  if (budgetId === 'free') return model.isFree
  if (budgetId === 'paygo') return !model.isFree && Number(model.inputPricePer1M ?? 0) <= 1
  if (budgetId === 'fixed') {
    const price = Number(model.inputPricePer1M ?? 0)
    return !model.isFree && price > 1 && price <= 5
  }
  if (budgetId === 'enterprise') return !model.isFree && Number(model.inputPricePer1M ?? 0) > 5
  return true
}

function buildVersionsForModel(model) {
  if (!model) return []

  const presets = {
    'gpt-5': [
      {
        id: 'gpt-5-flagship',
        name: 'GPT-5',
        subtitle: 'Flagship agent use',
        context: '1.05M context',
        pricing: '$7.50/$22.50/1M',
        badge: 'Most Popular',
      },
      {
        id: 'gpt-5-value',
        name: 'GPT-4.1 Mini',
        subtitle: 'Fast and affordable companion',
        context: '1M context',
        pricing: '$0.40/$1.60/1M',
        badge: 'Best Value',
      },
    ],
    'claude-opus-4': [
      {
        id: 'claude-opus-4-main',
        name: 'Claude Opus 4',
        subtitle: 'Maximum capability',
        context: '200K context',
        pricing: '$15/$75/1M',
        badge: 'Most Capable',
      },
      {
        id: 'claude-sonnet-4-main',
        name: 'Claude Sonnet 4',
        subtitle: 'Balanced performance',
        context: '200K context',
        pricing: '$3/$15/1M',
        badge: 'Best Value',
      },
    ],
    'gemini-2.5-pro': [
      {
        id: 'gemini-2.5-pro-main',
        name: 'Gemini 2.5 Pro',
        subtitle: 'Deep analysis with long context',
        context: '1M context',
        pricing: '$3.50/$10.50/1M',
        badge: 'Most Powerful',
      },
      {
        id: 'gemini-2.0-flash-main',
        name: 'Gemini 2.0 Flash',
        subtitle: 'Fast and efficient sibling',
        context: '1M context',
        pricing: '$0.70/$2.10/1M',
        badge: 'Best Value',
      },
    ],
  }

  return (
    presets[model.modelId] ?? [
      {
        id: `${model.modelId}-default`,
        name: model.name,
        subtitle: model.description,
        context: `${formatContext(model.contextWindow)} context`,
        pricing: formatPrice(model),
        badge: model.isFree ? 'Open Friendly' : 'Recommended',
      },
    ]
  )
}

function AssistantBubble({ children }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--accent-soft)] text-[var(--accent)]">
        <Sparkles className="h-4 w-4" />
      </div>
      <div className="max-w-full rounded-[18px] rounded-tl-[8px] border border-black/10 bg-white px-4 py-4 text-[15px] leading-7 text-[#17110d] sm:max-w-[680px]">
        {children}
      </div>
    </div>
  )
}

function UserBubble({ children }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[88%] rounded-[16px] bg-[var(--accent)] px-4 py-3 text-sm font-medium text-white shadow-[0_12px_24px_rgba(var(--accent-rgb),0.18)]">
        {children}
      </div>
    </div>
  )
}

export function DiscoverDiscussPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const endRef = useRef(null)

  const [feedItem, setFeedItem] = useState(location.state?.feedItem ?? null)
  const [selectedBudget, setSelectedBudget] = useState(null)
  const [selectedModel, setSelectedModel] = useState(null)
  const [selectedQuestionId, setSelectedQuestionId] = useState(null)
  const [showVersionPicker, setShowVersionPicker] = useState(false)
  const [selectedVersionId, setSelectedVersionId] = useState(null)
  const [confirmedVersionId, setConfirmedVersionId] = useState(null)
  const [drawerModel, setDrawerModel] = useState(null)

  useEffect(() => {
    document.title = 'Discuss Discover Insight - PromptForge'
  }, [])

  useEffect(() => {
    if (feedItem) return

    const id = searchParams.get('id')
    if (!id) return

    let cancelled = false

    discoverService.detail(id).then((item) => {
      if (!cancelled && item) {
        setFeedItem(item)
      }
    })

    return () => {
      cancelled = true
    }
  }, [feedItem, searchParams])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [
    selectedBudget,
    selectedModel,
    selectedQuestionId,
    showVersionPicker,
    selectedVersionId,
    confirmedVersionId,
  ])

  const relatedModels = useMemo(() => {
    if (!feedItem) return []

    return (feedItem.relatedModelIds ?? [])
      .map((modelId) => fallbackModels.find((model) => model.modelId === modelId))
      .filter(Boolean)
  }, [feedItem])

  const candidateModels = useMemo(() => {
    const scoped = relatedModels.length ? relatedModels : fallbackModels.slice(0, 6)
    const filtered = selectedBudget
      ? scoped.filter((model) => matchesBudget(model, selectedBudget))
      : scoped
    return (filtered.length ? filtered : scoped).slice(0, 3)
  }, [relatedModels, selectedBudget])

  const versionOptions = useMemo(() => buildVersionsForModel(selectedModel), [selectedModel])
  const selectedVersion = versionOptions.find((entry) => entry.id === selectedVersionId) ?? null
  const confirmedVersion =
    versionOptions.find((entry) => entry.id === confirmedVersionId) ?? selectedVersion ?? versionOptions[0] ?? null
  const questions = questionSets[selectedModel?.modelId] ?? questionSets['gpt-5']
  const selectedQuestion = questions.find((entry) => entry.id === selectedQuestionId) ?? null

  async function openModelDetails(model) {
    const fallbackModel = model ?? null

    try {
      const detailedModel = await modelService.detail(model.modelId)
      setDrawerModel(detailedModel ?? fallbackModel)
    } catch {
      setDrawerModel(fallbackModel)
    }
  }

  function handleProceed(model) {
    setSelectedModel(model)
    setSelectedQuestionId(null)
    setShowVersionPicker(false)
    setSelectedVersionId(null)
    setConfirmedVersionId(null)
  }

  function handleCreateAgent() {
    if (!selectedModel) return

    navigate('/agents', {
      state: {
        agentBuilder: {
          openBuilder: true,
          selectedModelId: selectedModel.modelId,
          seedPrompt: `Create an agent inspired by this research insight: ${feedItem?.title ?? 'Discover insight'}${
            confirmedVersion ? `\nPreferred version: ${confirmedVersion.name}` : ''
          }`,
        },
      },
    })
  }

  if (!feedItem) {
    return (
      <PageWrapper className="mx-auto max-w-[1700px] px-4 py-4 lg:px-8 lg:py-6">
        <div className="rounded-[24px] border border-black/8 bg-white px-6 py-8 text-sm text-[#7b6b58]">
          We could not find that discover item. Go back to the feed and choose another insight.
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper className="mx-auto max-w-[1700px] px-4 py-4 lg:px-8 lg:py-6">
      <div className="flex min-h-[720px] overflow-hidden rounded-[26px] border border-black/8 bg-white shadow-[0_12px_30px_rgba(36,30,21,0.05)] lg:h-[calc(100vh-145px)]">
        <aside className="hidden w-[230px] shrink-0 border-r border-black/8 bg-[#fbf7f1] lg:flex lg:flex-col">
          <div className="border-b border-black/8 px-4 py-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#a99783]">
              Models
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-2 py-2">
            {fallbackModels.slice(0, 18).map((model) => {
              const isSelected = selectedModel?.modelId === model.modelId
              const isRelated = relatedModels.some((entry) => entry.modelId === model.modelId)

              return (
                <button
                  key={model.modelId}
                  type="button"
                  onClick={() => openModelDetails(model)}
                  className={`flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-left transition ${
                    isSelected ? 'bg-[var(--accent-soft)]' : 'hover:bg-white'
                  }`}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#f2e8dc] text-xs font-semibold text-[#8a6a4f]">
                    {model.labIcon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-[#17110d]">{model.name}</div>
                    <div className="text-xs text-[#a08d79]">{model.lab}</div>
                  </div>
                  {isRelated ? <span className="h-2 w-2 rounded-full bg-[var(--accent)]" /> : null}
                </button>
              )
            })}
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#f7f2ea]">
          <div className="border-b border-black/8 bg-white px-5 py-4 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/discover')}
                  className="inline-flex items-center gap-1 text-sm text-[#7e6e5b] transition hover:text-[#17110d]"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>
                <div className="min-w-0 truncate text-sm font-medium text-[#17110d]">{feedItem.title}</div>
              </div>
              {selectedModel ? (
                <div className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white">
                  {confirmedVersion ? `Selected: ${confirmedVersion.name}` : `Proceed with ${selectedModel.name}`}
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-6">
            <div className="space-y-5">
              <AssistantBubble>
                I found the research insight on <strong>{feedItem.title}</strong>. Let&apos;s figure out which model fits this use case best.
              </AssistantBubble>

              <AssistantBubble>What&apos;s your budget?</AssistantBubble>

              <div className="grid gap-3 sm:grid-cols-2 xl:max-w-[620px] xl:grid-cols-4">
                {budgetTiers.map((tier) => {
                  const { Icon } = tier
                  const isActive = selectedBudget === tier.id

                  return (
                    <button
                      key={tier.id}
                      type="button"
                      onClick={() => setSelectedBudget(tier.id)}
                      className={`rounded-[18px] border bg-white p-4 text-left transition ${
                        isActive ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-black/10 hover:border-[var(--accent)]'
                      }`}
                    >
                      <div className={`inline-flex h-9 w-9 items-center justify-center rounded-[12px] ${tier.tone}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="mt-3 text-sm font-semibold text-[#17110d]">{tier.label}</div>
                      <div className="mt-1 text-xs text-[#9f8d79]">{tier.subtitle}</div>
                    </button>
                  )
                })}
              </div>

              {selectedBudget ? (
                <UserBubble>{budgetTiers.find((tier) => tier.id === selectedBudget)?.label}</UserBubble>
              ) : null}

              {selectedBudget ? (
                <>
                  <AssistantBubble>
                    Here are the top models side by side for this budget and research context:
                  </AssistantBubble>

                  <div className="space-y-3 xl:max-w-[700px]">
                    {candidateModels.map((model) => (
                      <div
                        key={model.modelId}
                        className="rounded-[18px] border border-black/10 bg-white px-4 py-3 shadow-[0_10px_24px_rgba(36,30,21,0.05)]"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#f2e8dc] text-xs font-semibold text-[#8a6a4f]">
                              {model.labIcon}
                            </div>
                            <div>
                              <div className="font-semibold text-[#17110d]">{model.name}</div>
                              <div className="text-xs text-[#9d8a76]">
                                {model.speed} - {model.isFree ? 'Free' : `$${Number(model.inputPricePer1M).toFixed(2)}/1M tk`}
                              </div>
                            </div>
                          </div>
                          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                            <button
                              type="button"
                              onClick={() => openModelDetails(model)}
                              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-medium text-[#6a5d50]"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Details
                            </button>
                            <button
                              type="button"
                              onClick={() => handleProceed(model)}
                              className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-medium text-white"
                            >
                              Proceed
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}

              {selectedModel ? (
                <>
                  <UserBubble>Proceed with {selectedModel.name}</UserBubble>

                  <AssistantBubble>
                    Before we pick a version of <strong>{selectedModel.name}</strong>, here are helpful questions people ask. Tap any to learn more, or continue to select a version.
                  </AssistantBubble>

                  <div className="rounded-[22px] border border-black/10 bg-white p-4 sm:p-5 xl:max-w-[760px]">
                    <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#a99783]">
                      {selectedModel.name} - Inspiration
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {questions.map((question) => (
                        <button
                          key={question.id}
                          type="button"
                          onClick={() =>
                            setSelectedQuestionId((current) => (current === question.id ? null : question.id))
                          }
                          className={`rounded-full border px-3 py-2 text-sm transition ${
                            selectedQuestionId === question.id
                              ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[#17110d]'
                              : 'border-black/10 bg-white text-[#5d5146] hover:border-[var(--accent)]'
                          }`}
                        >
                          {question.label}
                        </button>
                      ))}
                    </div>

                    {selectedQuestion ? (
                      <div className="mt-4 rounded-[14px] border border-black/8 bg-[#fcfaf7] px-4 py-4 text-sm leading-7 text-[#65584c]">
                        {selectedQuestion.answer}
                      </div>
                    ) : null}

                    <div className="mt-5 rounded-[18px] border border-black/8 bg-[#fcfaf7] px-4 py-4">
                      <div className="text-sm text-[#65584c]">Ready to choose a version?</div>
                      <div className="mt-3 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => openModelDetails(selectedModel)}
                          className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm text-[#5d5146]"
                        >
                          View full details
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowVersionPicker(true)}
                          className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm text-[#5d5146]"
                        >
                          Select a version
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}

              {showVersionPicker && selectedModel ? (
                <div className="rounded-[22px] border border-black/10 bg-white p-4 sm:p-5 xl:max-w-[760px]">
                  <div className="text-lg font-semibold tracking-[-0.03em] text-[#17110d]">
                    Choose your {selectedModel.name} version
                  </div>
                  <div className="mt-1 text-sm text-[#9a8773]">
                    Click a version to select, then proceed.
                  </div>

                  <div className="mt-4 space-y-3">
                    {versionOptions.map((version) => {
                      const isActive = selectedVersionId === version.id

                      return (
                        <button
                          key={version.id}
                          type="button"
                          onClick={() => setSelectedVersionId(version.id)}
                          className={`flex w-full flex-col items-start justify-between gap-4 rounded-[16px] border px-4 py-4 text-left transition sm:flex-row sm:items-center ${
                            isActive ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-black/10 hover:border-[var(--accent)]'
                          }`}
                        >
                          <div>
                            <div className="font-semibold text-[#17110d]">{version.name}</div>
                            <div className="mt-1 text-sm text-[#8e7d69]">
                              {version.subtitle} - {version.context} - {version.pricing}
                            </div>
                          </div>
                            <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-start">
                            <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent)]">
                              {version.badge}
                            </span>
                            <span
                              className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                                isActive ? 'border-[var(--accent)]' : 'border-[#d7c4b1]'
                              }`}
                            >
                              {isActive ? <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent)]" /> : null}
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  <Button
                    className="mt-4 w-full justify-center"
                    onClick={() => {
                      if (!selectedVersionId) {
                        toast({
                          title: 'Pick a version',
                          message: 'Select one model version before continuing.',
                        })
                        return
                      }

                      setConfirmedVersionId(selectedVersionId)
                    }}
                  >
                    Proceed with selected version
                  </Button>
                </div>
              ) : null}

              {confirmedVersionId && selectedModel ? (
                <>
                  <UserBubble>Selected: {confirmedVersion?.name}</UserBubble>

                  <AssistantBubble>
                    Excellent pick! Here&apos;s everything you need to know about <strong>{confirmedVersion?.name ?? selectedModel.name}</strong> before we get started.
                  </AssistantBubble>

                  <div className="rounded-[22px] border border-[var(--border-strong)] bg-white p-4 shadow-[0_14px_28px_rgba(36,30,21,0.05)] sm:p-5 xl:max-w-[760px]">
                    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#f2e8dc] text-xs font-semibold text-[#8a6a4f]">
                          {selectedModel.labIcon}
                        </div>
                        <div>
                          <div className="text-[1.4rem] font-semibold tracking-[-0.03em] text-[#17110d]">
                            {confirmedVersion?.name ?? selectedModel.name}
                          </div>
                          <div className="text-sm text-[#a08d79]">
                            {confirmedVersion?.subtitle ?? selectedModel.lab}
                          </div>
                        </div>
                      </div>
                      <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent)]">
                        {confirmedVersion?.badge ?? 'Recommended'}
                      </span>
                    </div>

                    <div className="mt-5">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#aa9783]">
                        Overview
                      </div>
                      <p className="mt-3 text-sm leading-7 text-[#625749]">{selectedModel.description}</p>
                    </div>

                    <div className="mt-5">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#aa9783]">
                        Key Specs
                      </div>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        <div className="rounded-[14px] border border-black/10 bg-[#fcfaf7] px-4 py-4 text-center">
                          <div className="text-lg font-semibold text-[#17110d]">
                            {confirmedVersion?.context?.replace(' context', '') ?? formatContext(selectedModel.contextWindow)}
                          </div>
                          <div className="mt-2 text-[10px] uppercase tracking-[0.2em] text-[#b19f8c]">Context</div>
                        </div>
                        <div className="rounded-[14px] border border-black/10 bg-[#fcfaf7] px-4 py-4 text-center">
                          <div className="text-lg font-semibold text-[#17110d]">
                            {selectedModel.speed === 'fast' ? '~1.1s' : selectedModel.speed === 'medium' ? '~1.8s' : '~2.6s'}
                          </div>
                          <div className="mt-2 text-[10px] uppercase tracking-[0.2em] text-[#b19f8c]">Speed</div>
                        </div>
                        <div className="rounded-[14px] border border-black/10 bg-[#fcfaf7] px-4 py-4 text-center">
                          <div className="text-lg font-semibold text-[#17110d]">
                            {confirmedVersion?.pricing ?? formatPrice(selectedModel)}
                          </div>
                          <div className="mt-2 text-[10px] uppercase tracking-[0.2em] text-[#b19f8c]">Price</div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#aa9783]">
                        Latest Update
                      </div>
                      <div className="mt-3 rounded-[14px] border border-[#bde3d6] bg-[#eaf8f1] px-4 py-4 text-sm leading-7 text-[#236c58]">
                        Updated {feedItem.publishedDate} - this is the latest stable release context for the discover item you selected.
                      </div>
                    </div>

                    <div className="mt-5">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#aa9783]">
                        Key Benefits
                      </div>
                      <div className="mt-3 space-y-2 text-sm leading-7 text-[#625749]">
                        {(selectedModel.bestFor ?? []).slice(0, 4).map((benefit) => (
                          <div key={benefit}>+ {benefit}</div>
                        ))}
                        {selectedModel.multimodal ? <div>+ Multimodal support for richer workflows</div> : null}
                        {selectedModel.isOpenSource ? <div>+ Open source and self-hostable deployment path</div> : null}
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => openModelDetails(selectedModel)}
                        className="w-full rounded-[14px] border border-black/10 bg-white px-4 py-3 text-sm font-medium text-[#5c5145] sm:w-auto"
                      >
                        Full Details
                      </button>
                      <Button className="w-full sm:w-auto" onClick={handleCreateAgent}>Create Agent</Button>
                    </div>
                  </div>
                </>
              ) : null}

              <div ref={endRef} />
            </div>
          </div>
        </section>
      </div>

      <ModelDrawer
        isOpen={Boolean(drawerModel)}
        onClose={() => setDrawerModel(null)}
        model={drawerModel}
      />
    </PageWrapper>
  )
}

