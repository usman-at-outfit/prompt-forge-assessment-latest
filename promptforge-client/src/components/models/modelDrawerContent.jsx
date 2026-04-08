import {
  BarChart3,
  BriefcaseBusiness,
  Code2,
  Compass,
  FileSearch,
  Globe2,
  GraduationCap,
  Hammer,
  Image,
  MessageSquareQuote,
  PenSquare,
  Users,
  Workflow,
  Wrench,
} from 'lucide-react'

export const modelDrawerTabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'how-to-use', label: 'How to Use' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'prompt-guide', label: 'Prompt Guide' },
  { id: 'agent-creation', label: 'Agent Creation' },
  { id: 'reviews', label: 'Reviews' },
]

const useCaseMeta = {
  'write-content': { label: 'Content writing', icon: PenSquare },
  'create-images': { label: 'Image creation', icon: Image },
  'build-something': { label: 'Build something', icon: Hammer },
  'automate-work': { label: 'Automation', icon: Workflow },
  'analyse-data': { label: 'Data analysis', icon: BarChart3 },
  'just-exploring': { label: 'Exploration', icon: Compass },
  'code-generation': { label: 'Code generation', icon: Code2 },
  'document-analysis': { label: 'Document analysis', icon: FileSearch },
  'my-team': { label: 'Team workflows', icon: Users },
  'my-company': { label: 'Company operations', icon: BriefcaseBusiness },
  'my-customers': { label: 'Customer support', icon: MessageSquareQuote },
  students: { label: 'Education', icon: GraduationCap },
  public: { label: 'Public-facing work', icon: Globe2 },
}

const exampleMap = {
  'write-content': {
    userPrompt:
      'Draft a launch email for our new workflow assistant. Keep it under 180 words and end with a clear CTA.',
    outputLines: [
      'Subject ideas tailored to a product launch announcement.',
      'A concise opening that frames the customer problem and promised outcome.',
      'A CTA section that nudges the reader toward trial or onboarding.',
    ],
    followUp: [
      'How should this change for enterprise buyers versus self-serve customers?',
      'Which version is best for a shorter in-app announcement?',
    ],
  },
  'build-something': {
    userPrompt:
      'Create a scoped implementation plan for a dashboard that tracks support ticket volume, SLA risk, and agent workload.',
    outputLines: [
      'Architecture split into frontend, API, database, and auth responsibilities.',
      'Milestones with testable acceptance criteria for each release slice.',
      'A risk checklist covering permissions, empty states, and error handling.',
    ],
    followUp: [
      'Which parts should be shipped behind a feature flag first?',
      'What metrics should we log from the first production release?',
    ],
  },
  'analyse-data': {
    userPrompt:
      'Summarize this weekly churn report in 3 bullets, identify the biggest risk, and suggest 2 next experiments.',
    outputLines: [
      'The largest churn spike came from new users who never reached first value in week one.',
      'Activation improved for paid cohorts, but retention dropped after the second billing cycle.',
      'The most urgent follow-up is onboarding friction around setup and permissions.',
    ],
    followUp: [
      'Which segment should we prioritize for follow-up interviews?',
      'What would a lightweight executive readout look like?',
    ],
  },
  'automate-work': {
    userPrompt:
      'Design an automation that routes inbound support requests, tags urgency, and drafts first responses for human review.',
    outputLines: [
      'Trigger map for intake, triage, escalation, and review checkpoints.',
      'Fallback logic for missing metadata, duplicate tickets, and low-confidence classification.',
      'A rollout plan with pilot metrics, alerting, and rollback thresholds.',
    ],
    followUp: [
      'Where should a human approval step remain mandatory?',
      'How do we measure quality before enabling full automation?',
    ],
  },
  'document-analysis': {
    userPrompt:
      'Review this policy document, extract the key obligations, list missing definitions, and flag legal-risk sections.',
    outputLines: [
      'Structured summary of the obligations with owners and due dates.',
      'Missing definitions and ambiguous clauses called out for legal review.',
      'A risk section ranking the most sensitive passages by operational impact.',
    ],
    followUp: [
      'Which sections should we convert into a checklist for teams?',
      'How would this summary change for executives versus operators?',
    ],
  },
  'code-generation': {
    userPrompt:
      'Generate a production-ready API endpoint for file uploads with validation, rate limiting, and test coverage.',
    outputLines: [
      'Implementation notes for handlers, validation rules, and storage boundaries.',
      'Edge cases covering file size, content type, retry behavior, and auth failures.',
      'A matching test plan for success paths, bad input, and service outages.',
    ],
    followUp: [
      'Which failure cases should be covered with integration tests first?',
      'How do we keep the output maintainable for a small engineering team?',
    ],
  },
  default: {
    userPrompt:
      'Help me understand the best way to use this model for a real project and give me a practical first prompt.',
    outputLines: [
      'A quick explanation of where the model is strongest and where to stay careful.',
      'A first prompt tailored to a likely use case and audience.',
      'A short list of next steps to validate quality, cost, and speed.',
    ],
    followUp: [
      'What is the safest low-risk way to pilot this model?',
      'Which tasks should we avoid until we validate output quality?',
    ],
  },
}

