import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

// Gates a route to one specific role - e.g. only a Superadmin can reach
// /accounts. This is a UX guard only (skips rendering, redirects away); the
// real enforcement is server-side (AccountController checks isSuperadmin()
// on every accounts endpoint), since a frontend-only check can't stop
// someone from calling the API directly.
function RequireRole({ role, children }) {
  const { user } = useAuth()

  if (user?.role !== role) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default RequireRole
