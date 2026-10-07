import { useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { AuthProvider, useAuth } from '../../context/AuthContext'

function AdminLayoutContent() {
  const [menuOpen, setMenuOpen] = useState(false)
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

function AdminLayout() {
  return (
    <AuthProvider>
      <AdminLayoutContent />
    </AuthProvider>
  )
}

export default AdminLayout
