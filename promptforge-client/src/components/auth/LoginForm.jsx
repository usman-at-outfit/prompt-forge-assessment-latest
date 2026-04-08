import { motion } from 'framer-motion'
import { ArrowRight, UserRound } from 'lucide-react'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

export function LoginForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const authError = useAuthStore((state) => state.error)
  const isLoading = useAuthStore((state) => state.isLoading)
  const login = useAuthStore((state) => state.actions.login)
  const initGuestSession = useAuthStore((state) => state.actions.initGuestSession)
  const clearError = useAuthStore((state) => state.actions.clearError)
  const [form, setForm] = useState({ email: '', password: '' })
  const redirectTo =
    typeof location.state?.from === 'string' ? location.state.from : '/hub'

  const onChange = (key) => (event) => {
    clearError()
    setForm((state) => ({ ...state, [key]: event.target.value }))
  }

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault()
        await login(form.email, form.password)
        navigate(redirectTo, { replace: true })
      }}
    >
      <Input label="Email" type="email" value={form.email} onChange={onChange('email')} />
      <Input
        label="Password"
        type="password"
        value={form.password}
        onChange={onChange('password')}
        error={authError}
      />
      <Button className="w-full" disabled={isLoading}>
        {isLoading ? 'Signing in...' : 'Login'}
        <ArrowRight className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="secondary"
        className="w-full"
        onClick={async () => {
          await initGuestSession()
          navigate('/hub', { replace: true })
        }}
      >
        <UserRound className="h-4 w-4" />
        Continue as Guest
      </Button>
      {authError ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[var(--radius-md)] border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700"
        >
          {authError}
        </motion.div>
      ) : null}
    </form>
  )
}
