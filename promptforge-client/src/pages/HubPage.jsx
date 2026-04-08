import { useEffect, useMemo, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ChatWindow } from '../components/chat/ChatWindow'
import { Sidebar } from '../components/layout/Sidebar'
import { ModelDrawer } from '../components/models/ModelDrawer'
import { PageWrapper } from '../components/layout/PageWrapper'
import { PromptBuilderFlow } from '../components/prompt/PromptBuilderFlow'
import { TokenStatsPanel } from '../components/stats/TokenStatsPanel'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { modelService } from '../services/modelService'
import { useModelStore } from '../store/modelStore'
import { runChatAction, useChatStore } from '../store/chatStore'
import { usePromptStore } from '../store/promptStore'
import { useTokenStore } from '../store/tokenStore'

const tabs = ['chat', 'prompt-builder']

function formatContext(value) {
  if (!value) return '--'
  if (value >= 1000000) return `${(value / 1000000).toFixed(1).replace('.0', '')}M`
  return `${Math.round(value / 1000)}K`
}

function formatInputPrice(model) {
  if (!model) return '--'
  return `$${Number(model.inputPricePer1M ?? 0).toFixed(2)}`
}

function resolveLatency(speed) {
  if (speed === 'slow') return '2.3s'
  if (speed === 'medium') return '1.6s'
  if (speed === 'fast') return '1.1s'
  return '--'
}

const quickGenerateItems = [
  'Create image',
  'Generate audio',
  'Create video',
  'Create slides',
  'Create infographics',
  'Create quiz',
  'Create flashcards',
  'Translate',
]

function applyPromptBuilderPreset(promptBuilderState) {
  const promptStore = usePromptStore.getState()
  const actions = promptStore.actions ?? {}
  const preset = promptBuilderState?.answers ?? promptBuilderState ?? {}

  if (typeof actions.reset === 'function') {
    actions.reset()
  } else {
    usePromptStore.setState({
      currentStep: 0,
      entryMessage: '',
      answers: {
        useCase: '',
        audience: '',
        experience: '',
        followUp: '',
      },
      generatedPrompt: null,
      promptHistory: [],
      isGenerating: false,
    })
  }

  if (preset.entryMessage) {
    if (typeof actions.setEntryMessage === 'function') {
      actions.setEntryMessage(preset.entryMessage)
    } else {
      usePromptStore.setState({ entryMessage: preset.entryMessage })
    }
  }

  const nextAnswers = {
    useCase: preset.useCase ?? '',
    audience: preset.audience ?? '',
    experience: preset.experience ?? '',
    followUp: preset.followUp ?? '',
  }

  if (typeof actions.setAnswer === 'function') {
    if (preset.useCase) actions.setAnswer('useCase', preset.useCase)
    if (preset.audience) actions.setAnswer('audience', preset.audience)
    if (preset.experience) actions.setAnswer('experience', preset.experience)
    if (preset.followUp) actions.setAnswer('followUp', preset.followUp)
  } else {
    usePromptStore.setState((state) => ({
      answers: {
        ...state.answers,
        ...nextAnswers,
      },
      generatedPrompt: null,
    }))
  }

  const resolvedStep =
    promptBuilderState?.currentStep ??
    (preset.followUp ? 4 : preset.experience ? 3 : preset.audience ? 2 : preset.useCase ? 1 : 0)

  if (typeof actions.setStep === 'function') {
    actions.setStep(resolvedStep)
  } else {
    usePromptStore.setState({ currentStep: Math.max(0, Math.min(4, resolvedStep)) })
  }
}

