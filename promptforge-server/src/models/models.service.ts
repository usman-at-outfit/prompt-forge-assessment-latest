import { Injectable, NotFoundException } from '@nestjs/common';
import { RuntimeStoreService } from '../runtime/runtime-store.service';

type ModelFilters = {
  page?: number;
  limit?: number;
  category?: string;
  lab?: string;
  maxPrice?: number;
  minRating?: number;
  license?: string;
  search?: string;
};

type RuntimeModel = {
  modelId: string;
  name: string;
  lab: string;
  category: string[];
  contextWindow: number;
  inputPricePer1M: number;
  outputPricePer1M: number;
  isFree: boolean;
  isOpenSource: boolean;
  multimodal: boolean;
  speed: string;
  useCases: string[];
  tags: string[];
};

function formatMoney(value: number) {
  if (value === 0) return '$0';
  if (value < 1) return `$${value.toFixed(2)}`;
  if (Number.isInteger(value)) return `$${value}`;
  return `$${value.toFixed(2)}`;
}

function formatContextWindow(value: number) {
  if (value >= 1000000) {
    const nextValue = value / 1000000;
    return `${Number.isInteger(nextValue) ? nextValue : nextValue.toFixed(1)}M`;
  }

  return `${Math.round(value / 1000)}K`;
}

function inferInputTypes(model: RuntimeModel) {
  const entries = ['text'];

  if (model.multimodal || model.category?.includes('vision')) entries.push('images');
  if (model.multimodal) entries.push('audio');
  if (
    model.useCases?.includes('analyse-data') ||
    model.useCases?.includes('document-analysis')
  ) {
    entries.push('PDFs');
  }
  if (model.category?.includes('code')) entries.push('code snippets');

  return Array.from(new Set(entries)).slice(0, 4);
}

function inferOutputTypes(model: RuntimeModel) {
  const entries = ['text'];

  if (model.category?.includes('code')) entries.push('code');
  if (
    model.useCases?.includes('analyse-data') ||
    model.useCases?.includes('document-analysis')
  ) {
    entries.push('structured JSON');
  }
  if (model.category?.includes('vision')) entries.push('captions');

  return Array.from(new Set(entries)).slice(0, 4);
}

function buildStarterCode(model: RuntimeModel) {
  return [
    'from promptforge import PromptForge',
    '',
    "client = PromptForge(api_key='YOUR_KEY')",
    '',
    'response = client.chat(',
    `    model='${model.modelId}',`,
    '    messages=[',
    "        {'role': 'system', 'content': 'You are a concise expert assistant.'},",
    "        {'role': 'user', 'content': 'Help me with a production task and keep the answer structured.'},",
    '    ],',
    '    temperature=0.4,',
    '    max_tokens=700,',
    ')',
    '',
    'print(response.content)',
  ].join('\n');
}

function buildHowToUseContent(model: RuntimeModel) {
  const inputTypes = inferInputTypes(model).join(', ');
  const outputTypes = inferOutputTypes(model).join(', ');
  const contextLabel = formatContextWindow(model.contextWindow);
  const priceLabel = model.isFree
    ? 'a free-tier proof of concept'
    : `${formatMoney(model.inputPricePer1M)} in / ${formatMoney(model.outputPricePer1M)} out per 1M tokens`;
  const speedLabel =
    model.speed === 'fast'
      ? 'fast-response'
      : model.speed === 'medium'
        ? 'balanced'
        : 'deeper-reasoning';

  return {
    title: 'How to Use This Model',
    intro: `Follow these steps to integrate ${model.name} and start getting value from it in minutes.`,
    steps: [
      {
        title: 'Get API Access',
        description: `Create a PromptForge workspace, open API settings, and generate a key for ${model.lab}. Your key works with marketplace models without any extra provider wiring.`,
      },
      {
        title: 'Choose your integration method',
        description:
          'Use the REST API for direct requests, the PromptForge SDK for quicker setup, or the built-in Playground when you want to validate prompts before writing code.',
        codeTitle: 'Quick Start (Python)',
        code: buildStarterCode(model),
      },
      {
        title: 'Understand input and output formats',
        description: `This model accepts ${inputTypes} as input and typically returns ${outputTypes}. The context window is ${contextLabel}, so long source material should still be chunked into clear sections.`,
      },
      {
        title: 'Set parameters for your use case',
        description: `Start with temperature 0.3-0.7, tune max_tokens to the response length you need, and keep the system message explicit. ${model.name} performs best as a ${speedLabel} workflow with clear constraints.`,
      },
      {
        title: 'Test in the Playground first',
        description: `Before wiring this into production, test real prompts inside PromptForge. Validate cost, latency, and output consistency, then promote the best version into your app or team workflow.`,
      },
    ],
    playgroundLabel: 'Open Playground ->',
    proTip: `Pro tip: Start with ${priceLabel}. Ship one narrow workflow first, measure quality and latency, then scale after 3-5 prompt iterations.`,
  };
}

