import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { RuntimeStoreService, RuntimeUser } from '../runtime/runtime-store.service';

@Injectable()
export class UsersService {
  constructor(private readonly runtimeStore: RuntimeStoreService) {}

  createUser(input: {
    name: string;
    email: string;
    passwordHash: string;
    role?: 'user' | 'admin';
  }) {
    if (this.findByEmail(input.email)) {
      throw new ConflictException('Email is already registered');
    }

    return this.runtimeStore.createUser({
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash: input.passwordHash,
      role: input.role ?? 'user',
      preferences: {
        defaultModel: 'gpt-4o',
        theme: 'dark',
        language: 'en',
      },
      tokenStats: {
        totalUsed: 0,
        totalCost: 0,
      },
      refreshToken: null,
    });
  }

  findByEmail(email: string) {
    return this.runtimeStore.users.find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
  }

  findById(userId: string) {
    const user = this.runtimeStore.users.find((entry) => entry.id === userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  sanitizeUser(user: RuntimeUser) {
    const { passwordHash, refreshToken, ...safeUser } = user;
    return safeUser;
  }

  updateRefreshToken(userId: string, refreshToken: string | null) {
    const user = this.findById(userId);
    user.refreshToken = refreshToken;
    user.updatedAt = this.runtimeStore.now();
    this.runtimeStore.persist();
    return user;
  }

  incrementTokenStats(userId: string, tokens: number, cost: number) {
    const user = this.findById(userId);
    user.tokenStats.totalUsed += tokens;
    user.tokenStats.totalCost += cost;
    user.updatedAt = this.runtimeStore.now();
    this.runtimeStore.persist();
    return user;
  }
}
