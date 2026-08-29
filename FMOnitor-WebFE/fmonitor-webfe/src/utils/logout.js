const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

// Shared by every "Logout" button in the app (Sidebar, ProfileDropdown).
export async function performLogout() {
  // The session cookie is what the backend's /logout actually invalidates -
  // but the access token saved in localStorage at login was never cleared by
  // anything on its own, so a stale one could sit here indefinitely.
  localStorage.removeItem('jwt')

  // Best-effort: harmless if unsupported or a no-op here.
  if (navigator.credentials?.preventSilentAccess) {
    try {
      await navigator.credentials.preventSilentAccess()
    } catch {
      // ignore
    }
  }

  // Back to a plain top-level navigation to the backend's /logout, same as
  // the original mechanism. A prior version of this function called /logout
  // via fetch() instead, trying to avoid a full page round-trip to the
  // backend - but that introduced a real, confirmed regression: fetch()
  // needed `redirect: 'manual'` to avoid a CORS/redirect failure, and with
  // that in place, logout would silently stop reaching the point where the
  // backend actually records the "LOGGED OUT" row (verified: login logs
  // kept showing LOGGED IN with no matching LOGGED OUT afterward). A plain
  // navigation never goes through fetch()'s CORS machinery at all, so it
  // never had that failure mode, and it's what reliably logged both login
  // and logout for this app before today.
  window.location.href = `${API_BASE_URL}/logout`
}
