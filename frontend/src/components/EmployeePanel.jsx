import { useState, useEffect } from 'react'
import { Line, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  LineElement, BarElement, PointElement,
  CategoryScale, LinearScale,
  Filler, Tooltip, Legend,
} from 'chart.js'
import { employeeApi } from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { toast } from './Toast.jsx'

ChartJS.register(
  LineElement, BarElement, PointElement,
  CategoryScale, LinearScale,
  Filler, Tooltip, Legend
)

// ── helpers ────────────────────────────────────────────────────
const SUG_STYLE = {
  Hike:           { bg: 'bg-green-50',  border: 'border-green-400',  text: 'text-green-800',  badge: 'bg-green-100 text-green-700',  icon: '📈' },
  Retain:         { bg: 'bg-yellow-50', border: 'border-yellow-400', text: 'text-yellow-800', badge: 'bg-yellow-100 text-yellow-700', icon: '⚖️' },
  'Under Review': { bg: 'bg-red-50',    border: 'border-red-400',    text: 'text-red-800',    badge: 'bg-red-100 text-red-700',      icon: '⚠️' },
}

const CONF_COLOR = conf =>
  conf >= 70 ? '#22c55e' : conf >= 50 ? '#f59e0b' : '#ef4444'

const LINE_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 800, easing: 'easeInOutQuart' },
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 11 } } },
    y: { beginAtZero: false, min: 0, max: 100, ticks: { font: { size: 11 } } },
  },
}

const BAR_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y',
  animation: { duration: 800, easing: 'easeInOutQuart' },
  plugins: { legend: { display: false } },
  scales: {
    x: { beginAtZero: true, max: 100, ticks: { font: { size: 11 } } },
    y: { ticks: { font: { size: 11 } } },
  },
}

// ── ConfidenceBar ─────────────────────────────────────────────
function ConfidenceBar({ value }) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setWidth(value), 100)
    return () => clearTimeout(t)
  }, [value])

  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
      <div
        className="h-2.5 rounded-full confidence-bar"
        style={{ width: `${width}%`, backgroundColor: CONF_COLOR(value) }}
      />
    </div>
  )
}

