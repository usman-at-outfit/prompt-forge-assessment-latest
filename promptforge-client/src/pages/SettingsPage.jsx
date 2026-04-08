import { PageWrapper } from '../components/layout/PageWrapper'
import { Card } from '../components/ui/Card'
import { useAuthStore } from '../store/authStore'

export function SettingsPage() {
  const user = useAuthStore((state) => state.user)
  const sessionId = useAuthStore((state) => state.sessionId)

  return (
    <PageWrapper className="mx-auto max-w-5xl space-y-6 px-4 lg:px-8">
      <h1 className="display-font text-[clamp(2.2rem,9vw,3.25rem)] font-bold">Settings</h1>
      <Card>
        <div className="text-sm uppercase tracking-[0.2em] text-[var(--text-muted)]">
          Account
        </div>
        <div className="mt-4 space-y-2 text-[var(--text-secondary)]">
          <div>Name: {user?.name ?? 'Guest'}</div>
          <div>Email: {user?.email ?? 'Guest session only'}</div>
          <div>Session ID: {sessionId}</div>
        </div>
      </Card>
      <Card>
        <div className="text-sm uppercase tracking-[0.2em] text-[var(--text-muted)]">
          Preferences
        </div>
        <p className="mt-4 text-[var(--text-secondary)]">
          Theme, language, and default model preferences are ready to be stored through
          the backend user profile when you expand the product after the hackathon.
        </p>
      </Card>
    </PageWrapper>
  )
}
