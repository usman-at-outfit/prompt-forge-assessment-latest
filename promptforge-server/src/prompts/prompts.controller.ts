import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { PromptsService } from './prompts.service';

@Controller('prompts')
export class PromptsController {
  constructor(private readonly promptsService: PromptsService) {}

  @Public()
  @Post('generate')
  generate(
    @Body()
    body: {
      answers: {
        useCase: string;
        audience: string;
        experience: string;
        followUp: string;
      };
      sessionId: string;
      userId?: string | null;
    },
  ) {
    return this.promptsService.generate(body);
  }

  @Public()
  @Post('regenerate')
  regenerate(
    @Body()
    body: {
      promptId?: string;
      sessionId: string;
      userId?: string | null;
      promptText?: string;
      answers?: {
        useCase?: string;
        audience?: string;
        experience?: string;
        followUp?: string;
      };
    },
  ) {
    return this.promptsService.regenerate(body);
  }

  @Public()
  @Put(':promptId')
  update(
    @Param('promptId') promptId: string,
    @Body()
    body: {
      sessionId: string;
      promptText: string;
      userId?: string | null;
    },
  ) {
    return this.promptsService.update(promptId, body);
  }

  @Public()
  @Get('history')
  history(@Query('sessionId') sessionId: string) {
    return this.promptsService.getHistory(sessionId);
  }

  @Public()
  @Delete(':promptId')
  remove(@Param('promptId') promptId: string, @Query('sessionId') sessionId: string) {
    return this.promptsService.delete(promptId, sessionId);
  }
}
