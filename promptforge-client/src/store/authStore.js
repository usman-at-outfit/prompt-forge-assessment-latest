import { create } from 'zustand'
import { authService } from '../services/authService'
import { sessionService } from '../services/sessionService'
import { generateGuestId } from '../utils/sessionId'
import { tokenManager } from '../services/tokenManager'

function clearPersistedWorkspaceState() {
  const prefixes = ['pf_chat_', 'pf_prompt_', 'pf_tokens_', 'pf_agents_']
  ;[localStorage, sessionStorage].forEach((storage) => {
    const keysToRemove = []
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index)
      if (key && prefixes.some((prefix) => key.startsWith(prefix))) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach((key) => storage.removeItem(key))
  })
}

async function resetClientSessionState() {
  const [{ resetChatSessionState }, { usePromptStore }, { useTokenStore }, { useModelStore }] =
    await Promise.all([
      import('./chatStore'),
      import('./promptStore'),
      import('./tokenStore'),
      import('./modelStore'),
    ])

  resetChatSessionState()
  usePromptStore.getState().actions.reset()
  useTokenStore.getState().actions.reset()
  useModelStore.getState().actions.clearRecommendations()
  useModelStore.getState().actions.selectModel(null)
}

function saveAuthState(snapshot) {
  if (snapshot.user) {
    localStorage.setItem(
      'pf_auth',
      JSON.stringify({
        user: snapshot.user,
        sessionId: snapshot.sessionId,
        accessToken: snapshot.accessToken,
        refreshToken: snapshot.refreshToken,
      }),
    )
    sessionStorage.removeItem('pf_guest')
    return
  }

  if (snapshot.isGuest && snapshot.sessionId && snapshot.accessToken) {
    sessionStorage.setItem(
      'pf_guest',
      JSON.stringify({
        sessionId: snapshot.sessionId,
        guestToken: snapshot.accessToken,
      }),
    )
    localStorage.removeItem('pf_auth')
    return
  }

  localStorage.removeItem('pf_auth')
  sessionStorage.removeItem('pf_guest')
}

export const useAuthStore = create((set, get) => ({
  user: null,
  isGuest: false,
  hasBootstrapped: false,
  sessionId: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  actions: {
    bootstrap(snapshot) {
      tokenManager.setToken(snapshot?.accessToken ?? null)
      set({
        user: snapshot?.user ?? null,
        isGuest: snapshot?.isGuest ?? false,
        hasBootstrapped: true,
        sessionId: snapshot?.sessionId ?? null,
        accessToken: snapshot?.accessToken ?? null,
        refreshToken: snapshot?.refreshToken ?? null,
        isAuthenticated: Boolean(snapshot?.user),
        isLoading: false,
        error: null,
      })
    },
    async login(email, password) {
      set({ isLoading: true, error: null })
      try {
        const result = await authService.login({ email, password })
        const guestData = sessionStorage.getItem('pf_guest')
        let sessionId = result.sessionId

        if (guestData) {
          const parsedGuest = JSON.parse(guestData)
          const merged = await sessionService.merge(parsedGuest.sessionId, result.user.id)
          sessionId = merged.sessionId
        }

        const nextState = {
          user: result.user,
          isGuest: false,
          sessionId,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        }
        tokenManager.setToken(result.accessToken)
        saveAuthState(nextState)
        set(nextState)
        return nextState
      } catch (error) {
        set({
          isLoading: false,
          error: error?.response?.data?.message ?? 'Unable to sign in right now.',
        })
        throw error
      }
    },
    async register(name, email, password, confirmPassword) {
      set({ isLoading: true, error: null })
      try {
        const result = await authService.register({
          name,
          email,
          password,
          confirmPassword,
        })
        const nextState = {
          user: result.user,
          isGuest: false,
          sessionId: result.sessionId,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        }
        tokenManager.setToken(result.accessToken)
        saveAuthState(nextState)
        set(nextState)
        return nextState
      } catch (error) {
        set({
          isLoading: false,
          error: error?.response?.data?.message ?? 'Unable to create your account.',
        })
        throw error
      }
    },
    async logout(options = { reinitializeGuest: true, silent: false }) {
      try {
        if (get().user) {
          await authService.logout()
        }
      } catch {
        if (!options.silent) {
          set({ error: 'We could not reach the server while logging out.' })
        }
      } finally {
        tokenManager.clearToken()
        saveAuthState({})
        clearPersistedWorkspaceState()
        await resetClientSessionState()
        set({
          user: null,
          isGuest: false,
          hasBootstrapped: true,
          sessionId: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        })
      }

      if (options.reinitializeGuest) {
        return get().actions.initGuestSession()
      }

      return null
    },
    async initGuestSession() {
      set({ isLoading: true, error: null })
      try {
        const result = await authService.initGuest()
        const nextState = {
          user: null,
          isGuest: true,
          sessionId: result.sessionId,
          accessToken: result.guestToken,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        }
        tokenManager.setToken(result.guestToken)
        saveAuthState(nextState)
        set(nextState)
        return nextState
      } catch {
        const offlineGuestToken = generateGuestId()
        const offlineState = {
          user: null,
          isGuest: true,
          sessionId: generateGuestId(),
          accessToken: offlineGuestToken,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        }
        tokenManager.setToken(offlineGuestToken)
        saveAuthState(offlineState)
        set(offlineState)
        return offlineState
      }
    },
    async refreshToken(silent = true) {
      if (!get().user) return null

      try {
        const result = await authService.refreshToken(get().refreshToken)
        const nextState = {
          ...get(),
          accessToken: result.accessToken,
          isAuthenticated: true,
        }
        tokenManager.setToken(result.accessToken)
        saveAuthState(nextState)
        set({ accessToken: result.accessToken, isAuthenticated: true })
        return result.accessToken
      } catch (error) {
        if (!silent) {
          set({
            error:
              error?.response?.data?.message ??
              'Your session expired. Please sign in again.',
          })
        }
        return null
      }
    },
    clearError() {
      set({ error: null })
    },
  },
}))

tokenManager.setRefreshHandler(() => useAuthStore.getState().actions.refreshToken())
tokenManager.setAuthFailureHandler(() =>
  useAuthStore.getState().actions.logout({ reinitializeGuest: true, silent: true }),
)
