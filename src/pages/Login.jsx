import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Navigate, useLocation } from 'react-router-dom'
import { MessageSquare, Eye, EyeOff, Loader2 } from 'lucide-react'
import { login, selectAuth, selectIsAuthenticated, clearAuthError } from '../features/auth/authSlice.js'

// Mirrors authApi.js's own flag — this text should only claim "any
// credentials work" when that's actually true, not unconditionally.
const USE_MOCK = import.meta.env.VITE_USE_MOCK_API !== 'false'

export default function Login() {
  const dispatch = useDispatch()
  const location = useLocation()
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const { status, error } = useSelector(selectAuth)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  if (isAuthenticated) {
    const from = location.state?.from?.pathname || '/app/inbox'
    return <Navigate to={from} replace />
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    dispatch(clearAuthError())
    dispatch(login({ email, password }))
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-panel">
            <MessageSquare className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">Threadline</h1>
            <p className="text-sm text-navy-300">Sign in to your support workspace</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl bg-white p-6 shadow-popover dark:bg-navy-900">
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="identifier" className="text-xs font-medium text-ink-600 dark:text-navy-300">
              Email or username
            </label>
            <input
              id="identifier"
              type="text"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email or username"
              className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 dark:border-navy-700 dark:bg-navy-800 dark:text-white dark:placeholder:text-navy-400"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-xs font-medium text-ink-600 dark:text-navy-300">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter Password"
                className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 pr-9 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 dark:border-navy-700 dark:bg-navy-800 dark:text-white dark:placeholder:text-navy-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600 dark:text-navy-400 dark:hover:text-navy-200"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={status === 'loading'}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:bg-brand-300"
          >
            {status === 'loading' && <Loader2 className="h-4 w-4 animate-spin" />}
            Sign in
          </button>

          {USE_MOCK && (
            <p className="text-center text-xs text-ink-400 dark:text-navy-500">
              Demo mode is on — any email and password will sign you in.
            </p>
          )}
        </form>
      </div>
    </div>
  )
}