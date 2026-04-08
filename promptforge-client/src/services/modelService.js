import { fallbackModels } from '../data/fallbackData'
import api from './api'

export const modelService = {
  async list(filters = {}) {
    try {
      const { data } = await api.get('/models', { params: filters })
      return data
    } catch {
      return {
        items: fallbackModels,
        meta: {
          page: 1,
          limit: fallbackModels.length,
          total: fallbackModels.length,
          totalPages: 1,
        },
      }
    }
  },
  async detail(modelId) {
    try {
      const { data } = await api.get(`/models/${modelId}`)
      return data
    } catch {
      return fallbackModels.find((model) => model.modelId === modelId) ?? fallbackModels[0]
    }
  },
  async recommend(payload) {
    try {
      const { data } = await api.post('/models/recommend', payload)
      return data
    } catch {
      return {
        recommendations: fallbackModels.slice(0, 3).map((model, index) => ({
          model,
          score: 90 - index * 7,
          reason: `${model.name} is a strong fallback recommendation for this workflow.`,
        })),
      }
    }
  },
  async compare(ids) {
    try {
      const { data } = await api.get('/models/compare', {
        params: { ids: ids.join(',') },
      })
      return data
    } catch {
      return fallbackModels.filter((model) => ids.includes(model.modelId))
    }
  },
  async labs() {
    try {
      const { data } = await api.get('/models/labs')
      return data
    } catch {
      return Object.values(
        fallbackModels.reduce((acc, model) => {
          acc[model.lab] = acc[model.lab] ?? { lab: model.lab, count: 0 }
          acc[model.lab].count += 1
          return acc
        }, {}),
      )
    }
  },
  async trending() {
    try {
      const { data } = await api.get('/models/trending')
      return data
    } catch {
      return fallbackModels.filter((model) => model.isTrending).slice(0, 6)
    }
  },
  async featured() {
    try {
      const { data } = await api.get('/models/featured')
      return data
    } catch {
      return fallbackModels.filter((model) => model.isFeatured).slice(0, 6)
    }
  },
}
