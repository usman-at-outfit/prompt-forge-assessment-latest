import {
  ArrowLeft,
  Bot,
  BriefcaseBusiness,
  ChartColumn,
  Copy,
  Eye,
  Handshake,
  MonitorCog,
  NotebookPen,
  PenTool,
  Plus,
  Search,
  Settings2,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AgentBuilderFlow } from '../components/agents-page/AgentBuilderFlow'
import { ActionComposer } from '../components/agents-page/ActionComposer'
import { AgentTemplateCard } from '../components/agents-page/AgentTemplateCard'
import { PageWrapper } from '../components/layout/PageWrapper'
import { toast } from '../components/ui/Toast'
import { fallbackAgentTemplates, fallbackModels } from '../data/fallbackData'
import { getTemplateHubPrompt } from '../data/agentGuideData'
import { readPersistedSnapshot, writePersistedSnapshot } from '../hooks/usePersist'
import { agentsService } from '../services/agentsService'
import { useAuthStore } from '../store/authStore'
import { useModelStore } from '../store/modelStore'

const AGENTS_SESSION_TTL_MS = 4 * 60 * 60 * 1000
const defaultTasks = [
  'Dashboard Layout Adjustments',
  'Design agent system prompt',
  'Configure tool integrations',
  'Review deployment targets',
  'New Task #5',
]

const suggestionGroups = {
  'Use cases': [
    'Build a space exploration timeline app',
    'Create a real-time stock market tracker',
    'Prototype an AI chatbot demo application',
    'Create a project management Kanban board',
  ],
  'Build a business': [
    'Design a lean outbound sales assistant',
    'Create an onboarding workflow for new customers',
    'Build an executive reporting co-pilot',
    'Automate proposal follow ups for my team',
  ],
  'Help me learn': [
    'Teach me how to structure an agent system prompt',
    'Explain tool calling vs memory in simple terms',
    'Show me a strong multi-step support agent setup',
    'Compare agent deployment options for a startup',
  ],
  'Monitor the situation': [
    'Create an incident triage agent for operations',
    'Summarize product feedback from multiple channels',
    'Watch for churn signals across accounts',
    'Track competitive launches and summarize changes',
  ],
  Research: [
    'Summarise latest research on a topic',
    'Find and compare top AI models for my task',
    'Research market trends in my industry',
    'Explain a technical paper in plain English',
    'Map out key players in a new field',
  ],
  'Create content': [
    'Create a launch email sequence',
    'Build a blog drafting assistant',
    'Generate social posts from product updates',
    'Draft customer stories from interview notes',
  ],
  'Analyze & research': [
    'Analyze revenue data and explain the trend',
    'Build a report generator for weekly ops',
    'Compare three GTM plans with pros and cons',
    'Summarize a deck and extract action items',
  ],
}

const previewPromptChips = [
  'What can you do?',
  'Give me a quick summary',
  'Show me an example',
  'How do you handle errors?',
  'What are your limits?',
]

const suggestionGroupMeta = {
  'Use cases': { icon: Bot },
  'Build a business': { icon: BriefcaseBusiness },
  'Help me learn': { icon: Sparkles },
  'Monitor the situation': { icon: Eye },
  Research: { icon: Search },
  'Create content': { icon: PenTool },
  'Analyze & research': { icon: ChartColumn },
}

const defaultBuilderState = {
  open: false,
  template: null,
  existingAgent: null,
  initialModelId: null,
  seedPrompt: '',
}

function getAgentsStorageKey(scope, userId, sessionId) {
  if (userId) return `pf_agents_${scope}_user:${userId}`
  if (sessionId) return `pf_agents_${scope}_guest:${sessionId}`
  return null
}

function formatMemory(memoryType) {
  if (memoryType === 'vector') return 'Short + Long-term'
  if (memoryType === 'history') return 'Short-term'
  return 'None'
}

