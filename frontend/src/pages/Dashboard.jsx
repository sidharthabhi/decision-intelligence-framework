import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { employeeApi, uploadApi, analyticsApi } from '../services/api.js'
import { Doughnut, Line } from 'react-chartjs-2'
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  LineElement, PointElement, CategoryScale, LinearScale, Filler,
} from 'chart.js'
import EmployeePanel      from '../components/EmployeePanel.jsx'
import UploadSummaryModal from '../components/UploadSummaryModal.jsx'
import OverwriteModal     from '../components/OverwriteModal.jsx'
import HistoryModal       from '../components/HistoryModal.jsx'
import SettingsModal      from '../components/SettingsModal.jsx'
import AddEmployeeModal   from '../components/AddEmployeeModal.jsx'
import { ToastContainer, toast } from '../components/Toast.jsx'

ChartJS.register(
  ArcElement, Tooltip, Legend,
  LineElement, PointElement, CategoryScale, LinearScale, Filler
)

// ── constants ──────────────────────────────────────────────────
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

const BIZ_META = {
  petrol_bunk:          { icon: '⛽', name: 'Petrol Bunk' },
  retail_store:         { icon: '🛒', name: 'Retail Store' },
  electronics_showroom: { icon: '📱', name: 'Electronics Showroom' },
  pharmacy:             { icon: '💊', name: 'Pharmacy' },
  mall_management:      { icon: '🏢', name: 'Mall Management' },
  warehouse:            { icon: '📦', name: 'Warehouse' },
  small_office:         { icon: '🏛️', name: 'Small Office' },
}

const SUG_CONFIG = {
  Hike:           { color: 'text-green-600',  bg: 'hover:bg-green-50 hover:border-green-200',  dot: 'bg-green-500',  icon: '📈', badge: 'bg-green-100 text-green-700'  },
  Retain:         { color: 'text-yellow-600', bg: 'hover:bg-yellow-50 hover:border-yellow-200',dot: 'bg-yellow-500', icon: '⚖️', badge: 'bg-yellow-100 text-yellow-700' },
  'Under Review': { color: 'text-red-600',    bg: 'hover:bg-red-50 hover:border-red-200',      dot: 'bg-red-500',    icon: '⚠️', badge: 'bg-red-100 text-red-700'      },
}

// ── StatCard ───────────────────────────────────────────────────
function StatCard({ icon, label, value, color, loading, delay = 0 }) {
  return (
    <div
      className="card p-4 flex items-center justify-between animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        {loading
          ? <div className="skeleton h-8 w-16 mt-1" />
          : <p className={`text-2xl font-bold mt-0.5 animate-fade-in ${color}`}>{value}</p>
        }
      </div>
      <div className="text-3xl opacity-60">{icon}</div>
    </div>
  )
}

// ── SkeletonCard ───────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="px-3 py-2.5 rounded-xl border border-transparent">
      <div className="flex justify-between items-center">
        <div className="space-y-1.5 flex-1">
          <div className="skeleton h-4 w-28" />
          <div className="skeleton h-3 w-16" />
        </div>
        <div className="text-right space-y-1.5">
          <div className="skeleton h-3 w-10" />
          <div className="skeleton h-3 w-12" />
        </div>
      </div>
    </div>
  )
}

