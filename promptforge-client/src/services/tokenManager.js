let accessToken = null
let refreshHandler = null
let authFailureHandler = null

export const tokenManager = {
  getToken() {
    return accessToken
  },
  setToken(token) {
    accessToken = token ?? null
  },
  clearToken() {
    accessToken = null
  },
  setRefreshHandler(handler) {
    refreshHandler = handler
  },
  setAuthFailureHandler(handler) {
    authFailureHandler = handler
  },
  async refresh() {
    return refreshHandler ? refreshHandler() : null
  },
  async handleAuthFailure() {
    if (authFailureHandler) {
      await authFailureHandler()
    }
  },
}
