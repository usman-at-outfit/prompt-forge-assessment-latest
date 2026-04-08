import { Injectable, NotFoundException } from '@nestjs/common';
import { RuntimeStoreService } from '../runtime/runtime-store.service';
import { TokensService } from '../tokens/tokens.service';

type AgentPayload = {
  sessionId?: string | null;
  userId?: string | null;
  templateId?: string | null;
  name: string;
  modelId: string;
  systemPrompt: string;
  description?: string;
  agentType?: string;
  mainJob?: string;
  audience?: string;
  tone?: string;
  avoid?: string;
  notes?: string;
  tools?: string[];
  memoryType?: string;
  testScenarios?: string[];
  customScenarios?: string[];
  deployTarget?: string;
  status?: 'draft' | 'live';
  summary?: string;
  greeting?: string;
};

@Injectable()
export class AgentsService {
  constructor(
    private readonly runtimeStore: RuntimeStoreService,
    private readonly tokensService: TokensService,
  ) {}

  private findAgent(id: string) {
    const agent = this.runtimeStore.agents.find((entry) => entry.id === id);

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    return agent;
  }

  private buildGreeting(agent: Pick<AgentPayload, 'name' | 'mainJob' | 'systemPrompt'>) {
    if (agent.name && agent.mainJob) {
      return `Hi! I'm ${agent.name} - ready to help with ${agent.mainJob.toLowerCase()}. How can I help today?`;
    }

    if (agent.name) {
      return `Hi! I'm ${agent.name} - a powerful AI agent ready to help with anything. How can I help today?`;
    }

    return 'Hi! I am ready to help. What would you like to work on today?';
  }

  private buildSummary(payload: AgentPayload) {
    const parts = [payload.agentType, payload.audience, payload.tone].filter(Boolean);
    return parts.length
      ? `Designed for ${parts.join(' · ')}`
      : 'Configured for flexible agent workflows';
  }

  private buildMetrics(agent: {
    modelId: string;
    tools: string[];
    status?: 'draft' | 'live';
  }) {
    const model = this.runtimeStore.models.find((entry) => entry.modelId === agent.modelId);
    const responseQuality = Math.round((model?.rating ?? 4.7) * 20);
    const avgLatencyMs =
      model?.speed === 'fast' ? 1100 : model?.speed === 'medium' ? 1600 : 2300;

    return {
      messageCount: 0,
      avgLatencyMs,
      tokensUsed: 0,
      satisfaction: model?.rating ?? 4.7,
      responseQuality,
      usagePerDay: agent.status === 'live' ? '12.4K/day' : '4.8K/day',
    };
  }

  private buildAssistantReply(agent: {
    name: string;
    mainJob: string;
    tone: string;
    tools: string[];
    memoryType: string;
  }, message: string) {
    const intro = `${agent.name || 'Your agent'} would handle this as a ${
      agent.tone || 'clear and helpful'
    } assistant.`;
    const capability = agent.mainJob
      ? `Its focus is ${agent.mainJob.toLowerCase()}.`
      : 'It is configured to solve the task directly and keep outputs structured.';
    const tools = agent.tools.length
      ? `It can lean on ${agent.tools.slice(0, 3).join(', ')} when needed.`
      : 'It is currently configured without connected tools.';
    const memory =
      agent.memoryType === 'vector'
        ? 'It keeps long-term memory in mind across sessions.'
        : agent.memoryType === 'history'
          ? 'It keeps short-term session context while responding.'
          : 'It responds statelessly for each request.';

    const action =
      message.trim().endsWith('?')
        ? 'A strong next reply would answer directly, then offer one concise follow-up.'
        : 'A strong next reply would structure the work into goals, steps, and a crisp outcome.';

    return `${intro} ${capability} ${tools} ${memory} ${action}`;
  }

  getTemplates() {
    return this.runtimeStore.agentTemplates;
  }

  create(body: AgentPayload) {
    const ownerId = body.userId ?? body.sessionId;
    if (!ownerId) {
      throw new NotFoundException('An owner is required to save the agent');
    }

    const greeting = body.greeting ?? this.buildGreeting(body);
    const status = body.status ?? 'draft';
    const now = this.runtimeStore.now();

    const agent = {
      id: this.runtimeStore.createId(),
      ownerId,
      sessionId: body.sessionId ?? null,
      templateId: body.templateId ?? null,
      name: body.name,
      modelId: body.modelId,
      systemPrompt: body.systemPrompt,
      description: body.description ?? '',
      agentType: body.agentType ?? '',
      mainJob: body.mainJob ?? '',
      audience: body.audience ?? '',
      tone: body.tone ?? '',
      avoid: body.avoid ?? '',
      notes: body.notes ?? '',
      tools: body.tools ?? [],
      memoryType: body.memoryType ?? 'none',
      testScenarios: body.testScenarios ?? [],
      customScenarios: body.customScenarios ?? [],
      deployTarget: body.deployTarget ?? 'api-endpoint',
      status,
      summary: body.summary ?? this.buildSummary(body),
      greeting,
      previewMessages: [
        {
          id: this.runtimeStore.createId(),
          role: 'assistant' as const,
          content: greeting,
          timestamp: now,
        },
      ],
      metrics: this.buildMetrics({
        modelId: body.modelId,
        tools: body.tools ?? [],
        status,
      }),
      createdAt: now,
      updatedAt: now,
    };

    this.runtimeStore.agents.unshift(agent);
    this.runtimeStore.persist();

    if (body.sessionId) {
      this.tokensService.track({
        agentName: 'Agent Builder',
        actionType: 'create',
        inputTokens: this.tokensService.estimateTokens(body.systemPrompt),
        outputTokens: this.tokensService.estimateTokens(agent.name),
        modelId: body.modelId,
        sessionId: body.sessionId,
        userId: body.userId ?? null,
      });
    }

    return agent;
  }

