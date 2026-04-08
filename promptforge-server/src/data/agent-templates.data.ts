export const seedAgentTemplates = [
  {
    id: 'research-agent',
    icon: 'Search',
    title: 'Research Agent',
    description:
      'Automates web research, summarizes findings, and generates structured reports on demand.',
    modelTags: ['GPT-5', 'Web search', 'Reports'],
    recommendedModelIds: ['gpt-5', 'kimi-k2'],
    useCase: 'agents',
    hubPrompt: 'Help me build a research agent - walk me through it',
    systemPrompt:
      'You are a research agent. Gather context, compare evidence, and return a concise report with confidence notes.',
  },
  {
    id: 'customer-support',
    icon: 'BriefcaseBusiness',
    title: 'Customer Support Agent',
    description:
      'Handles tickets, FAQs, and escalates complex issues with full conversation context.',
    modelTags: ['GPT-4o', 'Ticketing', 'Escalation'],
    recommendedModelIds: ['gpt-4o', 'command-r-plus'],
    useCase: 'my-customers',
    hubPrompt: 'Help me build a customer support agent - walk me through it',
    systemPrompt:
      'You are a support agent. Solve issues clearly, ask focused questions, and escalate when required.',
  },
  {
    id: 'code-review',
    icon: 'Code2',
    title: 'Code Review Agent',
    description:
      'Reviews pull requests, flags bugs, suggests improvements, and explains changes inline.',
    modelTags: ['GPT-5', 'GitHub', 'Code'],
    recommendedModelIds: ['gpt-5', 'codestral'],
    useCase: 'code-generation',
    hubPrompt: 'Help me build a code review agent - walk me through it',
    systemPrompt:
      'You are a code review agent. Prioritize correctness, risks, and actionable feedback.',
  },
  {
    id: 'data-analysis',
    icon: 'ChartColumn',
    title: 'Data Analysis Agent',
    description:
      'Processes spreadsheets, generates insights, creates visualizations, and answers data questions.',
    modelTags: ['Gemini', 'Spreadsheets', 'Charts'],
    recommendedModelIds: ['gemini-2.5-pro', 'gpt-5'],
    useCase: 'analyse-data',
    hubPrompt: 'Help me build a data analysis agent - walk me through it',
    systemPrompt:
      'You are a data analysis agent. Organize evidence, interpret metrics, and recommend decisions.',
  },
  {
    id: 'content-writer',
    icon: 'PenTool',
    title: 'Content Writer Agent',
    description:
      'Creates blog posts, social content, and marketing copy with consistent brand voice.',
    modelTags: ['Claude Sonnet 4', 'Marketing', 'SEO'],
    recommendedModelIds: ['claude-sonnet-4', 'gpt-5'],
    useCase: 'write-content',
    hubPrompt: 'Help me build a content writer agent - walk me through it',
    systemPrompt:
      'You are a content writer. Match tone, audience, and business goals while staying concise.',
  },
  {
    id: 'sales-outreach',
    icon: 'Handshake',
    title: 'Sales Outreach Agent',
    description:
      'Automates personalised outreach, follow ups, and lead management for pipeline teams.',
    modelTags: ['GPT-5 Turbo', 'Email Sender', 'CRM'],
    recommendedModelIds: ['gpt-5', 'gpt-4o'],
    useCase: 'my-customers',
    hubPrompt: 'Help me build a sales outreach agent - walk me through it',
    systemPrompt:
      'You are a sales outreach agent. Personalize outreach, qualify leads, and keep handoffs crisp for account teams.',
  },
  {
    id: 'custom-agent',
    icon: 'Plus',
    title: 'Build from Scratch',
    description:
      'Start with any model and a blank canvas - full control over every detail.',
    modelTags: ['Any model'],
    recommendedModelIds: ['gpt-5', 'kimi-k2', 'gpt-4o'],
    useCase: 'agents',
    hubPrompt: 'Help me build an AI agent - walk me through it',
    systemPrompt:
      'You are a flexible agent shell. Behave according to the system prompt and configured tools.',
  },
];
