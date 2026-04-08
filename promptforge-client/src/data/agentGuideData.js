import {
  BriefcaseBusiness,
  ChartColumn,
  Code2,
  Globe2,
  Handshake,
  GraduationCap,
  PenTool,
  Plus,
  Search,
  User,
  Users,
} from 'lucide-react'

export const agentTemplateIcons = {
  Search,
  BriefcaseBusiness,
  Code2,
  ChartColumn,
  PenTool,
  Handshake,
  Plus,
}

export const agentAudienceIcons = {
  'just-me': User,
  'my-team': Users,
  'my-company': BriefcaseBusiness,
  'my-customers': Users,
  students: GraduationCap,
  public: Globe2,
}

export const agentAudienceOptions = [
  {
    id: 'just-me',
    label: 'Just me',
    description: 'Personal use',
  },
  {
    id: 'my-team',
    label: 'My team',
    description: 'Small group, work',
  },
  {
    id: 'my-company',
    label: 'My company',
    description: 'Business / enterprise',
  },
  {
    id: 'my-customers',
    label: 'My customers',
    description: 'Building for end-users',
  },
  {
    id: 'students',
    label: 'Students',
    description: 'Education / learning',
  },
  {
    id: 'public',
    label: 'Anyone / public',
    description: 'Open to the world',
  },
]

function normalize(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
}

function formatPrice(model) {
  if (!model) return '$0/1M tk'
  const value = model.inputPricePer1M
  if (value === 0) return '$0/1M tk'
  if (value < 1) return `$${value.toFixed(2)}/1M tk`
  return `$${value.toFixed(2)}/1M tk`
}

function modelSubline(model) {
  if (!model) return ''
  if (model.tags?.includes('flagship')) return `Flagship - ${formatPrice(model)}`
  if (model.tags?.includes('long-context')) return `Long context - ${formatPrice(model)}`
  if (model.tags?.includes('value')) return `Best value - ${formatPrice(model)}`
  if (model.isOpenSource) return `Open model - ${formatPrice(model)}`
  return `${model.speed[0].toUpperCase()}${model.speed.slice(1)} - ${formatPrice(model)}`
}

export function getTemplateHubPrompt(template) {
  return template?.hubPrompt ?? 'Help me build an AI agent - walk me through it'
}

export function getTemplateRecommendedModels(template, models = []) {
  const directMatches = (template?.recommendedModelIds ?? [])
    .map((modelId) => models.find((entry) => entry.modelId === modelId))
    .filter(Boolean)

  if (directMatches.length) {
    return directMatches
  }

  const fallbacks = (template?.modelTags ?? [])
    .map((tag) =>
      models.find(
        (entry) =>
          normalize(entry.name) === normalize(tag) || normalize(entry.modelId) === normalize(tag),
      ),
    )
    .filter(Boolean)

  if (fallbacks.length) {
    return fallbacks
  }

  const prioritizedIds = ['gpt-5', 'kimi-k2', 'gpt-4o', 'claude-sonnet-4']
  return prioritizedIds
    .map((modelId) => models.find((entry) => entry.modelId === modelId))
    .filter(Boolean)
}

export function getGuideRecommendations({ template, models = [], audience }) {
  const selected = getTemplateRecommendedModels(template, models).slice(0, 2)

  return selected.map((model) => ({
    model,
    subtitle: modelSubline(model),
    reason:
      audience === 'my-company'
        ? `${model.name} is a strong fit for production rollouts where governance, quality, and repeatability matter.`
        : audience === 'my-customers'
          ? `${model.name} balances quality and responsiveness well for customer-facing agents.`
          : audience === 'students'
            ? `${model.name} stays approachable while still handling guided explanation and step-by-step reasoning.`
            : `${model.name} is a strong foundation model for agent workflows that need reliability and clear structure.`,
  }))
}

