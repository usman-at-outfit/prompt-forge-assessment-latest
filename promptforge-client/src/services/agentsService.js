import api from './api'

function normalizeAgent(agent) {
  return {
    id: agent.id,
    ownerId: agent.ownerId,
    sessionId: agent.sessionId ?? null,
    templateId: agent.templateId ?? null,
    name: agent.name,
    modelId: agent.modelId,
    systemPrompt: agent.systemPrompt ?? '',
    description: agent.description ?? '',
    agentType: agent.agentType ?? '',
    mainJob: agent.mainJob ?? '',
    audience: agent.audience ?? '',
    tone: agent.tone ?? '',
    avoid: agent.avoid ?? '',
    notes: agent.notes ?? '',
    tools: agent.tools ?? [],
    memoryType: agent.memoryType ?? 'none',
    testScenarios: agent.testScenarios ?? [],
    customScenarios: agent.customScenarios ?? [],
    deployTarget: agent.deployTarget ?? 'api-endpoint',
    status: agent.status ?? 'draft',
    summary: agent.summary ?? '',
    greeting: agent.greeting ?? '',
    previewMessages: agent.previewMessages ?? [],
    metrics: {
      messageCount: agent.metrics?.messageCount ?? 0,
      avgLatencyMs: agent.metrics?.avgLatencyMs ?? 0,
      tokensUsed: agent.metrics?.tokensUsed ?? 0,
      satisfaction: agent.metrics?.satisfaction ?? 4.7,
      responseQuality: agent.metrics?.responseQuality ?? 94,
      usagePerDay: agent.metrics?.usagePerDay ?? '12.4K/day',
    },
    createdAt: agent.createdAt,
    updatedAt: agent.updatedAt,
  }
}

export const agentsService = {
  async templates() {
    const { data } = await api.get('/agents/templates')
    return data
  },
  async list({ sessionId, userId }) {
    const { data } = await api.get('/agents', {
      params: {
        sessionId,
        userId,
      },
    })
    return data.map(normalizeAgent)
  },
  async create(payload) {
    const { data } = await api.post('/agents', payload)
    return normalizeAgent(data)
  },
  async update(id, payload) {
    const { data } = await api.put(`/agents/${id}`, payload)
    return normalizeAgent(data)
  },
  async remove(id) {
    const { data } = await api.delete(`/agents/${id}`)
    return data
  },
  async respond(id, message) {
    const { data } = await api.post(`/agents/${id}/respond`, { message })
    return {
      agent: normalizeAgent(data.agent),
      message: data.message,
    }
  },
}
