import { useCallback } from 'react'
import { useAuthStore } from '../store/authStore'
import { useTokenStore } from '../store/tokenStore'

export function useTokenTracker() {
  const track = useTokenStore((state) => state.actions.track)
  const sessionId = useAuthStore((state) => state.sessionId)
  const userId = useAuthStore((state) => state.user?.id ?? null)

  const trackAsync = useCallback(
    async ({
      agentName,
      actionType,
      inputText = '',
      modelId = 'gpt-4o',
      task,
      serverManaged = false,
    }) => {
      const result = await task()
      const outputText =
        typeof result === 'string'
          ? result
          : JSON.stringify(result ?? {})

      if (!serverManaged && sessionId) {
        await track({
          agentName,
          actionType,
          inputText,
          outputText,
          modelId,
          sessionId,
          userId,
        })
      } else if (sessionId) {
        await useTokenStore.getState().actions.loadSession(sessionId)
      }

      return result
    },
    [sessionId, track, userId],
  )

  return { trackAsync }
}
