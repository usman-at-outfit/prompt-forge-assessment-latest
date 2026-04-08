import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronDown,
  CircleOff,
  Code2,
  Database,
  FileSpreadsheet,
  Globe2,
  Handshake,
  Mail,
  MessageSquare,
  PenTool,
  Plus,
  Search,
  Sparkles,
  Ticket,
  UserRound,
  Users,
  Webhook,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  readPersistedSnapshot,
  removePersistedSnapshot,
  writePersistedSnapshot,
} from '../../hooks/usePersist'
import { agentsService } from '../../services/agentsService'
import { toast } from '../ui/Toast'

const stepLabels = ['Purpose', 'System Prompt', 'Tools & APIs', 'Memory', 'Test', 'Deploy']
const AGENT_BUILDER_DRAFT_TTL_MS = 4 * 60 * 60 * 1000

const purposeTypeOptions = [
  { value: 'Customer Support', icon: MessageSquare },
  { value: 'Research & Data', icon: Search },
  { value: 'Code & Dev', icon: Code2 },
  { value: 'Sales & CRM', icon: Handshake },
  { value: 'Content & Writing', icon: PenTool },
  { value: 'Operations', icon: BriefcaseBusiness },
  { value: 'Finance & Reports', icon: FileSpreadsheet },
  { value: 'Something else', icon: Sparkles },
]

const audienceOptions = [
  { value: 'Customers', icon: Users },
  { value: 'Internal team', icon: Users },
  { value: 'Developers', icon: Code2 },
  { value: 'Executives', icon: BriefcaseBusiness },
]

const toneOptions = [
  { value: 'Professional', icon: BriefcaseBusiness },
  { value: 'Friendly', icon: Sparkles },
  { value: 'Short & direct', icon: ArrowRight },
  { value: 'Thorough', icon: FileSpreadsheet },
]

const exampleMainJobs = [
  'Answer customer questions and escalate unresolved issues',
  'Search the web and write structured research reports',
  'Review code for bugs and suggest improvements',
  'Draft emails, posts, and marketing content',
  'Summarise meetings and extract action items',
]

const toolFilters = ['All', 'Connected', 'Available', 'Suggested']

const toolCatalog = [
  {
    id: 'Web Search',
    title: 'Web Search',
    description: 'Search the web in real time for up-to-date information.',
    icon: Globe2,
    suggested: true,
  },
  {
    id: 'Database Lookup',
    title: 'Database Lookup',
    description: 'Query your database or vector store for internal knowledge.',
    icon: Database,
    suggested: true,
  },
  {
    id: 'Email Sender',
    title: 'Email Sender',
    description: 'Send emails or notifications on behalf of the agent.',
    icon: Mail,
    suggested: true,
  },
  {
    id: 'Calendar API',
    title: 'Calendar API',
    description: 'Read and write calendar events and schedule meetings.',
    icon: CalendarDays,
    suggested: false,
  },
  {
    id: 'Slack Webhook',
    title: 'Slack Webhook',
    description: 'Post messages and alerts to Slack channels.',
    icon: Webhook,
    suggested: true,
  },
  {
    id: 'Jira',
    title: 'Jira',
    description: 'Create and update Jira tickets automatically.',
    icon: Ticket,
    suggested: true,
  },
  {
    id: 'Google Sheets',
    title: 'Google Sheets',
    description: 'Read from and write to spreadsheets.',
    icon: FileSpreadsheet,
    suggested: false,
  },
  {
    id: 'Custom Function',
    title: 'Custom Function',
    description: 'Define your own tool with a JSON schema.',
    icon: Bot,
    suggested: true,
  },
]

const memoryOptions = [
  {
    value: 'none',
    title: 'No Memory',
    description: 'Stateless - each conversation starts fresh. Best for simple Q&A agents.',
    icon: CircleOff,
  },
  {
    value: 'history',
    title: 'Short-term Only',
    description: 'Maintains conversation history within a session. Forgets after the session ends.',
    icon: MessageSquare,
  },
  {
    value: 'vector',
    title: 'Short + Long-term',
    description: 'Persists key facts, preferences, and summaries across sessions.',
    icon: Database,
  },
]

const defaultTestScenarios = [
  'Normal use case - typical user query',
  'Edge case - unexpected or out-of-scope request',
  'Escalation trigger - billing or security issue',
  'Empty / very short input',
  'Multilingual input',
  'Harmful or adversarial prompt',
  'Follow-up questions needing context',
  'Request for information outside agent scope',
]

