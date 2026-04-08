import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtGuard extends AuthGuard('jwt') {
  handleRequest<TUser = unknown>(
    _err: unknown,
    user: TUser,
    _info?: unknown,
    _context?: ExecutionContext,
    _status?: unknown,
  ): TUser | null {
    return user ?? null;
  }
}
