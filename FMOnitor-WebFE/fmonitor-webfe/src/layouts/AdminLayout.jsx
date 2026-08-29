import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import Topbar from '../components/layout/Topbar'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

function AdminLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  // Two separate flags on purpose: "have we heard back yet" vs "was it a yes" -
  // collapsing these into one would make "still checking" indistinguishable
  // from "checked and it's a no" and briefly render this shell as if logged
  // in either way. Without this check at all, this whole shell (sidebar,
  // topbar, dashboard content) would render unconditionally the instant this
  // route is reached, regardless of whether the session behind it is
  // actually still valid - the reactive 401 handling in sessionGuard.js only
  // catches this AFTER something fetches and fails, not before.
  const [checked, setChecked] = useState(false)
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch(`${API_BASE_URL}/api/user`, { credentials: 'include' })
      .then((res) => {
        if (!cancelled) setAuthorized(res.ok)
      })
      .catch(() => {
        if (!cancelled) setAuthorized(false)
      })
      .finally(() => {
        if (!cancelled) setChecked(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-[#fdcc36]" />
      </div>
    )
  }

  if (!authorized) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="flex min-h-screen bg-gray-50 opacity-0 animate-[fade-in_0.3s_ease-out_forwards]">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar onOpenMenu={() => setMenuOpen(true)} />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
