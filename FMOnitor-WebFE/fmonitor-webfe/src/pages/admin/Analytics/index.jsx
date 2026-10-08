import { useMemo, useState } from 'react'
import AdminPageShell from '../../../components/layout/AdminPageShell'
import StatCard from '../../../components/common/StatCard'
import SectionCard, { SectionEmpty } from '../../../components/common/SectionCard'
import ColumnChart from '../../../components/common/charts/ColumnChart'
import StackedBar from '../../../components/common/charts/StackedBar'
import BarList from '../../../components/common/charts/BarList'
import useOperationsData from '../../../hooks/useOperationsData'
import { CONDITIONS, REPORT_STATUSES, REPORT_TYPES } from '../Inventory/data/inventoryData'
import { TASK_STATUSES, generateTasks } from '../Calendar/data/taskData'
import { CONDITION_COLORS, REPORT_STATUS_COLORS, TASK_STATUS_COLORS } from '../../../constants/chartColors'
import AnalyticsSkeleton from './components/AnalyticsSkeleton'
import { averageResolution, countBy, reportTrend, unitsByLocation } from './utils/metrics'

const RANGES = [
  ['weekly', 'Weekly'],
  ['monthly', 'Monthly'],
]

const enter = (delay) => ({
  className: 'animate-[fade-in-up_0.45s_ease-out_forwards] opacity-0',
  style: { animationDelay: `${delay}s` },
})

function RangeToggle({ value, onChange }) {
  return (
    <div role="tablist" aria-label="Trend range" className="inline-flex shrink-0 rounded-lg bg-gray-100 p-0.5">
      {RANGES.map(([key, label]) => (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={value === key}
          onClick={() => onChange(key)}
          className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
            value === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

const toSegments = (counts, colors) =>
  Object.entries(counts).map(([key, value]) => ({ key, label: key, value, color: colors[key] }))

function AnalyticsContent() {
  const { loading, items, reports } = useOperationsData()
  const [tasks] = useState(() => generateTasks(new Date()))
  const [range, setRange] = useState('weekly')

  const totals = useMemo(() => {
    const totalUnits = items.reduce((sum, item) => sum + (item.available ?? 0), 0)
    const goodUnits = items.filter((i) => i.condition === 'Good').reduce((sum, i) => sum + (i.available ?? 0), 0)
    const resolved = reports.filter((r) => r.status === 'Resolved').length
    return {
      totalUnits,
      locations: new Set(items.map((i) => i.location)).size,
      goodPct: totalUnits ? Math.round((goodUnits / totalUnits) * 100) : 0,
      resolved,
      resolutionPct: reports.length ? Math.round((resolved / reports.length) * 100) : 0,
      avgResolution: averageResolution(reports),
    }
  }, [items, reports])

  const conditionUnits = useMemo(() => {
    const units = Object.fromEntries(CONDITIONS.map((c) => [c, 0]))
    for (const item of items) if (item.condition in units) units[item.condition] += item.available ?? 0
    return units
  }, [items])

  const trend = useMemo(() => reportTrend(reports, range), [reports, range])
  const trendTotal = trend.reduce((sum, d) => sum + d.value, 0)
  const locations = useMemo(() => unitsByLocation(items), [items])
  const reportTypes = useMemo(() => countBy(reports, 'type', REPORT_TYPES), [reports])
  const reportStatuses = useMemo(() => countBy(reports, 'status', REPORT_STATUSES), [reports])
  const taskStatuses = useMemo(() => countBy(tasks, 'status', TASK_STATUSES), [tasks])

  if (loading) return <AnalyticsSkeleton />

  return (
    <div className="flex flex-col gap-6">
      <div {...enter(0)}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Units"
            value={totals.totalUnits.toLocaleString()}
            hint={`${items.length} items across ${totals.locations} location${totals.locations === 1 ? '' : 's'}`}
            tone="brand"
          />
          <StatCard
            label="Good Condition"
            value={`${totals.goodPct}%`}
            hint="Share of units with no issues"
            tone="success"
          />
          <StatCard
            label="Resolution Rate"
            value={`${totals.resolutionPct}%`}
            hint={`${totals.resolved} of ${reports.length} reports resolved`}
            tone="info"
          />
          <StatCard
            label="Avg. Resolution"
            value={totals.avgResolution ?? '—'}
            hint="From report filed to resolved"
            tone="neutral"
          />
        </div>
      </div>

      <div {...enter(0.05)}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <SectionCard
            title="Reports Filed"
            subtitle={`${trendTotal} report${trendTotal === 1 ? '' : 's'} in the ${
              range === 'weekly' ? 'last 8 weeks' : 'last 6 months'
            }`}
            toolbar={<RangeToggle value={range} onChange={setRange} />}
            className="lg:col-span-2"
          >
            {/* Re-keyed per range so the columns replay their entrance. */}
            <ColumnChart key={range} data={trend} height={220} unitLabel="reports" />
          </SectionCard>

          <SectionCard title="Equipment Condition" subtitle="Units by current condition">
            {totals.totalUnits === 0 ? (
              <SectionEmpty message="No equipment recorded yet." />
            ) : (
              <StackedBar unit="units" segments={toSegments(conditionUnits, CONDITION_COLORS)} />
            )}
          </SectionCard>
        </div>
      </div>

      <div {...enter(0.1)}>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          <SectionCard title="Units by Location" subtitle="Where equipment is stored">
            {locations.length === 0 ? (
              <SectionEmpty message="No equipment recorded yet." />
            ) : (
              <BarList rows={locations} unit="units" />
            )}
          </SectionCard>

          <SectionCard title="Report Breakdown" subtitle="By issue type and status">
            {reports.length === 0 ? (
              <SectionEmpty message="No reports filed yet." />
            ) : (
              <div className="flex flex-col gap-6">
                <BarList
                  rows={REPORT_TYPES.map((t) => ({ label: t, value: reportTypes[t] }))}
                  unit="reports"
                />
                <div className="border-t border-gray-100 pt-5">
                  <StackedBar unit="reports" segments={toSegments(reportStatuses, REPORT_STATUS_COLORS)} />
                </div>
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Task Pipeline"
            subtitle="Calendar tasks by status"
            action={{ label: 'Calendar', to: '/calendar' }}
            className="md:col-span-2 xl:col-span-1"
          >
            {tasks.length === 0 ? (
              <SectionEmpty message="No tasks scheduled." />
            ) : (
              <StackedBar unit="tasks" segments={toSegments(taskStatuses, TASK_STATUS_COLORS)} />
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  )
}

function Analytics() {
  // skipSkeleton: the page shows its own AnalyticsSkeleton instead of the generic one.
  return (
    <AdminPageShell skipSkeleton>
      <AnalyticsContent />
    </AdminPageShell>
  )
}

export default Analytics
