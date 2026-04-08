import axios from 'axios'
import { tokenManager } from './tokenManager'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  withCredentials: true,
})

const authFreeRoutes = ['/auth/login', '/auth/register', '/auth/guest', '/auth/refresh']

api.interceptors.request.use((config) => {
  const token = tokenManager.getToken()
  const requestUrl = config.url || ''
  const shouldAttachToken = token && !authFreeRoutes.some((route) => requestUrl.includes(route))

  if (shouldAttachToken) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      !originalRequest?.skipAuthRefresh
    ) {
      originalRequest._retry = true
      const nextToken = await tokenManager.refresh()
      if (nextToken) {
        originalRequest.headers.Authorization = `Bearer ${nextToken}`
        return api(originalRequest)
      }
      await tokenManager.handleAuthFailure()
    }
    return Promise.reject(error)
  },
)

export default api
