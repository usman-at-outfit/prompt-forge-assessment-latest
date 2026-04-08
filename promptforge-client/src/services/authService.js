import api from './api'

export const authService = {
  async register(payload) {
    const { data } = await api.post('/auth/register', payload)
    return data
  },
  async login(payload) {
    const { data } = await api.post('/auth/login', payload)
    return data
  },
  async logout() {
    const { data } = await api.post('/auth/logout')
    return data
  },
  async initGuest() {
    const { data } = await api.post('/auth/guest')
    return data
  },
  async refreshToken(refreshToken) {
    const { data } = await api.post(
      '/auth/refresh',
      refreshToken ? { refreshToken } : {},
      { skipAuthRefresh: true },
    )
    return data
  },
  async me() {
    const { data } = await api.get('/auth/me')
    return data
  },
}
