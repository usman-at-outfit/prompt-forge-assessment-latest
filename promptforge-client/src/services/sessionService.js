import api from './api'

export const sessionService = {
  async load(sessionId) {
    const { data } = await api.get(`/sessions/${sessionId}`)
    return data
  },
  async init(payload = {}) {
    const { data } = await api.post('/sessions/init', payload)
    return data
  },
  async merge(guestSessionId, userId) {
    const { data } = await api.post('/sessions/merge', { guestSessionId, userId })
    return data
  },
  async update(sessionId, payload) {
    const { data } = await api.put(`/sessions/${sessionId}`, payload)
    return data
  },
}