  getAll(filters: { sessionId?: string; userId?: string }) {
    return this.runtimeStore.agents.filter((agent) => {
      if (filters.userId) {
        return agent.ownerId === filters.userId;
      }

      return filters.sessionId ? agent.sessionId === filters.sessionId : false;
    });
  }

  getOne(id: string) {
    return this.findAgent(id);
  }

  update(id: string, body: Partial<AgentPayload>) {
    const agent = this.findAgent(id);
    const previousLatencyCount = Math.max(agent.metrics.messageCount, 1);

    Object.assign(agent, body, {
      summary:
        body.summary ??
        agent.summary ??
        this.buildSummary({
          ...agent,
          ...body,
          sessionId: agent.sessionId,
          userId: agent.ownerId,
        }),
      greeting:
        body.greeting ??
        agent.greeting ??
        this.buildGreeting({
          name: body.name ?? agent.name,
          mainJob: body.mainJob ?? agent.mainJob,
          systemPrompt: body.systemPrompt ?? agent.systemPrompt,
        }),
      updatedAt: this.runtimeStore.now(),
    });

    if (!agent.previewMessages?.length) {
      agent.previewMessages = [
        {
          id: this.runtimeStore.createId(),
          role: 'assistant',
          content: agent.greeting,
          timestamp: this.runtimeStore.now(),
        },
      ];
    } else {
      agent.previewMessages[0] = {
        ...agent.previewMessages[0],
        content: agent.greeting,
      };
    }

    agent.metrics = {
      ...this.buildMetrics({
        modelId: body.modelId ?? agent.modelId,
        tools: body.tools ?? agent.tools,
        status: body.status ?? agent.status,
      }),
      messageCount: agent.metrics?.messageCount ?? 0,
      tokensUsed: agent.metrics?.tokensUsed ?? 0,
      satisfaction: agent.metrics?.satisfaction ?? 4.7,
      responseQuality: agent.metrics?.responseQuality ?? 94,
      avgLatencyMs:
        agent.metrics?.avgLatencyMs && body.modelId === undefined
          ? agent.metrics.avgLatencyMs
          : this.buildMetrics({
              modelId: body.modelId ?? agent.modelId,
              tools: body.tools ?? agent.tools,
              status: body.status ?? agent.status,
            }).avgLatencyMs,
      usagePerDay: agent.metrics?.usagePerDay ?? '4.8K/day',
    };

    if (body.systemPrompt && agent.sessionId) {
      this.tokensService.track({
        agentName: 'Agent Builder',
        actionType: 'update',
        inputTokens: this.tokensService.estimateTokens(body.systemPrompt),
        outputTokens: this.tokensService.estimateTokens(agent.name),
        modelId: agent.modelId,
        sessionId: agent.sessionId,
        userId: agent.ownerId ?? null,
      });
    }

    if (agent.metrics.messageCount > 0 && previousLatencyCount > 0) {
      agent.metrics.avgLatencyMs = Math.round(agent.metrics.avgLatencyMs);
    }

    this.runtimeStore.persist();
    return agent;
  }

  respond(id: string, body: { message: string }) {
    const agent = this.findAgent(id);
    const now = this.runtimeStore.now();
    const responseLatency = Math.round(900 + Math.random() * 700);
    const userMessage = {
      id: this.runtimeStore.createId(),
      role: 'user' as const,
      content: body.message,
      timestamp: now,
    };
    const assistantContent = this.buildAssistantReply(agent, body.message);
    const assistantMessage = {
      id: this.runtimeStore.createId(),
      role: 'assistant' as const,
      content: assistantContent,
      timestamp: this.runtimeStore.now(),
    };

    agent.previewMessages = [...(agent.previewMessages ?? []), userMessage, assistantMessage];
    agent.status = 'live';
    agent.metrics = {
      ...agent.metrics,
      messageCount: (agent.metrics?.messageCount ?? 0) + 1,
      avgLatencyMs: Math.round(
        ((agent.metrics?.avgLatencyMs ?? responseLatency) *
          Math.max(agent.metrics?.messageCount ?? 0, 1) +
          responseLatency) /
          Math.max((agent.metrics?.messageCount ?? 0) + 1, 1),
      ),
      tokensUsed:
        (agent.metrics?.tokensUsed ?? 0) +
        this.tokensService.estimateTokens(body.message) +
        this.tokensService.estimateTokens(assistantContent),
      satisfaction: Math.max(4.2, Math.min(5, (agent.metrics?.satisfaction ?? 4.7) + 0.01)),
      responseQuality: Math.max(
        88,
        Math.min(99, (agent.metrics?.responseQuality ?? 94) + 1),
      ),
      usagePerDay: '12.4K/day',
    };
    agent.updatedAt = this.runtimeStore.now();

    if (agent.sessionId) {
      this.tokensService.track({
        agentName: 'Agent Preview',
        actionType: 'respond',
        inputTokens: this.tokensService.estimateTokens(body.message),
        outputTokens: this.tokensService.estimateTokens(assistantContent),
        modelId: agent.modelId,
        sessionId: agent.sessionId,
        userId: agent.ownerId ?? null,
      });
    }

    this.runtimeStore.persist();

    return {
      agent,
      message: assistantMessage,
    };
  }

  remove(id: string) {
    const index = this.runtimeStore.agents.findIndex((entry) => entry.id === id);

    if (index === -1) {
      throw new NotFoundException('Agent not found');
    }

    this.runtimeStore.agents.splice(index, 1);
    this.runtimeStore.persist();
    return { success: true };
  }
}
