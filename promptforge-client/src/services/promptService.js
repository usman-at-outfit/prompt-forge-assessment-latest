import { fallbackTemplates } from '../data/fallbackData'
import { estimateTokens } from '../utils/tokenCounter'
import api from './api'

function interpolate(template, values) {
  return template.replace(/{{(.*?)}}/g, (_, key) => values[key.trim()] ?? '')
}

export const promptService = {
  async generate(payload) {
    try {
      const { data } = await api.post('/prompts/generate', payload)
      return data
    } catch {
      const template =
        fallbackTemplates.find(
          (entry) => entry.useCase === payload.answers.useCase,
        ) ?? fallbackTemplates[0]
      const promptText = [
        `System role: ${template.systemPrompt}`,
        interpolate(template.userPromptTemplate, payload.answers),
      ].join('\n\n')
      return {
        promptId: crypto.randomUUID(),
        promptText,
        templateUsed: template.title,
        estimatedTokens: estimateTokens(promptText),
        suggestedModels: template.suggestedModels,
      }
    }
  },
  async regenerate(payload) {
    try {
      const { data } = await api.post('/prompts/regenerate', payload)
      return data
    } catch {
      const sourcePrompt = payload.promptText ?? ''
      const promptText = `${sourcePrompt}\n\nRefinement note: tighten the response structure and make the steps slightly more actionable.`
      return {
        promptId: crypto.randomUUID(),
        promptText,
        estimatedTokens: estimateTokens(promptText),
      }
    }
  },
  async update(promptId, payload) {
    try {
      const { data } = await api.put(`/prompts/${promptId}`, payload)
      return data
    } catch {
      const promptText = payload.promptText ?? ''
      return {
        promptId,
        promptText,
        estimatedTokens: estimateTokens(promptText),
      }
    }
  },
  async history(sessionId) {
    const { data } = await api.get('/prompts/history', { params: { sessionId } })
    return data
  },
  async remove(promptId, sessionId) {
    const { data } = await api.delete(`/prompts/${promptId}`, {
      params: { sessionId },
    })
    return data
  },
}
