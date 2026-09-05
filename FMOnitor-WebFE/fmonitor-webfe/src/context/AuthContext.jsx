import { createContext, useContext, useEffect, useState } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

const AuthContext = createContext(null)

// Single source of truth for "who is logged in" (name/email/picture/role).
// Previously AdminLayout, ProfileDropdown, and the Accounts page each fetched
// /api/user independently on every admin page load - three requests for data
// that's identical and never changes within a session. This fetches it once,
// here, and everything else reads it from context instead.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch(`${API_BASE_URL}/api/user`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setUser(data)
      })
      .catch(() => {
        if (!cancelled) setUser(null)
      })
      .finally(() => {
        if (!cancelled) setChecked(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, checked, authorized: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

// Only ever rendered under AdminLayout (which owns the AuthProvider), so
// every consumer is guaranteed a real value here, never the createContext
// default - the throw below is a misuse guard, not a real runtime path.
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
