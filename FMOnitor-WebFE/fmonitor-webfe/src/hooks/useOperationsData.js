import { useEffect, useMemo, useState } from 'react'
import useDelayedLoading from './useDelayedLoading'
import {
  apiRequest,
  ITEMS_ENDPOINT,
  REPORTS_ENDPOINT,
  STORAGES_ENDPOINT,
} from '../pages/admin/Inventory/api/inventoryApi'

// Everything the Dashboard and Analytics summarize: live inventory items
// (with their storage name as `location`), the reports filed against them,
// and the sign-in log. A failed request just leaves that list empty.
function useOperationsData() {
  const [rawItems, setRawItems] = useState([])
  const [rawReports, setRawReports] = useState([])
  const [storages, setStorages] = useState([])
  const [loginLogs, setLoginLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const minDelayPending = useDelayedLoading()

  useEffect(() => {
    let cancelled = false
    Promise.all([
      apiRequest('GET', ITEMS_ENDPOINT),
      apiRequest('GET', REPORTS_ENDPOINT),
      apiRequest('GET', STORAGES_ENDPOINT),
      apiRequest('GET', '/api/login-logs'),
    ])
      .then(([itemsResult, reportsResult, storagesResult, logsResult]) => {
        if (cancelled) return
        if (itemsResult.ok) setRawItems(itemsResult.data ?? [])
        if (reportsResult.ok) setRawReports(reportsResult.data ?? [])
        if (storagesResult.ok) setStorages(storagesResult.data ?? [])
        if (logsResult.ok) setLoginLogs(logsResult.data ?? [])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const items = useMemo(() => {
    const storageNames = new Map(storages.map((s) => [s.id, s.name]))
    return rawItems.map((item) => ({ ...item, location: storageNames.get(item.storageId) ?? 'Unknown storage' }))
  }, [rawItems, storages])

  // Reports of trashed items are hidden, matching the Inventory page.
  const reports = useMemo(() => {
    const liveIds = new Set(rawItems.map((item) => item.id))
    return rawReports.filter((report) => liveIds.has(report.itemId))
  }, [rawItems, rawReports])

  return { loading: loading || minDelayPending, items, reports, loginLogs }
}

export default useOperationsData
