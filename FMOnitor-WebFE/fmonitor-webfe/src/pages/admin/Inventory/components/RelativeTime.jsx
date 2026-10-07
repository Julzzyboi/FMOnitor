import useNow from '../../../../hooks/useNow'
import { formatDateTime, formatRelativeTime } from '../utils/timeFormat'

// "5 minutes ago" that keeps itself current; hover shows the exact time.
function RelativeTime({ value, className = '' }) {
  const now = useNow(15000)
  if (!value) return <span className={className}>—</span>
  return (
    <time dateTime={value} title={formatDateTime(value)} className={className}>
      {formatRelativeTime(value, now)}
    </time>
  )
}

export default RelativeTime
