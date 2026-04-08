export const discoverFilters = [
  { id: 'all', label: 'All' },
  { id: 'reasoning', label: 'Reasoning' },
  { id: 'multimodal', label: 'Multimodal' },
  { id: 'alignment', label: 'Alignment' },
  { id: 'efficiency', label: 'Efficiency' },
  { id: 'open-weights', label: 'Open Weights' },
]

export const discoverFeed = [
  {
    id: 'gemini-2-5-reasoning',
    month: 'MAR',
    day: '26',
    source: 'Google DeepMind',
    publishedDate: 'March 26, 2026',
    topic: 'reasoning',
    topicLabel: 'Reasoning',
    title: 'Gemini 2.5 Pro achieves new SOTA on reasoning benchmarks',
    summary:
      'Scores 83.2% on AIME 2025 math competition, outperforming all prior frontier models on reasoning-intensive tasks.',
    overview:
      "Google DeepMind's Gemini 2.5 Pro has set a new state-of-the-art across multiple reasoning benchmarks, most notably scoring 83.2% on the highly competitive AIME 2025 mathematical competition. The paper introduces an iterative thought refinement technique that lets the model revisit intermediate reasoning steps in real time, driving stronger performance on multi-step logical and mathematical tasks.",
    paperId: 'arXiv:2603.08821',
    authors: 'Anil, R., Borgeaud, S., Wu, Y., et al.',
    metrics: [
      { value: '83.2%', label: 'AIME 2025 score' },
      { value: '+6.4%', label: 'vs prior SOTA' },
      { value: '5M ctx', label: 'Context window' },
    ],
    findings: [
      'New iterative thought refinement allows real-time reasoning backtracking, boosting math accuracy by 18% versus standard CoT.',
      'Gemini 2.5 Pro scored top-1 on MATH, HumanEval, and MMLU-Pro simultaneously for the first time.',
      'Performance gains are strongest on problems requiring 10 or more reasoning steps, suggesting the refinement loop scales with complexity.',
      'Multimodal reasoning with diagrams and equations improved 22% over Gemini 2.0, which matters for physics and geometry-heavy tasks.',
    ],
    relatedModelIds: ['gemini-2.5-pro', 'gpt-5', 'claude-opus-4', 'o3-mini'],
    impact: {
      level: 'High',
      text: 'Sets a new benchmark baseline for future frontier model evaluations.',
    },
    citation:
      'Anil, R., Borgeaud, S., Wu, Y., et al. - Google DeepMind (2026). "Gemini 2.5 Pro achieves new SOTA on reasoning benchmarks." arXiv:2603.08821.',
    sourceUrl: 'https://arxiv.org/abs/2603.08821',
  },
  {
    id: 'multimodal-scaling-laws',
    month: 'MAR',
    day: '22',
    source: 'MIT CSAIL',
    publishedDate: 'March 22, 2026',
    topic: 'multimodal',
    topicLabel: 'Multimodal',
    title: 'Scaling laws for multimodal models: new empirical findings',
    summary:
      'Research reveals unexpected scaling dynamics when combining vision and language, with efficiency gains plateauing earlier than expected.',
    overview:
      'MIT CSAIL researchers present a comprehensive empirical study of scaling laws for multimodal language models. Contrary to prior assumptions derived from unimodal language models, the team finds that combining vision and language encoders introduces cross-modal interference at scale, causing compute efficiency gains to plateau around the 70B to 100B parameter range. The paper proposes a modal-decoupled scaling strategy that recovers some of that lost efficiency.',
    paperId: 'arXiv:2603.05512',
    authors: 'Chen, K., Goldwasser, D., Barzilay, R., et al.',
    metrics: [
      { value: '70-100B', label: 'Plateau point' },
      { value: '31%', label: 'Efficiency gap' },
      { value: '12 models', label: 'Benchmarked' },
    ],
    findings: [
      'Vision-language efficiency plateaus occur about three times earlier than in text-only models, suggesting scaling recipes need revision.',
      'Modal decoupled scaling recovers roughly 31% of lost efficiency by training modalities on separate optimizers before fusion.',
      'Cross-modal interference is highest in mid-layers, which points to specific architectural intervention opportunities.',
      'Open multimodal stacks already show faster plateaus than proprietary peers, likely due to data mixture and training composition.',
    ],
    relatedModelIds: ['gemini-2.5-pro', 'gpt-5', 'gpt-4o', 'llama-3.2-11b-vision'],
    impact: {
      level: 'Medium-High',
      text: 'Directly challenges current scaling assumptions for multimodal AI.',
    },
    citation:
      'Chen, K., Goldwasser, D., Barzilay, R., et al. - MIT CSAIL (2026). "Scaling laws for multimodal models: new empirical findings." arXiv:2603.05512.',
    sourceUrl: 'https://arxiv.org/abs/2603.05512',
  },
  {
    id: 'constitutional-ai-v2',
    month: 'MAR',
    day: '18',
    source: 'Anthropic',
    publishedDate: 'March 18, 2026',
    topic: 'alignment',
    topicLabel: 'Alignment',
    title: 'Constitutional AI v2: improved alignment through iterative refinement',
    summary:
      'New methodology achieves a 40% reduction in harmful outputs while preserving capability on standard benchmarks.',
    overview:
      "Anthropic introduces Constitutional AI v2, a significantly improved alignment framework that builds on the original CAI approach. The key innovation is iterative constitutional refinement, where the constitution itself is treated as a learnable document that evolves through repeated rounds of red-teaming, model critique, and human feedback. CAI-2 achieves a 40% reduction in harmful output rate across Anthropic's evaluation suite while maintaining performance within 0.5% on standard capability benchmarks.",
    paperId: 'arXiv:2603.03142',
    authors: 'Bai, Y., Jones, A., Ndousse, K., et al.',
    metrics: [
      { value: '-40%', label: 'Harmful outputs' },
      { value: '<0.5%', label: 'Capability drop' },
      { value: 'v2.0', label: 'Constitution ver.' },
    ],
    findings: [
      'Iterative constitutional refinement allows the safety constitution to self-improve via model feedback loops over 5 iterations.',
      "The system reduces harmful outputs by 40% across Anthropic's internal suite with less than 0.5% degradation on MMLU, HumanEval, and MATH.",
      'CAI-2 generalizes better to novel harmful prompt categories not seen during training, a key improvement over v1.',
      'The approach is model-agnostic and was validated on both Claude Opus 4.6 and smaller Claude variants.',
    ],
    relatedModelIds: ['claude-opus-4', 'claude-sonnet-4', 'gpt-5'],
    impact: {
      level: 'High',
      text: 'Directly shapes frontier alignment methodology and industry safety standards.',
    },
    citation:
      'Bai, Y., Jones, A., Ndousse, K., et al. - Anthropic (2026). "Constitutional AI v2: improved alignment through iterative refinement." arXiv:2603.03142.',
    sourceUrl: 'https://arxiv.org/abs/2603.03142',
  },
  {
    id: 'llama-4-open-weights',
    month: 'MAR',
    day: '15',
    source: 'Meta AI',
    publishedDate: 'March 15, 2026',
    topic: ['multimodal', 'open-weights'],
    topicLabel: 'Open Weights',
    title: 'Llama 4 Scout & Maverick: natively multimodal from the ground up',
    summary:
      '17B and 400B open-weight models trained on 40 trillion tokens with native understanding across text, image, and video.',
    overview:
      'Meta AI releases Llama 4 Scout and Llama 4 Maverick, two open-weight multimodal models built with a mixture-of-experts architecture supporting text, image, and video from pretraining rather than as a post-hoc adapter. Scout is the efficient long-context variant, while Maverick is the large 400B-class model built for complex reasoning, multilingual interaction, and competitive multimodal workloads across 119 languages.',
    paperId: 'arXiv:2603.01234',
    authors: 'Dubey, A., Jauhari, A., Pandey, A., et al.',
    metrics: [
      { value: '400B', label: 'Maverick params' },
      { value: '119', label: 'Languages' },
      { value: '40T', label: 'Training tokens' },
    ],
    findings: [
      'Native multimodal pretraining allows Scout and Maverick to reason across text, images, and video in a unified token space.',
      'Maverick matches GPT-4o and Claude Sonnet 4.6 on MMLU-Pro while being fully self-hostable.',
      "Scout's 128K context and efficient MoE layout make it ideal for retrieval pipelines and long-document summarization at lower cost.",
      'Both models support 119 languages, with especially strong gains in Arabic, Hindi, and Southeast Asian languages over prior Llama generations.',
    ],
    relatedModelIds: ['llama-3.3-70b', 'gpt-4o', 'claude-sonnet-4', 'gemma-3-27b'],
    impact: {
      level: 'Very High',
      text: 'Redefines what open-weight multimodal models can achieve and adds pressure on proprietary labs.',
    },
    citation:
      'Dubey, A., Jauhari, A., Pandey, A., et al. - Meta AI (2026). "Llama 4 Scout & Maverick: natively multimodal from the ground up." arXiv:2603.01234.',
    sourceUrl: 'https://arxiv.org/abs/2603.01234',
  },
  {
    id: 'long-context-recall',
    month: 'MAR',
    day: '10',
    source: 'Stanford NLP',
    publishedDate: 'March 10, 2026',
    topic: 'efficiency',
    topicLabel: 'Efficiency',
    title: 'Long-context recall: how models handle 1M+ token windows',
    summary:
      'Comprehensive evaluation shows sharp recall degradation beyond 200K tokens for most frontier models tested.',
    overview:
      'Stanford NLP\'s "LongBench-2026" study presents the most comprehensive evaluation to date of long-context recall across 14 frontier models, testing windows from 32K to 2M tokens. The key finding is that most models show sharp recall degradation beyond 200K tokens, with average accuracy dropping from 91% within 100K tokens to 58% at 500K tokens and just 34% at 1M-token scale.',
    paperId: 'arXiv:2603.00187',
    authors: 'Liu, N., Lin, K., Hewitt, J., et al.',
    metrics: [
      { value: '34%', label: 'Recall at 1M tok' },
      { value: '91%', label: 'Recall at 100K' },
      { value: '14', label: 'Models tested' },
    ],
    findings: [
      'Across all 14 models, recall drops from 91% at 100K tokens to 58% at 500K tokens, a steeper cliff than previously reported.',
      'Kimi-K2 and GLM-5 are the top performers at 1M+ token contexts, helped by sparse attention innovations.',
      'The "lost in the middle" phenomenon intensifies at scale, with information in the middle 60% of a 1M-token context recalled at just 28%.',
      'Instruction-following capability degrades even faster than information recall, so formatting instructions are often forgotten first.',
    ],
    relatedModelIds: ['kimi-k2', 'gpt-5', 'claude-opus-4', 'gemini-2.5-pro'],
    impact: {
      level: 'High',
      text: 'Essential reading for teams building RAG or long-document AI applications.',
    },
    citation:
      'Liu, N., Lin, K., Hewitt, J., et al. - Stanford NLP (2026). "Long-context recall: how models handle 1M+ token windows." arXiv:2603.00187.',
    sourceUrl: 'https://arxiv.org/abs/2603.00187',
  },
  {
    id: 'deepseek-r1-open-weights',
    month: 'MAR',
    day: '5',
    source: 'DeepSeek',
    publishedDate: 'March 5, 2026',
    topic: 'open-weights',
    topicLabel: 'Open Weights',
    title: 'DeepSeek-R1 open weights: reproducing frontier reasoning at minimal cost',
    summary:
      'Full-weight release enables domain fine-tuning for strong reasoning performance at a fraction of frontier API cost.',
    overview:
      'DeepSeek publishes the full weights for DeepSeek-R1, allowing teams to fine-tune a frontier-style reasoning model for narrow domains without relying on a closed vendor roadmap. The release makes ownership, hosting control, and low-cost inference much more practical for product teams that can trade a little polish for customization and deployment flexibility.',
    paperId: 'arXiv:2602.98112',
    authors: 'DeepSeek AI',
    metrics: [
      { value: '$0.27', label: 'Input / 1M tok' },
      { value: '128K', label: 'Context window' },
      { value: 'Open', label: 'Weights released' },
    ],
    findings: [
      'The release makes domain-specific fine-tuning realistic for cost-sensitive teams shipping internal or specialized assistants.',
      'Open deployment gives product teams more control over privacy, hosting, and evaluation than API-only systems.',
      'Reasoning quality remains competitive enough that retrieval plus fine-tuning can outperform larger closed models in narrow workflows.',
      'The biggest win is not cheaper inference alone, but the ability to tailor the model to a domain without vendor constraints.',
    ],
    relatedModelIds: ['deepseek-chat', 'llama-3.3-70b', 'kimi-k2'],
    impact: {
      level: 'High',
      text: 'Strengthens the open-weight path for reasoning-intensive production systems.',
    },
    citation:
      'DeepSeek AI (2026). "DeepSeek-R1 open weights: reproducing frontier reasoning at minimal cost." arXiv:2602.98112.',
    sourceUrl: 'https://arxiv.org/abs/2602.98112',
  },
]
