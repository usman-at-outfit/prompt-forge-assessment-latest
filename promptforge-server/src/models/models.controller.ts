import { Controller, Get, Param, Post, Query, Body } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { ModelsService } from './models.service';

@Controller('models')
export class ModelsController {
  constructor(private readonly modelsService: ModelsService) {}

  @Public()
  @Get()
  getModels(@Query() query: Record<string, string>) {
    return this.modelsService.getModels({
      page: query.page ? Number(query.page) : 1,
      limit: query.limit ? Number(query.limit) : 24,
      category: query.category,
      lab: query.lab,
      maxPrice: query.maxPrice ? Number(query.maxPrice) : undefined,
      minRating: query.minRating ? Number(query.minRating) : undefined,
      license: query.license,
      search: query.search,
    });
  }

  @Public()
  @Get('labs')
  getLabs() {
    return this.modelsService.getLabs();
  }

  @Public()
  @Get('trending')
  getTrending() {
    return this.modelsService.getTrending();
  }

  @Public()
  @Get('featured')
  getFeatured() {
    return this.modelsService.getFeatured();
  }

  @Public()
  @Post('recommend')
  recommend(
    @Body()
    body: {
      useCase: string;
      audience: string;
      experience: string;
      promptText?: string;
      sessionId?: string;
    },
  ) {
    return this.modelsService.recommend(body);
  }

  @Public()
  @Get('compare')
  compare(@Query('ids') ids: string) {
    return this.modelsService.compare(ids.split(',').filter(Boolean));
  }

  @Public()
  @Get(':modelId')
  getOne(@Param('modelId') modelId: string) {
    return this.modelsService.getModelById(modelId);
  }
}
