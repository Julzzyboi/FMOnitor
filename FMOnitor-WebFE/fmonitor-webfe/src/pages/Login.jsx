import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DotGrid from '../components/common/DotGrid'
import WaveFooter from '../components/common/WaveFooter'
import logo from '../assets/logo.png'
import buildingBg from '../assets/building-bg.png'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

// Floor for how long the "signing you in" loader stays up after a successful
// Google login, even if the /api/user confirmation comes back almost
// instantly - without this, a fast network made the loader flash for only a
// few ms, which read as no transition at all rather than a smooth one.
const MIN_LOADING_DISPLAY_MS = 600

function GoogleIcon() {
  return (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.9-2.26 5.36-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}

// Captured once, at MODULE load time - not inside the component. This app
// renders under <StrictMode>, which deliberately mounts every component
// twice in dev (mount -> discard -> mount again) to surface effects that
// aren't idempotent. The token-handling effect below used to read the URL
// and then strip it via history.replaceState - fine on its own, but the
// *second* StrictMode mount would then find an already-stripped URL and
// conclude (wrongly) that there was never a token, flashing the sign-in
// button while the *first* mount's abandoned fetch silently finished the
// login and navigated away underneath it. Reading the token once here, before
// any component instance exists to be duplicated, means every mount attempt
// - however many StrictMode runs - agrees on the same answer.
const initialToken = new URLSearchParams(window.location.search).get('token')
if (initialToken) {
  const params = new URLSearchParams(window.location.search)
  params.delete('token')
  const newSearch = params.toString()
  window.history.replaceState({}, '', window.location.pathname + (newSearch ? `?${newSearch}` : ''))
}

function Login() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(() => !!initialToken)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    if (!initialToken) {
      // Plain visit to the login page - just show the sign-in button, no auto-redirect.
      setLoading(false)
      return
    }

    localStorage.setItem('jwt', initialToken)

    // Just completed the Google OAuth round trip - confirm the session is valid, then go straight to the dashboard.
    const startedAt = Date.now()
    fetch(`${API_BASE_URL}/api/user`, { credentials: 'include' })
      .then((res) => {
        if (res.ok) {
          const elapsed = Date.now() - startedAt
          const remaining = Math.max(0, MIN_LOADING_DISPLAY_MS - elapsed)
          // Wait out the minimum display floor, THEN fade this loader out,
          // THEN navigate - an instant unmount here was the hard, jarring cut
          // straight into the dashboard shell popping in with no transition.
          setTimeout(() => {
            setLeaving(true)
            setTimeout(() => navigate('/dashboard', { replace: true }), 300)
          }, remaining)
        } else {
          setLoading(false)
        }
      })
      .catch(() => setLoading(false))
  }, [navigate])

  const handleGoogleSignIn = () => {
    window.location.href = `${API_BASE_URL}/oauth2/authorization/google`
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-white pb-12 sm:pb-16">
      <DotGrid className="absolute left-6 top-6 z-10 opacity-90 sm:left-10 sm:top-10" />

      <img
        src={buildingBg}
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full animate-[fade-in-bg_1.4s_ease-out_forwards] object-cover object-center opacity-0"
      />

      <WaveFooter />

      {loading ? (
        <div
          className={`relative z-10 flex flex-col items-center gap-4 transition-opacity duration-300 ${
            leaving ? 'opacity-0' : 'opacity-100 animate-[fade-in_0.4s_ease-out_forwards]'
          }`}
        >
          <img src={logo} alt="FMOnitor" className="h-20 w-20 animate-pulse" />
          <div className="h-1 w-24 overflow-hidden rounded-full bg-amber-100">
            <div className="h-full w-1/2 animate-[loading-bar_1s_ease-in-out_infinite] rounded-full bg-amber-400" />
          </div>
          <p className="text-sm font-medium text-gray-500">Signing you in…</p>
        </div>
      ) : (
        <div className="relative z-10 w-[90%] max-w-md animate-[fade-in-up_0.6s_ease-out_forwards] rounded-2xl bg-white p-8 text-center opacity-0 shadow-[0_18px_42px_-11px_rgba(0,0,0,0.25)] sm:p-12">
          <div className="flex flex-col items-center animate-[fade-in-up_0.6s_ease-out_0.1s_forwards] opacity-0">
            <img src={logo} alt="FMOnitor" className="h-24 w-24 sm:h-28 sm:w-28" />
            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              <span className="text-[#fdcc36]">FMO</span>
              <span className="text-gray-900">nitor</span>
            </h1>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.25em] text-gray-700">
              Facilities Management Office
            </p>
            <span className="mt-5 h-1 w-12 rounded-full bg-[#fdcc36]" />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="mt-8 flex w-full cursor-pointer animate-[fade-in-up_0.6s_ease-out_0.2s_forwards] items-center justify-center gap-3 rounded-full border border-gray-200 bg-white px-6 py-3.5 text-base font-medium text-gray-700 opacity-0 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md hover:shadow-amber-100 active:translate-y-0"
          >
            <GoogleIcon />
            Sign in with Google
          </button>

          <p className="mt-6 animate-[fade-in-up_0.6s_ease-out_0.3s_forwards] text-sm leading-relaxed text-gray-500 opacity-0">
            By signing in, you agree to our{' '}
            <a href="#" className="font-semibold text-[#fdcc36] hover:underline">
              Privacy Policy
            </a>
            <br className="hidden sm:block" /> and{' '}
            <a href="#" className="font-semibold text-[#fdcc36] hover:underline">
              Terms and Conditions
            </a>
            .
          </p>
        </div>
      )}
    </div>
  )
}

export default Login
