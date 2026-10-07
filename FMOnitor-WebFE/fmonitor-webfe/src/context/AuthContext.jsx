import { createContext, useContext, useEffect, useState } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

const AuthContext = createContext(null)

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

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
