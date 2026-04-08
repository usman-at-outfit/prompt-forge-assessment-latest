import { Injectable, NotFoundException } from '@nestjs/common';
import { discoverFeedData, discoverFiltersData } from '../data/discover-feed.data';

@Injectable()
export class DiscoverService {
  getFilters() {
    return discoverFiltersData;
  }

  getFeed(filter?: string) {
    if (!filter || filter === 'all') {
      return discoverFeedData;
    }

    return discoverFeedData.filter((item) => {
      const topics = Array.isArray(item.topic) ? item.topic : [item.topic];
      return topics.includes(filter);
    });
  }

  getItem(id: string) {
    const item = discoverFeedData.find((entry) => entry.id === id);

    if (!item) {
      throw new NotFoundException(`Discover item ${id} not found`);
    }

    return item;
  }
}
