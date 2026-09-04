import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import AdminLayout from './layouts/AdminLayout'
import Dashboard from './pages/admin/Dashboard'
import Inventory from './pages/admin/Inventory'
import Calendar from './pages/admin/Calendar'
import CampusMap from './pages/admin/CampusMap'
import Analytics from './pages/admin/Analytics'
import History from './pages/admin/History'
import Accounts from './pages/admin/Accounts'
import Profile from './pages/admin/Profile'
import RequireRole from './components/layout/RequireRole'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route element={<AdminLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/campus-map" element={<CampusMap />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/history" element={<History />} />
          <Route
            path="/accounts"
            element={
              <RequireRole role="Superadmin">
                <Accounts />
              </RequireRole>
            }
          />
          <Route path="/profile" element={<Profile />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
