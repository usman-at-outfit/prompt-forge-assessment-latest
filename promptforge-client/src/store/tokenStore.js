import { create } from 'zustand'
import api from '../services/api'
import { fallbackModels } from '../data/fallbackData'
import { estimateCost, estimateTokens } from '../utils/tokenCounter'

export const useTokenStore = create((set, get) => ({
  stats: [],
  totalTokens: 0,
  totalCost: 0,
  byAgent: {},
  actions: {
    async track({ agentName, actionType, inputText, outputText, modelId, sessionId, userId }) {
      const inputTokens = estimateTokens(inputText)
      const outputTokens = estimateTokens(outputText)

      try {
        const { data } = await api.post('/tokens/track', {
          agentName,
          actionType,
          inputTokens,
          outputTokens,
          modelId,
          sessionId,
          userId,
        })
        await get().actions.loadSession(sessionId)
        return data
      } catch {
        const totalTokens = inputTokens + outputTokens
        const estimatedCostUSD = estimateCost(totalTokens, modelId, fallbackModels)
        const stat = {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          agentName,
          actionType,
          inputTokens,
          outputTokens,
          totalTokens,
          estimatedCostUSD,
          modelId,
          sessionId,
        }
        const current = get()
        const byAgent = {
          ...current.byAgent,
          [agentName]: {
            tokens: (current.byAgent[agentName]?.tokens ?? 0) + totalTokens,
            cost: Number(
              ((current.byAgent[agentName]?.cost ?? 0) + estimatedCostUSD).toFixed(6),
            ),
            count: (current.byAgent[agentName]?.count ?? 0) + 1,
          },
        }
        set({
          stats: [stat, ...current.stats].slice(0, 50),
          totalTokens: current.totalTokens + totalTokens,
          totalCost: Number((current.totalCost + estimatedCostUSD).toFixed(6)),
          byAgent,
        })
        return { stat, sessionTotal: { totalTokens, totalCost: estimatedCostUSD } }
      }
    },
    async loadSession(sessionId) {
      if (!sessionId) return
      try {
        const { data } = await api.get(`/tokens/session/${sessionId}`)
        set({
          stats: data.stats ?? [],
          totalTokens: data.totalTokens ?? 0,
          totalCost: data.totalCost ?? 0,
          byAgent: data.byAgent ?? {},
        })
      } catch {
        return null
      }
    },
    hydrate(snapshot = {}) {
      set({
        stats: snapshot.stats ?? [],
        totalTokens: snapshot.totalTokens ?? 0,
        totalCost: snapshot.totalCost ?? 0,
        byAgent: snapshot.byAgent ?? {},
      })
    },
    reset() {
      set({ stats: [], totalTokens: 0, totalCost: 0, byAgent: {} })
    },
  },
}))
