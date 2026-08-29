const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

// Every backend call in this app goes through the browser's built-in fetch()
// (no shared API client exists yet), so this wraps fetch itself, once, instead
// of needing every page's fetch() call to remember to check for a 401 on its
// own. The moment ANY call to our API comes back 401 (session cookie missing
// or expired), we know the user isn't logged in anymore and send them back to
// the login page - that's what "session ended -> back to login" actually means
// here, since the session cookie (not the JWT) is this app's real auth check.
const originalFetch = window.fetch

window.fetch = async (...args) => {
  const response = await originalFetch(...args)

  const request = args[0]
  const url = typeof request === 'string' ? request : request?.url
  const isApiCall = typeof url === 'string' && url.startsWith(API_BASE_URL)
  const alreadyOnLoginPage = window.location.pathname === '/'

  if (isApiCall && response.status === 401 && !alreadyOnLoginPage) {
    localStorage.removeItem('jwt')
    window.location.href = '/'
  }

  return response
}

// Logging out is a full navigation away from this SPA (window.location.href
// to the backend's /logout, then a redirect back) - not a client-side route
// change. Pressing the browser's Back button afterward can make it restore a
// frozen SNAPSHOT of the page as it looked right before logout (a browser
// feature called bfcache) instead of actually re-running any of this app's
// JS. Nothing remounts in that case, so AdminLayout's own "check auth before
// rendering" never gets a chance to run, and the stale, already-authenticated
// dashboard just reappears even though the session behind it is gone.
// Forcing a real reload whenever a bfcache restore happens guarantees every
// page you land on (via Back/Forward too) actually re-verifies auth.
window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    window.location.reload()
  }
})
