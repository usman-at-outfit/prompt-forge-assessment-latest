import { Link, useLocation } from 'react-router-dom'
import { AuthQuotePanel } from '../components/auth/AuthQuotePanel'
import { RegisterForm } from '../components/auth/RegisterForm'
import { PageWrapper } from '../components/layout/PageWrapper'
import { Card } from '../components/ui/Card'

export function RegisterPage() {
  const location = useLocation()

  return (
    <PageWrapper className="mx-auto flex max-w-6xl items-center justify-center px-4">
      <div className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="space-y-5 border-[var(--accent)]/15">
          <div className="display-font text-[clamp(2rem,8vw,2.5rem)] font-semibold">Create your forge</div>
          <p className="text-[var(--text-secondary)]">
            Build an account to save sessions, merge guest work, and keep your agent
            projects under one identity.
          </p>
          <RegisterForm />
          <div className="text-sm text-[var(--text-secondary)]">
            Already have an account?{' '}
            <Link
              to="/login"
              state={location.state}
              className="text-[var(--accent-hover)]"
            >
              Sign in
            </Link>
          </div>
        </Card>
        <AuthQuotePanel
          title="A little machine wisdom before you build"
          description="Fresh quotes fade in over time, and the motion pauses while you hover."
        />
      </div>
    </PageWrapper>
  )
}