const deployTargets = [
  {
    value: 'api-endpoint',
    title: 'API Endpoint',
    description: 'Get a REST endpoint. Integrate into any app, website, or backend in minutes.',
    badge: 'Most flexible',
    icon: Webhook,
  },
  {
    value: 'embed-widget',
    title: 'Embed Widget',
    description: 'Drop a chat widget onto your website with one line of JavaScript.',
    badge: 'No-code option',
    icon: MessageSquare,
  },
  {
    value: 'slack-bot',
    title: 'Slack Bot',
    description: 'Deploy as a Slack bot so your team can chat with the agent directly.',
    badge: 'Internal teams',
    icon: Users,
  },
  {
    value: 'whatsapp',
    title: 'WhatsApp / SMS',
    description: 'Connect via Twilio to deploy your agent on WhatsApp or SMS.',
    badge: 'Consumer reach',
    icon: UserRound,
  },
]

function inferAgentType(template, existingAgent) {
  if (existingAgent?.agentType) return existingAgent.agentType
  if (template?.id === 'research-agent') return 'Research & Data'
  if (template?.id === 'customer-support') return 'Customer Support'
  if (template?.id === 'code-review') return 'Code & Dev'
  if (template?.id === 'data-analysis') return 'Research & Data'
  if (template?.id === 'content-writer') return 'Content & Writing'
  if (template?.id === 'sales-outreach') return 'Sales & CRM'
  return 'Something else'
}

function buildSystemPrompt(form, template, selectedModelName) {
  const role = form.name || template?.title || 'AI Assistant'
  const mainJob = form.mainJob || template?.description || 'help users with their requests'
  const audience = form.audience || 'users'
  const tone = form.tone || 'Professional'
  const modelLine = selectedModelName ? `\n## Foundation Model\nUse ${selectedModelName} when a model-specific choice matters.\n` : ''

  return [
    `You are ${role}, an AI agent specialising in ${mainJob.toLowerCase()}.`,
    '',
    '## Your Role',
    mainJob,
    '',
    '## Audience',
    `You are talking to ${audience.toLowerCase()}. Tailor your language, examples, and depth accordingly.`,
    '',
    '## Tone & Style',
    `Respond in a ${tone.toLowerCase()} tone. Be concise, practical, and easy to follow.`,
    '',
    '## Tools',
    form.tools.length
      ? `Use these tools when they improve the answer: ${form.tools.join(', ')}. Explain tool choices when helpful.`
      : 'If no external tools are connected, stay honest about limitations and offer the best possible guidance.',
    '',
    '## Memory',
    form.memoryType === 'vector'
      ? 'Use both short-term and long-term memory responsibly. Summarize durable preferences instead of raw logs.'
      : form.memoryType === 'history'
        ? 'Use short-term conversation memory within the current session only.'
        : 'Treat each conversation independently unless the user gives fresh context.',
    '',
    '## Escalation',
    'Escalate or ask clarifying questions when the request is risky, ambiguous, or outside scope.',
    '',
    '## Never Do This',
    form.avoid || 'Do not fabricate facts, leak sensitive data, or act outside the allowed scope.',
    modelLine,
  ]
    .join('\n')
    .trim()
}

function buildInitialForm({ template, existingAgent, initialModelId, seedPrompt }) {
  return {
    name: existingAgent?.name ?? template?.title ?? '',
    agentType: inferAgentType(template, existingAgent),
    mainJob: existingAgent?.mainJob ?? seedPrompt ?? template?.description ?? '',
    audience: existingAgent?.audience ?? 'Customers',
    tone: existingAgent?.tone ?? 'Professional',
    avoid: existingAgent?.avoid ?? '',
    modelId:
      existingAgent?.modelId ??
      initialModelId ??
      template?.recommendedModelIds?.[0] ??
      'gpt-4o',
    systemPrompt: existingAgent?.systemPrompt ?? template?.systemPrompt ?? '',
    tools: existingAgent?.tools ?? [],
    memoryType: existingAgent?.memoryType ?? 'history',
    testScenarios: existingAgent?.testScenarios ?? [
      defaultTestScenarios[1],
      defaultTestScenarios[2],
    ],
    customScenarios: existingAgent?.customScenarios ?? [],
    deployTarget: existingAgent?.deployTarget ?? 'api-endpoint',
    description: existingAgent?.description ?? template?.description ?? '',
    notes: existingAgent?.notes ?? '',
    status: existingAgent?.status ?? 'draft',
  }
}