// ── main component ─────────────────────────────────────────────
export default function Dashboard() {
  const { user, business, logout, refreshBusiness } = useAuth()

  // data state
  const [employees,  setEmployees]  = useState([])
  const [stats,      setStats]      = useState(null)
  const [teamTrend,  setTeamTrend]  = useState([])
  const [dataLoading,setDataLoading]= useState(true)

  // ui state
  const [activeTab,        setActiveTab]        = useState('active')
  const [search,           setSearch]           = useState('')
  const [filterSug,        setFilterSug]        = useState('all')
  const [selectedEmpId,    setSelectedEmpId]    = useState(null)
  const [missingBanners,   setMissingBanners]   = useState([])
  const [dismissedBanners, setDismissedBanners] = useState(new Set())

  // upload state
  const [uploadMonth,   setUploadMonth]   = useState(new Date().getMonth() + 1)
  const [uploadYear,    setUploadYear]    = useState(new Date().getFullYear())
  const [uploadFile,    setUploadFile]    = useState(null)
  const [uploading,     setUploading]     = useState(false)
  const [uploadResult,  setUploadResult]  = useState(null)
  const [overwriteData, setOverwriteData] = useState(null)
  const fileRef = useRef()

  // modals
  const [showHistory,  setShowHistory]  = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showAddEmp,   setShowAddEmp]   = useState(false)

  const biz = BIZ_META[business?.business_type] || { icon: '🏢', name: business?.business_type }

  // ── fetch all data ─────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setDataLoading(true)
    try {
      const [empRes, dashRes] = await Promise.all([
        employeeApi.list(),
        analyticsApi.dashboard(),
      ])
      setEmployees(empRes.data)
      setStats(dashRes.data.stats)
      setTeamTrend(dashRes.data.team_trend || [])
      setMissingBanners(dashRes.data.missing_banners || [])
    } catch {
      toast.error('Failed to load dashboard data')
    } finally {
      setDataLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── file upload ────────────────────────────────────────────
  const handleFileChange = e => {
    const f = e.target.files[0]
    if (!f) return
    if (!f.name.endsWith('.xlsx')) {
      toast.error('Only .xlsx files are accepted')
      e.target.value = ''
      return
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error('File too large (max 5MB)')
      e.target.value = ''
      return
    }
    setUploadFile(f)
  }

  const handleUpload = async (overwrite = false) => {
    if (!uploadFile) { toast.error('Please select a file'); return }

    setUploading(true)
    const fd = new FormData()
    fd.append('file',     uploadFile)
    fd.append('month',    uploadMonth)
    fd.append('year',     uploadYear)
    fd.append('overwrite', overwrite)

    try {
      const res  = await uploadApi.upload(fd)
      const data = res.data

      // overwrite confirmation needed
      if (data.needs_overwrite_confirmation) {
        setOverwriteData({ message: data.message })
        return
      }

      // success
      setUploadResult(data)
      setUploadFile(null)
      if (fileRef.current) fileRef.current.value = ''
      await fetchAll()
      toast.success(`${data.month} ${data.year} uploaded successfully!`)

    } catch (err) {
      const detail = err.response?.data?.detail
      if (Array.isArray(detail)) {
        toast.error(detail[0] || 'Upload failed')
      } else {
        toast.error(detail || 'Upload failed')
      }
    } finally {
      setUploading(false)
      setOverwriteData(null)
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      const res = await uploadApi.template(uploadMonth, uploadYear)
      const safeName = business?.business_name?.toLowerCase().replace(/\s/g,'').slice(0,15) || 'business'
      const monShort = MONTHS[uploadMonth - 1].slice(0,3).toLowerCase()
      const fname    = `${safeName}_${monShort}_${uploadYear}.xlsx`
      const url      = URL.createObjectURL(new Blob([res.data]))
      const a        = document.createElement('a')
      a.href = url; a.download = fname; a.click()
      URL.revokeObjectURL(url)
      toast.success(`Template downloaded: ${fname}`)
    } catch {
      toast.error('Failed to download template')
    }
  }

  const handleMarkInactive = async empId => {
    try {
      await employeeApi.markInactive(empId)
      toast.success(`${empId} marked as inactive`)
      setDismissedBanners(prev => new Set([...prev, empId]))
      await fetchAll()
    } catch { toast.error('Failed to update status') }
  }

  const handleReactivate = async empId => {
    try {
      await employeeApi.reactivate(empId)
      toast.success(`${empId} reactivated`)
      await fetchAll()
    } catch { toast.error('Failed to reactivate') }
  }

  // ── filtered employee lists ────────────────────────────────
  const active   = employees.filter(e => e.status === 'active')
  const inactive = employees.filter(e => e.status === 'inactive')

  const filteredActive = active.filter(e => {
    const matchSearch = !search ||
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.employee_id.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filterSug === 'all' || e.current_suggestion === filterSug
    return matchSearch && matchFilter
  })

  const filteredInactive = inactive.filter(e =>
    !search ||
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.employee_id.toLowerCase().includes(search.toLowerCase())
  )

  // group active by suggestion
  const grouped = {
    Hike:           filteredActive.filter(e => e.current_suggestion === 'Hike'),
    Retain:         filteredActive.filter(e => e.current_suggestion === 'Retain'),
    'Under Review': filteredActive.filter(e => e.current_suggestion === 'Under Review'),
    None:           filteredActive.filter(e => !e.current_suggestion),
  }

  // ── chart data ─────────────────────────────────────────────
  const doughnutData = {
    labels: ['Hike', 'Retain', 'Under Review'],
    datasets: [{
      data: [stats?.hike_count || 0, stats?.retain_count || 0, stats?.under_review_count || 0],
      backgroundColor: ['#22c55e','#f59e0b','#ef4444'],
      borderWidth: 0,
      hoverOffset: 6,
    }],
  }

  const lineData = {
    labels: teamTrend.map(t => t.month),
    datasets: [{
      label: 'Team Average',
      data: teamTrend.map(t => t.average_score),
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59,130,246,0.08)',
      tension: 0.4,
      fill: true,
      pointRadius: 5,
      pointBackgroundColor: '#3b82f6',
    }],
  }

  const lineOpts = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 1000, easing: 'easeInOutQuart' },
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: false, min: 0, max: 100, ticks: { font: { size: 11 } }, grid: { color: '#f1f5f9' } },
      x: { ticks: { font: { size: 11 } }, grid: { display: false } },
    },
  }

  const doughnutOpts = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 800, animateRotate: true, animateScale: true },
    plugins: {
      legend: { position: 'bottom', labels: { font: { size: 12 }, padding: 16 } },
    },
  }

  // ── visible missing banners ────────────────────────────────
  const visibleBanners = missingBanners.filter(b => !dismissedBanners.has(b.employee_id))

  // ── render ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50">
      <ToastContainer />

      {/* ── NAVBAR ───────────────────────────────────────────── */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-blue-600 font-bold text-lg flex items-center gap-1.5">
              ✈️ Decision Intelligence
            </span>
            <span className="text-gray-300">|</span>
            <span className="text-sm bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium">
              {biz.icon} {biz.name}
            </span>
            <span className="text-sm text-gray-600 font-medium hidden sm:block">
              {business?.business_name}
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-3 text-sm">
            <button
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-150"
            >
              📁 <span className="hidden sm:inline">History</span>
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-150"
            >
              ⚙️ <span className="hidden sm:inline">Settings</span>
            </button>
            <span className="text-gray-300 hidden sm:block">|</span>
            <span className="text-gray-600 text-xs hidden sm:block">{user?.full_name}</span>
            <button
              onClick={logout}
              className="px-3 py-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg font-medium transition-all duration-150"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* ── MISSING BANNERS ──────────────────────────────────── */}
      {visibleBanners.map(banner => (
        <div
          key={banner.employee_id}
          className="bg-yellow-50 border-b-2 border-yellow-300 animate-slide-down"
        >
          <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-yellow-600 text-lg">⚠️</span>
              <div>
                <p className="text-sm font-semibold text-yellow-900">Employee Missing from Upload</p>
                <p className="text-xs text-yellow-800">
                  {banner.employee_id} ({banner.name}) missing for{' '}
                  <strong>{banner.consecutive_missing}</strong> consecutive month(s).
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => handleMarkInactive(banner.employee_id)}
                className="text-xs bg-yellow-600 text-white px-3 py-1.5 rounded-lg hover:bg-yellow-700 transition-all duration-150 font-medium"
              >
                Mark Inactive
              </button>
              <button
                onClick={() => setDismissedBanners(prev => new Set([...prev, banner.employee_id]))}
                className="text-xs text-yellow-600 hover:text-yellow-800 font-medium transition-colors duration-150"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      ))}

      <div className="max-w-7xl mx-auto px-4 py-5">

        {/* ── UPLOAD SECTION ───────────────────────────────────── */}
        <div className="card p-5 mb-5 animate-fade-in">
          <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            📤 Upload Performance Data
          </h2>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Month *</label>
              <select
                value={uploadMonth}
                onChange={e => setUploadMonth(Number(e.target.value))}
                className="select"
                style={{ width: 130 }}
              >
                {MONTHS.map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Year *</label>
              <select
                value={uploadYear}
                onChange={e => setUploadYear(Number(e.target.value))}
                className="select"
                style={{ width: 100 }}
              >
                {[2023,2024,2025,2026,2027].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-48">
              <label className="block text-xs font-medium text-gray-600 mb-1">Excel File *</label>
              <input
                type="file"
                accept=".xlsx"
                ref={fileRef}
                onChange={handleFileChange}
                className="input text-xs"
              />
            </div>

            <button
              onClick={() => handleUpload(false)}
              disabled={uploading || !uploadFile}
              className="btn btn-success px-5 py-2.5 whitespace-nowrap"
            >
              {uploading
                ? <><span className="spinner" style={{width:16,height:16}} /> Processing...</>
                : '🚀 Upload & Process'
              }
            </button>
          </div>

          {/* template download + add employee */}
          <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
            <button
              onClick={handleDownloadTemplate}
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 transition-colors duration-150"
            >
              📥 Download Template for <span className="font-semibold">{biz.name}</span>
            </button>
            <button
              onClick={() => setShowAddEmp(true)}
              className="btn btn-secondary text-xs px-4 py-2"
            >
              ➕ Add Employee Manually
            </button>
          </div>
        </div>

        {/* ── STAT CARDS ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
          <StatCard icon="👥" label="Total Employees"  value={stats?.total_employees    || 0} color="text-gray-800"  loading={dataLoading} delay={0}   />
          <StatCard icon="📈" label="Eligible for Hike" value={stats?.hike_count        || 0} color="text-green-600" loading={dataLoading} delay={50}  />
          <StatCard icon="⚖️" label="Retain Status"    value={stats?.retain_count       || 0} color="text-yellow-600"loading={dataLoading} delay={100} />
          <StatCard icon="⚠️" label="Under Review"     value={stats?.under_review_count || 0} color="text-red-600"   loading={dataLoading} delay={150} />
          <StatCard icon="📊" label="Team Average"     value={`${stats?.team_average    || 0}`} color="text-blue-600" loading={dataLoading} delay={200} />
        </div>

        {/* ── MAIN GRID ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">

          {/* ── EMPLOYEE LIST (1/4) ─────────────────────────── */}
          <div className="card p-4 animate-fade-in" style={{ animationDelay: '100ms' }}>

            {/* tabs */}
            <div className="flex border-b border-gray-100 mb-3">
              {['active','inactive'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 text-sm font-medium capitalize transition-all duration-150 border-b-2 ${
                    activeTab === tab
                      ? 'text-blue-600 border-blue-600'
                      : 'text-gray-400 border-transparent hover:text-gray-600'
                  }`}
                >
                  {tab}
                  <span className="ml-1.5 text-xs">
                    ({tab === 'active' ? active.length : inactive.length})
                  </span>
                </button>
              ))}
            </div>

            {/* search */}
            <div className="space-y-2 mb-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
                  🔍
                </span>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search employees..."
                  className="input pl-8 text-sm"
                />
              </div>

              {activeTab === 'active' && (
                <select
                  value={filterSug}
                  onChange={e => setFilterSug(e.target.value)}
                  className="select text-sm"
                >
                  <option value="all">All Suggestions</option>
                  <option value="Hike">Hike Only</option>
                  <option value="Retain">Retain Only</option>
                  <option value="Under Review">Under Review Only</option>
                </select>
              )}
            </div>

            {/* list */}
            <div className="space-y-1 overflow-y-auto" style={{ maxHeight: 520 }}>
              {dataLoading ? (
                Array(5).fill(0).map((_, i) => <SkeletonCard key={i} />)
              ) : activeTab === 'active' ? (
                <>
                  {Object.entries(grouped).map(([cat, emps]) => {
                    if (emps.length === 0) return null
                    const cfg = SUG_CONFIG[cat] || { color: 'text-gray-500', icon: '—', bg: '' }
                    return (
                      <div key={cat} className="mb-2">
                        <p className={`text-xs font-bold mb-1.5 px-2 flex items-center gap-1 ${cfg.color}`}>
                          {cfg.icon} {cat} ({emps.length})
                        </p>
                        {emps.map((emp, i) => (
                          <button
                            key={emp.id}
                            onClick={() => setSelectedEmpId(emp.employee_id)}
                            className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all duration-150 mb-1 ${
                              selectedEmpId === emp.employee_id
                                ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300'
                                : `border-transparent ${cfg.bg}`
                            } animate-fade-in`}
                            style={{ animationDelay: `${i * 40}ms` }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">{emp.name}</p>
                                <p className="text-xs text-gray-400 font-mono">{emp.employee_id}</p>
                              </div>
                              <div className="text-right ml-2 flex-shrink-0">
                                {emp.current_confidence != null && (
                                  <p className={`text-xs font-bold ${cfg.color}`}>
                                    {emp.current_confidence.toFixed(0)}%
                                  </p>
                                )}
                                {emp.current_score != null && (
                                  <p className="text-xs text-gray-400">
                                    {emp.current_score.toFixed(1)}/100
                                  </p>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )
                  })}

                  {filteredActive.length === 0 && (
                    <div className="text-center py-10">
                      <p className="text-3xl mb-2">🔍</p>
                      <p className="text-sm text-gray-400">No employees found</p>
                    </div>
                  )}
                </>
              ) : (
                /* inactive tab */
                <>
                  {filteredInactive.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-3xl mb-2">✅</p>
                      <p className="text-sm text-gray-400">No inactive employees</p>
                    </div>
                  ) : filteredInactive.map((emp, i) => (
                    <div
                      key={emp.id}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-gray-100 hover:bg-gray-50 transition-all duration-150 mb-1 animate-fade-in"
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-700">{emp.name}</p>
                        <p className="text-xs text-gray-400 font-mono">{emp.employee_id}</p>
                      </div>
                      <button
                        onClick={() => handleReactivate(emp.employee_id)}
                        className="text-xs bg-green-100 text-green-700 px-2.5 py-1.5 rounded-lg hover:bg-green-200 transition-all duration-150 font-medium"
                      >
                        Reactivate
                      </button>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* ── CHARTS (3/4) ─────────────────────────────────── */}
          <div className="lg:col-span-3 space-y-5">

            {/* empty state */}
            {!dataLoading && employees.length === 0 ? (
              <div className="card p-12 text-center animate-fade-in">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">No Performance Data Yet</h3>
                <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
                  Upload your first month's performance data to get started with the Decision Intelligence Framework.
                </p>
                <div className="max-w-xs mx-auto text-left space-y-2.5">
                  {[
                    'Download the Excel template for your business type',
                    'Fill in employee IDs, names, roles and metrics',
                    'Upload using the form above',
                  ].map((s, i) => (
                    <div key={i} className="flex gap-2.5 text-sm text-gray-600">
                      <span className="text-blue-600 font-bold flex-shrink-0">{i + 1}.</span>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* chart row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                  {/* doughnut */}
                  <div className="card p-5 animate-fade-in" style={{ animationDelay: '150ms' }}>
                    <h3 className="text-sm font-bold text-gray-900 mb-4">
                      Performance Distribution
                    </h3>
                    {dataLoading ? (
                      <div className="skeleton" style={{ height: 220 }} />
                    ) : (
                      <div style={{ height: 220 }}>
                        <Doughnut data={doughnutData} options={doughnutOpts} />
                      </div>
                    )}
                  </div>

                  {/* team trend line */}
                  <div className="card p-5 animate-fade-in" style={{ animationDelay: '200ms' }}>
                    <h3 className="text-sm font-bold text-gray-900 mb-4">
                      Team Trend (Monthly Avg)
                    </h3>
                    {dataLoading ? (
                      <div className="skeleton" style={{ height: 220 }} />
                    ) : teamTrend.length === 0 ? (
                      <div className="flex items-center justify-center h-52 text-sm text-gray-400">
                        Upload data to see trend
                      </div>
                    ) : (
                      <div style={{ height: 220 }}>
                        <Line data={lineData} options={lineOpts} />
                      </div>
                    )}
                  </div>
                </div>

                {/* suggestion summary table */}
                {!dataLoading && active.length > 0 && (
                  <div className="card p-5 animate-fade-in" style={{ animationDelay: '250ms' }}>
                    <h3 className="text-sm font-bold text-gray-900 mb-4">
                      Team Overview
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-xs text-gray-400 border-b border-gray-100 uppercase tracking-wide">
                            <th className="text-left pb-3 font-semibold">Employee</th>
                            <th className="text-left pb-3 font-semibold">Role</th>
                            <th className="text-center pb-3 font-semibold">Score</th>
                            <th className="text-center pb-3 font-semibold">Trend</th>
                            <th className="text-center pb-3 font-semibold">Suggestion</th>
                            <th className="text-center pb-3 font-semibold">Confidence</th>
                          </tr>
                        </thead>
                        <tbody>
                          {active.slice(0,10).map((emp, i) => {
                            const cfg = SUG_CONFIG[emp.current_suggestion] || {}
                            return (
                              <tr
                                key={emp.id}
                                className="border-b border-gray-50 hover:bg-gray-50 transition-colors duration-150 cursor-pointer animate-fade-in"
                                style={{ animationDelay: `${i * 30}ms` }}
                                onClick={() => setSelectedEmpId(emp.employee_id)}
                              >
                                <td className="py-3">
                                  <p className="font-semibold text-gray-900">{emp.name}</p>
                                  <p className="text-xs text-gray-400 font-mono">{emp.employee_id}</p>
                                </td>
                                <td className="py-3 text-gray-600 text-xs">
                                  {emp.role?.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}
                                </td>
                                <td className="py-3 text-center font-bold text-gray-900">
                                  {emp.current_score?.toFixed(1) ?? '—'}
                                </td>
                                <td className="py-3 text-center text-base">
                                  {emp.current_trend === 'Improving' ? '↗' :
                                   emp.current_trend === 'Declining' ? '↘' :
                                   emp.current_trend === 'Stable'    ? '→' : '?'}
                                </td>
                                <td className="py-3 text-center">
                                  {emp.current_suggestion ? (
                                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${cfg.badge || 'bg-gray-100 text-gray-500'}`}>
                                      {cfg.icon} {emp.current_suggestion}
                                    </span>
                                  ) : <span className="text-gray-300 text-xs">No data</span>}
                                </td>
                                <td className="py-3 text-center text-xs text-gray-600 font-medium">
                                  {emp.current_confidence?.toFixed(0) ?? '—'}%
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                      {active.length > 10 && (
                        <p className="text-xs text-gray-400 text-center mt-3">
                          Showing 10 of {active.length} — click an employee in the list to see full details
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── EMPLOYEE PANEL ────────────────────────────────────── */}
      {selectedEmpId && (
        <EmployeePanel
          employeeId={selectedEmpId}
          onClose={() => setSelectedEmpId(null)}
          onUpdate={fetchAll}
        />
      )}

      {/* ── MODALS ────────────────────────────────────────────── */}
      {uploadResult && (
        <UploadSummaryModal
          result={uploadResult}
          onClose={() => setUploadResult(null)}
        />
      )}

      {overwriteData && (
        <OverwriteModal
          message={overwriteData.message}
          onConfirm={() => handleUpload(true)}
          onCancel={() => { setOverwriteData(null); setUploadFile(null); if(fileRef.current) fileRef.current.value='' }}
        />
      )}

      {showHistory  && <HistoryModal    onClose={() => setShowHistory(false)}  />}
      {showSettings && <SettingsModal   onClose={() => { setShowSettings(false); refreshBusiness() }} />}
      {showAddEmp   && <AddEmployeeModal onClose={() => setShowAddEmp(false)} onAdded={fetchAll} />}
    </div>
  )
}