const reviewProfiles = [
  {
    name: 'Sara K.',
    role: 'ML Engineer at Stripe',
    date: 'Mar 2026',
  },
  {
    name: 'Tariq M.',
    role: 'Founder, EdTech Startup',
    date: 'Feb 2026',
  },
  {
    name: 'Priya N.',
    role: 'Senior Developer at Shopify',
    date: 'Jan 2026',
  },
]

function formatMoney(value) {
  if (value === 0) return '$0'
  if (value < 1) return `$${value.toFixed(2)}`
  if (Number.isInteger(value)) return `$${value}`
  return `$${value.toFixed(1)}`
}

function formatContextWindow(value) {
  if (value >= 1000000) {
    const nextValue = value / 1000000
    return `${Number.isInteger(nextValue) ? nextValue : nextValue.toFixed(1)}M`
  }
  return `${Math.round(value / 1000)}K`
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(value)
}

function latencyForSpeed(speed) {
  if (speed === 'fast') return '~1.1s avg'
  if (speed === 'medium') return '~1.8s avg'
  return '~3.2s avg'
}

function maxOutputForContext(contextWindow) {
  if (contextWindow >= 1000000) return '8,192 tokens'
  if (contextWindow >= 200000) return '6,144 tokens'
  return '4,096 tokens'
}

function statusLabel(model) {
  if (model.isTrending) return 'Hot'
  if (model.isFeatured) return 'Featured'
  if (model.isOpenSource) return 'Open'
  return model.speed === 'fast' ? 'Fast' : 'Live'
}

function inferInputTypes(model) {
  const entries = ['Text']
  if (model.multimodal || model.category?.includes('vision')) entries.push('Images')
  if (model.multimodal) entries.push('Audio')
  if (
    model.useCases?.includes('analyse-data') ||
    model.useCases?.includes('document-analysis')
  ) {
    entries.push('PDFs')
  }
  if (model.category?.includes('code')) entries.push('Code snippets')
  return Array.from(new Set(entries)).slice(0, 4)
}

function inferOutputTypes(model) {
  const entries = ['Text']
  if (model.category?.includes('code')) entries.push('Code')
  if (
    model.useCases?.includes('analyse-data') ||
    model.useCases?.includes('document-analysis')
  ) {
    entries.push('Structured data')
  }
  if (model.category?.includes('vision')) entries.push('Captions')
  return Array.from(new Set(entries)).slice(0, 4)
}

function getUseCaseEntry(value) {
  if (useCaseMeta[value]) return useCaseMeta[value]

  return {
    label: value
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' '),
    icon: Wrench,
  }
}

function getPrimaryUseCase(model) {
  return model.useCases?.[0] ?? 'just-exploring'
}

function buildPricing(model) {
  const blendedPrice = model.inputPricePer1M + model.outputPricePer1M
  const monthlyPrice = blendedPrice <= 2 ? 29 : blendedPrice <= 12 ? 49 : blendedPrice <= 35 ? 99 : 249

  return {
    headline: model.isFree
      ? 'Free tier available for experimentation and prototypes.'
      : `Choose the plan that fits your ${model.lab} workflow and throughput needs.`,
    plans: [
      {
        name: 'Pay-per-use',
        price: `${formatMoney(model.inputPricePer1M)} / 1M in`,
        sublabel: 'Usage based',
        features: [
          `${formatMoney(model.outputPricePer1M)} / 1M out`,
          `${formatContextWindow(model.contextWindow)} context window`,
          `${model.speed} response profile`,
          'Standard support',
        ],
      },
      {
        name: 'Pro Workflow',
        price: `$${monthlyPrice}`,
        sublabel: 'per month',
        highlight: true,
        features: [
          `${formatMoney(Math.max(0, model.inputPricePer1M * 0.75))} / 1M in`,
          `${formatMoney(Math.max(0, model.outputPricePer1M * 0.72))} / 1M out`,
          'Priority queueing and usage dashboard',
          'Higher throughput for teams',
          'Prompt templates and saved presets',
        ],
      },
      {
        name: 'Enterprise',
        price: 'Custom',
        sublabel: 'negotiated pricing',
        features: [
          'Volume discounts and reserved capacity',
          'Security review and procurement support',
          'Dedicated onboarding and success plans',
          'Custom SLAs and reporting',
        ],
      },
    ],
  }
}