function MetricTile({ value, label }) {
  return (
    <div className="rounded-[16px] border border-black/8 bg-white px-3 py-4 text-center shadow-[0_8px_18px_rgba(36,30,21,0.04)]">
      <div className="text-[1.4rem] font-semibold tracking-[-0.04em] text-[#17110d]">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-[0.18em] text-[#b39c86]">{label}</div>
    </div>
  )
}

export function AgentBuilderFlow({
  isOpen,
  template,
  existingAgent = null,
  initialModelId = null,
  seedPrompt = '',
  models = [],
  sessionId = null,
  userId = null,
  persistKey = null,
  onClose,
  onSaved,
}) {
  const [step, setStep] = useState(0)
  const [toolFilter, setToolFilter] = useState('All')
  const [customScenario, setCustomScenario] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState(() =>
    buildInitialForm({ template, existingAgent, initialModelId, seedPrompt }),
  )

  const selectedModel = useMemo(
    () => models.find((entry) => entry.modelId === form.modelId) ?? null,
    [form.modelId, models],
  )

  const generatedSystemPrompt = useMemo(
    () => buildSystemPrompt(form, template, selectedModel?.name),
    [form, selectedModel?.name, template],
  )

  const filteredTools = useMemo(() => {
    if (toolFilter === 'Connected') {
      return toolCatalog.filter((tool) => form.tools.includes(tool.id))
    }
    if (toolFilter === 'Available') {
      return toolCatalog.filter((tool) => !form.tools.includes(tool.id))
    }
    if (toolFilter === 'Suggested') {
      return toolCatalog.filter((tool) => tool.suggested)
    }
    return toolCatalog
  }, [form.tools, toolFilter])
  const totalScenarioCount = form.testScenarios.length + form.customScenarios.length

  useEffect(() => {
    if (!isOpen) return

    const nextForm = buildInitialForm({
      template,
      existingAgent,
      initialModelId,
      seedPrompt,
    })

    if (!nextForm.systemPrompt.trim()) {
      nextForm.systemPrompt = buildSystemPrompt(
        nextForm,
        template,
        models.find((entry) => entry.modelId === nextForm.modelId)?.name,
      )
    }

    const persistedDraft =
      persistKey ? readPersistedSnapshot(sessionStorage, persistKey) : null

    if (persistedDraft?.form) {
      const restoredForm = {
        ...nextForm,
        ...persistedDraft.form,
        tools: Array.isArray(persistedDraft.form.tools) ? persistedDraft.form.tools : nextForm.tools,
        testScenarios: Array.isArray(persistedDraft.form.testScenarios)
          ? persistedDraft.form.testScenarios
          : nextForm.testScenarios,
        customScenarios: Array.isArray(persistedDraft.form.customScenarios)
          ? persistedDraft.form.customScenarios
          : nextForm.customScenarios,
      }

      if (!restoredForm.systemPrompt.trim()) {
        restoredForm.systemPrompt = buildSystemPrompt(
          restoredForm,
          template,
          models.find((entry) => entry.modelId === restoredForm.modelId)?.name,
        )
      }

      setForm(restoredForm)
      setStep(
        Number.isInteger(persistedDraft.step)
          ? Math.max(0, Math.min(stepLabels.length - 1, persistedDraft.step))
          : 0,
      )
      setToolFilter(
        toolFilters.includes(persistedDraft.toolFilter) ? persistedDraft.toolFilter : 'All',
      )
      setCustomScenario(persistedDraft.customScenario ?? '')
      return
    }

    setForm(nextForm)
    setStep(0)
    setToolFilter('All')
    setCustomScenario('')
  }, [existingAgent, initialModelId, isOpen, models, persistKey, seedPrompt, template])

  useEffect(() => {
    if (!isOpen || !persistKey) return

    try {
      writePersistedSnapshot(
        sessionStorage,
        persistKey,
        {
          step,
          toolFilter,
          customScenario,
          form,
        },
        AGENT_BUILDER_DRAFT_TTL_MS,
      )
    } catch {
      // ignore storage quota and serialization issues for builder drafts
    }
  }, [customScenario, form, isOpen, persistKey, step, toolFilter])

  if (!isOpen) return null

  function updateField(key, value) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function clearPersistedDraft() {
    if (!persistKey) return
    removePersistedSnapshot(sessionStorage, persistKey)
  }

  function handleClose() {
    clearPersistedDraft()
    onClose?.()
  }

  function handleNext() {
    if (step === 0 && !form.systemPrompt.trim()) {
      updateField('systemPrompt', generatedSystemPrompt)
    }

    setStep((current) => Math.min(5, current + 1))
  }

  async function handleSave(nextStatus = form.status ?? 'draft') {
    const payload = {
      sessionId,
      userId,
      templateId: template?.id ?? existingAgent?.templateId ?? null,
      name: form.name || template?.title || 'My Agent',
      modelId: form.modelId,
      systemPrompt: form.systemPrompt || generatedSystemPrompt,
      description: form.description || template?.description || '',
      agentType: form.agentType,
      mainJob: form.mainJob,
      audience: form.audience,
      tone: form.tone,
      avoid: form.avoid,
      notes: form.notes,
      tools: form.tools,
      memoryType: form.memoryType,
      testScenarios: form.testScenarios,
      customScenarios: form.customScenarios,
      deployTarget: form.deployTarget,
      status: nextStatus,
      summary: `${form.agentType || 'Custom'} agent for ${form.audience || 'general'} workflows`,
      greeting: `Hi! I'm ${form.name || template?.title || 'your agent'} - ready to help with ${form.mainJob || 'your workflow'}. How can I help today?`,
    }

    setIsSaving(true)
    try {
      const savedAgent = existingAgent?.id
        ? await agentsService.update(existingAgent.id, payload)
        : await agentsService.create(payload)

      clearPersistedDraft()

      toast({
        title: nextStatus === 'live' ? 'Agent deployed' : 'Agent saved',
        message:
          nextStatus === 'live'
            ? `${savedAgent.name} is live and ready for preview.`
            : `${savedAgent.name} has been saved to your agent workspace.`,
        type: 'success',
      })

      onSaved?.(savedAgent, { openPreview: nextStatus === 'live' })
    } catch (error) {
      toast({
        title: 'Unable to save agent',
        message:
          error?.response?.data?.message ??
          'The agent configuration could not be saved right now.',
        type: 'error',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1400] flex items-start justify-center bg-[rgba(32,25,18,0.42)] px-3 py-3 backdrop-blur-sm sm:px-4 sm:py-8 md:items-center"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2 }}
          className="max-h-[96vh] w-full max-w-[1120px] overflow-hidden rounded-[24px] border border-black/10 bg-[#fbf6ef] shadow-[0_28px_70px_rgba(30,22,14,0.22)] sm:max-h-[92vh] sm:rounded-[34px]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4 border-b border-black/8 bg-white px-4 py-4 sm:px-7 sm:py-5">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[var(--accent)] text-white shadow-[0_10px_24px_rgba(var(--accent-rgb),0.22)]">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <div className="display-font text-[clamp(1.55rem,7vw,2rem)] font-medium tracking-[-0.05em] text-[#17110d]">
                    {step === 0
                      ? "Define your agent's purpose"
                      : step === 1
                        ? 'Write the system prompt'
                        : step === 2
                          ? 'Connect tools & APIs'
                          : step === 3
                            ? 'Set up memory'
                            : step === 4
                              ? 'Test & iterate'
                              : 'Deploy & monitor'}
                  </div>
                  <div className="text-sm text-[#9d8a75]">Step {step + 1} of 6</div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-[#fcfaf7] text-[#8d7b68] transition hover:border-[#e2c0a2] hover:text-[#17110d]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-nowrap gap-4 overflow-x-auto border-b border-black/8 bg-white px-4 py-3 sm:flex-wrap sm:px-7 sm:py-4">
            {stepLabels.map((label, index) => {
              const isComplete = index < step
              const isActive = index === step

              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setStep(index)}
                  className={`inline-flex shrink-0 items-center gap-2 text-sm ${
                    isActive ? 'text-[#17110d]' : isComplete ? 'text-[var(--accent)]' : 'text-[#9b8a78]'
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                      isActive
                        ? 'bg-[var(--accent)] text-white'
                        : isComplete
                          ? 'bg-[#ffe9d6] text-[var(--accent)]'
                          : 'bg-[#f0ece6] text-[#9b8a78]'
                    }`}
                  >
                    {isComplete ? <Check className="h-3.5 w-3.5" /> : index + 1}
                  </span>
                  <span className={isActive ? 'font-semibold' : ''}>{label}</span>
                </button>
              )
            })}
          </div>

          <div className="max-h-[calc(96vh-188px)] overflow-y-auto bg-[#fbf6ef] px-4 py-4 sm:max-h-[calc(92vh-180px)] sm:px-7 sm:py-6">
            {step === 0 ? (
              <div className="space-y-6">
                <div>
                  <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                    Question 1 of 7
                  </div>
                  <div className="mt-3 text-base font-semibold text-[#17110d]">
                    What do you want to call your agent?
                  </div>
                  <input
                    value={form.name}
                    onChange={(event) => updateField('name', event.target.value)}
                    placeholder="e.g. Support Bot, Research Assistant, Code Reviewer..."
                    className="mt-3 w-full rounded-[16px] border border-black/10 bg-white px-4 py-3 text-[15px] outline-none transition focus:border-[var(--accent)]"
                  />
                </div>

                <div>
                  <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                    Question 2 of 7
                  </div>
                  <div className="mt-3 text-base font-semibold text-[#17110d]">
                    What kind of agent is this?
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {purposeTypeOptions.map((option) => {
                      const Icon = option.icon
                      const active = form.agentType === option.value

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => updateField('agentType', option.value)}
                          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
                            active
                              ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[#17110d]'
                              : 'border-black/10 bg-white text-[#6d5d4d] hover:border-[#e6c5a8]'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          {option.value}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                    Question 3 of 7
                  </div>
                  <div className="mt-3 text-base font-semibold text-[#17110d]">
                    What&apos;s the main job? <span className="text-[#9e8b78]">(in plain English)</span>
                  </div>
                  <textarea
                    rows={3}
                    value={form.mainJob}
                    onChange={(event) => updateField('mainJob', event.target.value)}
                    placeholder="e.g. Answer customer questions, handle returns, and create support tickets for issues we can't resolve."
                    className="mt-3 w-full rounded-[18px] border border-black/10 bg-white px-4 py-3 text-[15px] outline-none transition focus:border-[var(--accent)]"
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    {exampleMainJobs.map((example) => (
                      <button
                        key={example}
                        type="button"
                        onClick={() => updateField('mainJob', example)}
                        className="rounded-full border border-[var(--border-strong)] bg-[var(--accent-soft)] px-3 py-1.5 text-xs text-[var(--accent)]"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                    Question 4 of 7
                  </div>
                  <div className="mt-3 text-base font-semibold text-[#17110d]">
                    Who will be talking to this agent?
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {audienceOptions.map((option) => {
                      const Icon = option.icon
                      const active = form.audience === option.value

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => updateField('audience', option.value)}
                          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
                            active
                              ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[#17110d]'
                              : 'border-black/10 bg-white text-[#6d5d4d]'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          {option.value}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                    Question 5 of 7
                  </div>
                  <div className="mt-3 text-base font-semibold text-[#17110d]">
                    How should the agent sound?
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {toneOptions.map((option) => {
                      const Icon = option.icon
                      const active = form.tone === option.value

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => updateField('tone', option.value)}
                          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
                            active
                              ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[#17110d]'
                              : 'border-black/10 bg-white text-[#6d5d4d]'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          {option.value}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9d8a75]">
                    Question 6 of 7 - optional
                  </div>
                  <div className="mt-3 text-base font-semibold text-[#17110d]">
                    Anything it should never do?
                  </div>
                  <textarea
                    rows={3}
                    value={form.avoid}
                    onChange={(event) => updateField('avoid', event.target.value)}
                    placeholder="e.g. Never fabricate data, never promise refunds, never reveal internal tools."
                    className="mt-3 w-full rounded-[18px] border border-black/10 bg-white px-4 py-3 text-[15px] outline-none transition focus:border-[var(--accent)]"
                  />
                </div>
              </div>
            ) : null}

            {step === 1 ? (
              <div className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                      Step 2 of 6
                    </div>
                    <p className="mt-2 max-w-3xl text-[17px] leading-8 text-[#6f604f]">
                      The system prompt defines the agent&apos;s persona, scope, and behaviour. Be
                      explicit about what it should and shouldn&apos;t do.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateField('systemPrompt', generatedSystemPrompt)}
                    className="rounded-full border border-[var(--border-strong)] bg-[var(--accent-soft)] px-4 py-2 text-sm font-medium text-[var(--accent)]"
                  >
                    Regenerate from answers
                  </button>
                </div>

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                  <div className="rounded-[18px] border border-[#cfe8d4] bg-[#ecfaf1] px-4 py-3 text-sm text-[#37795c]">
                    Auto-generated from your Step 1 answers - edit freely below.
                  </div>
                  <div className="rounded-[18px] border border-black/10 bg-white px-4 py-3">
                    <div className="text-xs uppercase tracking-[0.18em] text-[#9f8b77]">
                      Foundation model
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <select
                        value={form.modelId}
                        onChange={(event) => updateField('modelId', event.target.value)}
                        className="w-full appearance-none bg-transparent text-sm font-medium outline-none"
                      >
                        {models.map((model) => (
                          <option key={model.modelId} value={model.modelId}>
                            {model.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="h-4 w-4 text-[#9f8b77]" />
                    </div>
                  </div>
                </div>

                <textarea
                  rows={15}
                  value={form.systemPrompt}
                  onChange={(event) => updateField('systemPrompt', event.target.value)}
                  className="w-full rounded-[20px] border border-black/10 bg-white px-5 py-4 text-[15px] leading-8 outline-none transition focus:border-[var(--accent)]"
                />

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-[20px] border border-black/8 bg-white px-5 py-4">
                    <div className="text-base font-semibold text-[#1a140f]">Include</div>
                    <ul className="mt-3 space-y-2 text-sm leading-7 text-[#6f604f]">
                      <li>Agent persona & role</li>
                      <li>Scope (what it handles)</li>
                      <li>Tone & response length</li>
                      <li>Escalation rules</li>
                      <li>What it must never do</li>
                    </ul>
                  </div>
                  <div className="rounded-[20px] border border-black/8 bg-white px-5 py-4">
                    <div className="text-base font-semibold text-[#1a140f]">Avoid</div>
                    <ul className="mt-3 space-y-2 text-sm leading-7 text-[#6f604f]">
                      <li>Vague instructions</li>
                      <li>Contradictory rules</li>
                      <li>Unnecessary jargon</li>
                      <li>Overly long prompts</li>
                      <li>Missing edge cases</li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="space-y-5">
                <div>
                  <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                    Step 3 of 6
                  </div>
                  <p className="mt-2 max-w-3xl text-[17px] leading-8 text-[#6f604f]">
                    Equip your agent with tools and integrations. Click any tool to open its
                    configuration hint.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    {toolFilters.map((filter) => (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => setToolFilter(filter)}
                        className={`rounded-full px-4 py-2 text-sm ${
                          toolFilter === filter
                            ? 'bg-[var(--accent)] text-white'
                            : 'border border-black/10 bg-white text-[#5f5142]'
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm text-[#5f5142]"
                  >
                    All categories
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  {filteredTools.map((tool) => {
                    const Icon = tool.icon
                    const active = form.tools.includes(tool.id)

                    return (
                      <div
                        key={tool.id}
                        className={`overflow-hidden rounded-[18px] border transition ${
                          active
                            ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                            : 'border-black/10 bg-white'
                        }`}
                      >
                        <label className="flex cursor-pointer items-start gap-3 px-4 py-4">
                          <input
                            type="checkbox"
                            checked={active}
                            onChange={(event) =>
                              updateField(
                                'tools',
                                event.target.checked
                                  ? [...form.tools, tool.id]
                                  : form.tools.filter((entry) => entry !== tool.id),
                              )
                            }
                          />
                          <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[var(--accent-soft)] text-[var(--accent)]">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-base font-semibold text-[#17110d]">{tool.title}</div>
                            <div className="mt-1 text-sm leading-6 text-[#7a6a58]">{tool.description}</div>
                          </div>
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            toast({
                              title: `${tool.title} configuration`,
                              message: `Configuration guidance for ${tool.title} is ready in the builder notes.`,
                            })
                          }
                          className="flex w-full items-center justify-between border-t border-black/8 px-4 py-3 text-sm font-medium text-[var(--accent)]"
                        >
                          How to configure
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    )
                  })}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    toast({
                      title: 'Tool catalog',
                      message: 'Additional tools can be added later as the integrations expand.',
                    })
                  }
                  className="flex w-full items-center gap-2 rounded-[18px] border border-dashed border-black/12 bg-white px-4 py-4 text-sm font-medium text-[#5f5142]"
                >
                  <Plus className="h-4 w-4" />
                  Add more tools
                </button>

                <div className="rounded-[18px] border border-[#cdd9f8] bg-[#edf3ff] px-4 py-4 text-sm leading-7 text-[#4a63b5]">
                  {selectedModel?.name ?? 'Selected models'} support function calling - define
                  tools in JSON schema and the model will invoke them automatically when needed.
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="space-y-5">
                <div>
                  <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                    Step 4 of 6
                  </div>
                  <p className="mt-2 max-w-3xl text-[17px] leading-8 text-[#6f604f]">
                    Configure short-term memory and long-term memory. Let the agent remember user
                    preferences across sessions.
                  </p>
                </div>

                <div className="space-y-4">
                  {memoryOptions.map((option) => {
                    const Icon = option.icon
                    const active = form.memoryType === option.value

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => updateField('memoryType', option.value)}
                        className={`flex w-full items-start gap-4 rounded-[20px] border px-5 py-5 text-left transition ${
                          active
                            ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                            : 'border-black/10 bg-white hover:border-[#e0c0a4]'
                        }`}
                      >
                        <span
                          className={`mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full border ${
                            active ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-black/20 text-transparent'
                          }`}
                        >
                          *
                        </span>
                        <div>
                          <div className="flex items-center gap-2 text-base font-semibold text-[#17110d]">
                            <Icon className="h-4 w-4" />
                            {option.title}
                          </div>
                          <div className="mt-2 text-sm leading-7 text-[#746452]">{option.description}</div>
                        </div>
                      </button>
                    )
                  })}
                </div>

                <div className="rounded-[18px] border border-[#eed39d] bg-[#fff5d8] px-4 py-4 text-sm leading-7 text-[#9f6e18]">
                  <strong>Pro tip:</strong> Long-term memory uses a vector store. Store user
                  preferences, past resolutions, and summaries - not raw conversation logs.
                </div>
              </div>
            ) : null}

            {step === 4 ? (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                      Step 5 of 6
                    </div>
                    <p className="mt-2 max-w-3xl text-[17px] leading-8 text-[#6f604f]">
                      Run the agent through test scenarios covering edge cases. Refine the system
                      prompt based on failures.
                    </p>
                  </div>
                  <div className="text-sm text-[#9b8a78]">{totalScenarioCount} selected</div>
                </div>

                <div className="space-y-2">
                  {defaultTestScenarios.map((scenario, index) => {
                    const active = form.testScenarios.includes(scenario)

                    return (
                      <button
                        key={scenario}
                        type="button"
                        onClick={() =>
                          updateField(
                            'testScenarios',
                            active
                              ? form.testScenarios.filter((entry) => entry !== scenario)
                              : [...form.testScenarios, scenario],
                          )
                        }
                        className={`flex w-full items-center justify-between rounded-[14px] border px-4 py-3 text-left transition ${
                          active
                            ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                            : 'border-black/10 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3 text-sm text-[#17110d]">
                          <span className="flex h-5 w-5 items-center justify-center rounded border border-black/10 bg-white">
                            {active ? <Check className="h-3.5 w-3.5 text-[var(--accent)]" /> : null}
                          </span>
                          {scenario}
                        </div>
                        <span className="text-xs uppercase tracking-[0.16em] text-[#b19a84]">
                          Scenario {index + 1}
                        </span>
                      </button>
                    )
                  })}

                  {form.customScenarios.map((scenario, index) => (
                    <div
                      key={scenario}
                      className="flex w-full items-center justify-between rounded-[14px] border border-[var(--accent)] bg-[var(--accent-soft)] px-4 py-3 text-left transition"
                    >
                      <div className="flex min-w-0 items-center gap-3 text-sm text-[#17110d]">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-black/10 bg-white">
                          <Check className="h-3.5 w-3.5 text-[var(--accent)]" />
                        </span>
                        <span className="truncate">{scenario}</span>
                      </div>
                      <div className="ml-3 flex shrink-0 items-center gap-2">
                        <span className="rounded-full border border-[var(--border-strong)] bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
                          Custom
                        </span>
                        <span className="text-xs uppercase tracking-[0.16em] text-[#b19a84]">
                          Scenario {defaultTestScenarios.length + index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateField(
                              'customScenarios',
                              form.customScenarios.filter((entry) => entry !== scenario),
                            )
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-black/10 bg-white text-[#8c7b68] transition hover:border-[#e0c0a4] hover:text-[#17110d]"
                          aria-label={`Remove custom scenario ${scenario}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 text-center text-xs font-semibold uppercase tracking-[0.28em] text-[#b7a18b]">
                  Manual scenarios
                </div>

                <div className="rounded-[20px] border border-black/10 bg-white px-4 py-4">
                  <div className="text-base font-semibold text-[#17110d]">Add your own test scenario</div>
                  <div className="mt-2 text-sm text-[#7b6b59]">
                    Write a scenario description, then optionally add expected behaviour.
                  </div>
                  <textarea
                    rows={3}
                    value={customScenario}
                    onChange={(event) => setCustomScenario(event.target.value)}
                    placeholder="e.g. User asks in a language the agent wasn't trained for..."
                    className="mt-4 w-full rounded-[18px] border border-black/10 bg-[#fcfaf7] px-4 py-3 text-[15px] outline-none transition focus:border-[var(--accent)]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const nextScenario = customScenario.trim()
                      if (!nextScenario) return
                      updateField('customScenarios', [...form.customScenarios, nextScenario])
                      setCustomScenario('')
                    }}
                    className="mt-3 inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white"
                  >
                    <Plus className="h-4 w-4" />
                    Add scenario
                  </button>
                </div>
              </div>
            ) : null}

            {step === 5 ? (
              <div className="space-y-5">
                <div>
                  <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                    Step 6 of 6
                  </div>
                  <p className="mt-2 max-w-3xl text-[17px] leading-8 text-[#6f604f]">
                    Get a shareable endpoint or embed widget. Monitor performance in the dashboard
                    - track response quality, latency, token usage, and satisfaction scores.
                  </p>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  {deployTargets.map((target) => {
                    const Icon = target.icon
                    const active = form.deployTarget === target.value

                    return (
                      <button
                        key={target.value}
                        type="button"
                        onClick={() => updateField('deployTarget', target.value)}
                        className={`rounded-[20px] border px-5 py-5 text-left transition ${
                          active
                            ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                            : 'border-black/10 bg-white hover:border-[#e0c0a4]'
                        }`}
                      >
                        <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[var(--accent-soft)] text-[var(--accent)]">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="mt-4 text-xl font-semibold tracking-[-0.03em] text-[#17110d]">
                          {target.title}
                        </div>
                        <div className="mt-2 text-sm leading-7 text-[#746452]">{target.description}</div>
                        <div className="mt-3 inline-flex rounded-full border border-[var(--border-strong)] bg-[var(--accent-soft)] px-3 py-1 text-xs text-[var(--accent)]">
                          {target.badge}
                        </div>
                      </button>
                    )
                  })}
                </div>

                <div className="rounded-[22px] border border-black/10 bg-white px-5 py-5">
                  <div className="text-base font-semibold text-[#17110d]">Dashboard Metrics</div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <MetricTile value={`${Math.round((selectedModel?.rating ?? 4.7) * 20)}%`} label="Response quality" />
                    <MetricTile
                      value={
                        selectedModel?.speed === 'fast'
                          ? '1.1s'
                          : selectedModel?.speed === 'medium'
                            ? '1.6s'
                            : '2.3s'
                      }
                      label="Avg latency"
                    />
                    <MetricTile value="12.4K/day" label="Token usage" />
                    <MetricTile value={`${(selectedModel?.rating ?? 4.7).toFixed(1)} *`} label="Satisfaction" />
                  </div>
                </div>

                <div className="rounded-[24px] border border-[var(--border-strong)] bg-gradient-to-br from-[var(--accent-soft)] to-[#fffaf6] px-6 py-7 text-center">
                  <div className="text-3xl">Ready</div>
                  <div className="mt-3 text-[1.7rem] font-semibold tracking-[-0.04em] text-[#17110d]">
                    Your agent is ready to deploy!
                  </div>
                  <div className="mt-2 text-sm leading-7 text-[#7a6a58]">
                    Review your configuration in the summary and click Deploy to go live.
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSave('live')}
                    disabled={isSaving}
                    className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-medium text-white shadow-[0_12px_28px_rgba(var(--accent-rgb),0.22)] disabled:opacity-60"
                  >
                    Deploy Agent
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 border-t border-black/8 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <button
              type="button"
              onClick={() => (step === 0 ? handleClose() : setStep((current) => current - 1))}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-black/10 px-4 py-2 text-sm text-[#54483d] sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4" />
              {step === 0 ? 'Close' : 'Back'}
            </button>

            <div className="flex items-center justify-center gap-2">
              {stepLabels.map((label, index) => (
                <span
                  key={label}
                  className={`h-2.5 w-2.5 rounded-full ${
                    index === step ? 'bg-[var(--accent)]' : 'bg-[#ead8c8]'
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              disabled={
                isSaving ||
                (step === 0 && (!form.name.trim() || !form.mainJob.trim())) ||
                (step === 1 && !form.systemPrompt.trim())
              }
              onClick={() => {
                if (step === 5) {
                  handleSave(form.status ?? 'draft')
                  return
                }
                handleNext()
              }}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white shadow-[0_12px_28px_rgba(var(--accent-rgb),0.22)] disabled:opacity-60 sm:w-auto"
            >
              {step === 5 ? (isSaving ? 'Saving...' : 'Finish') : 'Next'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}


