const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

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

window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    window.location.reload()
  }
})
