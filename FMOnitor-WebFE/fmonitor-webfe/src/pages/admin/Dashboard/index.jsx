import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminPageShell from '../../../components/layout/AdminPageShell'
import StatCard from '../../../components/common/StatCard'
import useOperationsData from '../../../hooks/useOperationsData'
import useNow from '../../../hooks/useNow'
import { useAuth } from '../../../context/AuthContext'
import { generateTasks, isCompleted } from '../Calendar/data/taskData'
import { isSameDay } from '../Calendar/utils/dateUtils'
import DashboardSkeleton from './components/DashboardSkeleton'
import UpcomingTasks from './components/UpcomingTasks'
import RecentReports from './components/RecentReports'
import RecentActivity from './components/RecentActivity'

const LIST_LIMIT = 5

function greeting(now) {
  const hour = now.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

// Staggered entrance shared by every block on the page.
const enter = (delay) => ({
  className: 'animate-[fade-in-up_0.45s_ease-out_forwards] opacity-0',
  style: { animationDelay: `${delay}s` },
})

function DashboardContent() {
  const { user } = useAuth()
  const now = useNow()
  const { loading, items, reports, loginLogs } = useOperationsData()
  // Calendar tasks are still mock data generated on the client, like the Calendar page.
  const [tasks] = useState(() => generateTasks(new Date()))

  const stats = useMemo(() => {
    const totalUnits = items.reduce((sum, item) => sum + (item.available ?? 0), 0)
    const flagged = items.filter((item) => item.condition !== 'Good')
    const flaggedUnits = flagged.reduce((sum, item) => sum + (item.available ?? 0), 0)
    const unresolved = reports.filter((r) => r.status !== 'Resolved')
    const todaysTasks = tasks.filter((t) => isSameDay(t.scheduledAt, now))
    return {
      totalUnits,
      itemCount: items.length,
      flaggedUnits,
      flaggedItems: flagged.length,
      openReports: unresolved.filter((r) => r.status === 'Open').length,
      inProgressReports: unresolved.filter((r) => r.status === 'In Progress').length,
      todaysTasks: todaysTasks.length,
      todaysActive: todaysTasks.filter((t) => !isCompleted(t)).length,
    }
  }, [items, reports, tasks, now])

  const itemsById = useMemo(() => new Map(items.map((item) => [item.id, item])), [items])

  const upcomingTasks = useMemo(
    () => tasks.filter((t) => !isCompleted(t)).slice(0, LIST_LIMIT),
    [tasks],
  )

  const recentReports = useMemo(
    () =>
      reports
        .filter((r) => r.status !== 'Resolved')
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, LIST_LIMIT),
    [reports],
  )

  const recentLogs = useMemo(() => loginLogs.slice(0, LIST_LIMIT), [loginLogs])

  if (loading) return <DashboardSkeleton />

  const firstName = user?.name?.split(' ')[0]

  return (
    <div className="flex flex-col gap-6">
      <div {...enter(0)}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              {now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
            <h1 className="mt-1 text-xl font-bold text-gray-900 sm:text-2xl">
              {greeting(now)}
              {firstName && `, ${firstName}`}
            </h1>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/inventory"
              className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-gray-600 transition-colors duration-150 hover:border-gray-300 hover:bg-gray-50"
            >
              Inventory
            </Link>
            <Link
              to="/calendar"
              className="rounded-lg bg-[#fccb35] px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-gray-900 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
            >
              Schedule Task
            </Link>
          </div>
        </div>
      </div>

      <div {...enter(0.05)}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Equipment"
            value={stats.totalUnits.toLocaleString()}
            hint={`${stats.itemCount} item record${stats.itemCount === 1 ? '' : 's'}`}
            tone="brand"
            to="/inventory"
          />
          <StatCard
            label="Needs Attention"
            value={stats.flaggedUnits.toLocaleString()}
            hint={`${stats.flaggedItems} item${stats.flaggedItems === 1 ? '' : 's'} flagged for issues`}
            tone={stats.flaggedUnits > 0 ? 'warning' : 'success'}
            to="/inventory"
          />
          <StatCard
            label="Open Reports"
            value={stats.openReports}
            hint={`${stats.inProgressReports} in progress`}
            tone={stats.openReports > 0 ? 'danger' : 'success'}
            to="/inventory?view=reports"
          />
          <StatCard
            label="Today's Tasks"
            value={stats.todaysTasks}
            hint={`${stats.todaysActive} still active`}
            tone="info"
            to="/calendar"
          />
        </div>
      </div>

      <div {...enter(0.1)}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <UpcomingTasks tasks={upcomingTasks} now={now} className="lg:col-span-2" />
          <RecentActivity logs={recentLogs} />
        </div>
      </div>

      <div {...enter(0.15)}>
        <RecentReports reports={recentReports} itemsById={itemsById} />
      </div>
    </div>
  )
}

function Dashboard() {
  // skipSkeleton: the page shows its own DashboardSkeleton instead of the generic one.
  return (
    <AdminPageShell skipSkeleton>
      <DashboardContent />
    </AdminPageShell>
  )
}

export default Dashboard
