import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Public } from '../common/decorators/public.decorator';
import { UploadedChatFile } from './chat-file-extractor';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Public()
  @Post('message')
  @UseInterceptors(
    FilesInterceptor('files', 20, {
      limits: {
        fileSize: 150 * 1024 * 1024,
        files: 20,
      },
    }),
  )
  message(
    @UploadedFiles() files: UploadedChatFile[] = [],
    @Body()
    body: {
      content: string;
      modelId: string;
      sessionId: string;
      userId?: string | null;
    },
  ) {
    return this.chatService.sendMessage({ ...body, files });
  }

  @Public()
  @Post('switch-model')
  switchModel(@Body() body: { newModelId: string; sessionId: string }) {
    return this.chatService.switchModel(body);
  }

  @Public()
  @Get('history')
  history(@Query('sessionId') sessionId: string) {
    return this.chatService.getHistory(sessionId);
  }

  @Public()
  @Delete('history')
  clear(@Query('sessionId') sessionId: string) {
    return this.chatService.clearHistory(sessionId);
  }
}
