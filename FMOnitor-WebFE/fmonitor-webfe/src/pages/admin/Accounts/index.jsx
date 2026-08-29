import { useEffect, useMemo, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMagnifyingGlass, faDownload, faUserPlus, faBan, faTrashCan } from '@fortawesome/free-solid-svg-icons'
import AdminPageShell from '../../../components/layout/AdminPageShell'
import StatCards from './StatCards'
import FilterDropdown from './FilterDropdown'
import UsersTable from './UsersTable'
import Pagination from './Pagination'
import EditUserModal from './EditUserModal'
import AddUserModal from './AddUserModal'
import UserDetailsModal from './UserDetailsModal'
import ConfirmModal from './ConfirmModal'
import Toast from './Toast'
import { ROLES, FILTERABLE_STATUSES } from './mockUsers'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const PAGE_SIZE = 8

function formatDate(isoString) {
  const d = new Date(isoString)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// Backend field names (googleSub/pictureUrl/createdAt) don't match what this
// page already expects (avatarUrl/dateCreated) - map once at the fetch boundary.
function mapAccount(account) {
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    role: account.role,
    status: account.status,
    dateCreated: formatDate(account.createdAt),
    avatarUrl: account.pictureUrl,
  }
}

const CONFIRM_CONFIG = {
  add: {
    title: 'Send invite?',
    message: "Each person will get an email with a link to sign in and activate their account.",
    confirmLabel: 'Invite',
    variant: 'success',
  },
  save: {
    title: 'Save changes?',
    message: "This will update the user's information.",
    confirmLabel: 'Save',
    variant: 'success',
  },
  disable: {
    title: 'Disable this user?',
    message: 'They will lose access to the system until re-enabled.',
    confirmLabel: 'Disable',
    variant: 'warning',
  },
  delete: {
    title: 'Delete this user?',
    message: "They'll be hidden from the active list and only reachable through the Deleted Users view.",
    confirmLabel: 'Delete',
    variant: 'danger',
  },
}

