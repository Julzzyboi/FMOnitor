import { useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import Topbar from '../components/layout/Topbar'
import { AuthProvider, useAuth } from '../context/AuthContext'

function AdminLayoutContent() {
  const [menuOpen, setMenuOpen] = useState(false)
  // Two separate flags on purpose: "have we heard back yet" vs "was it a yes" -
  // collapsing these into one would make "still checking" indistinguishable
  // from "checked and it's a no" and briefly render this shell as if logged
  // in either way. Without this check at all, this whole shell (sidebar,
  // topbar, dashboard content) would render unconditionally the instant this
  // route is reached, regardless of whether the session behind it is
  // actually still valid - the reactive 401 handling in sessionGuard.js only
  // catches this AFTER something fetches and fails, not before.
  const { checked, authorized } = useAuth()

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

// AuthProvider lives here, not in App.jsx - only routes under this layout
// are ever behind a login, so this is the one place a single /api/user fetch
// can cover the whole authenticated section (sidebar, topbar, every admin
// page including the role-gated ones) without also running on /.
function AdminLayout() {
  return (
    <AuthProvider>
      <AdminLayoutContent />
    </AuthProvider>
  )
}

export default AdminLayout
