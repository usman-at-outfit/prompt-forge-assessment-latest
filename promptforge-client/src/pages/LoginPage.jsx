import { Link, useLocation } from 'react-router-dom'
import { AuthQuotePanel } from '../components/auth/AuthQuotePanel'
import { LoginForm } from '../components/auth/LoginForm'
import { PageWrapper } from '../components/layout/PageWrapper'
import { Card } from '../components/ui/Card'

export function LoginPage() {
  const location = useLocation()

  return (
    <PageWrapper className="mx-auto flex max-w-6xl items-center justify-center px-4">
      <div className="grid w-full gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="space-y-5 border-[var(--accent)]/15">
          <div className="display-font text-[clamp(2rem,8vw,2.5rem)] font-semibold">Welcome back</div>
          <p className="text-[var(--text-secondary)]">
            Sign in to sync your chats, prompts, and saved agents across sessions.
          </p>
          <LoginForm />
          <div className="text-sm text-[var(--text-secondary)]">
            New here?{' '}
            <Link
              to="/register"
              state={location.state}
              className="text-[var(--accent-hover)]"
            >
              Create an account
            </Link>
          </div>
        </Card>
        <AuthQuotePanel
          title="A few AI thoughts before you dive back in"
          description="Let the right side breathe with rotating quotes instead of a feature checklist."
        />
      </div>
    </PageWrapper>
  )
}
