import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import type { RuntimeSession } from '../runtime/runtime-store.service';
import { SessionsService } from './sessions.service';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Public()
  @Post('init')
  init(@Body() body: { userId?: string | null }) {
    return body.userId
      ? this.sessionsService.createAuthSession(body.userId)
      : this.sessionsService.createGuestSession();
  }

  @Public()
  @Get(':sessionId')
  getOne(@Param('sessionId') sessionId: string) {
    return this.sessionsService.getSession(sessionId);
  }

  @Public()
  @Put(':sessionId')
  update(
    @Param('sessionId') sessionId: string,
    @Body()
    body: {
      chatHistory?: RuntimeSession['chatHistory'];
      promptHistory?: RuntimeSession['promptHistory'];
      activeModel?: string;
      modelHistory?: string[];
    },
  ) {
    return this.sessionsService.updateSession(sessionId, body);
  }

  @Public()
  @Post('merge')
  merge(@Body() body: { guestSessionId: string; userId: string }) {
    return this.sessionsService.mergeGuestIntoUser(body.guestSessionId, body.userId);
  }
}
