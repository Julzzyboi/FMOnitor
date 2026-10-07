const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export async function performLogout() {
  localStorage.removeItem('jwt')

  if (navigator.credentials?.preventSilentAccess) {
    try {
      await navigator.credentials.preventSilentAccess()
    } catch {}
  }

  window.location.href = `${API_BASE_URL}/logout`
}
