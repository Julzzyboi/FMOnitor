import SectionCard, { SectionEmpty } from '../../../../components/common/SectionCard'
import Avatar from '../../../../components/common/Avatar'
import RelativeTime from '../../Inventory/components/RelativeTime'

// Latest sign-ins and sign-outs across all accounts.
function RecentActivity({ logs }) {
  return (
    <SectionCard title="Recent Activity" action={{ label: 'History', to: '/history?tab=LOGIN_ACTIVITY' }}>
      {logs.length === 0 ? (
        <SectionEmpty message="No recent activity." />
      ) : (
        <ol className="relative flex flex-col gap-4 before:absolute before:bottom-2 before:left-4 before:top-2 before:w-px before:bg-gray-100">
          {logs.map((log) => {
            const signedIn = log.action !== 'LOGGED OUT'
            return (
              <li key={log.id} className="relative flex items-center gap-3">
                <Avatar src={log.pictureUrl} name={log.name || log.email} className="relative ring-2 ring-white" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-gray-900">
                    <span className="font-semibold">{log.name || log.email}</span>{' '}
                    <span className="text-gray-500">{signedIn ? 'signed in' : 'signed out'}</span>
                  </p>
                  <RelativeTime value={log.actionAt} className="text-xs text-gray-400" />
                </div>
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${signedIn ? 'bg-emerald-500' : 'bg-gray-300'}`}
                  aria-hidden="true"
                />
              </li>
            )
          })}
        </ol>
      )}
    </SectionCard>
  )
}

export default RecentActivity
