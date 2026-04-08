import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from 'fs';
import { dirname, join } from 'path';
import { seedAgentTemplates } from '../data/agent-templates.data';
import { seedModels } from '../data/models.data';
import { seedPromptTemplates } from '../data/prompt-templates.data';

export type RuntimeUser = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'user' | 'admin';
  preferences: {
    defaultModel?: string;
    theme: string;
    language: string;
  };
  tokenStats: {
    totalUsed: number;
    totalCost: number;
  };
  refreshToken?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RuntimeMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  modelId: string;
  tokens: number;
  timestamp: string;
};

export type RuntimePromptHistory = {
  id: string;
  promptText: string;
  modelRecommendations: string[];
  answers: Record<string, unknown>;
  createdAt: string;
  estimatedTokens: number;
  templateUsed: string;
};

export type RuntimeSession = {
  id: string;
  sessionId: string;
  userId: string | null;
  isGuest: boolean;
  chatHistory: RuntimeMessage[];
  promptHistory: RuntimePromptHistory[];
  activeModel: string;
  modelHistory: string[];
  tokenStats: {
    totalTokens: number;
    totalCost: number;
  };
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
};

export type RuntimeTokenStat = {
  id: string;
  sessionId: string;
  userId: string | null;
  agentName: string;
  actionType: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostUSD: number;
  modelId: string;
  timestamp: string;
};

export type RuntimeAgentPreviewMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
};

export type RuntimeAgentMetrics = {
  messageCount: number;
  avgLatencyMs: number;
  tokensUsed: number;
  satisfaction: number;
  responseQuality: number;
  usagePerDay: string;
};

export type RuntimeAgent = {
  id: string;
  ownerId: string;
  sessionId: string | null;
  templateId: string | null;
  name: string;
  modelId: string;
  systemPrompt: string;
  description: string;
  agentType: string;
  mainJob: string;
  audience: string;
  tone: string;
  avoid: string;
  notes: string;
  tools: string[];
  memoryType: string;
  testScenarios: string[];
  customScenarios: string[];
  deployTarget: string;
  status: 'draft' | 'live';
  summary: string;
  greeting: string;
  previewMessages: RuntimeAgentPreviewMessage[];
  metrics: RuntimeAgentMetrics;
  createdAt: string;
  updatedAt: string;
};

type RuntimePersistedState = {
  users: RuntimeUser[];
  sessions: RuntimeSession[];
  tokenStats: RuntimeTokenStat[];
  agents: RuntimeAgent[];
};

@Injectable()
export class RuntimeStoreService {
  readonly models = [...seedModels];
  readonly promptTemplates = [...seedPromptTemplates];
  readonly agentTemplates = [...seedAgentTemplates];
  readonly users: RuntimeUser[] = [];
  readonly sessions: RuntimeSession[] = [];
  readonly tokenStats: RuntimeTokenStat[] = [];
  readonly agents: RuntimeAgent[] = [];
  private readonly storagePath = join(
    process.cwd(),
    'data',
    'runtime-store.json',
  );

  constructor() {
    this.load();

    if (this.sessions.length === 0) {
      this.createSession({
        userId: null,
        isGuest: true,
        sessionId: 'demo-session',
      });
    }
  }

  now() {
    return new Date().toISOString();
  }

  createId() {
    return randomUUID();
  }

  createSession(options?: {
    sessionId?: string;
    userId?: string | null;
    isGuest?: boolean;
    expiresAt?: string;
  }) {
    const isGuest = options?.isGuest ?? true;
    const session: RuntimeSession = {
      id: this.createId(),
      sessionId: options?.sessionId ?? this.createId(),
      userId: options?.userId ?? null,
      isGuest,
      chatHistory: [],
      promptHistory: [],
      activeModel: 'gpt-4o',
      modelHistory: ['gpt-4o'],
      tokenStats: {
        totalTokens: 0,
        totalCost: 0,
      },
      expiresAt:
        options?.expiresAt ??
        new Date(
          Date.now() + (isGuest ? 1 : 7) * 24 * 60 * 60 * 1000,
        ).toISOString(),
      createdAt: this.now(),
      updatedAt: this.now(),
    };

    this.sessions.push(session);
    this.persist();
    return session;
  }

  createUser(input: Omit<RuntimeUser, 'id' | 'createdAt' | 'updatedAt'>) {
    const user: RuntimeUser = {
      ...input,
      id: this.createId(),
      createdAt: this.now(),
      updatedAt: this.now(),
    };

    this.users.push(user);
    this.persist();
    return user;
  }

  touchSession(session: RuntimeSession) {
    session.updatedAt = this.now();
    session.expiresAt = new Date(
      Date.now() + (session.isGuest ? 1 : 7) * 24 * 60 * 60 * 1000,
    ).toISOString();
    this.persist();
    return session;
  }

  persist() {
    const state: RuntimePersistedState = {
      users: this.users,
      sessions: this.sessions,
      tokenStats: this.tokenStats,
      agents: this.agents,
    };

    mkdirSync(dirname(this.storagePath), { recursive: true });
    writeFileSync(this.storagePath, JSON.stringify(state, null, 2), 'utf8');
  }

  private load() {
    if (!existsSync(this.storagePath)) {
      return;
    }

    const raw = readFileSync(this.storagePath, 'utf8');
    if (!raw.trim()) {
      return;
    }

    if (/^\0+$/.test(raw)) {
      this.quarantineInvalidStore('all-zero file');
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<RuntimePersistedState>;
      this.users.push(...(parsed.users ?? []));
      this.sessions.push(...(parsed.sessions ?? []));
      this.tokenStats.push(...(parsed.tokenStats ?? []));
      this.agents.push(...(parsed.agents ?? []));
    } catch (error) {
      const backupPath = this.quarantineInvalidStore('invalid JSON');
      console.warn(
        `[RuntimeStoreService] Invalid runtime store JSON moved to ${backupPath}`,
        error,
      );
    }
  }

  private quarantineInvalidStore(reason: string) {
    const backupPath = join(
      dirname(this.storagePath),
      `runtime-store.corrupt-${Date.now()}.json`,
    );

    renameSync(this.storagePath, backupPath);
    console.warn(
      `[RuntimeStoreService] Quarantined runtime store (${reason}) at ${backupPath}`,
    );
    return backupPath;
  }
}
