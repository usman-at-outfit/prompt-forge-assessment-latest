import api from './api'
import { discoverFeed, discoverFilters } from '../data/discoverFeed'

export const discoverService = {
  async filters() {
    try {
      const { data } = await api.get('/discover/filters')
      return Array.isArray(data) && data.length ? data : discoverFilters
    } catch {
      return discoverFilters
    }
  },

  async feed(filter = 'all') {
    try {
      const { data } = await api.get('/discover/feed', {
        params: filter && filter !== 'all' ? { filter } : {},
      })
      return Array.isArray(data) && data.length ? data : filterDiscoverFeed(filter)
    } catch {
      return filterDiscoverFeed(filter)
    }
  },

  async detail(id) {
    try {
      const { data } = await api.get(`/discover/feed/${id}`)
      return data
    } catch {
      return discoverFeed.find((item) => item.id === id) ?? null
    }
  },
}

function filterDiscoverFeed(filter) {
  if (!filter || filter === 'all') {
    return discoverFeed
  }

  return discoverFeed.filter((item) => {
    const topics = Array.isArray(item.topic) ? item.topic : [item.topic]
    return topics.includes(filter)
  })
}
