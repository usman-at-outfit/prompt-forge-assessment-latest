export type SeedPromptTemplate = {
  templateId: string;
  title: string;
  category: string;
  useCase: string;
  audienceLevel: 'beginner' | 'developer' | 'researcher';
  systemPrompt: string;
  userPromptTemplate: string;
  tags: string[];
  suggestedModels: string[];
};

export const seedPromptTemplates: SeedPromptTemplate[] = [
  {
    templateId: 'content-launch-plan',
    title: 'Content Launch Plan',
    category: 'marketing',
    useCase: 'write-content',
    audienceLevel: 'beginner',
    systemPrompt:
      'You are a senior content strategist who writes clear, practical assets.',
    userPromptTemplate:
      'Create a complete content asset for {{audience}} about {{followUp}}. Keep the tone appropriate for a {{experience}} user and explain decisions clearly.',
    tags: ['content', 'copywriting', 'marketing'],
    suggestedModels: ['gpt-4o', 'claude-sonnet-4', 'solar-pro-2'],
  },
  {
    templateId: 'image-brief-builder',
    title: 'Image Prompt Builder',
    category: 'creative',
    useCase: 'create-images',
    audienceLevel: 'beginner',
    systemPrompt:
      'You are an art director who creates vivid, production-ready prompt briefs.',
    userPromptTemplate:
      'Draft an image generation prompt for {{audience}} focused on {{followUp}}. Include composition, lighting, mood, color palette, and negative prompts.',
    tags: ['images', 'creative', 'visual'],
    suggestedModels: ['gpt-4o', 'pixtral-large', 'gemini-2.0-flash'],
  },
  {
    templateId: 'app-spec-planner',
    title: 'App Spec Planner',
    category: 'product',
    useCase: 'build-something',
    audienceLevel: 'developer',
    systemPrompt:
      'You are a pragmatic product engineer who turns vague ideas into executable plans.',
    userPromptTemplate:
      'Turn the idea "{{followUp}}" into a scoped build plan for {{audience}}. Include architecture, milestones, edge cases, acceptance criteria, and next actions.',
    tags: ['build', 'planning', 'engineering'],
    suggestedModels: ['o3-mini', 'claude-opus-4', 'qwen2.5-coder-32b'],
  },
  {
    templateId: 'automation-playbook',
    title: 'Automation Playbook',
    category: 'operations',
    useCase: 'automate-work',
    audienceLevel: 'developer',
    systemPrompt:
      'You are an operations designer focused on repeatable automation systems.',
    userPromptTemplate:
      'Design an automation workflow for {{audience}} around {{followUp}}. Include triggers, steps, failure handling, reporting, and rollout guidance.',
    tags: ['automation', 'ops', 'workflow'],
    suggestedModels: ['claude-sonnet-4', 'gpt-4.1-mini', 'deepseek-chat'],
  },
  {
    templateId: 'analysis-brief',
    title: 'Analysis Brief',
    category: 'analytics',
    useCase: 'analyse-data',
    audienceLevel: 'researcher',
    systemPrompt:
      'You are a data analyst who explains findings with rigor and clarity.',
    userPromptTemplate:
      'Analyze {{followUp}} for {{audience}}. Provide hypotheses, metrics to inspect, likely pitfalls, and a concise executive summary.',
    tags: ['analysis', 'data', 'research'],
    suggestedModels: ['gemini-2.5-pro', 'claude-opus-4', 'gpt-4o'],
  },
  {
    templateId: 'exploration-starter',
    title: 'Exploration Starter',
    category: 'discovery',
    useCase: 'just-exploring',
    audienceLevel: 'beginner',
    systemPrompt:
      'You are a patient guide who helps users explore unfamiliar tools safely.',
    userPromptTemplate:
      'Create a friendly starting prompt for someone exploring {{followUp}}. Tailor it for {{audience}} and include simple next-step suggestions.',
    tags: ['exploration', 'learning', 'beginner'],
    suggestedModels: ['gemini-2.0-flash', 'gpt-4.1-mini', 'gemma-3-27b'],
  },
  {
    templateId: 'customer-support-agent',
    title: 'Support Agent Prompt',
    category: 'support',
    useCase: 'my-customers',
    audienceLevel: 'developer',
    systemPrompt:
      'You design support agents that are calm, accurate, and escalation-aware.',
    userPromptTemplate:
      'Write a support agent prompt for handling {{followUp}} for {{audience}}. Include tone, boundaries, escalation rules, and issue triage.',
    tags: ['support', 'customers', 'agent'],
    suggestedModels: ['command-r-plus', 'claude-sonnet-4', 'grok-2'],
  },
  {
    templateId: 'team-workflow-guide',
    title: 'Team Workflow Guide',
    category: 'team',
    useCase: 'my-team',
    audienceLevel: 'developer',
    systemPrompt:
      'You optimize collaboration systems for clarity, speed, and accountability.',
    userPromptTemplate:
      'Create a reusable prompt workflow for {{audience}} to handle {{followUp}}. Include roles, handoffs, review loops, and a final quality checklist.',
    tags: ['team', 'workflow', 'collaboration'],
    suggestedModels: ['claude-sonnet-4', 'deepseek-chat', 'mistral-large'],
  },
  {
    templateId: 'company-rollout-memo',
    title: 'Company Rollout Memo',
    category: 'enterprise',
    useCase: 'my-company',
    audienceLevel: 'researcher',
    systemPrompt:
      'You write enterprise-ready rollout documents that balance speed and governance.',
    userPromptTemplate:
      'Draft a rollout memo for {{audience}} about {{followUp}}. Cover business value, rollout phases, risk controls, and owner responsibilities.',
    tags: ['enterprise', 'rollout', 'strategy'],
    suggestedModels: ['mistral-large', 'command-r-plus', 'gpt-4o'],
  },
  {
    templateId: 'student-lesson-builder',
    title: 'Student Lesson Builder',
    category: 'education',
    useCase: 'students',
    audienceLevel: 'beginner',
    systemPrompt:
      'You are an educator who turns complex ideas into encouraging lessons.',
    userPromptTemplate:
      'Create a step-by-step lesson prompt for {{audience}} focused on {{followUp}}. Include examples, practice prompts, and a short quiz.',
    tags: ['students', 'education', 'lesson'],
    suggestedModels: ['phi-4', 'gemma-3-27b', 'gpt-4.1-mini'],
  },
  {
    templateId: 'code-generator',
    title: 'Code Generator',
    category: 'engineering',
    useCase: 'code-generation',
    audienceLevel: 'developer',
    systemPrompt:
      'You are a senior software engineer who writes correct, maintainable code.',
    userPromptTemplate:
      'Generate production-ready code for {{followUp}} intended for {{audience}}. Include architecture notes, edge cases, and tests.',
    tags: ['code', 'developer', 'implementation'],
    suggestedModels: ['codestral', 'o3-mini', 'deepseek-coder-v2'],
  },
  {
    templateId: 'document-analysis',
    title: 'Document Analysis',
    category: 'documents',
    useCase: 'document-analysis',
    audienceLevel: 'researcher',
    systemPrompt:
      'You inspect long documents and return structured findings with confidence.',
    userPromptTemplate:
      'Review {{followUp}} for {{audience}}. Extract key themes, risks, action items, and any missing information.',
    tags: ['documents', 'analysis', 'summary'],
    suggestedModels: ['gemini-2.5-pro', 'claude-opus-4', 'command-r-plus'],
  },
];