function AccountsContent() {
  const [users, setUsers] = useState([])
  const [currentUserRole, setCurrentUserRole] = useState(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [viewMode, setViewMode] = useState('normal') // 'normal' | 'disabled' | 'deleted'
  const [page, setPage] = useState(1)

  const [editingUser, setEditingUser] = useState(null)
  const [viewingUser, setViewingUser] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [pendingAction, setPendingAction] = useState(null) // { type: 'add'|'save'|'disable'|'delete', payload }
  const [toast, setToast] = useState(null) // { message, type }

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/accounts`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : []))
      .then((accounts) => setUsers(accounts.map(mapAccount)))
      .catch(() => setUsers([]))

    fetch(`${API_BASE_URL}/api/user`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((me) => setCurrentUserRole(me?.role ?? null))
      .catch(() => setCurrentUserRole(null))
  }, [])

  const canInvite = currentUserRole === 'Superadmin'

  const counts = useMemo(() => {
    const visible = users.filter((u) => u.status !== 'Deleted' && u.status !== 'Disabled')
    return {
      total: visible.length,
      active: visible.filter((u) => u.status === 'Active').length,
      inactive: visible.filter((u) => u.status === 'Inactive').length,
      unregistered: visible.filter((u) => u.status === 'Unregistered').length,
    }
  }, [users])

  const disabledCount = useMemo(() => users.filter((u) => u.status === 'Disabled').length, [users])
  const deletedCount = useMemo(() => users.filter((u) => u.status === 'Deleted').length, [users])

  const toggleViewMode = (mode) => {
    setViewMode((current) => (current === mode ? 'normal' : mode))
    setStatusFilter('All')
    setPage(1)
  }

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase()
    return users.filter((user) => {
      if (viewMode === 'disabled') {
        if (user.status !== 'Disabled') return false
      } else if (viewMode === 'deleted') {
        if (user.status !== 'Deleted') return false
      } else if (user.status === 'Disabled' || user.status === 'Deleted') {
        return false
      }

      const matchesQuery =
        query === '' ||
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query) ||
        user.status.toLowerCase().includes(query)
      const matchesRole = roleFilter === 'All' || user.role === roleFilter
      const matchesStatus = viewMode !== 'normal' || statusFilter === 'All' || user.status === statusFilter
      return matchesQuery && matchesRole && matchesStatus
    })
  }, [users, search, roleFilter, statusFilter, viewMode])

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const updateFilters = (setter) => (value) => {
    setter(value)
    setPage(1)
  }

  // --- request handlers: open the confirm modal instead of acting immediately ---
  const requestEdit = (user) => {
    setViewingUser(null)
    setEditingUser(user)
  }
  const requestDisable = (user) => setPendingAction({ type: 'disable', payload: user })
  const requestDelete = (user) => setPendingAction({ type: 'delete', payload: user })
  const requestSave = (updatedUser) => setPendingAction({ type: 'save', payload: updatedUser })
  const requestAdd = (draftUser) => setPendingAction({ type: 'add', payload: draftUser })

  const cancelPendingAction = () => setPendingAction(null)

  const confirmPendingAction = async () => {
    if (!pendingAction) return
    const { type, payload } = pendingAction

    if (type === 'add') {
      const { emails, role } = payload
      const createdUsers = []
      let alreadyExists = 0
      let failed = 0

      for (const email of emails) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/accounts/invite`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, role }),
          })

          if (res.status === 403) {
            // Applies to every email in this batch the same way - no point continuing the loop.
            setToast({ message: 'Only Superadmins can invite new users', type: 'danger' })
            setPendingAction(null)
            return
          }
          if (res.status === 409) {
            alreadyExists += 1
            continue
          }
          if (!res.ok) {
            failed += 1
            continue
          }

          createdUsers.push(await res.json())
        } catch {
          failed += 1
        }
      }

      if (createdUsers.length > 0) {
        setUsers((prev) => [...createdUsers.map(mapAccount), ...prev])
      }
      if (createdUsers.length > 0 && alreadyExists === 0 && failed === 0) {
        setShowAddModal(false)
      }

      const parts = []
      if (createdUsers.length > 0) parts.push(`${createdUsers.length} invite${createdUsers.length > 1 ? 's' : ''} sent`)
      if (alreadyExists > 0) parts.push(`${alreadyExists} already registered`)
      if (failed > 0) parts.push(`${failed} failed`)
      setToast({
        message: parts.join(', ') || 'Nothing to invite',
        type: createdUsers.length > 0 && failed === 0 ? 'success' : 'danger',
      })
    } else if (type === 'save') {
      setUsers((prev) => prev.map((u) => (u.id === payload.id ? payload : u)))
      setEditingUser(null)
      setToast({ message: 'Changes saved successfully', type: 'success' })
    } else if (type === 'disable') {
      setUsers((prev) => prev.map((u) => (u.id === payload.id ? { ...u, status: 'Disabled' } : u)))
      setViewingUser(null)
      setToast({ message: 'User disabled successfully', type: 'warning' })
    } else if (type === 'delete') {
      setUsers((prev) =>
        prev.map((u) => (u.id === payload.id ? { ...u, status: 'Deleted', previousStatus: u.status } : u)),
      )
      setViewingUser(null)
      setToast({ message: 'User deleted successfully', type: 'danger' })
    }

    setPendingAction(null)
  }

  // Restore is a lightweight recovery action, no confirmation needed.
  const handleRestore = (user) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, status: u.previousStatus ?? 'Active', previousStatus: undefined } : u)),
    )
    setViewingUser(null)
    setToast({ message: 'User restored successfully', type: 'success' })
  }

  const confirmConfig = pendingAction ? CONFIRM_CONFIG[pendingAction.type] : null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap animate-[fade-in-up_0.4s_ease-out_forwards] justify-end gap-3 opacity-0">
        <button
          type="button"
          className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-gray-600 transition-colors duration-150 hover:border-gray-300 hover:bg-gray-50"
        >
          <FontAwesomeIcon icon={faDownload} className="h-3.5 w-3.5" />
          Download
        </button>
        {canInvite && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex cursor-pointer items-center gap-2 rounded-lg bg-[#fccb35] px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-gray-900 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
          >
            <FontAwesomeIcon icon={faUserPlus} className="h-3.5 w-3.5" />
            Add User
          </button>
        )}
      </div>

      <div className="animate-[fade-in-up_0.4s_ease-out_0.05s_forwards] opacity-0">
        <StatCards counts={counts} />
      </div>

      <div className="flex animate-[fade-in-up_0.4s_ease-out_0.1s_forwards] flex-col gap-3 opacity-0 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => updateFilters(setSearch)(e.target.value)}
            placeholder="Search by name, email, role, or status..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-11 pr-4 text-sm text-gray-700 placeholder:text-gray-400 transition-shadow duration-150 focus:border-[#fccb35] focus:outline-none focus:ring-2 focus:ring-[#fccb35]/30"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <FilterDropdown
            label="Role"
            options={['All', ...ROLES]}
            value={roleFilter}
            onChange={updateFilters(setRoleFilter)}
          />
          {viewMode === 'normal' && (
            <FilterDropdown
              label="Status"
              options={['All', ...FILTERABLE_STATUSES]}
              value={statusFilter}
              onChange={updateFilters(setStatusFilter)}
            />
          )}
        </div>
      </div>

      <div className="flex flex-wrap animate-[fade-in-up_0.4s_ease-out_0.12s_forwards] gap-3 opacity-0">
        <button
          type="button"
          onClick={() => toggleViewMode('disabled')}
          className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-bold uppercase tracking-wide transition-colors duration-150 ${
            viewMode === 'disabled'
              ? 'border-orange-500 bg-orange-500 text-white'
              : 'border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100'
          }`}
        >
          <FontAwesomeIcon icon={faBan} className="h-3.5 w-3.5" />
          Disabled Users
          <span
            className={`rounded-full px-1.5 py-0.5 text-[10px] ${
              viewMode === 'disabled' ? 'bg-white/25' : 'bg-orange-200/70'
            }`}
          >
            {disabledCount}
          </span>
        </button>
        <button
          type="button"
          onClick={() => toggleViewMode('deleted')}
          className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-bold uppercase tracking-wide transition-colors duration-150 ${
            viewMode === 'deleted'
              ? 'border-red-600 bg-red-600 text-white'
              : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
          }`}
        >
          <FontAwesomeIcon icon={faTrashCan} className="h-3.5 w-3.5" />
          Deleted Users
          <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${viewMode === 'deleted' ? 'bg-white/25' : 'bg-red-200/70'}`}>
            {deletedCount}
          </span>
        </button>
      </div>

      <div className="animate-[fade-in-up_0.4s_ease-out_0.15s_forwards] rounded-xl bg-white opacity-0 shadow-sm">
        <UsersTable
          users={paginatedUsers}
          onRowClick={setViewingUser}
          onEdit={requestEdit}
          onDisable={requestDisable}
          onDelete={requestDelete}
          onRestore={handleRestore}
        />
        <div className="border-t border-gray-100">
          <Pagination
            page={currentPage}
            totalPages={totalPages}
            totalItems={filteredUsers.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      </div>

      {showAddModal && <AddUserModal onCancel={() => setShowAddModal(false)} onInvite={requestAdd} />}

      {editingUser && (
        <EditUserModal user={editingUser} onCancel={() => setEditingUser(null)} onSave={requestSave} />
      )}

      {viewingUser && (
        <UserDetailsModal
          user={viewingUser}
          onClose={() => setViewingUser(null)}
          onEdit={requestEdit}
          onDisable={requestDisable}
          onDelete={requestDelete}
          onRestore={handleRestore}
        />
      )}

      {pendingAction && (
        <ConfirmModal
          title={confirmConfig.title}
          message={confirmConfig.message}
          confirmLabel={confirmConfig.confirmLabel}
          variant={confirmConfig.variant}
          onConfirm={confirmPendingAction}
          onCancel={cancelPendingAction}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}

function Accounts() {
  return (
    <AdminPageShell>
      <AccountsContent />
    </AdminPageShell>
  )
}

export default Accounts
