import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import type { StringValue } from 'ms';
import { SessionsService } from '../sessions/sessions.service';
import { TokensService } from '../tokens/tokens.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService,
    private readonly jwtService: JwtService,
    private readonly tokensService: TokensService,
  ) {}

  private get accessSecret() {
    return process.env.JWT_SECRET ?? 'promptforge-dev-secret';
  }

  private get refreshSecret() {
    return process.env.JWT_REFRESH_SECRET ?? 'promptforge-dev-refresh-secret';
  }

  async validateUser(email: string, password: string) {
    const user = this.usersService.findByEmail(email);

    if (!user) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    return isValid ? this.usersService.sanitizeUser(user) : null;
  }

  async register(dto: RegisterDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = this.usersService.createUser({
      name: dto.name,
      email: dto.email,
      passwordHash,
    });
    const session = this.sessionsService.createAuthSession(user.id);
    const accessToken = await this.signAccessToken(user.id, user.email, session.sessionId);
    const refreshToken = await this.signRefreshToken(user.id, session.sessionId);
    this.usersService.updateRefreshToken(user.id, refreshToken);

    this.tokensService.track({
      agentName: 'Auth',
      actionType: 'register',
      inputTokens: this.tokensService.estimateTokens(
        `${dto.name} ${dto.email} ${dto.password}`,
      ),
      outputTokens: this.tokensService.estimateTokens(accessToken + refreshToken),
      modelId: 'gpt-4o',
      sessionId: session.sessionId,
      userId: user.id,
    });

    return {
      user: this.usersService.sanitizeUser(user),
      sessionId: session.sessionId,
      accessToken,
      refreshToken,
    };
  }

  async login(dto: LoginDto) {
    const user = this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const session = this.sessionsService.createAuthSession(user.id);
    const accessToken = await this.signAccessToken(user.id, user.email, session.sessionId);
    const refreshToken = await this.signRefreshToken(user.id, session.sessionId);
    this.usersService.updateRefreshToken(user.id, refreshToken);

    this.tokensService.track({
      agentName: 'Auth',
      actionType: 'login',
      inputTokens: this.tokensService.estimateTokens(`${dto.email} ${dto.password}`),
      outputTokens: this.tokensService.estimateTokens(accessToken + refreshToken),
      modelId: 'gpt-4o',
      sessionId: session.sessionId,
      userId: user.id,
    });

    return {
      user: this.usersService.sanitizeUser(user),
      sessionId: session.sessionId,
      accessToken,
      refreshToken,
    };
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const payload = await this.jwtService.verifyAsync<{
      sub: string;
      sessionId: string;
    }>(refreshToken, { secret: this.refreshSecret });
    const user = this.usersService.findById(payload.sub);

    if (user.refreshToken !== refreshToken) {
      throw new UnauthorizedException('Refresh token is invalid');
    }

    const accessToken = await this.signAccessToken(
      user.id,
      user.email,
      payload.sessionId,
    );

    return { accessToken };
  }

  logout(userId: string) {
    this.usersService.updateRefreshToken(userId, null);
    return { success: true };
  }

  async initGuestSession() {
    const session = this.sessionsService.createGuestSession();
    const guestToken = await this.jwtService.signAsync(
      {
        sessionId: session.sessionId,
        isGuest: true,
        type: 'guest',
      },
      {
        secret: this.accessSecret,
        expiresIn: '24h',
      },
    );

    return {
      sessionId: session.sessionId,
      guestToken,
    };
  }

  getMe(userId: string) {
    return { user: this.usersService.sanitizeUser(this.usersService.findById(userId)) };
  }

  private signAccessToken(userId: string, email: string, sessionId: string) {
    return this.jwtService.signAsync(
      {
        sub: userId,
        email,
        sessionId,
        type: 'access',
      },
      {
        secret: this.accessSecret,
        expiresIn: (process.env.JWT_EXPIRES_IN ?? '15m') as StringValue,
      },
    );
  }

  private signRefreshToken(userId: string, sessionId: string) {
    return this.jwtService.signAsync(
      {
        sub: userId,
        sessionId,
        type: 'refresh',
      },
      {
        secret: this.refreshSecret,
        expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ?? '7d') as StringValue,
      },
    );
  }
}
