import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { toast } from '../components/Toast.jsx'
import { ToastContainer } from '../components/Toast.jsx'

export default function Login() {
  const [email,    setEmail]    = useState('raj@example.com')
  const [password, setPassword] = useState('SecurePass123!')
  const [remember, setRemember] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const { login } = useAuth()
  const navigate  = useNavigate()

  const handleSubmit = async e => {
    e.preventDefault()
    if (!email || !password) { setError('Please fill in all fields'); return }
    setError('')
    setLoading(true)
    try {
      const result = await login(email, password, remember)
      toast.success('Welcome back!')
      if (result.hasBusiness) navigate('/dashboard')
      else                     navigate('/setup')
    } catch (err) {
      const msg = err.response?.data?.detail || 'Invalid email or password'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 flex items-center justify-center px-4">
      <ToastContainer />

      <div className="w-full max-w-md animate-fade-in">
        {/* card */}
        <div className="card p-8">
          {/* logo + title */}
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">✈️</div>
            <h1 className="text-2xl font-bold text-blue-600 leading-tight">
              Decision Intelligence
            </h1>
            <p className="text-gray-500 text-sm mt-1">Employee Performance Evaluation System</p>
          </div>

          {/* error */}
          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2 animate-slide-down">
              <span>✕</span> {error}
            </div>
          )}

          {/* form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className={`input ${error ? 'error' : ''}`}
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`input ${error ? 'error' : ''}`}
                autoComplete="current-password"
                required
              />
            </div>

            {/* remember me */}
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                id="remember"
                checked={remember}
                onChange={e => setRemember(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
              />
              <label
                htmlFor="remember"
                className="text-sm text-gray-600 cursor-pointer select-none"
              >
                Remember me for 30 days
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3 text-base mt-2"
            >
              {loading
                ? <><span className="spinner" style={{width:18,height:18}} /> Signing in...</>
                : 'Login'
              }
            </button>
          </form>

          {/* demo hint */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl text-center">
            <p className="text-xs text-blue-600">
              🎯 Demo credentials pre-filled — just click Login!
            </p>
          </div>

          {/* signup link */}
          <p className="text-center text-sm text-gray-500 mt-5">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="text-blue-600 font-semibold hover:text-blue-800 transition-colors duration-150"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}