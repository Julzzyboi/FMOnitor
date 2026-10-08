import { useEffect, useMemo, useState } from 'react'
import AdminPageShell from '../../../components/layout/AdminPageShell'
import SectionCard, { SectionEmpty } from '../../../components/common/SectionCard'
import DotGrid from '../../../components/common/DotGrid'
import Avatar from '../../../components/common/Avatar'
import useDelayedLoading from '../../../hooks/useDelayedLoading'
import { useAuth } from '../../../context/AuthContext'
import { performLogout } from '../../../utils/logout'
import { formatYmdTime12h } from '../../../utils/dateTime'
import { apiRequest } from '../Inventory/api/inventoryApi'
import RelativeTime from '../Inventory/components/RelativeTime'
import ProfileSkeleton from './components/ProfileSkeleton'

const HISTORY_LIMIT = 6

const enter = (delay) => ({
  className: 'animate-[fade-in-up_0.45s_ease-out_forwards] opacity-0',
  style: { animationDelay: `${delay}s` },
})

function DetailRow({ label, children }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</dt>
      <dd className="mt-1 truncate text-sm font-medium text-gray-900">{children}</dd>
    </div>
  )
}

function ProfileContent() {
  const { user } = useAuth()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const minDelayPending = useDelayedLoading()

  useEffect(() => {
    let cancelled = false
    apiRequest('GET', '/api/login-logs')
      .then((result) => {
        if (!cancelled && result.ok) setLogs(result.data ?? [])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const myLogs = useMemo(() => logs.filter((log) => log.email === user?.email), [logs, user?.email])
  const lastSignIn = myLogs.find((log) => log.action !== 'LOGGED OUT')
  const signInsThisMonth = useMemo(() => {
    const now = new Date()
    return myLogs.filter((log) => {
      const d = new Date(log.actionAt)
      return log.action !== 'LOGGED OUT' && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    }).length
  }, [myLogs])

  if (loading || minDelayPending) return <ProfileSkeleton />

  return (
    <div className="flex flex-col gap-6">
      <div {...enter(0)}>
        <section className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="relative h-24 overflow-hidden bg-[#141414] sm:h-28">
            <div className="absolute -right-10 -top-16 h-48 w-48 rounded-full bg-[#fccb35]/10" />
            <DotGrid className="absolute right-6 top-5 opacity-60" />
          </div>

          <div className="flex flex-col gap-4 px-5 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-0 items-end gap-4">
              <Avatar
                src={user?.picture}
                name={user?.name}
                size="lg"
                className="relative -mt-10 shadow-md ring-4 ring-white"
              />
              <div className="min-w-0 pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-lg font-bold text-gray-900 sm:text-xl">{user?.name || 'Unnamed user'}</h1>
                  {user?.role && (
                    <span className="rounded-full bg-[#fccb35] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-900">
                      {user.role}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>

            <dl className="flex gap-8 sm:pb-1 sm:text-right">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Last sign-in</dt>
                <dd className="mt-1 text-sm font-semibold text-gray-900">
                  <RelativeTime value={lastSignIn?.actionAt} />
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">This month</dt>
                <dd className="mt-1 text-sm font-semibold tabular-nums text-gray-900">
                  {signInsThisMonth} sign-in{signInsThisMonth === 1 ? '' : 's'}
                </dd>
              </div>
            </dl>
          </div>
        </section>
      </div>

      <div {...enter(0.08)}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <SectionCard title="Account Details">
            <dl className="flex flex-col gap-5">
              <DetailRow label="Full name">{user?.name || '—'}</DetailRow>
              <DetailRow label="Email address">{user?.email || '—'}</DetailRow>
              <DetailRow label="Role">{user?.role || '—'}</DetailRow>
              <DetailRow label="Sign-in method">Google account</DetailRow>
            </dl>
            <p className="mt-5 rounded-lg bg-gray-50 px-3 py-2.5 text-xs text-gray-500">
              Your name and photo come from your Google account. Contact a Superadmin to change your role.
            </p>
            <button
              type="button"
              onClick={performLogout}
              className="mt-5 w-full cursor-pointer rounded-lg border border-gray-200 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-gray-700 transition-colors duration-150 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              Sign out
            </button>
          </SectionCard>

          <SectionCard
            title="Sign-in History"
            subtitle="Your most recent sessions"
            action={{ label: 'All activity', to: '/history?tab=LOGIN_ACTIVITY' }}
            className="lg:col-span-2"
          >
            {myLogs.length === 0 ? (
              <SectionEmpty message="No sign-in activity recorded yet." />
            ) : (
              <ul className="-mx-2 flex flex-col divide-y divide-gray-100">
                {myLogs.slice(0, HISTORY_LIMIT).map((log) => {
                  const signedIn = log.action !== 'LOGGED OUT'
                  return (
                    <li
                      key={log.id}
                      className="flex items-center gap-3 rounded-lg px-2 py-3 transition-colors duration-150 hover:bg-gray-50"
                    >
                      <span
                        aria-hidden="true"
                        className={`h-2 w-2 shrink-0 rounded-full ${signedIn ? 'bg-emerald-500' : 'bg-gray-300'}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900">{signedIn ? 'Signed in' : 'Signed out'}</p>
                        <p className="mt-0.5 text-xs tabular-nums text-gray-500">{formatYmdTime12h(log.actionAt)}</p>
                      </div>
                      <RelativeTime value={log.actionAt} className="shrink-0 text-xs text-gray-400" />
                    </li>
                  )
                })}
              </ul>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  )
}

function Profile() {
  // skipSkeleton: the page shows its own ProfileSkeleton instead of the generic one.
  return (
    <AdminPageShell skipSkeleton>
      <ProfileContent />
    </AdminPageShell>
  )
}

export default Profile
