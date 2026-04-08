import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { TokensService } from './tokens.service';

@Controller('tokens')
export class TokensController {
  constructor(private readonly tokensService: TokensService) {}

  @Post('track')
  track(
    @Body()
    body: {
      agentName: string;
      actionType: string;
      inputTokens: number;
      outputTokens: number;
      modelId: string;
      sessionId: string;
      userId?: string | null;
    },
  ) {
    return this.tokensService.track(body);
  }

  @Get('session/:sessionId')
  getSessionStats(@Param('sessionId') sessionId: string) {
    return this.tokensService.getSessionStats(sessionId);
  }

  @Get('user/:userId')
  getUserStats(@Param('userId') userId: string) {
    return this.tokensService.getUserStats(userId);
  }
}