const deepDiveByModelId = {
  'gpt-5': {
    intro:
      'Before we pick a version of GPT-5, here are helpful questions people ask. Tap any to learn more, or continue to select a version.',
    questions: [
      {
        id: 'best-at',
        label: 'What is GPT-5 best at?',
        answer:
          'GPT-5 is strongest when you need multi-step reasoning, strong tool orchestration, and polished outputs across text, code, and multimodal work.',
      },
      {
        id: 'latency',
        label: 'How fast is it and what affects latency?',
        answer:
          'It is usually fast for short requests, but long context, tool calls, and complex instructions all increase latency. Keeping prompts focused helps a lot.',
      },
      {
        id: 'cost',
        label: 'What does it cost at small vs large scale?',
        answer:
          'GPT-5 is premium priced, so it is best when quality matters more than sheer volume. Teams often prototype with it, then decide whether to route lighter work elsewhere.',
      },
      {
        id: 'tools',
        label: 'Does it support function/tool calling?',
        answer:
          'Yes. GPT-5 works well for structured tool use, multi-step agent loops, and workflows where the model needs to decide between tools or ask clarifying questions.',
      },
      {
        id: 'formats',
        label: 'What input/output formats work best?',
        answer:
          'Clear structured prompts work best: role, task, constraints, output format, and acceptance criteria. JSON or sectioned text works especially well for agents.',
      },
      {
        id: 'context',
        label: 'How does context window impact results?',
        answer:
          'The long context is useful for agent memory, long documents, and multi-part instructions, but larger payloads still cost more and can slow responses down.',
      },
      {
        id: 'compare',
        label: 'How does GPT-5 compare to alternatives?',
        answer:
          'Compared with lower-cost options, GPT-5 usually wins on reasoning depth and consistency. Compared with specialized models, it trades some cost efficiency for flexibility.',
      },
      {
        id: 'privacy',
        label: 'What about privacy and data safety?',
        answer:
          'For production use, keep sensitive data rules explicit, route private data carefully, and pair the model with clear tool boundaries, logging rules, and review steps.',
      },
      {
        id: 'starter-prompts',
        label: 'Show a few great starter prompts.',
        answer:
          'A strong starter prompt says who the agent is, what success looks like, what tools it may use, when it must escalate, and the exact response format it should return.',
      },
    ],
  },
  'kimi-k2': {
    intro:
      'Before choosing Kimi K2, here are the practical questions builders usually ask. Tap one to see the tradeoff or continue to select a version.',
    questions: [
      {
        id: 'best-at',
        label: 'What is Kimi K2 best at?',
        answer:
          'Kimi K2 is especially good for long-context planning, affordable agent experimentation, and workflows where you need a lot of iterative drafting without premium pricing.',
      },
      {
        id: 'latency',
        label: 'How fast is it and what affects latency?',
        answer:
          'It is usually quick for normal chat and planning tasks. Latency increases mostly with very long context or dense reasoning instructions.',
      },
      {
        id: 'cost',
        label: 'What makes it cost-effective?',
        answer:
          'Its lower token price makes it easier to run agent loops, repeated drafts, and evaluation workflows without burning through budget too quickly.',
      },
      {
        id: 'tools',
        label: 'Is it a good fit for agents?',
        answer:
          'Yes, especially for teams that want a capable planning model for repeated tool use and longer working memory, but still want cost discipline.',
      },
      {
        id: 'formats',
        label: 'What prompt format works best?',
        answer:
          'Give it a clear role, a strict output format, and a short checklist for tool use or escalation. That keeps agent behavior more predictable.',
      },
      {
        id: 'compare',
        label: 'How does it compare to GPT-5?',
        answer:
          'Kimi K2 is often the better value choice for iterative workflows, while GPT-5 is typically the stronger premium option for difficult reasoning and polished delivery.',
      },
    ],
  },
}

export function getModelDeepDive(model) {
  return (
    deepDiveByModelId[model?.modelId] ?? {
      intro:
        `Before choosing ${model?.name ?? 'this model'}, here are the questions people usually ask. Tap one to learn more or continue to select a version.`,
      questions: [
        {
          id: 'fit',
          label: `What is ${model?.name ?? 'this model'} best at?`,
          answer:
            `${model?.name ?? 'This model'} is a strong fit when you want a reliable agent foundation with clear prompting, predictable structure, and a balance between speed and quality.`,
        },
        {
          id: 'latency',
          label: 'How fast is it and what affects latency?',
          answer:
            'Latency depends mostly on context size, output length, and whether the workflow uses tools or multiple steps. Smaller prompts generally feel much faster.',
        },
        {
          id: 'cost',
          label: 'What does it cost at scale?',
          answer:
            'Start with a narrow test flow, measure token usage in production-like traffic, and only then decide whether the model remains the right cost-quality fit.',
        },
      ],
    }
  )
}
