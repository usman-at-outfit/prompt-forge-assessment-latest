import { useEffect, useState } from 'react'
import { authService } from '../services/authService'
import { sessionService } from '../services/sessionService'
import { tokenManager } from '../services/tokenManager'
import { useAuthStore } from '../store/authStore'
import { useChatStore } from '../store/chatStore'
import { usePromptStore } from '../store/promptStore'
import { useTokenStore } from '../store/tokenStore'

function parseTokenExpiry(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp ? payload.exp * 1000 : null
  } catch {
    return null
  }
}

function normalizeModelHistory(modelHistory, fallbackModel) {
  const uniqueModels = Array.from(
    new Set([...(Array.isArray(modelHistory) ? modelHistory : []), fallbackModel].filter(Boolean)),
  )

  return uniqueModels.length ? uniqueModels : ['gpt-4o']
}

function initializeChatSession(session) {
  const chatState = useChatStore.getState()
  const initSession = chatState.actions?.initSession
  const hydrate = chatState.actions?.hydrate
  const nextSessionId = session?.sessionId ?? null
  const existingMessages = Array.isArray(chatState.messages) ? chatState.messages : []
  const incomingMessages = session?.chatHistory ?? session?.messages ?? []
  const canReuseExistingMessages =
    existingMessages.length > 0 &&
    (!chatState.sessionId || !nextSessionId || chatState.sessionId === nextSessionId) &&
    existingMessages.length >= incomingMessages.length
  const activeModel = canReuseExistingMessages
    ? chatState.activeModel ?? session?.activeModel ?? 'gpt-4o'
    : session?.activeModel ?? chatState.activeModel ?? 'gpt-4o'
  const normalizedSnapshot = {
    sessionId: nextSessionId,
    messages: canReuseExistingMessages ? existingMessages : incomingMessages,
    activeModel,
    modelHistory: normalizeModelHistory(
      canReuseExistingMessages
        ? [...chatState.modelHistory, ...(session?.modelHistory ?? [])]
        : [...(session?.modelHistory ?? []), ...chatState.modelHistory],
      activeModel,
    ),
    guideFlow: chatState.guideFlow,
  }

  if (typeof initSession === 'function') {
    initSession(normalizedSnapshot)
    return
  }

  if (typeof hydrate === 'function') {
    hydrate(normalizedSnapshot)
    return
  }

  useChatStore.setState(normalizedSnapshot)
}

export function useSession() {
  const [isReady, setIsReady] = useState(false)
  const authStore = useAuthStore()

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      const authActions = useAuthStore.getState().actions

      try {
        const storedAuth = localStorage.getItem('pf_auth')
        if (storedAuth) {
          const parsedAuth = JSON.parse(storedAuth)
          authActions.bootstrap({
            user: parsedAuth.user,
            isGuest: false,
            sessionId: parsedAuth.sessionId,
            accessToken: parsedAuth.accessToken,
            refreshToken: parsedAuth.refreshToken,
          })

          try {
            const me = await authService.me()
            authActions.bootstrap({
              user: me.user,
              isGuest: false,
              sessionId: parsedAuth.sessionId,
              accessToken: parsedAuth.accessToken,
              refreshToken: parsedAuth.refreshToken,
            })
            if (!cancelled) {
              setIsReady(true)
            }
            return
          } catch {
            const refreshed = await authActions.refreshToken()
            if (refreshed) {
              if (!cancelled) setIsReady(true)
              return
            }
          }
        }

        const storedGuest = sessionStorage.getItem('pf_guest')
        if (storedGuest) {
          const parsedGuest = JSON.parse(storedGuest)
          authActions.bootstrap({
            user: null,
            isGuest: true,
            sessionId: parsedGuest.sessionId,
            accessToken: parsedGuest.guestToken,
          })
          if (!cancelled) {
            setIsReady(true)
          }
          return
        }

        await authActions.initGuestSession()
      } finally {
        if (!cancelled) {
          useAuthStore.setState({ hasBootstrapped: true })
          setIsReady(true)
        }
      }
    }

    bootstrap()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function hydrateSession() {
      if (!authStore.sessionId) return

      try {
        const session = await sessionService.load(authStore.sessionId)
        if (cancelled) return
        initializeChatSession(session)
        usePromptStore.getState().actions.hydrate(session)
        await useTokenStore.getState().actions.loadSession(authStore.sessionId)
      } catch {
        initializeChatSession({
          sessionId: authStore.sessionId,
          chatHistory: [],
          activeModel: 'gpt-4o',
          modelHistory: ['gpt-4o'],
        })
      }
    }

    hydrateSession()

    return () => {
      cancelled = true
    }
  }, [authStore.sessionId])

  useEffect(() => {
    const token = authStore.accessToken
    if (!token || authStore.isGuest) return undefined

    const interval = window.setInterval(async () => {
      const expiry = parseTokenExpiry(tokenManager.getToken())
      if (!expiry) return
      if (expiry - Date.now() < 2 * 60 * 1000) {
        await useAuthStore.getState().actions.refreshToken()
      }
    }, 30 * 1000)

    return () => window.clearInterval(interval)
  }, [authStore.accessToken, authStore.isGuest])

  return { isReady }
}