// ── main component ────────────────────────────────────────────
export default function EmployeePanel({ employeeId, onClose, onUpdate }) {
  const [emp,       setEmp]       = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [noteText,  setNoteText]  = useState('')
  const [addingNote,setAddingNote]= useState(false)
  const [showNoteForm, setShowNoteForm] = useState(false)
  const [editMode,  setEditMode]  = useState(false)
  const [editName,  setEditName]  = useState('')
  const [editRole,  setEditRole]  = useState('')
  const [saving,    setSaving]    = useState(false)

  useEffect(() => {
    if (!employeeId) return
    setLoading(true)
    employeeApi.get(employeeId)
      .then(r => {
        setEmp(r.data)
        setEditName(r.data.name)
        setEditRole(r.data.role)
      })
      .catch(() => toast.error('Failed to load employee'))
      .finally(() => setLoading(false))
  }, [employeeId])

  const handleMarkInactive = async () => {
    if (!window.confirm(`Mark ${emp.name} as inactive?`)) return
    try {
      await employeeApi.markInactive(emp.employee_id)
      toast.success(`${emp.name} marked as inactive`)
      onUpdate()
      onClose()
    } catch { toast.error('Failed to update status') }
  }

  const handleSaveEdit = async () => {
    setSaving(true)
    try {
      await employeeApi.update(emp.employee_id, { name: editName, role: editRole })
      toast.success('Employee updated')
      const r = await employeeApi.get(emp.employee_id)
      setEmp(r.data)
      onUpdate()
      setEditMode(false)
    } catch { toast.error('Update failed') }
    finally { setSaving(false) }
  }

  const handleAddNote = async () => {
    if (!noteText.trim()) return
    setAddingNote(true)
    try {
      await employeeApi.addNote(emp.employee_id, { note: noteText.trim() })
      toast.success('Note added')
      const r = await employeeApi.get(emp.employee_id)
      setEmp(r.data)
      setNoteText('')
      setShowNoteForm(false)
    } catch { toast.error('Failed to add note') }
    finally { setAddingNote(false) }
  }

  const handleDeleteNote = async (noteId) => {
    try {
      await employeeApi.deleteNote(emp.employee_id, noteId)
      toast.success('Note deleted')
      const r = await employeeApi.get(emp.employee_id)
      setEmp(r.data)
    } catch { toast.error('Failed to delete note') }
  }

  // ── render ────────────────────────────────────────────────
  const sug     = emp?.current_suggestion || 'Retain'
  const style   = SUG_STYLE[sug] || SUG_STYLE['Retain']
  const detail  = emp?.suggestion_detail
  const exp     = detail?.explanation || {}
  const trend   = exp?.performance_trend || {}
  const conf    = detail?.confidence_score ?? emp?.current_confidence ?? 30

  // chart data
  const months   = (emp?.performance_history || []).map(h => h.month)
  const scores   = (emp?.performance_history || []).map(h => h.score)
  const attData  = (emp?.performance_history || []).map(h => h.attendance)

  const scoreChartData = {
    labels: months,
    datasets: [{
      label: 'Score',
      data: scores,
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59,130,246,0.08)',
      tension: 0.4,
      fill: true,
      pointRadius: 5,
      pointBackgroundColor: '#3b82f6',
    }],
  }

  const attChartData = {
    labels: months,
    datasets: [{
      label: 'Attendance %',
      data: attData,
      borderColor: '#22c55e',
      backgroundColor: 'rgba(34,197,94,0.08)',
      tension: 0.4,
      fill: true,
      pointRadius: 5,
      pointBackgroundColor: '#22c55e',
    }],
  }

  // metric breakdown bar chart
  const breakdownEntries = Object.entries(exp?.confidence_detail?.penalties || {})
  const barChartData = {
    labels: breakdownEntries.map(([k]) => k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())),
    datasets: [{
      label: 'Score',
      data: [
        emp?.current_score || 0,
        trend?.avg_3month || 0,
        trend?.avg_score  || 0,
      ],
      backgroundColor: ['#3b82f6','#f59e0b','#94a3b8'],
      borderRadius: 6,
    }],
  }

  const metricsBarData = {
    labels: ['Current Score','3-Month Avg','Overall Avg'],
    datasets: [{
      label: 'Score',
      data: [
        emp?.current_score || 0,
        trend?.avg_3month  || 0,
        trend?.avg_score   || 0,
      ],
      backgroundColor: ['#3b82f6','#f59e0b','#94a3b8'],
      borderRadius: 6,
    }],
  }

  return (
    <>
      {/* backdrop */}
      <div className="panel-overlay" onClick={onClose} />

      {/* drawer */}
      <div className="panel-drawer" style={{ width: '100%', maxWidth: 620 }}>

        {/* ── header ─────────────────────────────────────────── */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100 bg-white">
          {loading ? (
            <div className="space-y-2 flex-1 mr-4">
              <div className="skeleton h-6 w-48" />
              <div className="skeleton h-4 w-32" />
            </div>
          ) : editMode ? (
            <div className="flex-1 mr-4 space-y-2">
              <input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="input text-lg font-bold"
                placeholder="Full Name"
              />
              <div className="flex gap-2 mt-1">
                <button onClick={handleSaveEdit} disabled={saving} className="btn btn-primary text-xs px-3 py-1.5">
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button onClick={() => setEditMode(false)} className="btn btn-secondary text-xs px-3 py-1.5">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 mr-4">
              <h2 className="text-xl font-bold text-gray-900">{emp?.name}</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-sm text-gray-500 font-mono">{emp?.employee_id}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${emp?.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {emp?.status}
                </span>
                <span className="text-xs text-gray-400">
                  {emp?.months_tracked} month{emp?.months_tracked !== 1 ? 's' : ''} tracked
                </span>
              </div>
            </div>
          )}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-all duration-150 flex-shrink-0"
          >
            ✕
          </button>
        </div>

        {/* ── scrollable body ─────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-5 space-y-4">
              {[120,80,160,80].map((h,i) => <div key={i} className="skeleton w-full" style={{height: h}} />)}
            </div>
          ) : (
            <div className="p-5 space-y-5">

              {/* insufficient data warning */}
              {emp.months_tracked < 3 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm animate-slide-down">
                  <p className="font-semibold text-blue-800 mb-1">ℹ️ Insufficient Data for Trend Analysis</p>
                  <p className="text-blue-700">
                    Currently tracking <strong>{emp.months_tracked}</strong> month(s).
                    Minimum <strong>3 months</strong> required for reliable analysis.
                  </p>
                </div>
              )}

              {/* ── suggestion card ─────────────────────────────── */}
              <div className={`rounded-xl border-2 p-5 ${style.bg} ${style.border}`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">System Suggestion</p>
                    <p className={`text-2xl font-extrabold ${style.text}`}>
                      {style.icon} {sug.toUpperCase()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Confidence</p>
                    <p className="text-2xl font-bold" style={{ color: CONF_COLOR(conf) }}>
                      {conf?.toFixed(0)}%
                    </p>
                  </div>
                </div>

                <ConfidenceBar value={conf} />

                {/* confidence breakdown */}
                {detail?.explanation?.confidence_detail?.penalties && (
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
                    <span>Base: 100%</span>
                    {Object.entries(detail.explanation.confidence_detail.penalties).map(([k, v]) =>
                      v !== 0 && (
                        <span key={k} className="text-red-600">
                          {k.replace(/_/g, ' ')}: {v}%
                        </span>
                      )
                    )}
                  </div>
                )}

                {/* low confidence notice */}
                {conf < 50 && (
                  <div className="mt-3 bg-yellow-100 border border-yellow-300 rounded-lg p-3">
                    <p className="text-xs font-bold text-yellow-800 mb-1">⚠️ LOW CONFIDENCE NOTICE</p>
                    <p className="text-xs text-yellow-700">
                      Limited data — based on {emp.months_tracked} month(s) only.
                      Collect more data before acting on this suggestion.
                    </p>
                  </div>
                )}

                {/* trend + score boxes */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="bg-white/70 rounded-lg p-3">
                    <p className="text-xs font-semibold text-gray-600 mb-1">Performance Trend</p>
                    <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${
                      trend?.trend === 'Improving' ? 'bg-green-100 text-green-700' :
                      trend?.trend === 'Declining' ? 'bg-red-100 text-red-700' :
                      trend?.trend === 'Stable'    ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {trend?.trend === 'Improving' ? '↗ ' :
                       trend?.trend === 'Declining' ? '↘ ' :
                       trend?.trend === 'Stable'    ? '→ ' : '? '}
                      {trend?.trend || 'Insufficient Data'}
                    </span>
                    {trend?.change_pct != null && (
                      <p className="text-xs text-gray-500 mt-1">
                        {trend.change_pct > 0 ? '+' : ''}{trend.change_pct}% vs 3-month avg
                      </p>
                    )}
                  </div>
                  <div className="bg-white/70 rounded-lg p-3">
                    <p className="text-xs font-semibold text-gray-600 mb-1">Current Score</p>
                    <p className="text-2xl font-bold text-gray-900">{emp.current_score?.toFixed(1) || 0}/100</p>
                    <p className="text-xs text-gray-500">3-month avg: {trend?.avg_3month?.toFixed(1) || '—'}</p>
                    <p className="text-xs text-gray-400">
                      Volatility: {
                        trend?.volatility_level
                          ? `${trend.volatility_level} (${trend.volatility?.toFixed(1)}%)`
                          : '—'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* ── strengths ──────────────────────────────────── */}
              {exp?.key_strengths?.length > 0 && (
                <div className="card p-4">
                  <p className="text-sm font-semibold text-gray-900 mb-3">✓ Key Strengths</p>
                  <ul className="space-y-1.5">
                    {exp.key_strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* ── risk factors ───────────────────────────────── */}
              {exp?.risk_factors?.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-yellow-800 mb-3">⚠️ Risk Factors</p>
                  <ul className="space-y-1.5">
                    {exp.risk_factors.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-yellow-700">
                        <span className="flex-shrink-0 mt-0.5">⚠️</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* ── critical alert ─────────────────────────────── */}
              {detail?.red_flags?.length > 0 && (
                <div className="bg-red-50 rounded-xl p-4 pulse-border">
                  <p className="text-sm font-bold text-red-800 mb-2">🚨 CRITICAL ALERT — IMMEDIATE ACTION REQUIRED</p>
                  <ul className="space-y-1 mb-3">
                    {detail.red_flags.map((f, i) => (
                      <li key={i} className="text-sm text-red-700">• {f}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* ── recommendation ─────────────────────────────── */}
              {exp?.recommendation && (
                <div className={`rounded-xl p-4 border ${style.bg} ${style.border}`}>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">System Recommendation</p>
                  <p className="text-sm text-gray-800">{exp.recommendation}</p>
                  <p className="text-xs text-gray-400 mt-2 italic">
                    ⚠️ Advisory only. All employment decisions remain with authorized personnel.
                  </p>
                </div>
              )}

              {/* ── auto note ──────────────────────────────────── */}
              {emp.auto_note && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Auto-Generated Note</p>
                  <p className="text-sm text-gray-700 italic">{emp.auto_note}</p>
                </div>
              )}

              {/* ── charts ─────────────────────────────────────── */}
              {scores.length > 0 && (
                <>
                  <div className="card p-4">
                    <p className="text-sm font-semibold text-gray-900 mb-3">Performance Score Trend</p>
                    <div style={{ height: 180 }}>
                      <Line data={scoreChartData} options={LINE_OPTS} />
                    </div>
                  </div>

                  <div className="card p-4">
                    <p className="text-sm font-semibold text-gray-900 mb-3">Attendance Trend</p>
                    <div style={{ height: 180 }}>
                      <Line data={attChartData} options={LINE_OPTS} />
                    </div>
                  </div>

                  <div className="card p-4">
                    <p className="text-sm font-semibold text-gray-900 mb-3">Score Comparison</p>
                    <div style={{ height: 140 }}>
                      <Bar data={metricsBarData} options={BAR_OPTS} />
                    </div>
                  </div>
                </>
              )}

              {/* ── historical table ────────────────────────────── */}
              {emp.performance_history?.length > 0 && (
                <div className="card p-4">
                  <p className="text-sm font-semibold text-gray-900 mb-3">Historical Performance</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-gray-400 border-b border-gray-100">
                          <th className="text-left pb-2 font-semibold">Month</th>
                          <th className="text-center pb-2 font-semibold">Score</th>
                          <th className="text-center pb-2 font-semibold">Attendance</th>
                          <th className="text-center pb-2 font-semibold">Trend</th>
                        </tr>
                      </thead>
                      <tbody>
                        {emp.performance_history.map((h, i) => (
                          <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors duration-150">
                            <td className="py-2 text-gray-700">{h.month}</td>
                            <td className="py-2 text-center font-semibold text-gray-900">{h.score?.toFixed(1)}</td>
                            <td className="py-2 text-center text-gray-600">{h.attendance}%</td>
                            <td className="py-2 text-center text-lg">{h.trend_arrow}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── owner notes ─────────────────────────────────── */}
              <div className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-gray-900">
                    Owner Notes ({emp.owner_notes?.length || 0})
                  </p>
                  <button
                    onClick={() => setShowNoteForm(!showNoteForm)}
                    className="btn btn-primary text-xs px-3 py-1.5"
                  >
                    ➕ Add Note
                  </button>
                </div>

                {showNoteForm && (
                  <div className="mb-4 animate-slide-down">
                    <textarea
                      value={noteText}
                      onChange={e => setNoteText(e.target.value)}
                      rows={3}
                      placeholder="Write your note here..."
                      className="input resize-none mb-2"
                    />
                    <div className="flex gap-2">
                      <button onClick={handleAddNote} disabled={addingNote} className="btn btn-primary text-xs flex-1">
                        {addingNote ? 'Saving...' : 'Save Note'}
                      </button>
                      <button onClick={() => { setShowNoteForm(false); setNoteText('') }} className="btn btn-secondary text-xs flex-1">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {emp.owner_notes?.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No notes yet</p>
                ) : (
                  <div className="space-y-2">
                    {emp.owner_notes.map(n => (
                      <div key={n.id} className="bg-gray-50 rounded-lg p-3 flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm text-gray-700">{n.note}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(n.created_at).toLocaleDateString('en-IN', {
                              day: 'numeric', month: 'short', year: 'numeric',
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteNote(n.id)}
                          className="text-gray-300 hover:text-red-500 transition-colors duration-150 text-sm flex-shrink-0"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

        {/* ── footer actions ──────────────────────────────────── */}
        {!loading && emp && (
          <div className="p-4 border-t border-gray-100 bg-white flex gap-3">
            <button
              onClick={() => setEditMode(true)}
              className="btn btn-secondary flex-1"
            >
              ✏️ Edit Employee
            </button>
            {emp.status === 'active' && (
              <button
                onClick={handleMarkInactive}
                className="btn btn-danger flex-1"
              >
                🚫 Mark Inactive
              </button>
            )}
          </div>
        )}
      </div>
    </>
  )
}