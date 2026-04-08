import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { AgentsService } from './agents.service';

type AgentBody = {
  sessionId?: string | null;
  userId?: string | null;
  templateId?: string | null;
  name: string;
  modelId: string;
  systemPrompt: string;
  description?: string;
  agentType?: string;
  mainJob?: string;
  audience?: string;
  tone?: string;
  avoid?: string;
  notes?: string;
  tools?: string[];
  memoryType?: string;
  testScenarios?: string[];
  customScenarios?: string[];
  deployTarget?: string;
  status?: 'draft' | 'live';
  summary?: string;
  greeting?: string;
};

@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Public()
  @Get('templates')
  templates() {
    return this.agentsService.getTemplates();
  }

  @Public()
  @Post()
  create(@Body() body: AgentBody) {
    return this.agentsService.create(body);
  }

  @Public()
  @Get()
  list(@Query('sessionId') sessionId?: string, @Query('userId') userId?: string) {
    return this.agentsService.getAll({ sessionId, userId });
  }

  @Public()
  @Get(':id')
  detail(@Param('id') id: string) {
    return this.agentsService.getOne(id);
  }

  @Public()
  @Put(':id')
  update(@Param('id') id: string, @Body() body: Partial<AgentBody>) {
    return this.agentsService.update(id, body);
  }

  @Public()
  @Post(':id/respond')
  respond(@Param('id') id: string, @Body() body: { message: string }) {
    return this.agentsService.respond(id, body);
  }

  @Public()
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.agentsService.remove(id);
  }
}
