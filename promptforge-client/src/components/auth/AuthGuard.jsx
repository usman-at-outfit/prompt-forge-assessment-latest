import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export function AuthGuard({ children, allowGuest = false }) {
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const isGuest = useAuthStore((state) => state.isGuest)
  const hasBootstrapped = useAuthStore((state) => state.hasBootstrapped)

  if (!hasBootstrapped) {
    return null
  }

  if (user) {
    return children
  }

  if (allowGuest && isGuest) {
    return children
  }

  return <Navigate to="/login" replace state={{ from: location.pathname }} />
}