function buildPromptGuide(model, primaryUseCaseLabel) {
  return {
    intro: `Use explicit instructions with ${model.name} so the output stays consistent across ${primaryUseCaseLabel.toLowerCase()} workflows.`,
    principles: [
      {
        title: 'Set the role first',
        description: 'Tell the model who it is before asking for the task.',
        prompt: `You are a senior ${primaryUseCaseLabel.toLowerCase()} specialist. Work like an expert operator, stay practical, and avoid filler.`,
      },
      {
        title: 'Specify the output format',
        description: 'State length, structure, and quality bar up front.',
        prompt: `Return the answer in exactly 3 sections: summary, key actions, and risks. Keep each section under 120 words.`,
      },
      {
        title: 'Give context and constraints',
        description: 'Better inputs usually matter more than model size alone.',
        prompt: `Context: This is for a lean product team shipping within two weeks. Constraints: no jargon, include edge cases, and call out open questions.`,
      },
      {
        title: 'Ask for a self-check',
        description: 'A short review step often improves trust and clarity.',
        prompt: `After the answer, add a "Quality check" section listing assumptions, missing data, and one alternative approach.`,
      },
    ],
    tips: [
      'Include the audience, success metric, and deadline in the prompt.',
      'Use delimiters or headings when passing long source material.',
      'For structured output, include a target schema or example.',
      'When cost matters, ask for the shortest useful answer first and iterate.',
    ],
  }
}

function buildHowToUse(model, primaryUseCaseLabel) {
  if (model.howToUseContent) {
    return {
      title: model.howToUseContent.title ?? 'How to Use This Model',
      intro: model.howToUseContent.intro,
      steps: model.howToUseContent.steps ?? [],
      starterRequest:
        model.howToUseContent.steps?.find((step) => step.code)?.code ?? '',
      proTip: model.howToUseContent.proTip ?? '',
      playgroundLabel: model.howToUseContent.playgroundLabel ?? 'Open Playground ->',
    }
  }

  const starterRequest = [
    '{',
    `  model: '${model.modelId}',`,
    "  messages: [",
    "    { role: 'system', content: 'You are a concise expert assistant.' },",
    `    { role: 'user', content: 'Help me with ${primaryUseCaseLabel.toLowerCase()} and keep the answer structured.' },`,
    '  ],',
    '  temperature: 0.4,',
    '  max_tokens: 700,',
    '}',
  ].join('\n')

  return {
    title: 'How to Use This Model',
    intro: `Use ${model.name} inside PromptForge or your provider SDK with a simple, testable first workflow.`,
    steps: [
      {
        title: 'Start with one concrete task',
        description: `Pick a single ${primaryUseCaseLabel.toLowerCase()} outcome before expanding the workflow.`,
      },
      {
        title: 'Define the expected format',
        description: 'Ask for bullets, tables, JSON, or a checklist so the model stays predictable.',
        codeTitle: 'Quick Start (Generic)',
        code: starterRequest,
      },
      {
        title: 'Tune for speed or depth',
        description: `This model is best treated as a ${model.speed} option, so keep requests sized to that response profile.`,
      },
      {
        title: 'Validate with realistic examples',
        description: 'Test two or three real prompts from your team instead of toy examples.',
      },
      {
        title: 'Track quality before scaling',
        description: 'Measure cost, latency, and output consistency before rolling it out broadly.',
      },
    ],
    starterRequest,
    proTip:
      'Pro tip: Start with a small free-tier experiment. Build a minimal working version, measure quality and latency, then scale.',
    playgroundLabel: 'Open Playground ->',
  }
}

