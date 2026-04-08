import {
  Bot,
  BriefcaseBusiness,
  Building2,
  Coins,
  Code2,
  Globe2,
  GraduationCap,
  Lightbulb,
  PenTool,
  RotateCcw,
  Search,
  Sparkles,
  User,
  Users,
} from 'lucide-react'
import clsx from 'clsx'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { queuePendingComposer, runChatAction } from '../../store/chatStore'
import { useModelStore } from '../../store/modelStore'
import { usePromptStore } from '../../store/promptStore'
import { ModelCard } from '../models/ModelCard'
import { ModelDrawer } from '../models/ModelDrawer'
import { PromptCard } from './PromptCard'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

const useCaseOptions = [
  {
    value: 'write-content',
    label: 'Write emails, posts or stories',
    description: 'Content, messaging, and copy',
    icon: PenTool,
  },
  {
    value: 'create-images',
    label: 'Create images',
    description: 'Visual concepts and creative direction',
    icon: Sparkles,
  },
  {
    value: 'build-something',
    label: 'Build something',
    description: 'Apps, tools, and prototypes',
    icon: Code2,
  },
  {
    value: 'automate-work',
    label: 'Automate work',
    description: 'Workflows, ops, and repeatable tasks',
    icon: Bot,
  },
  {
    value: 'analyse-data',
    label: 'Analyze data',
    description: 'Reports, metrics, and trends',
    icon: Search,
  },
  {
    value: 'just-exploring',
    label: 'Just exploring',
    description: 'Show me what is possible',
    icon: Lightbulb,
  },
]

const audienceOptions = [
  { value: 'just-me', label: 'Just me', description: 'Personal use', icon: User },
  { value: 'my-team', label: 'My team', description: 'Small group, work', icon: Users },
  {
    value: 'my-company',
    label: 'My company',
    description: 'Business / enterprise',
    icon: BriefcaseBusiness,
  },
  {
    value: 'my-customers',
    label: 'My customers',
    description: 'Building for end-users',
    icon: Users,
  },
  {
    value: 'students',
    label: 'Students',
    description: 'Education / learning',
    icon: GraduationCap,
  },
  {
    value: 'public',
    label: 'Anyone / public',
    description: 'Open to the world',
    icon: Globe2,
  },
]

const experienceOptions = [
  {
    value: 'beginner',
    label: 'Complete beginner',
    description: 'Never used AI before',
    icon: Sparkles,
  },
  {
    value: 'experienced',
    label: 'Some experience',
    description: 'Used ChatGPT etc.',
    icon: Lightbulb,
  },
  {
    value: 'developer',
    label: 'Developer',
    description: 'I can write code',
    icon: Code2,
  },
  {
    value: 'researcher',
    label: 'AI researcher',
    description: 'Deep technical knowledge',
    icon: Search,
  },
]

const budgetOptions = [
  {
    value: 'Free only. Prioritize free or open-source tools where possible.',
    label: 'Free only',
    description: 'No credit card',
    icon: Coins,
  },
  {
    value: 'Pay as you go is fine. Small monthly or usage-based costs are okay.',
    label: 'Pay as I go',
    description: 'Small monthly costs OK',
    icon: Sparkles,
  },
  {
    value: 'A fixed plan is best. Keep the workflow predictable month to month.',
    label: 'Fixed plan',
    description: 'Predictable monthly bill',
    icon: Building2,
  },
  {
    value: 'Enterprise-ready options are welcome. Include scale, SLAs, and support.',
    label: 'Enterprise',
    description: 'Scale, SLAs, support',
    icon: BriefcaseBusiness,
  },
]

function findOption(options, value) {
  return options.find((option) => option.value === value) ?? null
}

function buildFlowState({
  selectedUseCase,
  selectedAudience,
  selectedExperience,
  selectedBudget,
  generatedPrompt,
  isGenerating,
}) {
  if (generatedPrompt) {
    return {
      label: 'Prompt ready',
      description: 'Review the prompt, tweak it if needed, then send it into Chat Hub.',
    }
  }

  if (isGenerating || selectedBudget) {
    return {
      label: 'Generating your prompt',
      description: 'Turning your answers into a practical, ready-to-run prompt.',
    }
  }

  if (selectedExperience) {
    return {
      label: 'Step 4 of 4',
      description: 'Choose the budget path that fits your workflow.',
    }
  }

  if (selectedAudience) {
    return {
      label: 'Step 3 of 4',
      description: 'Tell me how comfortable you are with AI and technical tools.',
    }
  }

  if (selectedUseCase) {
    return {
      label: 'Step 2 of 4',
      description: 'Who is this workflow for? That helps shape the tool recommendations.',
    }
  }

  return {
    label: 'Step 1 of 4',
    description: 'Pick a starting point and I will guide the rest like a conversation.',
  }
}

