import { Controller, Get, Param, Query } from '@nestjs/common';
import { DiscoverService } from './discover.service';

@Controller('discover')
export class DiscoverController {
  constructor(private readonly discoverService: DiscoverService) {}

  @Get('filters')
  getFilters() {
    return this.discoverService.getFilters();
  }

  @Get('feed')
  getFeed(@Query('filter') filter?: string) {
    return this.discoverService.getFeed(filter);
  }

  @Get('feed/:id')
  getItem(@Param('id') id: string) {
    return this.discoverService.getItem(id);
  }
}
