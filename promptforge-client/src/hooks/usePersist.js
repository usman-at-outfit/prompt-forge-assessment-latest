import { useEffect } from 'react'

function resolveStorage(storageKey, storageMode) {
  if (storageMode === 'local') return localStorage
  if (storageMode === 'session') return sessionStorage
  return storageKey.includes('user:') ? localStorage : sessionStorage
}

function shouldHydrateFromSnapshot(currentState) {
  if (Array.isArray(currentState.messages)) {
    return currentState.messages.length === 0
  }

  if (Array.isArray(currentState.promptHistory)) {
    return currentState.promptHistory.length === 0
  }

  return currentState.totalTokens === 0
}

export function readPersistedSnapshot(storage, storageKey) {
  const raw = storage.getItem(storageKey)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw)

    if (
      parsed &&
      typeof parsed === 'object' &&
      Object.prototype.hasOwnProperty.call(parsed, 'state')
    ) {
      const expiresAt =
        typeof parsed.expiresAt === 'number' ? parsed.expiresAt : null

      if (expiresAt && Date.now() > expiresAt) {
        storage.removeItem(storageKey)
        return null
      }

      return parsed.state
    }

    return parsed
  } catch {
    return null
  }
}

export function createPersistedSnapshot(state, ttlMs) {
  const serializedState = JSON.parse(
    JSON.stringify(state, (_key, value) =>
      typeof value === 'function' ? undefined : value,
    ),
  )

  if (!ttlMs) {
    return serializedState
  }

  const savedAt = Date.now()

  return {
    savedAt,
    expiresAt: savedAt + ttlMs,
    state: serializedState,
  }
}

export function writePersistedSnapshot(storage, storageKey, state, ttlMs = null) {
  const snapshot = createPersistedSnapshot(state, ttlMs)
  storage.setItem(storageKey, JSON.stringify(snapshot))
}

export function removePersistedSnapshot(storage, storageKey) {
  storage.removeItem(storageKey)
}

export function usePersist(storeHook, storageKey, options = {}) {
  const { storage: storageMode = 'auto', ttlMs = null } = options

  useEffect(() => {
    if (!storageKey || storageKey.includes('bootstrap')) return undefined

    const storage = resolveStorage(storageKey, storageMode)
    const snapshot = readPersistedSnapshot(storage, storageKey)

    const persistState = (state) => {
      try {
        writePersistedSnapshot(storage, storageKey, state, ttlMs)
      } catch {
        // ignore storage serialization and quota failures
      }
    }

    if (snapshot) {
      const currentState = storeHook.getState()
      const hydrate = currentState.actions?.hydrate

      if (shouldHydrateFromSnapshot(currentState)) {
        if (typeof hydrate === 'function') {
          hydrate(snapshot)
        } else {
          storeHook.setState(snapshot)
        }
      }
    }

    const unsubscribe = storeHook.subscribe((state) => {
      persistState(state)
    })

    persistState(storeHook.getState())

    return unsubscribe
  }, [storageKey, storeHook, storageMode, ttlMs])
}
