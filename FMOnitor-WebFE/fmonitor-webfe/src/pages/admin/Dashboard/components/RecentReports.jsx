import SectionCard, { SectionEmpty } from '../../../../components/common/SectionCard'
import RelativeTime from '../../Inventory/components/RelativeTime'
import { formatItemId } from '../../Inventory/utils/itemId'

// Same colors as the Inventory Reports view.
const STATUS_STYLES = {
  Open: 'bg-red-50 text-red-700 ring-red-200',
  'In Progress': 'bg-amber-50 text-amber-700 ring-amber-200',
  Resolved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
}

function RecentReports({ reports, itemsById, className = '' }) {
  return (
    <SectionCard
      title="Open Reports"
      subtitle="Newest unresolved equipment issues"
      action={{ label: 'View all', to: '/inventory?view=reports' }}
      className={className}
    >
      {reports.length === 0 ? (
        <SectionEmpty message="No open reports. All equipment issues are resolved." />
      ) : (
        <ul className="-mx-2 flex flex-col divide-y divide-gray-100">
          {reports.map((report) => {
            const item = itemsById.get(report.itemId)
            return (
              <li
                key={report.id}
                className="flex items-center gap-4 rounded-lg px-2 py-3 transition-colors duration-150 hover:bg-gray-50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {item?.name ?? 'Unknown item'}
                    <span className="ml-1.5 font-normal text-gray-400">· {report.type}</span>
                  </p>
                  <p className="mt-0.5 truncate text-xs text-gray-500">
                    <span className="font-mono">{formatItemId(report.itemId)}</span>
                    {item?.location && <> · {item.location}</>}
                  </p>
                </div>

                <RelativeTime value={report.createdAt} className="hidden shrink-0 text-xs text-gray-400 sm:block" />

                <span
                  className={`w-20 shrink-0 rounded-full px-2 py-1 text-center text-[11px] font-semibold ring-1 ring-inset ${STATUS_STYLES[report.status]}`}
                >
                  {report.status}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </SectionCard>
  )
}

export default RecentReports