export function HubPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('chat')
  const [isStatsOpen, setIsStatsOpen] = useState(false)
  const [activeModelDetails, setActiveModelDetails] = useState(null)
  const [isActiveModelLoading, setIsActiveModelLoading] = useState(false)
  const [drawerModel, setDrawerModel] = useState(null)
  const [drawerTab, setDrawerTab] = useState('overview')

  const filteredModels = useModelStore((state) => state.filteredModels)
  const allModels = useModelStore((state) => state.allModels)
  const loadModels = useModelStore((state) => state.actions.loadModels)
  const selectModel = useModelStore((state) => state.actions.selectModel)
  const setFilter = useModelStore((state) => state.actions.setFilter)
  const activeModel = useChatStore((state) => state.activeModel)
  const totalCost = useTokenStore((state) => state.totalCost)
  const stats = useTokenStore((state) => state.stats)

  const models = useMemo(
    () => (filteredModels.length ? filteredModels : allModels).slice(0, 24),
    [allModels, filteredModels],
  )

  const usageBars = useMemo(() => {
    if (stats.length) {
      return stats
        .slice(0, 14)
        .map((entry) => Math.max(14, Math.min(100, Math.round(entry.totalTokens / 4))))
    }

    return [18, 26, 22, 40, 28, 56, 48, 34, 52, 44, 30, 38]
  }, [stats])

  useEffect(() => {
    loadModels()
  }, [loadModels])

  useEffect(() => {
    if (!activeModel) {
      setActiveModelDetails(null)
      return undefined
    }

    let cancelled = false
    setActiveModelDetails(null)
    setIsActiveModelLoading(true)

    modelService
      .detail(activeModel)
      .then((model) => {
        if (cancelled || !model?.modelId) return
        setActiveModelDetails(model)
        selectModel(model)
      })
      .catch(() => {
        if (cancelled) return
        const fallbackModel = allModels.find((model) => model.modelId === activeModel) ?? null
        setActiveModelDetails(fallbackModel)
        if (fallbackModel) {
          selectModel(fallbackModel)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsActiveModelLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [activeModel, allModels, selectModel])

  useEffect(() => {
    const requestedTab = location.state?.tab
    const promptBuilderState = location.state?.promptBuilder
    if (requestedTab && tabs.includes(requestedTab)) {
      setActiveTab(requestedTab)
      if (!promptBuilderState) {
        navigate(location.pathname, { replace: true, state: null })
      }
    }
  }, [location.pathname, location.state, navigate])

  useEffect(() => {
    const guideState = location.state?.agentGuide
    if (!guideState) return

    setActiveTab('chat')
    runChatAction('startAgentGuide', guideState)
    navigate(location.pathname, { replace: true, state: null })
  }, [location.pathname, location.state, navigate])

  useEffect(() => {
    const promptBuilderState = location.state?.promptBuilder
    if (!promptBuilderState) return

    applyPromptBuilderPreset(promptBuilderState)
    setActiveTab('prompt-builder')
    navigate(location.pathname, { replace: true, state: null })
  }, [location.pathname, location.state, navigate])

  function openActiveModelDrawer(tab = 'overview') {
    if (!activeModelDetails) return
    setDrawerModel(activeModelDetails)
    setDrawerTab(tab)
  }

  const requestsCount = stats.length.toLocaleString()
  const avgLatency = resolveLatency(activeModelDetails?.speed)

  return (
    <PageWrapper className="mx-auto flex min-h-[calc(100vh-89px)] max-w-[1500px] flex-col px-4 lg:px-8 xl:h-[calc(100vh-89px)] xl:overflow-hidden">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        {tabs.map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? 'primary' : 'secondary'}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'chat' ? 'Chat Hub' : 'Prompt Builder'}
          </Button>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 gap-5 xl:grid-cols-[260px_minmax(0,1fr)_320px]">
        <Sidebar title="Models" className="order-2 flex min-h-0 flex-col overflow-hidden xl:order-1 xl:h-full">
          <input
            type="search"
            placeholder={`Search ${allModels.length || 525} models...`}
            className="mb-3 min-h-11 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]"
            onChange={(event) => setFilter('search', event.target.value)}
          />
          <div className="mb-4 flex flex-wrap gap-2 text-xs">
            {['', 'language', 'vision', 'code', 'open-source'].map((category) => (
              <button
                key={category || 'all'}
                type="button"
                className="rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-3 py-1 text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
                onClick={() => setFilter('category', category)}
              >
                {category || 'all'}
              </button>
            ))}
          </div>
          <div className="max-h-[420px] min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 xl:max-h-none">
            {models.map((model) => (
              <button
                key={model.modelId}
                type="button"
                onClick={() => runChatAction('switchModel', model.modelId)}
                className={`flex w-full items-center justify-between rounded-[var(--radius-md)] border px-3 py-3 text-left text-sm transition ${
                  activeModel === model.modelId
                    ? 'active-glow border-[var(--accent)] bg-[var(--accent-muted)]'
                    : 'border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--border-hover)]'
                }`}
              >
                <span>
                  <div className="font-medium">{model.name}</div>
                  <div className="text-xs text-[var(--text-muted)]">{model.lab}</div>
                </span>
                {model.isLive ? <span className="h-2 w-2 rounded-full bg-emerald-400" /> : null}
              </button>
            ))}
          </div>
        </Sidebar>

        <div className="order-1 min-h-[560px] min-w-0 xl:order-2 xl:min-h-0">
          {activeTab === 'chat' ? (
            <ChatWindow />
          ) : (
            <PromptBuilderFlow />
          )}
        </div>

        <Sidebar className="order-3 flex min-h-0 flex-col overflow-hidden xl:h-full">
          <div className="min-h-0 space-y-3 overflow-y-auto pr-1">
            <Card className="space-y-4">
              <div className="text-sm uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Active Model
              </div>
              {activeModelDetails ? (
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="text-2xl font-semibold text-[var(--text-primary)]">
                          {activeModelDetails.name}
                        </div>
                        {activeModelDetails.isLive ? <Badge variant="status">Live</Badge> : null}
                      </div>
                      <div className="text-sm text-[var(--text-secondary)]">
                        by {activeModelDetails.lab}
                      </div>
                    </div>
                  </div>

                  <p className="text-sm leading-6 text-[var(--text-secondary)]">
                    {activeModelDetails.description}
                  </p>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <div className="flex min-h-[78px] flex-col items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-center">
                      <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                        Context
                      </div>
                      <div className="mt-1 text-sm font-medium leading-none text-[var(--text-primary)]">
                        {formatContext(activeModelDetails.contextWindow)}
                      </div>
                    </div>
                    <div className="flex min-h-[78px] flex-col items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-center">
                      <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                        /1M tk
                      </div>
                      <div className="mt-1 text-sm font-medium leading-none text-[var(--text-primary)]">
                        {formatInputPrice(activeModelDetails)}
                      </div>
                    </div>
                    <div className="flex min-h-[78px] flex-col items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-center">
                      <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                        Rating
                      </div>
                      <div className="mt-1 text-sm font-medium leading-none text-[var(--text-primary)]">
                        {activeModelDetails.rating?.toFixed(1) ?? '--'} star
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="!rounded-[14px] !shadow-none"
                      onClick={() => openActiveModelDrawer('overview')}
                    >
                      Details
                    </Button>
                    <Button
                      size="sm"
                      className="!rounded-[14px]"
                      onClick={() => openActiveModelDrawer('pricing')}
                    >
                      Pricing
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-4 text-sm text-[var(--text-secondary)]">
                  {isActiveModelLoading
                    ? 'Loading active model details from the API...'
                    : 'Switch to a model to load its details.'}
                </div>
              )}
            </Card>

            <Card className="space-y-4">
              <div className="text-sm uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Usage Overview
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div className="flex min-h-[84px] flex-col items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-3 text-center">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    Requests
                  </div>
                  <div className="mt-1 text-lg font-medium leading-none text-[var(--text-primary)]">
                    {requestsCount}
                  </div>
                </div>
                <div className="flex min-h-[84px] flex-col items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-3 text-center">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    Avg Latency
                  </div>
                  <div className="mt-1 text-lg font-medium leading-none text-[var(--text-primary)]">
                    {avgLatency}
                  </div>
                </div>
                <div className="flex min-h-[84px] flex-col items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-3 text-center">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    Cost
                  </div>
                  <div className="mt-1 text-lg font-medium leading-none text-[var(--text-primary)]">
                    ${Number(totalCost ?? 0).toFixed(2)}
                  </div>
                </div>
              </div>
              <div className="flex h-20 items-end gap-1 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-3">
                {usageBars.map((bar, index) => (
                  <div
                    key={`${bar}-${index}`}
                    className="flex-1 rounded-full bg-gradient-to-t from-[#7aa6ff] to-[#5b7df5]"
                    style={{ height: `${bar}%` }}
                  />
                ))}
              </div>
            </Card>

            <Card className="space-y-3">
              <div className="text-sm uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Navigation & Tools
              </div>
              <div className="grid gap-2 text-sm text-[var(--text-secondary)]">
                <Link to="/marketplace">Browse Marketplace</Link>
                <Link to="/agents">Build an Agent</Link>
                <button type="button" className="text-left" onClick={() => navigate('/discover')}>
                  Discover New
                </button>
                <button
                  type="button"
                  className="text-left"
                  onClick={() => navigate('/hub', { state: { tab: 'prompt-builder' } })}
                >
                  Prompt Builder
                </button>
                <button type="button" className="text-left" onClick={() => setIsStatsOpen(true)}>
                  Session Stats
                </button>
                <button
                  type="button"
                  className="text-left"
                  onClick={() => activeModelDetails && openActiveModelDrawer('how-to-use')}
                >
                  How to Use Guide
                </button>
                <button
                  type="button"
                  className="text-left"
                  onClick={() => activeModelDetails && openActiveModelDrawer('prompt-guide')}
                >
                  Prompt Engineering
                </button>
                <button
                  type="button"
                  className="text-left"
                  onClick={() => activeModelDetails && openActiveModelDrawer('pricing')}
                >
                  View Pricing
                </button>
              </div>
            </Card>

            <Card className="space-y-3">
              <div className="text-sm uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Create & Generate
              </div>
              <div className="grid gap-2 text-sm text-[var(--text-secondary)]">
                {quickGenerateItems.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className="flex items-center justify-between text-left"
                    onClick={() =>
                      navigate('/hub', {
                        state: {
                          tab: 'prompt-builder',
                          promptBuilder: {
                            useCase: 'just-exploring',
                            audience: 'public',
                            experience: 'beginner',
                            followUp: item,
                            currentStep: 4,
                          },
                        },
                      })
                    }
                  >
                    <span>{item}</span>
                    <ArrowRight className="h-4 w-4 text-[var(--accent)]" />
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </Sidebar>
      </div>

      <TokenStatsPanel isOpen={isStatsOpen} onClose={() => setIsStatsOpen(false)} />
      <ModelDrawer
        isOpen={Boolean(drawerModel)}
        onClose={() => setDrawerModel(null)}
        model={drawerModel}
        initialTab={drawerTab}
      />
    </PageWrapper>
  )
}