function AssistantRow({ children, wide = false }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--border-strong)] bg-white text-[var(--accent)]">
        <Sparkles className="h-4 w-4" />
      </div>
      <div
        className={clsx('min-w-0 flex-1 max-w-full', {
          'sm:max-w-[900px] xl:max-w-[980px]': !wide,
        })}
      >
        {children}
      </div>
    </div>
  )
}

function AssistantMessage({ children }) {
  return (
    <AssistantRow>
      <div className="card-surface rounded-[24px] px-5 py-4 text-[16px] leading-7 text-[var(--text-primary)] sm:px-6 sm:py-5 sm:text-[17px] sm:leading-8">
        {children}
      </div>
    </AssistantRow>
  )
}

function UserAnswer({ option }) {
  if (!option) return null

  const Icon = option.icon

  return (
    <div className="flex justify-end">
      <div className="inline-flex max-w-[88%] items-center gap-2 rounded-[18px] bg-[var(--accent)] px-4 py-3 text-sm font-medium text-white shadow-[0_14px_30px_rgba(var(--accent-rgb),0.2)] sm:max-w-[72%]">
        <Icon className="h-4 w-4" />
        <span>{option.label}</span>
      </div>
    </div>
  )
}

function UserAnswerText({ text, option }) {
  if (!text) return <UserAnswer option={option} />
  if (!option) return null

  const Icon = option.icon

  return (
    <div className="flex justify-end">
      <div className="inline-flex max-w-[88%] items-center gap-2 rounded-[18px] bg-[var(--accent)] px-4 py-3 text-sm font-medium text-white shadow-[0_14px_30px_rgba(var(--accent-rgb),0.2)] sm:max-w-[72%]">
        <Icon className="h-4 w-4" />
        <span>{text}</span>
      </div>
    </div>
  )
}

function QuestionCard({
  eyebrow,
  title,
  subtitle,
  options,
  selectedValue,
  onSelect,
  columns = 'md:grid-cols-2',
}) {
  return (
    <AssistantRow wide>
      <div className="card-surface w-full rounded-[26px] p-5 sm:p-6">
        <div className="inline-flex rounded-full border border-[var(--border-strong)] bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
          {eyebrow}
        </div>
        <h3 className="mt-4 text-[clamp(1.5rem,4vw,1.85rem)] font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
          {title}
        </h3>
        {subtitle ? (
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">{subtitle}</p>
        ) : null}
        <div className={`mt-5 grid gap-3 ${columns}`}>
          {options.map((option) => {
            const Icon = option.icon
            const isActive = selectedValue === option.value

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onSelect(option)}
                className={`flex items-center gap-4 rounded-[18px] border px-4 py-4 text-left transition ${
                  isActive
                    ? 'border-[var(--accent)] bg-[var(--accent-soft)] shadow-[0_10px_24px_rgba(var(--accent-rgb),0.08)]'
                    : 'border-black/10 bg-[var(--bg-elevated)] hover:border-[var(--border-strong)] hover:bg-white'
                }`}
              >
                <span className="icon-badge flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-[0_8px_20px_rgba(16,24,40,0.04)]">
                  <Icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-base font-semibold text-[var(--text-primary)]">{option.label}</span>
                  <span className="block text-sm text-[var(--text-muted)]">{option.description}</span>
                </span>
              </button>
            )
          })}
        </div>
        <div className="mt-4 text-xs text-[var(--text-muted)]">PromptForge Hub - guided setup</div>
      </div>
    </AssistantRow>
  )
}