function LeftRail({
  mode,
  selectedTaskId,
  onSelectTask,
  onAddTask,
  onOpenLibrary,
  onAskHub,
  onBackToWorkspace,
  tasks,
}) {
  return (
    <aside className="flex min-h-0 flex-col justify-between border-b border-black/8 pb-6 xl:min-h-[780px] xl:border-b-0 xl:border-r xl:pb-0 xl:pr-6">
      <div>
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[var(--accent)] text-white shadow-[0_14px_30px_rgba(var(--accent-rgb),0.2)]">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h1 className="display-font text-[clamp(2rem,8vw,2.4rem)] font-medium tracking-[-0.05em] text-[#17110d]">
              Agent Builder
            </h1>
            <p className="mt-2 max-w-[340px] text-sm leading-7 text-[#6f604f] xl:max-w-[250px]">
              Create powerful AI agents using any model. Pick a template or start from scratch.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={mode === 'workspace' ? onOpenLibrary : onBackToWorkspace}
          className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-medium text-white shadow-[0_12px_28px_rgba(var(--accent-rgb),0.18)]"
        >
          {mode === 'workspace' ? <Plus className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
          {mode === 'workspace' ? 'New Agent' : 'Back'}
        </button>

        <div className="mt-5 rounded-[22px] border border-[var(--border-strong)] bg-[var(--accent-soft)] p-5">
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#17110d]">
            <Sparkles className="h-4 w-4 text-[var(--accent)]" />
            Not sure where to start?
          </div>
          <p className="mt-3 text-sm leading-7 text-[#765f4a]">
            Chat with our AI guide - describe what you want your agent to do and get a personalised
            setup plan.
          </p>
          <button
            type="button"
            onClick={onAskHub}
            className="mt-4 rounded-full border border-[var(--border-strong)] bg-white px-4 py-2 text-sm font-medium text-[#5d5146]"
          >
            Ask the Hub
          </button>
        </div>

        <button
          type="button"
          onClick={onAddTask}
          className="mt-5 flex w-full items-center gap-2 rounded-[16px] border border-dashed border-black/12 bg-[#fcfaf7] px-4 py-3 text-sm font-medium text-[#5e5246]"
        >
          <Plus className="h-4 w-4" />
          New Task
        </button>

        <div className="mt-3 space-y-2">
          {tasks.map((task) => (
            <button
              key={task.id}
              type="button"
              onClick={() => onSelectTask(task.id)}
              className={`flex w-full items-center gap-3 border-l-2 px-3 py-3 text-left text-sm transition ${
                selectedTaskId === task.id
                  ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                  : 'border-transparent text-[#18120d] hover:bg-white/70'
              }`}
            >
              <span className="inline-flex h-4 w-4 rounded-[4px] border border-black/12 bg-white" />
              <span className="truncate">{task.title}</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  )
}

function WorkspaceHome({
  activeSuggestionGroup,
  onSelectGroup,
  onSelectSuggestion,
  onShuffleSuggestions,
  promptValue,
  onPromptChange,
  onSubmitPrompt,
}) {
  const suggestions = suggestionGroups[activeSuggestionGroup] ?? suggestionGroups['Use cases']
  const ActiveIcon = suggestionGroupMeta[activeSuggestionGroup]?.icon ?? Bot

  return (
    <div className="space-y-6">
      <div className="border-b border-black/8 px-2 pb-6 pt-2 text-center sm:px-4">
        <h2 className="display-font text-[clamp(2.5rem,10vw,3.35rem)] leading-[0.96] font-medium tracking-[-0.06em] text-[#17110d]">
          Agent works <span className="text-[var(--accent)]">for you.</span>
        </h2>
        <p className="mt-3 text-lg text-[#7b6a57]">
          Your AI agent takes care of everything, end to end.
        </p>
      </div>

      <div className="rounded-[24px] border border-black/10 bg-white shadow-[0_12px_28px_rgba(36,30,21,0.06)]">
        <ActionComposer
          value={promptValue}
          onChange={onPromptChange}
          onSubmit={onSubmitPrompt}
          placeholder="What should we work on next?"
        />

        <div className="border-t border-black/8 px-4 py-4">
          <div className="flex flex-wrap gap-2">
            {Object.keys(suggestionGroups).map((group) => {
              const GroupIcon = suggestionGroupMeta[group]?.icon ?? Bot

              return (
                <button
                  key={group}
                  type="button"
                  onClick={() => onSelectGroup(group)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm ${
                    activeSuggestionGroup === group
                      ? 'bg-[#17110d] text-white'
                      : 'border border-black/10 bg-[#fcfaf7] text-[#5f5142]'
                  }`}
                >
                  <GroupIcon className="h-4 w-4" />
                  {group}
                </button>
              )
            })}
          </div>

          <div className="mt-4 divide-y divide-black/8">
            {suggestions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => onSelectSuggestion(item)}
                className="flex w-full items-center gap-4 px-4 py-4 text-left transition hover:bg-[var(--accent-soft)]"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[var(--accent-soft)] text-[var(--accent)]">
                  <ActiveIcon className="h-4 w-4" />
                </span>
                <span className="text-[15px] text-[#4f4337]">{item}</span>
              </button>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between px-2 text-sm text-[#7d6c5c]">
            <button type="button" className="inline-flex items-center gap-2">
              View all suggestions
            </button>
            <button
              type="button"
              onClick={onShuffleSuggestions}
              className="inline-flex items-center gap-2"
            >
              Shuffle
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function MyAgentsPanel({ agents, activeAgentId, onSelectAgent, onBack, onCreateCustom }) {
  return (
    <div className="flex h-full min-h-0 flex-col border-b border-black/8 bg-[#fffaf3] xl:min-h-[720px] xl:border-b-0 xl:border-r">
      <div className="flex items-center justify-between border-b border-black/8 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[var(--accent)] text-white">
            <Bot className="h-4 w-4" />
          </div>
          <div className="display-font text-[clamp(1.8rem,6vw,2rem)] font-medium tracking-[-0.05em] text-[#17110d]">
            My Agents
          </div>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white text-[#8c7b68]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {agents.length ? (
          <div className="space-y-3">
            {agents.map((agent) => (
              <button
                key={agent.id}
                type="button"
                onClick={() => onSelectAgent(agent.id)}
                className={`flex w-full items-start gap-3 rounded-[18px] border px-4 py-4 text-left transition ${
                  activeAgentId === agent.id
                    ? 'border-[var(--border-strong)] bg-white shadow-[0_12px_28px_rgba(36,30,21,0.06)]'
                    : 'border-transparent hover:border-black/10 hover:bg-white'
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[var(--accent-soft)] text-[var(--accent)]">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-[#17110d]">{agent.name}</div>
                  <div className="truncate text-xs text-[#9c8a78]">{`${agent.modelId} / ${formatMemory(agent.memoryType)}`}</div>
                </div>
                <span
                  className={`mt-1 h-2.5 w-2.5 rounded-full ${
                    agent.status === 'live' ? 'bg-emerald-400' : 'bg-[#d7c4b1]'
                  }`}
                />
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-[18px] border border-dashed border-black/12 bg-white px-4 py-5 text-sm leading-7 text-[#7b6a57]">
            No saved agents yet. Pick a template on the right or create one from scratch.
          </div>
        )}
      </div>

      <div className="border-t border-black/8 p-5">
        <button
          type="button"
          onClick={onCreateCustom}
          className="inline-flex w-full items-center justify-center gap-2 rounded-[16px] bg-[var(--accent)] px-4 py-3 text-sm font-medium text-white shadow-[0_12px_28px_rgba(var(--accent-rgb),0.18)]"
        >
          <Sparkles className="h-4 w-4" />
          Create Custom Agent
        </button>
      </div>
    </div>
  )
}

function AgentPreview({ agent, onBack, onEdit, onDelete, onSendMessage }) {
  const [previewInput, setPreviewInput] = useState('')
  const [isReplying, setIsReplying] = useState(false)
  const listRef = useRef(null)

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [agent?.previewMessages])

  return (
    <div className="grid min-h-0 gap-5 xl:min-h-[780px] xl:grid-cols-[minmax(0,1fr)_260px]">
      <div className="flex min-h-0 flex-col rounded-[26px] border border-black/8 bg-[#fcfaf7] shadow-[0_12px_28px_rgba(36,30,21,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/8 px-5 py-4">
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm text-[#5d5146]"
            >
              <ArrowLeft className="h-4 w-4" />
              Agents
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[var(--accent)] text-white">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <div className="text-[clamp(1.5rem,6vw,2rem)] font-semibold tracking-[-0.04em] text-[#17110d]">
                    {agent.name}
                  </div>
                  <span className="rounded-full border border-[#bfe7d3] bg-[#effcf4] px-3 py-1 text-xs font-medium text-[#2f8a61]">
                    {agent.status === 'live' ? 'Live' : 'Draft'}
                  </span>
                </div>
                <div className="text-sm text-[#9d8a75]">
                  {`Tools: ${agent.tools.length ? agent.tools.join(', ') : 'None'} / Memory: ${formatMemory(agent.memoryType)}`}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm text-[#5f5142]"
            >
              <Settings2 className="mr-2 inline h-4 w-4" />
              Settings
            </button>
            <button
              type="button"
              className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm text-[#5f5142]"
            >
              <MonitorCog className="mr-2 inline h-4 w-4" />
              Monitor
            </button>
            <button
              type="button"
              onClick={onEdit}
              className="rounded-full border border-[var(--border-strong)] bg-[var(--accent-soft)] px-4 py-2 text-sm font-medium text-[var(--accent)]"
            >
              <NotebookPen className="mr-2 inline h-4 w-4" />
              Edit Agent
            </button>
          </div>
        </div>

        <div className="border-b border-black/8 px-5 py-3">
          <div className="flex flex-wrap gap-2">
            {previewPromptChips.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={async () => {
                  setIsReplying(true)
                  try {
                    await onSendMessage(prompt)
                  } finally {
                    setIsReplying(false)
                  }
                }}
                className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm text-[#5f5142]"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        <div ref={listRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
          {(agent.previewMessages ?? []).map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-full rounded-[22px] border px-4 py-4 text-[15px] leading-8 sm:max-w-[760px] sm:px-5 ${
                  message.role === 'user'
                    ? 'border-[var(--border-strong)] bg-[var(--accent-soft)] text-[#5d3b24]'
                    : 'border-black/8 bg-white text-[#261f19]'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-black/8 px-4 py-4">
          <ActionComposer
            value={previewInput}
            onChange={setPreviewInput}
            placeholder="Describe your project, ask a question, or just say hi - I'm here to help..."
            submitLabel="Send"
            trailingLabel="Agent"
            onSubmit={async ({ text, files }) => {
              setIsReplying(true)
              try {
                const payload = [text, ...files.map((file) => `[Attachment] ${file.name}`)]
                  .filter(Boolean)
                  .join('\n')
                await onSendMessage(payload)
                setPreviewInput('')
              } finally {
                setIsReplying(false)
              }
            }}
          />
          {isReplying ? <div className="mt-3 text-sm text-[#9d8a75]">Agent is responding...</div> : null}
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-[22px] border border-black/8 bg-white px-4 py-4">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9d8a75]">Agent info</div>
          <div className="mt-3 space-y-3">
            <div className="rounded-[16px] bg-[#fcfaf7] px-4 py-3">
              <div className="text-xs text-[#a08d79]">Status</div>
              <div className="mt-1 font-semibold text-[#17110d]">{agent.status === 'live' ? 'Deployed & Live' : 'Draft'}</div>
            </div>
            <div className="rounded-[16px] bg-[#fcfaf7] px-4 py-3">
              <div className="text-xs text-[#a08d79]">Memory</div>
              <div className="mt-1 font-semibold text-[#17110d]">{formatMemory(agent.memoryType)}</div>
            </div>
            <div className="rounded-[16px] bg-[#fcfaf7] px-4 py-3">
              <div className="text-xs text-[#a08d79]">Tools Connected</div>
              <div className="mt-1 font-semibold text-[#17110d]">{agent.tools.length || 'None connected'}</div>
            </div>
          </div>
        </div>

        <div className="rounded-[22px] border border-black/8 bg-white px-4 py-4">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9d8a75]">Live metrics</div>
          <div className="mt-3 grid gap-2">
            <div className="rounded-[14px] bg-[#fcfaf7] px-4 py-3 text-sm text-[#5f5142]">
              Messages
              <span className="float-right font-semibold text-[#17110d]">{agent.metrics?.messageCount ?? 0}</span>
            </div>
            <div className="rounded-[14px] bg-[#fcfaf7] px-4 py-3 text-sm text-[#5f5142]">
              Avg latency
              <span className="float-right font-semibold text-[#17110d]">
                {agent.metrics?.avgLatencyMs ? `${(agent.metrics.avgLatencyMs / 1000).toFixed(1)}s` : '--'}
              </span>
            </div>
            <div className="rounded-[14px] bg-[#fcfaf7] px-4 py-3 text-sm text-[#5f5142]">
              Tokens used
              <span className="float-right font-semibold text-[#17110d]">{agent.metrics?.tokensUsed ?? 0}</span>
            </div>
          </div>
        </div>

        <div className="rounded-[22px] border border-black/8 bg-white px-4 py-4">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9d8a75]">Actions</div>
          <div className="mt-3 space-y-2">
            <button
              type="button"
              onClick={onEdit}
              className="flex w-full items-center gap-2 rounded-[14px] border border-black/10 bg-[#fcfaf7] px-4 py-3 text-sm text-[#5f5142]"
            >
              <NotebookPen className="h-4 w-4" />
              Edit configuration
            </button>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(`https://promptforge.local/agent/${agent.id}`)
                toast({
                  title: 'Copied',
                  message: 'Endpoint URL copied to clipboard.',
                })
              }}
              className="flex w-full items-center gap-2 rounded-[14px] border border-black/10 bg-[#fcfaf7] px-4 py-3 text-sm text-[#5f5142]"
            >
              <Copy className="h-4 w-4" />
              Copy endpoint URL
            </button>
            <button
              type="button"
              onClick={() =>
                toast({
                  title: 'Dashboard',
                  message: 'Live dashboard monitoring will expand here.',
                })
              }
              className="flex w-full items-center gap-2 rounded-[14px] border border-black/10 bg-[#fcfaf7] px-4 py-3 text-sm text-[#5f5142]"
            >
              <Eye className="h-4 w-4" />
              View dashboard
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="flex w-full items-center gap-2 rounded-[14px] border border-[#f3c1bc] bg-[#fff5f4] px-4 py-3 text-sm text-[#bf574f]"
            >
              <Trash2 className="h-4 w-4" />
              Delete agent
            </button>
            <button
              type="button"
              onClick={onBack}
              className="flex w-full items-center gap-2 rounded-[14px] border border-black/10 bg-white px-4 py-3 text-sm text-[#5f5142]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Agents
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function AgentsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const sessionId = useAuthStore((state) => state.sessionId)
  const userId = useAuthStore((state) => state.user?.id ?? null)
  const loadModels = useModelStore((state) => state.actions.loadModels)
  const selectModel = useModelStore((state) => state.actions.selectModel)
  const models = useModelStore((state) => state.allModels)

  const [templates, setTemplates] = useState(fallbackAgentTemplates)
  const [agents, setAgents] = useState([])
  const [mode, setMode] = useState('workspace')
  const [selectedTaskId, setSelectedTaskId] = useState('task-5')
  const [tasks, setTasks] = useState(
    defaultTasks.map((title, index) => ({ id: `task-${index + 1}`, title })),
  )
  const [activeSuggestionGroup, setActiveSuggestionGroup] = useState('Use cases')
  const [workspacePrompt, setWorkspacePrompt] = useState('')
  const [builderState, setBuilderState] = useState(defaultBuilderState)
  const [activeAgentId, setActiveAgentId] = useState(null)
  const [hasHydratedPersistedState, setHasHydratedPersistedState] = useState(false)

  const allModelPool = models.length ? models : fallbackModels
  const pagePersistKey = useMemo(
    () => getAgentsStorageKey('page', userId, sessionId),
    [sessionId, userId],
  )
  const builderPersistKey = useMemo(
    () => getAgentsStorageKey('builder', userId, sessionId),
    [sessionId, userId],
  )
  const scratchTemplate = useMemo(
    () => templates.find((entry) => entry.id === 'custom-agent') ?? fallbackAgentTemplates.at(-1),
    [templates],
  )
  const activeAgent = useMemo(
    () => agents.find((entry) => entry.id === activeAgentId) ?? null,
    [activeAgentId, agents],
  )
  const resolvedMode = mode === 'preview' && !activeAgent ? 'library' : mode

  useEffect(() => {
    if (!pagePersistKey) {
      setHasHydratedPersistedState(true)
      return
    }

    const snapshot = readPersistedSnapshot(sessionStorage, pagePersistKey)

    if (snapshot) {
      setMode(snapshot.mode === 'library' || snapshot.mode === 'preview' ? snapshot.mode : 'workspace')
      setSelectedTaskId(snapshot.selectedTaskId ?? 'task-5')
      setTasks(
        Array.isArray(snapshot.tasks) && snapshot.tasks.length
          ? snapshot.tasks
          : defaultTasks.map((title, index) => ({ id: `task-${index + 1}`, title })),
      )
      setActiveSuggestionGroup(
        Object.prototype.hasOwnProperty.call(suggestionGroups, snapshot.activeSuggestionGroup)
          ? snapshot.activeSuggestionGroup
          : 'Use cases',
      )
      setWorkspacePrompt(snapshot.workspacePrompt ?? '')
      setBuilderState({
        ...defaultBuilderState,
        ...(snapshot.builderState ?? {}),
      })
      setActiveAgentId(snapshot.activeAgentId ?? null)
    }

    setHasHydratedPersistedState(true)
  }, [pagePersistKey])

  useEffect(() => {
    if (!pagePersistKey || !hasHydratedPersistedState) return

    try {
      writePersistedSnapshot(
        sessionStorage,
        pagePersistKey,
        {
          mode,
          selectedTaskId,
          tasks,
          activeSuggestionGroup,
          workspacePrompt,
          builderState,
          activeAgentId,
        },
        AGENTS_SESSION_TTL_MS,
      )
    } catch {
      // ignore storage serialization and quota failures
    }
  }, [
    activeAgentId,
    activeSuggestionGroup,
    builderState,
    hasHydratedPersistedState,
    mode,
    pagePersistKey,
    selectedTaskId,
    tasks,
    workspacePrompt,
  ])

  useEffect(() => {
    loadModels()
  }, [loadModels])

  useEffect(() => {
    let cancelled = false

    async function loadAgentWorkspace() {
      try {
        const [templateData, agentData] = await Promise.all([
          agentsService.templates(),
          agentsService.list({ sessionId, userId }),
        ])

        if (cancelled) return
        setTemplates(templateData?.length ? templateData : fallbackAgentTemplates)
        setAgents(agentData)
        if (!activeAgentId && agentData.length) {
          setActiveAgentId(agentData[0].id)
        }
      } catch {
        if (cancelled) return
        setTemplates(fallbackAgentTemplates)
        setAgents([])
      }
    }

    loadAgentWorkspace()

    return () => {
      cancelled = true
    }
  }, [sessionId, userId])

  useEffect(() => {
    const builderPayload = location.state?.agentBuilder
    if (!builderPayload || !templates.length) return

    const matchedTemplate =
      templates.find((entry) => entry.id === builderPayload.templateId) ?? scratchTemplate

    setMode('library')
    setBuilderState({
      open: Boolean(builderPayload.openBuilder),
      template: matchedTemplate,
      existingAgent: null,
      initialModelId: builderPayload.selectedModelId ?? null,
      seedPrompt: builderPayload.seedPrompt ?? '',
    })

    if (builderPayload.selectedModelId) {
      const selectedModel = allModelPool.find(
        (entry) => entry.modelId === builderPayload.selectedModelId,
      )
      if (selectedModel) {
        selectModel(selectedModel)
      }
    }

    navigate(location.pathname, { replace: true, state: null })
  }, [allModelPool, location.pathname, location.state, navigate, scratchTemplate, selectModel, templates])

  function openBuilder({ template = scratchTemplate, agent = null, seedPrompt = '', modelId = null }) {
    if (modelId) {
      const nextModel = allModelPool.find((entry) => entry.modelId === modelId)
      if (nextModel) {
        selectModel(nextModel)
      }
    }

    setBuilderState({
      open: true,
      template,
      existingAgent: agent,
      initialModelId: modelId,
      seedPrompt,
    })
  }

  function closeBuilder() {
    setBuilderState(defaultBuilderState)
  }

  function openLibrary() {
    setMode('library')
  }

  function launchGuide(template = null) {
    navigate('/hub', {
      state: {
        agentGuide: {
          template,
          prompt: getTemplateHubPrompt(template),
        },
      },
    })
  }

  async function handleWorkspaceSubmit({ text, files }) {
    const seedPrompt = [text, ...files.map((file) => `[Asset] ${file.name}`)]
      .filter(Boolean)
      .join('\n')
      .trim()

    if (!seedPrompt) return

    setMode('library')
    openBuilder({
      template: scratchTemplate,
      seedPrompt,
    })
    setWorkspacePrompt('')
  }

  function handleShuffleSuggestions() {
    const groupNames = Object.keys(suggestionGroups)
    const currentIndex = groupNames.indexOf(activeSuggestionGroup)
    const nextIndex = currentIndex === groupNames.length - 1 ? 0 : currentIndex + 1
    setActiveSuggestionGroup(groupNames[nextIndex])
  }

  async function handleSaveAgent(savedAgent, meta = {}) {
    setAgents((current) => {
      const existingIndex = current.findIndex((entry) => entry.id === savedAgent.id)
      if (existingIndex >= 0) {
        const next = [...current]
        next[existingIndex] = savedAgent
        return next
      }
      return [savedAgent, ...current]
    })
    setActiveAgentId(savedAgent.id)
    closeBuilder()
    setMode(meta.openPreview ? 'preview' : 'library')
  }

  async function handleDeleteAgent(agentId = activeAgentId) {
    if (!agentId) return

    try {
      await agentsService.remove(agentId)
      const remainingAgents = agents.filter((entry) => entry.id !== agentId)
      setAgents(remainingAgents)
      setMode('library')
      setActiveAgentId(remainingAgents[0]?.id ?? null)
      toast({
        title: 'Agent removed',
        message: 'The agent has been deleted from your workspace.',
      })
    } catch {
      toast({
        title: 'Delete failed',
        message: 'We could not delete this agent right now.',
        type: 'error',
      })
    }
  }

  async function handlePreviewSend(message) {
    if (!activeAgent?.id || !message.trim()) return

    try {
      const response = await agentsService.respond(activeAgent.id, message)
      setAgents((current) =>
        current.map((entry) => (entry.id === response.agent.id ? response.agent : entry)),
      )
    } catch {
      toast({
        title: 'Preview unavailable',
        message: 'The agent could not respond right now.',
        type: 'error',
      })
    }
  }

  return (
    <PageWrapper className="mx-auto max-w-[1700px] px-4 lg:px-8">
      <div className="grid gap-6 xl:grid-cols-[290px_minmax(0,1fr)]">
        <LeftRail
          mode={resolvedMode}
          selectedTaskId={selectedTaskId}
          tasks={tasks}
          onSelectTask={(taskId) => {
            setSelectedTaskId(taskId)
            const selectedTask = tasks.find((entry) => entry.id === taskId)
            if (selectedTask) {
              setWorkspacePrompt(selectedTask.title)
              setMode('workspace')
            }
          }}
          onAddTask={() => {
            const nextTask = {
              id: crypto.randomUUID(),
              title: `New Task #${tasks.length + 1}`,
            }
            setTasks((current) => [...current, nextTask])
            setSelectedTaskId(nextTask.id)
          }}
          onOpenLibrary={openLibrary}
          onBackToWorkspace={() => setMode('workspace')}
          onAskHub={() => launchGuide(builderState.template)}
        />

        <div className="min-w-0">
          {resolvedMode === 'workspace' ? (
            <WorkspaceHome
              activeSuggestionGroup={activeSuggestionGroup}
              onSelectGroup={setActiveSuggestionGroup}
              onSelectSuggestion={setWorkspacePrompt}
              onShuffleSuggestions={handleShuffleSuggestions}
              promptValue={workspacePrompt}
              onPromptChange={setWorkspacePrompt}
              onSubmitPrompt={handleWorkspaceSubmit}
            />
          ) : null}

          {resolvedMode === 'library' ? (
            <div className="grid min-h-0 gap-6 xl:min-h-[780px] xl:grid-cols-[280px_minmax(0,1fr)]">
              <MyAgentsPanel
                agents={agents}
                activeAgentId={activeAgentId}
                onSelectAgent={(agentId) => {
                  setActiveAgentId(agentId)
                  setMode('preview')
                }}
                onBack={() => setMode('workspace')}
                onCreateCustom={() =>
                  openBuilder({
                    template: scratchTemplate,
                  })
                }
              />

              <div className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-black/8 pb-5">
                  <div>
                    <h2 className="display-font text-[clamp(2.25rem,8vw,3rem)] font-medium tracking-[-0.05em] text-[#17110d]">
                      Agent Library
                    </h2>
                    <p className="mt-2 text-sm text-[#7a6a58]">
                      Choose a default agent or build your own.
                    </p>
                  </div>
                  <div className="rounded-full bg-[#17110d] px-4 py-2 text-sm font-medium text-white">
                    Default Agents
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {templates.map((template) => (
                    <AgentTemplateCard
                      key={template.id}
                      template={template}
                      onUse={(entry) =>
                        openBuilder({
                          template: entry,
                          modelId: entry.recommendedModelIds?.[0] ?? null,
                        })
                      }
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {resolvedMode === 'preview' && activeAgent ? (
            <AgentPreview
              agent={activeAgent}
              onBack={() => setMode('library')}
              onEdit={() =>
                openBuilder({
                  template:
                    templates.find((entry) => entry.id === activeAgent.templateId) ??
                    scratchTemplate,
                  agent: activeAgent,
                  modelId: activeAgent.modelId,
                })
              }
              onDelete={() => handleDeleteAgent(activeAgent.id)}
              onSendMessage={handlePreviewSend}
            />
          ) : null}
        </div>
      </div>

      <AgentBuilderFlow
        isOpen={builderState.open}
        template={builderState.template}
        existingAgent={builderState.existingAgent}
        initialModelId={builderState.initialModelId}
        seedPrompt={builderState.seedPrompt}
        models={allModelPool}
        sessionId={sessionId}
        userId={userId}
        persistKey={builderPersistKey}
        onClose={closeBuilder}
        onSaved={handleSaveAgent}
      />
    </PageWrapper>
  )
}

