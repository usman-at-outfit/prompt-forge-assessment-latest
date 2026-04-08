import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

function passwordStrength(password) {
  if (password.length >= 12) return { label: 'Strong', width: '100%' }
  if (password.length >= 8) return { label: 'Good', width: '66%' }
  return { label: 'Weak', width: '33%' }
}

export function RegisterForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const register = useAuthStore((state) => state.actions.register)
  const authError = useAuthStore((state) => state.error)
  const isLoading = useAuthStore((state) => state.isLoading)
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const redirectTo =
    typeof location.state?.from === 'string' ? location.state.from : '/hub'

  const strength = useMemo(() => passwordStrength(form.password), [form.password])

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault()
        await register(
          form.name,
          form.email,
          form.password,
          form.confirmPassword,
        )
        navigate(redirectTo, { replace: true })
      }}
    >
      <Input
        label="Name"
        value={form.name}
        onChange={(event) => setForm((state) => ({ ...state, name: event.target.value }))}
      />
      <Input
        label="Email"
        type="email"
        value={form.email}
        onChange={(event) => setForm((state) => ({ ...state, email: event.target.value }))}
      />
      <Input
        label="Password"
        type="password"
        value={form.password}
        onChange={(event) => setForm((state) => ({ ...state, password: event.target.value }))}
      />
      <div className="rounded-full bg-[var(--bg-muted)] p-1">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-hover)]"
          style={{ width: strength.width }}
        />
      </div>
      <div className="text-sm text-[var(--text-muted)]">Password strength: {strength.label}</div>
      <Input
        label="Confirm Password"
        type="password"
        value={form.confirmPassword}
        onChange={(event) =>
          setForm((state) => ({ ...state, confirmPassword: event.target.value }))
        }
        error={
          form.confirmPassword && form.password !== form.confirmPassword
            ? 'Passwords do not match'
            : authError
        }
      />
      <Button className="w-full" disabled={isLoading}>
        {isLoading ? 'Creating account...' : 'Create Account'}
        <ArrowRight className="h-4 w-4" />
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