function WelcomePanel({ onSelect }) {
  return (
    <AssistantRow wide>
      <div className="card-surface w-full rounded-[30px] p-5 sm:p-6">
        <div className="inline-flex rounded-full border border-[var(--border-strong)] bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
          Prompt Builder
        </div>
        <h2 className="display-font mt-4 text-[clamp(2rem,5vw,2.75rem)] font-semibold leading-[0.96] text-[var(--text-primary)]">
          Build your prompt like a guided chat.
        </h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--text-secondary)] sm:text-lg sm:leading-8">
          Pick the kind of outcome you want. I will ask a few focused questions,
          then turn your answers into a prompt you can run in Chat Hub.
        </p>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {useCaseOptions.map((option) => {
            const Icon = option.icon
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onSelect(option)}
                className="rounded-[18px] border border-black/10 bg-white px-4 py-5 text-left transition hover:border-[var(--border-strong)] hover:bg-[#fffdf9]"
              >
                <span className="icon-badge flex h-12 w-12 items-center justify-center rounded-2xl shadow-[0_8px_20px_rgba(16,24,40,0.04)]">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="mt-4 block text-[1.05rem] font-semibold text-[var(--text-primary)]">
                  {option.value === 'write-content' ? 'Write content' : option.label}
                </span>
                <span className="mt-1 block text-sm text-[var(--text-muted)]">
                  {option.value === 'write-content'
                    ? 'Emails, posts, stories'
                    : option.value === 'create-images'
                      ? 'Art, photos, designs'
                      : option.value === 'build-something'
                        ? 'Apps, tools, websites'
                        : option.value === 'automate-work'
                          ? 'Save hours every week'
                          : option.value === 'analyse-data'
                            ? 'PDFs, sheets, reports'
                            : 'Show me what is possible'}
                </span>
              </button>
            )
          })}
        </div>

        <div className="mt-4 text-sm text-[var(--text-muted)]">
          Start with any option and we will shape it into a usable prompt together.
        </div>
      </div>
    </AssistantRow>
  )
}

