import { Module } from '@nestjs/common';
import { TokensModule } from '../tokens/tokens.module';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';

@Module({
  imports: [TokensModule],
  controllers: [AgentsController],
  providers: [AgentsService],
})
export class AgentsModule {}
