import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RuntimeSession, RuntimeStoreService } from '../runtime/runtime-store.service';

@Injectable()
export class SessionsService {
  constructor(private readonly runtimeStore: RuntimeStoreService) {}

  createGuestSession() {
    return this.runtimeStore.createSession({
      isGuest: true,
      userId: null,
    });
  }

  createAuthSession(userId: string) {
    return this.runtimeStore.createSession({
      isGuest: false,
      userId,
    });
  }

  getSession(sessionId: string) {
    const session = this.runtimeStore.sessions.find(
      (entry) => entry.sessionId === sessionId,
    );

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return this.runtimeStore.touchSession(session);
  }

  updateSession(
    sessionId: string,
    payload: Partial<Pick<RuntimeSession, 'chatHistory' | 'promptHistory' | 'activeModel' | 'modelHistory'>>,
  ) {
    const session = this.getSession(sessionId);

    if (payload.chatHistory) {
      session.chatHistory = payload.chatHistory;
    }

    if (payload.promptHistory) {
      session.promptHistory = payload.promptHistory;
    }

    if (payload.activeModel) {
      session.activeModel = payload.activeModel;
    }

    if (payload.modelHistory) {
      session.modelHistory = payload.modelHistory;
    }

    return this.runtimeStore.touchSession(session);
  }

  findUserSessions(userId: string) {
    return this.runtimeStore.sessions.filter((session) => session.userId === userId);
  }

  mergeGuestIntoUser(guestSessionId: string, userId: string) {
    const guestSession = this.getSession(guestSessionId);
    const existingUserSession =
      [...this.findUserSessions(userId)].sort(
        (left, right) =>
          new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
      )[0] ?? this.createAuthSession(userId);

    existingUserSession.userId = userId;
    existingUserSession.isGuest = false;
    existingUserSession.chatHistory = [
      ...existingUserSession.chatHistory,
      ...guestSession.chatHistory,
    ];
    existingUserSession.promptHistory = [
      ...existingUserSession.promptHistory,
      ...guestSession.promptHistory,
    ];
    existingUserSession.activeModel = guestSession.activeModel || existingUserSession.activeModel;
    existingUserSession.modelHistory = Array.from(
      new Set([...existingUserSession.modelHistory, ...guestSession.modelHistory]),
    );
    existingUserSession.tokenStats.totalTokens += guestSession.tokenStats.totalTokens;
    existingUserSession.tokenStats.totalCost += guestSession.tokenStats.totalCost;
    this.runtimeStore.touchSession(existingUserSession);

    this.runtimeStore.sessions.splice(
      this.runtimeStore.sessions.findIndex(
        (session) => session.sessionId === guestSessionId,
      ),
      1,
    );
    this.runtimeStore.persist();

    return existingUserSession;
  }

  clearHistory(sessionId: string) {
    const session = this.getSession(sessionId);
    session.chatHistory = [];
    session.promptHistory = [];
    session.modelHistory = session.activeModel ? [session.activeModel] : [];
    session.tokenStats.totalTokens = 0;
    session.tokenStats.totalCost = 0;
    return this.runtimeStore.touchSession(session);
  }

  @Cron(CronExpression.EVERY_HOUR)
  cleanupExpiredSessions() {
    const now = Date.now();
    const activeSessions = this.runtimeStore.sessions.filter(
      (session) => new Date(session.expiresAt).getTime() > now,
    );
    this.runtimeStore.sessions.splice(0, this.runtimeStore.sessions.length, ...activeSessions);
    this.runtimeStore.persist();
  }
}