export function PromptBuilderFlow() {
  const navigate = useNavigate()
  const [detailModel, setDetailModel] = useState(null)
  const [detailTab, setDetailTab] = useState('overview')
  const [lastAutoGeneratedKey, setLastAutoGeneratedKey] = useState('')
  const [selectedRecommendedModelId, setSelectedRecommendedModelId] = useState('')
  const listRef = useRef(null)
  const currentStep = usePromptStore((state) => state.currentStep)
  const entryMessage = usePromptStore((state) => state.entryMessage)
  const answers = usePromptStore((state) => state.answers)
  const generatedPrompt = usePromptStore((state) => state.generatedPrompt)
  const isGenerating = usePromptStore((state) => state.isGenerating)
  const actions = usePromptStore((state) => state.actions)
  const recommended = useModelStore((state) => state.recommended)
  const allModels = useModelStore((state) => state.allModels)

  const selectedUseCase = findOption(useCaseOptions, answers.useCase)
  const selectedAudience = findOption(audienceOptions, answers.audience)
  const selectedExperience = findOption(experienceOptions, answers.experience)
  const selectedBudget =
    findOption(budgetOptions, answers.followUp) ??
    (answers.followUp
      ? {
          value: answers.followUp,
          label: answers.followUp,
          description: 'Selected detail',
          icon: Coins,
        }
      : null)

  const flowState = useMemo(
    () =>
      buildFlowState({
        selectedUseCase,
        selectedAudience,
        selectedExperience,
        selectedBudget,
        generatedPrompt,
        isGenerating,
      }),
    [generatedPrompt, isGenerating, selectedAudience, selectedBudget, selectedExperience, selectedUseCase],
  )
  const selectionChips = useMemo(
    () => [selectedUseCase, selectedAudience, selectedExperience, selectedBudget].filter(Boolean),
    [selectedAudience, selectedBudget, selectedExperience, selectedUseCase],
  )
  const isReadyToGenerate = useMemo(
    () =>
      Boolean(
        answers.useCase &&
          answers.audience &&
          answers.experience &&
          answers.followUp,
      ),
    [answers.audience, answers.experience, answers.followUp, answers.useCase],
  )
  const answerKey = useMemo(
    () =>
      [answers.useCase, answers.audience, answers.experience, answers.followUp].join('::'),
    [answers.audience, answers.experience, answers.followUp, answers.useCase],
  )
  const displayRecommendations = useMemo(() => {
    if (recommended.length) return recommended
    if (!generatedPrompt?.suggestedModels?.length) return []

    return generatedPrompt.suggestedModels
      .map((modelId, index) => {
        const model = allModels.find((entry) => entry.modelId === modelId)
        if (!model) return null

        return {
          model,
          score: Math.max(80, 94 - index * 6),
          reason: `${model.name} matches the template selected for this prompt and is a strong fit for this workflow.`,
        }
      })
      .filter(Boolean)
  }, [allModels, generatedPrompt?.suggestedModels, recommended])

  useEffect(() => {
    if (!answers.useCase && !answers.audience && !answers.experience && !answers.followUp) {
      setLastAutoGeneratedKey('')
      setSelectedRecommendedModelId('')
      return
    }
  }, [answers.audience, answers.experience, answers.followUp, answers.useCase])

  useEffect(() => {
    if (
      currentStep !== 4 ||
      !isReadyToGenerate ||
      generatedPrompt ||
      isGenerating ||
      lastAutoGeneratedKey === answerKey
    ) {
      return
    }
    setLastAutoGeneratedKey(answerKey)
    actions.generatePrompt()
  }, [
    actions,
    answerKey,
    currentStep,
    generatedPrompt,
    isGenerating,
    isReadyToGenerate,
    lastAutoGeneratedKey,
  ])

  useEffect(() => {
    if (!displayRecommendations.length) return
    if (
      selectedRecommendedModelId &&
      displayRecommendations.some(
        (entry) => entry.model.modelId === selectedRecommendedModelId,
      )
    ) {
      return
    }
    setSelectedRecommendedModelId(displayRecommendations[0].model.modelId)
  }, [displayRecommendations, selectedRecommendedModelId])

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [
    currentStep,
    answers.useCase,
    answers.audience,
    answers.experience,
    answers.followUp,
    generatedPrompt?.promptId,
    displayRecommendations.length,
    isGenerating,
  ])

  function handleUseCaseSelect(option) {
    actions.startFlow(option.value, option.label)
  }

  function handleAudienceSelect(option) {
    actions.setAnswer('audience', option.value)
    actions.setAnswer('experience', '')
    actions.setAnswer('followUp', '')
    actions.setStep(2)
  }

  function handleExperienceSelect(option) {
    actions.setAnswer('experience', option.value)
    actions.setAnswer('followUp', '')
    actions.setStep(3)
  }

  function handleBudgetSelect(option) {
    actions.setAnswer('followUp', option.value)
    actions.setStep(4)
  }

  function openDetails(model, tab = 'overview') {
    setDetailModel(model)
    setDetailTab(tab)
  }

  async function handleRunPrompt() {
    if (!generatedPrompt?.promptText) return

    if (selectedRecommendedModelId) {
      await runChatAction('switchModel', selectedRecommendedModelId)
    }

    queuePendingComposer({
      content: generatedPrompt.promptText,
      autoSend: true,
    })
    navigate('/hub', { state: { tab: 'chat' } })
  }

  async function handleEditPrompt() {
    if (!generatedPrompt?.promptId) return

    const nextPromptText = window.prompt('Edit your prompt', generatedPrompt.promptText)
    if (nextPromptText == null) return

    const trimmedPrompt = nextPromptText.trim()
    if (!trimmedPrompt) return

    await actions.editPrompt(generatedPrompt.promptId, trimmedPrompt)
  }

  return (
    <>
      <div className="flex h-full min-h-0 flex-col rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)]">
        <div className="flex flex-col gap-4 border-b border-[var(--border)] px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-sm text-[var(--text-muted)]">Guided prompt builder</div>
              <div className="text-lg font-semibold text-[var(--text-primary)]">{flowState.label}</div>
              <div className="mt-1 text-sm text-[var(--text-secondary)]">{flowState.description}</div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={generatedPrompt ? 'status' : 'category'}>
                {generatedPrompt ? 'Ready to run' : 'Prompt workflow'}
              </Badge>
              {selectedUseCase ? (
                <Badge variant="lab" className="max-w-[220px] truncate">
                  {selectedUseCase.label}
                </Badge>
              ) : null}
            </div>
          </div>
          {selectionChips.length ? (
            <div className="flex flex-wrap gap-2">
              {selectionChips.map((option) => (
                <Badge key={`${option.value}-${option.label}`} variant="category" className="max-w-[220px] truncate">
                  {option.label}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>

        <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-5">
          <div className="space-y-5 pb-6">
            {!selectedUseCase ? <WelcomePanel onSelect={handleUseCaseSelect} /> : null}

            {selectedUseCase ? <UserAnswerText text={entryMessage} option={selectedUseCase} /> : null}

            {selectedUseCase ? (
              <AssistantMessage>
                Great choice! <strong>"{entryMessage || selectedUseCase.label}"</strong>.
                I can already think of some excellent models and prompt structures for that.
                <br />
                <br />
                Now, quick question:
              </AssistantMessage>
            ) : null}

            {selectedUseCase && !selectedAudience ? (
              <QuestionCard
                eyebrow="Who it's for"
                title="Who will be using this AI?"
                subtitle="This helps match the right tool style without making the setup feel heavy."
                options={audienceOptions}
                selectedValue={answers.audience}
                onSelect={handleAudienceSelect}
              />
            ) : null}

            {selectedAudience ? <UserAnswer option={selectedAudience} /> : null}

            {selectedAudience ? (
              <AssistantMessage>
                Perfect. <strong>{selectedAudience.label}</strong> gives me a much better sense of the workflow.
                <br />
                <br />
                One more:
              </AssistantMessage>
            ) : null}

            {selectedAudience && !selectedExperience ? (
              <QuestionCard
                eyebrow="Your Experience"
                title="How comfortable are you with tech and AI tools?"
                subtitle="Brand new is completely fine. I will adjust the prompt style to match."
                options={experienceOptions}
                selectedValue={answers.experience}
                onSelect={handleExperienceSelect}
              />
            ) : null}

            {selectedExperience ? <UserAnswer option={selectedExperience} /> : null}

            {selectedExperience ? (
              <AssistantMessage>
                Got it. <strong>{selectedExperience.label}</strong> helps set the right level of complexity.
                <br />
                <br />
                Last question:
              </AssistantMessage>
            ) : null}

            {selectedExperience && !selectedBudget ? (
              <QuestionCard
                eyebrow="Your Budget"
                title="What budget should I optimize for?"
                subtitle="I will keep the recommendations aligned with what you are actually willing to use."
                options={budgetOptions}
                selectedValue={answers.followUp}
                onSelect={handleBudgetSelect}
              />
            ) : null}

            {selectedBudget ? <UserAnswer option={selectedBudget} /> : null}

            {currentStep === 4 && isGenerating && !generatedPrompt ? (
              <AssistantMessage>
                <strong>Generating your personalized AI prompt</strong> based on your answers...
              </AssistantMessage>
            ) : null}

            {generatedPrompt ? (
              <>
                <AssistantMessage>
                  Here is a personalized prompt crafted from your answers. You can <strong>run it as-is</strong>, edit it,
                  regenerate a fresh version, or delete it and start again.
                </AssistantMessage>

                <AssistantRow wide>
                  <PromptCard
                    prompt={generatedPrompt}
                    onRun={handleRunPrompt}
                    onEdit={handleEditPrompt}
                    onRegenerate={() => actions.regeneratePrompt(generatedPrompt.promptId)}
                    onDelete={() => actions.deletePrompt(generatedPrompt.promptId)}
                  />
                </AssistantRow>

                {displayRecommendations.length ? (
                  <>
                    <AssistantRow>
                      <div className="rounded-[22px] border border-black/8 bg-white px-5 py-4 text-[16px] leading-7 text-[var(--text-primary)] shadow-[0_10px_28px_rgba(16,24,40,0.04)]">
                        Recommended models for this prompt
                      </div>
                    </AssistantRow>
                    <AssistantRow wide>
                      <div className="grid w-full min-w-0 gap-4 md:grid-cols-2">
                        {displayRecommendations.map((entry) => (
                          <ModelCard
                            key={entry.model.modelId}
                            model={entry.model}
                            tone="light"
                            selected={selectedRecommendedModelId === entry.model.modelId}
                            onSelect={(model) => {
                              setSelectedRecommendedModelId(model.modelId)
                              openDetails(model, 'overview')
                            }}
                            onDetails={(model, tab) => {
                              setSelectedRecommendedModelId(model.modelId)
                              openDetails(model, tab ?? 'overview')
                            }}
                          />
                        ))}
                      </div>
                    </AssistantRow>
                  </>
                ) : null}
              </>
            ) : null}
          </div>
        </div>

        <div className="border-t border-[var(--border)] bg-[var(--bg-elevated)]/55 p-4">
          {!selectedUseCase ? (
            <div className="space-y-3">
              <div className="text-sm text-[var(--text-muted)]">Quick starts</div>
              <div className="flex flex-wrap gap-2">
                {useCaseOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleUseCaseSelect(option)}
                    className="rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-3 py-1.5 text-sm text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
                  >
                    {option.value === 'write-content' ? 'Write content' : option.label}
                  </button>
                ))}
              </div>
            </div>
          ) : generatedPrompt ? (
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="text-sm leading-6 text-[var(--text-secondary)]">
                Your prompt is ready. When you run it, the conversation will continue inside Chat Hub.
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={handleRunPrompt}>
                  Run in Chat Hub
                </Button>
                <Button variant="secondary" size="sm" onClick={() => actions.reset()}>
                  <RotateCcw className="h-4 w-4" />
                  Start over
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="text-sm leading-6 text-[var(--text-secondary)]">
                {isGenerating
                  ? 'Generating your prompt now. You can stay here and review the result when it appears.'
                  : 'Answer the next card above to keep moving through the guided setup.'}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" onClick={() => actions.reset()}>
                  <RotateCcw className="h-4 w-4" />
                  Start over
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ModelDrawer
        isOpen={Boolean(detailModel)}
        onClose={() => setDetailModel(null)}
        model={detailModel}
        initialTab={detailTab}
      />
    </>
  )
}