function buildAgentCreation(model, primaryUseCaseLabel) {
  return {
    intro: `Turn ${model.name} into a reusable agent by locking the role, tools, and review steps around ${primaryUseCaseLabel.toLowerCase()}.`,
    steps: [
      {
        title: 'Pick the job to be done',
        description: 'Name one repeatable task and one success metric for the agent.',
      },
      {
        title: 'Write the system prompt',
        description: 'Set tone, boundaries, escalation rules, and output expectations.',
      },
      {
        title: 'Choose the right tools',
        description: 'Attach search, files, memory, or database access only when the task needs them.',
      },
      {
        title: 'Set memory carefully',
        description: 'Use conversation history for continuity and longer-term memory only when it improves the workflow.',
      },
      {
        title: 'Run edge-case tests',
        description: 'Test missing data, contradictory input, low-confidence cases, and fallback behavior.',
      },
      {
        title: 'Deploy with monitoring',
        description: 'Track token usage, latency, and user corrections after launch so prompts keep improving.',
      },
    ],
  }
}

function buildRatingBreakdown(rating) {
  if (rating >= 4.8) return { five: 72, four: 20, three: 6, low: 2 }
  if (rating >= 4.6) return { five: 63, four: 24, three: 9, low: 4 }
  if (rating >= 4.4) return { five: 55, four: 27, three: 11, low: 7 }
  return { five: 48, four: 29, three: 14, low: 9 }
}

function buildReviews(model, primaryUseCaseLabel) {
  const breakdown = buildRatingBreakdown(model.rating)

  return {
    summary: `${model.name} is rated highly for ${primaryUseCaseLabel.toLowerCase()}, especially when teams need a dependable ${model.speed} workflow.`,
    breakdown,
    entries: reviewProfiles.map((review, index) => ({
      ...review,
      rating: index === 1 && model.rating < 4.8 ? 4 : 5,
      body:
        index === 0
          ? `${model.name} has been a strong fit for our ${primaryUseCaseLabel.toLowerCase()} workflow. We especially like the balance between output quality, response speed, and clear structure.`
          : index === 1
            ? `We use ${model.name} for weekly deliverables and team-facing drafts. The biggest win is consistency. The main watch-out is keeping prompts specific when the task gets broad.`
            : `${model.name} feels dependable for production work. It handles nuanced instructions well, and the cost remains reasonable when we keep the prompt disciplined and focused.`,
    })),
  }
}

export function buildModelDrawerContent(model) {
  const primaryUseCase = getPrimaryUseCase(model)
  const primaryUseCaseEntry = getUseCaseEntry(primaryUseCase)
  const example = exampleMap[primaryUseCase] ?? exampleMap.default
  const pricing = buildPricing(model)

  return {
    status: statusLabel(model),
    subtitle: `${model.lab} - ${model.multimodal ? 'Multimodal' : 'Text-first'} ${model.isOpenSource ? 'open model' : 'production model'}`,
    quickStats: [
      { label: 'Context', value: formatContextWindow(model.contextWindow) },
      {
        label: 'Pricing',
        value: `${formatMoney(model.inputPricePer1M)} / ${formatMoney(model.outputPricePer1M)}`,
      },
      { label: 'Rating', value: `${model.rating.toFixed(1)} / 5` },
    ],
    overview: {
      description: model.description,
      inputTypes: inferInputTypes(model),
      outputTypes: inferOutputTypes(model),
      contextWindow: formatContextWindow(model.contextWindow),
      maxOutput: maxOutputForContext(model.contextWindow),
      latency: latencyForSpeed(model.speed),
      useCases: (model.useCases ?? []).slice(0, 6).map((entry) => getUseCaseEntry(entry)),
      example: {
        title: 'Example Prompt -> Output',
        userPrompt: example.userPrompt,
        outputLabel: model.name,
        outputLines: example.outputLines,
        followUp: example.followUp,
      },
      benchmarks: Object.entries(model.benchmarks ?? {}),
    },
    howToUse: buildHowToUse(model, primaryUseCaseEntry.label),
    pricing,
    promptGuide: buildPromptGuide(model, primaryUseCaseEntry.label),
    agentCreation: buildAgentCreation(model, primaryUseCaseEntry.label),
    reviews: buildReviews(model, primaryUseCaseEntry.label),
    meta: {
      primaryUseCaseLabel: primaryUseCaseEntry.label,
      reviewCount: formatNumber(model.reviewCount),
    },
  }
}
