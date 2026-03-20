import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { ToastContainer, toast } from '../components/Toast.jsx'

function Requirement({ met, text }) {
  return (
    <p className={`text-xs flex items-center gap-1.5 transition-colors duration-200 ${met ? 'text-green-600' : 'text-gray-400'}`}>
      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs flex-shrink-0 transition-all duration-200 ${met ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
        {met ? '✓' : '✗'}
      </span>
      {text}
    </p>
  )
}

export default function Signup() {
  const [fullName, setFullName] = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const { signup } = useAuth()
  const navigate   = useNavigate()

  // live password rules
  const rules = {
    length:  password.length >= 8,
    upper:   /[A-Z]/.test(password),
    number:  /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  }
  const strength     = Object.values(rules).filter(Boolean).length
  const strengthPct  = (strength / 4) * 100
  const strengthColor =
    strength === 0 ? 'bg-gray-200' :
    strength === 1 ? 'bg-red-500'  :
    strength === 2 ? 'bg-orange-500' :
    strength === 3 ? 'bg-yellow-500' :
    'bg-green-500'
  const strengthLabel =
    strength === 0 ? '' :
    strength === 1 ? 'Weak' :
    strength === 2 ? 'Fair' :
    strength === 3 ? 'Good' :
    'Strong'

  const passwordsMatch = confirm.length > 0 && password === confirm

  const handleSubmit = async e => {
    e.preventDefault()
    if (!fullName.trim()) { setError('Full name is required');               return }
    if (strength < 4)     { setError('Password does not meet requirements'); return }
    if (password !== confirm) { setError('Passwords do not match');          return }

    setError('')
    setLoading(true)
    try {
      await signup(fullName.trim(), email, password)
      toast.success('Account created!')
      navigate('/setup')
    } catch (err) {
      setError(err.response?.data?.detail || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 flex items-center justify-center px-4 py-8">
      <ToastContainer />

      <div className="w-full max-w-md animate-fade-in">
        <div className="card p-8">
          {/* title */}
          <div className="text-center mb-7">
            <h1 className="text-3xl font-bold text-blue-600">Create Account</h1>
            <p className="text-gray-500 text-sm mt-1">
              Get started with Decision Intelligence Framework
            </p>
          </div>

          {/* error */}
          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 animate-slide-down flex items-center gap-2">
              <span>✕</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* full name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Rajesh Kumar"
                className="input"
                required
              />
            </div>

            {/* email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="input"
                required
              />
            </div>

            {/* password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input"
                required
              />

              {/* strength bar */}
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${strengthColor}`}
                        style={{ width: `${strengthPct}%` }}
                      />
                    </div>
                    <span className={`text-xs font-medium transition-colors duration-200 ${
                      strength <= 1 ? 'text-red-500' :
                      strength === 2 ? 'text-orange-500' :
                      strength === 3 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>{strengthLabel}</span>
                  </div>

                  {/* requirements */}
                  <div className="space-y-1 mt-2">
                    <Requirement met={rules.length}  text="At least 8 characters" />
                    <Requirement met={rules.upper}   text="One uppercase letter" />
                    <Requirement met={rules.number}  text="One number" />
                    <Requirement met={rules.special} text="One special character (!@#$...)" />
                  </div>
                </div>
              )}
            </div>

            {/* confirm password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="••••••••"
                className={`input ${
                  confirm.length > 0
                    ? passwordsMatch ? 'border-green-400' : 'error'
                    : ''
                }`}
                required
              />
              {confirm.length > 0 && (
                <p className={`text-xs mt-1 transition-colors duration-200 ${passwordsMatch ? 'text-green-600' : 'text-red-500'}`}>
                  {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3 text-base mt-1"
            >
              {loading
                ? <><span className="spinner" style={{width:18,height:18}} /> Creating Account...</>
                : 'Create Account'
              }
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-blue-600 font-semibold hover:text-blue-800 transition-colors duration-150"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}