import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { ToastContainer, toast } from '../components/Toast.jsx'

const BIZ_TYPES = [
  { value: 'petrol_bunk',          label: '⛽ Petrol Bunk / Gas Station' },
  { value: 'retail_store',         label: '🛒 Retail Store / Supermarket' },
  { value: 'electronics_showroom', label: '📱 Electronics Showroom' },
  { value: 'pharmacy',             label: '💊 Pharmacy / Medical Store' },
  { value: 'mall_management',      label: '🏢 Mall Management' },
  { value: 'warehouse',            label: '📦 Warehouse / Godown' },
  { value: 'small_office',         label: '🏛️ Small Office' },
]

const EMP_COUNTS = ['1-10', '11-25', '26-50', '51+']

export default function BusinessSetup() {
  const [agreed,    setAgreed]    = useState(false)
  const [bizName,   setBizName]   = useState('')
  const [bizType,   setBizType]   = useState('')
  const [empCount,  setEmpCount]  = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const { setupBusiness } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async e => {
    e.preventDefault()
    if (!agreed)   { setError('Please acknowledge the disclaimer'); return }
    if (!bizName)  { setError('Business name is required');         return }
    if (!bizType)  { setError('Business type is required');         return }
    if (!empCount) { setError('Employee count is required');        return }

    setError('')
    setLoading(true)
    try {
      await setupBusiness({
        business_name:           bizName.trim(),
        business_type:           bizType,
        employee_count_estimate: empCount,
      })
      toast.success('Business setup complete!')
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Setup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 py-10 px-4">
      <ToastContainer />

      <div className="w-full max-w-3xl mx-auto animate-fade-in">
        <div className="card p-8">
          {/* title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-blue-600">Business Setup</h1>
            <p className="text-gray-500 text-sm mt-1">
              One-time setup — configure your business profile
            </p>
          </div>

          {/* ── disclaimer ───────────────────────────────────── */}
          <div className="mb-7 p-5 bg-yellow-50 border-2 border-yellow-300 rounded-2xl">
            <h3 className="text-base font-bold text-yellow-900 mb-4 flex items-center gap-2">
              ⚠️ DECISION SUPPORT SYSTEM DISCLAIMER
            </h3>

            <div className="text-sm text-yellow-900 space-y-4 max-h-64 overflow-y-auto pr-2">
              <p className="font-semibold">
                This platform is a DECISION SUPPORT TOOL ONLY — not an automated HR system.
              </p>

              <div>
                <p className="font-semibold mb-1">✅ What This System Does:</p>
                <ul className="list-disc ml-5 space-y-0.5 text-yellow-800">
                  <li>Analyses employee performance data over time</li>
                  <li>Identifies trends and patterns using scoring algorithms</li>
                  <li>Provides explainable advisory suggestions with confidence levels</li>
                  <li>Flags red flags and zero-tolerance violations</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold mb-1">❌ What This System Does NOT Do:</p>
                <ul className="list-disc ml-5 space-y-0.5 text-yellow-800">
                  <li>Make automatic employment decisions</li>
                  <li>Replace human judgment or HR expertise</li>
                  <li>Enforce salary changes, promotions, or terminations</li>
                  <li>Account for personal circumstances or context</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold mb-1">📋 Your Responsibilities:</p>
                <ul className="list-disc ml-5 space-y-0.5 text-yellow-800">
                  <li>Review all suggestions carefully before any action</li>
                  <li>Consider factors beyond system metrics</li>
                  <li>Comply with all applicable labour laws</li>
                  <li>Maintain confidentiality of employee data</li>
                  <li>Final decisions remain with authorised personnel</li>
                </ul>
              </div>

              {/* acknowledge checkbox */}
              <div className="border-t border-yellow-400 pt-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={e => setAgreed(e.target.checked)}
                    className="w-5 h-5 mt-0.5 rounded border-yellow-400 text-blue-600 cursor-pointer flex-shrink-0"
                  />
                  <span className="text-sm text-yellow-800 leading-relaxed">
                    By proceeding, I acknowledge: I understand this is an advisory tool only,
                    I am responsible for all employment decisions, I will review suggestions
                    before taking action, and final decisions remain with authorised personnel.
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* error */}
          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 animate-slide-down flex items-center gap-2">
              <span>✕</span> {error}
            </div>
          )}

          {/* ── form ─────────────────────────────────────────── */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* business name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Business Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={bizName}
                onChange={e => setBizName(e.target.value)}
                placeholder="e.g. Sunrise Petrol Bunk"
                className="input"
                required
              />
            </div>

            {/* business type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Business Type <span className="text-red-500">*</span>
              </label>
              <select
                value={bizType}
                onChange={e => setBizType(e.target.value)}
                className="select"
                required
              >
                <option value="">Select business type...</option>
                {BIZ_TYPES.map(b => (
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </select>
            </div>

            {/* employee count */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Estimated Employee Count <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {EMP_COUNTS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setEmpCount(c)}
                    className={`py-2.5 rounded-lg text-sm font-medium border-2 transition-all duration-150 ${
                      empCount === c
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* submit */}
            <button
              type="submit"
              disabled={!agreed || loading}
              className={`btn w-full py-3 text-base mt-2 transition-all duration-200 ${
                agreed
                  ? 'btn-primary'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {loading
                ? <><span className="spinner" style={{width:18,height:18}} /> Setting up...</>
                : 'Complete Setup'
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}