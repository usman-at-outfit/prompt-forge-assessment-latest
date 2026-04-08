import { Module } from '@nestjs/common';
import { ModelsModule } from '../models/models.module';
import { SessionsModule } from '../sessions/sessions.module';
import { TokensModule } from '../tokens/tokens.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  imports: [ModelsModule, SessionsModule, TokensModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
