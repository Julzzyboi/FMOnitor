import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DotGrid from '../../components/common/DotGrid'
import WaveFooter from '../../components/common/WaveFooter'
import GoogleIcon from './components/GoogleIcon'
import logo from '../../assets/logo.png'
import buildingBg from '../../assets/building-bg.png'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

const MIN_LOADING_DISPLAY_MS = 600

const initialParams = new URLSearchParams(window.location.search)
const initialToken = initialParams.get('token')
const initialError = initialParams.get('error')
if (initialToken || initialError) {
  const params = new URLSearchParams(window.location.search)
  params.delete('token')
  params.delete('error')
  const newSearch = params.toString()
  window.history.replaceState({}, '', window.location.pathname + (newSearch ? `?${newSearch}` : ''))
}

const ERROR_MESSAGES = {
  unauthorized_user: "This Google account isn't registered with FMOnitor. Ask an admin to invite you first.",
  account_disabled: 'This account has been disabled or removed. Contact an administrator.',
  login_failed: 'Sign-in failed. Please try again.',
}

function Login() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(() => !!initialToken)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    if (!initialToken) {
      setLoading(false)
      return
    }

    localStorage.setItem('jwt', initialToken)

    const startedAt = Date.now()
    fetch(`${API_BASE_URL}/api/user`, { credentials: 'include' })
      .then((res) => {
        if (res.ok) {
          const elapsed = Date.now() - startedAt
          const remaining = Math.max(0, MIN_LOADING_DISPLAY_MS - elapsed)
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

          {initialError && (
            <p className="mt-6 animate-[fade-in-up_0.6s_ease-out_forwards] rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {ERROR_MESSAGES[initialError] || ERROR_MESSAGES.login_failed}
            </p>
          )}

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