@Injectable()
export class ModelsService {
  constructor(private readonly runtimeStore: RuntimeStoreService) {}

  getModels(filters: ModelFilters = {}) {
    const page = Number(filters.page ?? 1);
    const limit = Number(filters.limit ?? 24);
    const maxPrice = Number(filters.maxPrice ?? Number.POSITIVE_INFINITY);
    const minRating = Number(filters.minRating ?? 0);
    const search = (filters.search ?? '').toLowerCase();

    const filtered = this.runtimeStore.models.filter((model) => {
      const matchesCategory = filters.category
        ? model.category.includes(filters.category) ||
          (filters.category === 'open-source' && model.isOpenSource)
        : true;
      const matchesLab = filters.lab ? model.lab === filters.lab : true;
      const matchesPrice =
        model.inputPricePer1M + model.outputPricePer1M <= maxPrice;
      const matchesRating = model.rating >= minRating;
      const matchesLicense = filters.license
        ? model.license.toLowerCase().includes(filters.license.toLowerCase())
        : true;
      const matchesSearch = search
        ? [model.name, model.lab, model.description, ...model.tags]
            .join(' ')
            .toLowerCase()
            .includes(search)
        : true;

      return (
        matchesCategory &&
        matchesLab &&
        matchesPrice &&
        matchesRating &&
        matchesLicense &&
        matchesSearch
      );
    });

    const start = (page - 1) * limit;
    const items = filtered.slice(start, start + limit);

    return {
      items,
      meta: {
        page,
        limit,
        total: filtered.length,
        totalPages: Math.max(1, Math.ceil(filtered.length / limit)),
      },
    };
  }

  getModelById(modelId: string) {
    const model = this.runtimeStore.models.find((entry) => entry.modelId === modelId);
    if (!model) {
      throw new NotFoundException('Model not found');
    }

    return {
      ...model,
      howToUseContent: buildHowToUseContent(model as RuntimeModel),
    };
  }

  compare(ids: string[]) {
    return ids.map((id) => this.getModelById(id));
  }

  getLabs() {
    return Object.values(
      this.runtimeStore.models.reduce<Record<string, { lab: string; count: number }>>(
        (accumulator, model) => {
          accumulator[model.lab] = accumulator[model.lab] ?? {
            lab: model.lab,
            count: 0,
          };
          accumulator[model.lab].count += 1;
          return accumulator;
        },
        {},
      ),
    ).sort((left, right) => right.count - left.count);
  }

  getTrending() {
    return this.runtimeStore.models.filter((model) => model.isTrending).slice(0, 6);
  }

  getFeatured() {
    return this.runtimeStore.models.filter((model) => model.isFeatured).slice(0, 6);
  }

  recommend(body: {
    useCase: string;
    audience: string;
    experience: string;
    promptText?: string;
    sessionId?: string;
  }) {
    const normalizeAudience = body.audience.toLowerCase();

    const recommendations = this.runtimeStore.models
      .map((model) => {
        const useCaseScore = model.useCases.includes(body.useCase) ? 40 : 0;
        const priceRange = model.inputPricePer1M + model.outputPricePer1M;
        const priceScore =
          normalizeAudience.includes('customers') || normalizeAudience.includes('company')
            ? model.isFree
              ? 25
              : priceRange < 5
                ? 20
                : 10
            : 25;
        const speedScore =
          body.experience === 'beginner'
            ? model.speed === 'fast'
              ? 20
              : 10
            : 20;
        const ratingBonus = (model.rating / 5) * 15;
        const score = Number((useCaseScore + priceScore + speedScore + ratingBonus).toFixed(2));

        return {
          model,
          score,
          reason: `${model.name} fits ${body.useCase} well with ${model.speed} speed, ${model.rating}/5 rating, and ${model.isFree ? 'free' : 'paid'} pricing.`,
        };
      })
      .sort((left, right) => right.score - left.score)
      .slice(0, 3);

    return { recommendations };
  }
}
