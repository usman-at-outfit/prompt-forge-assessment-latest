import { AnimatePresence } from 'framer-motion'
import { useEffect, useMemo } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AuthGuard } from './components/auth/AuthGuard'
import { Navbar } from './components/layout/Navbar'
import { ToastViewport } from './components/ui/Toast'
import { usePersist } from './hooks/usePersist'
import { useSession } from './hooks/useSession'
import { useAuthStore } from './store/authStore'
import { useChatStore } from './store/chatStore'
import { useLanguageStore } from './store/languageStore'
import { usePromptStore } from './store/promptStore'
import { useTokenStore } from './store/tokenStore'
import { AgentsPage } from './pages/AgentsPage'
import { DiscoverDiscussPage } from './pages/DiscoverDiscussPage'
import { DiscoverPage } from './pages/DiscoverPage'
import { HubPage } from './pages/HubPage'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { MarketplacePage } from './pages/MarketplacePage'
import { RegisterPage } from './pages/RegisterPage'
import { SettingsPage } from './pages/SettingsPage'

const CHAT_SESSION_TTL_MS = 4 * 60 * 60 * 1000

function App() {
  const location = useLocation()
  const { isReady } = useSession()
  const user = useAuthStore((state) => state.user)
  const sessionId = useAuthStore((state) => state.sessionId)
  const locale = useLanguageStore((state) => state.locale)

  const persistKeyPrefix = useMemo(() => {
    if (user?.id) return `user:${user.id}`
    if (sessionId) return `guest:${sessionId}`
    return 'bootstrap'
  }, [sessionId, user?.id])

  usePersist(useChatStore, `pf_chat_${persistKeyPrefix}`, {
    storage: 'session',
    ttlMs: CHAT_SESSION_TTL_MS,
  })
  usePersist(usePromptStore, `pf_prompt_${persistKeyPrefix}`)
  usePersist(useTokenStore, `pf_tokens_${persistKeyPrefix}`)

  useEffect(() => {
    document.title = 'PromptForge'
  }, [])

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  return (
    <div className="grain app-shell bg-[var(--bg-base)] text-[var(--text-primary)]">
      <Navbar />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/hub"
            element={
              <AuthGuard allowGuest>
                <HubPage />
              </AuthGuard>
            }
          />
          <Route
            path="/marketplace"
            element={
              <AuthGuard allowGuest>
                <MarketplacePage />
              </AuthGuard>
            }
          />
          <Route
            path="/agents"
            element={
              <AuthGuard>
                <AgentsPage />
              </AuthGuard>
            }
          />
          <Route
            path="/discover"
            element={
              <AuthGuard allowGuest>
                <DiscoverPage />
              </AuthGuard>
            }
          />
          <Route
            path="/discover/discuss"
            element={
              <AuthGuard allowGuest>
                <DiscoverDiscussPage />
              </AuthGuard>
            }
          />
          <Route
            path="/settings"
            element={
              <AuthGuard>
                <SettingsPage />
              </AuthGuard>
            }
          />
          <Route path="*" element={<Navigate to={isReady ? '/hub' : '/'} replace />} />
        </Routes>
      </AnimatePresence>
      <ToastViewport />
    </div>
  )
}

export default App
