const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export const ITEMS_ENDPOINT = '/api/inventory-items'
export const REPORTS_ENDPOINT = '/api/inventory-reports'
export const STORAGES_ENDPOINT = '/api/campus-storages'
export const FACILITIES_ENDPOINT = '/api/campus-facilities'

export const CHANGE_REQUESTS_ENDPOINT = '/api/inventory-change-requests'

// Resolves to { ok: true, status, data } or { ok: false, status, message } -
// never throws. `queued` is true when an Admin's change was sent for
// Superadmin approval (HTTP 202) instead of being applied.
export async function apiRequest(method, path, body) {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      credentials: 'include',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) {
      const errorBody = await res.json().catch(() => null)
      return { ok: false, status: res.status, message: errorBody?.message || 'Something went wrong - please try again.' }
    }
    const data = res.status === 204 ? null : await res.json()
    return { ok: true, status: res.status, queued: res.status === 202, data }
  } catch {
    return { ok: false, status: 0, message: 'Network error - please try again.' }
  }
}
