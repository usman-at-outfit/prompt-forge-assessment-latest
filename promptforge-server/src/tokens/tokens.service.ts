import { Injectable, NotFoundException } from '@nestjs/common';
import { RuntimeStoreService } from '../runtime/runtime-store.service';
import { SessionsService } from '../sessions/sessions.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class TokensService {
  constructor(
    private readonly runtimeStore: RuntimeStoreService,
    private readonly sessionsService: SessionsService,
    private readonly usersService: UsersService,
  ) {}

  estimateTokens(text: string) {
    return Math.ceil((text ?? '').length / 4);
  }

  estimateCost(tokens: number, modelId: string) {
    const model = this.runtimeStore.models.find((entry) => entry.modelId === modelId);
    if (!model) {
      return 0;
    }

    return Number(((tokens / 1_000_000) * model.outputPricePer1M).toFixed(6));
  }

  track(body: {
    agentName: string;
    actionType: string;
    inputTokens: number;
    outputTokens: number;
    modelId: string;
    sessionId: string;
    userId?: string | null;
  }) {
    const session = this.sessionsService.getSession(body.sessionId);
    const resolvedUserId = body.userId ?? session.userId ?? null;
    const totalTokens = body.inputTokens + body.outputTokens;
    const estimatedCostUSD = this.estimateCost(totalTokens, body.modelId);

    const stat = {
      id: this.runtimeStore.createId(),
      sessionId: body.sessionId,
      userId: resolvedUserId,
      agentName: body.agentName,
      actionType: body.actionType,
      inputTokens: body.inputTokens,
      outputTokens: body.outputTokens,
      totalTokens,
      estimatedCostUSD,
      modelId: body.modelId,
      timestamp: this.runtimeStore.now(),
    };

    this.runtimeStore.tokenStats.push(stat);
    session.tokenStats.totalTokens += totalTokens;
    session.tokenStats.totalCost += estimatedCostUSD;
    this.runtimeStore.touchSession(session);
    this.runtimeStore.persist();

    if (resolvedUserId) {
      this.usersService.incrementTokenStats(
        resolvedUserId,
        totalTokens,
        estimatedCostUSD,
      );
    }

    return {
      stat,
      sessionTotal: {
        totalTokens: session.tokenStats.totalTokens,
        totalCost: session.tokenStats.totalCost,
      },
    };
  }

  getSessionStats(sessionId: string) {
    const session = this.sessionsService.getSession(sessionId);
    const stats = this.runtimeStore.tokenStats
      .filter((entry) => entry.sessionId === sessionId)
      .sort(
        (left, right) =>
          new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime(),
      );

    const byAgent = stats.reduce<Record<string, { tokens: number; cost: number; count: number }>>(
      (accumulator, entry) => {
        const current = accumulator[entry.agentName] ?? {
          tokens: 0,
          cost: 0,
          count: 0,
        };

        current.tokens += entry.totalTokens;
        current.cost += entry.estimatedCostUSD;
        current.count += 1;
        accumulator[entry.agentName] = current;
        return accumulator;
      },
      {},
    );

    return {
      stats,
      totalTokens: session.tokenStats.totalTokens,
      totalCost: Number(session.tokenStats.totalCost.toFixed(6)),
      byAgent,
    };
  }

  getUserStats(userId: string) {
    const user = this.usersService.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const stats = this.runtimeStore.tokenStats.filter((entry) => entry.userId === userId);
    return {
      stats,
      totalTokens: user.tokenStats.totalUsed,
      totalCost: Number(user.tokenStats.totalCost.toFixed(6)),
    };
  }
}
