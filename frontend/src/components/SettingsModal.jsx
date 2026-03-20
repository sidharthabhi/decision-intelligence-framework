import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { businessApi } from '../services/api.js'
import { toast } from './Toast.jsx'

const BIZ_TYPES = [
  { value: 'petrol_bunk',          label: '⛽ Petrol Bunk' },
  { value: 'retail_store',         label: '🛒 Retail Store' },
  { value: 'electronics_showroom', label: '📱 Electronics Showroom' },
  { value: 'pharmacy',             label: '💊 Pharmacy' },
  { value: 'mall_management',      label: '🏢 Mall Management' },
  { value: 'warehouse',            label: '📦 Warehouse' },
  { value: 'small_office',         label: '🏛️ Small Office' },
]

export default function SettingsModal({ onClose }) {
  const { user, business, refreshBusiness } = useAuth()

  const [bizName,   setBizName]   = useState(business?.business_name || '')
  const [fullName,  setFullName]  = useState(user?.full_name || '')
  const [saving,    setSaving]    = useState(false)

  const [showChangeType, setShowChangeType] = useState(false)
  const [newType,        setNewType]        = useState('')
  const [deleteConfirm,  setDeleteConfirm]  = useState('')
  const [changing,       setChanging]       = useState(false)
  const [error,          setError]          = useState('')

  const currentBizMeta = BIZ_TYPES.find(b => b.value === business?.business_type)

  const handleSave = async () => {
    setSaving(true)
    try {
      await businessApi.update({ business_name: bizName.trim(), full_name: fullName.trim() })
      await refreshBusiness()
      toast.success('Settings saved successfully')
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleChangeType = async () => {
    if (deleteConfirm !== 'DELETE') { setError("Type exactly 'DELETE' to confirm"); return }
    if (!newType)                    { setError('Select a new business type');        return }
    setChanging(true)
    try {
      await businessApi.changeType({ new_type: newType, confirmation: 'DELETE' })
      await refreshBusiness()
      toast.success(`Business type changed to ${newType}`)
      onClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to change type')
    } finally {
      setChanging(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-box w-full max-w-lg flex flex-col"
        style={{ maxHeight: '88vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">⚙️ Settings</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-all duration-150"
          >
            ✕
          </button>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 animate-slide-down">
              {error}
            </div>
          )}

          {/* business profile */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Business Profile</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Business Name</label>
                <input value={bizName} onChange={e => setBizName(e.target.value)} className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Business Type</label>
                <div className="flex items-center justify-between px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg">
                  <span className="text-sm text-gray-700">{currentBizMeta?.label || business?.business_type}</span>
                  <button
                    onClick={() => setShowChangeType(!showChangeType)}
                    className="text-xs text-red-600 hover:text-red-800 font-medium transition-colors duration-150"
                  >
                    Change Type
                  </button>
                </div>
                <p className="text-xs text-yellow-700 mt-1.5 bg-yellow-50 px-2.5 py-1.5 rounded-lg border border-yellow-100">
                  ⚠️ Changing business type will delete ALL employee data and history.
                </p>
              </div>
            </div>
          </div>

          {/* change type section */}
          {showChangeType && (
            <div className="border-2 border-red-200 rounded-xl p-4 bg-red-50 animate-slide-down">
              <p className="text-sm font-bold text-red-800 mb-1">⚠️ CRITICAL WARNING</p>
              <p className="text-xs text-red-700 mb-3">
                This will permanently delete: all employees, all performance history,
                all upload history, all suggestions and notes.
              </p>
              <div className="space-y-3">
                <select
                  value={newType}
                  onChange={e => setNewType(e.target.value)}
                  className="select border-red-300"
                >
                  <option value="">Select new business type...</option>
                  {BIZ_TYPES
                    .filter(b => b.value !== business?.business_type)
                    .map(b => <option key={b.value} value={b.value}>{b.label}</option>)
                  }
                </select>
                <div>
                  <label className="block text-xs font-semibold text-red-800 mb-1">
                    Type <span className="font-mono bg-red-100 px-1 rounded">DELETE</span> to confirm:
                  </label>
                  <input
                    value={deleteConfirm}
                    onChange={e => setDeleteConfirm(e.target.value)}
                    placeholder="DELETE"
                    className="input border-red-300 font-mono"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowChangeType(false); setDeleteConfirm(''); setNewType(''); setError('') }}
                    className="btn btn-secondary flex-1 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleChangeType}
                    disabled={changing || deleteConfirm !== 'DELETE'}
                    className="btn btn-danger flex-1 text-xs"
                  >
                    {changing ? <><span className="spinner" style={{width:14,height:14}} /> Changing...</> : 'Confirm Change'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* account settings */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Account Settings</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email (Read Only)</label>
                <input value={user?.email || ''} disabled className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <input value={fullName} onChange={e => setFullName(e.target.value)} className="input" />
              </div>
            </div>
          </div>

          {/* system limitations */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">System Limitations</h3>
            <div className="text-xs text-gray-600 space-y-2 bg-gray-50 rounded-lg p-3 max-h-28 overflow-y-auto">
              <p><strong>Data-Dependent:</strong> Quality of suggestions depends on accuracy of uploaded data.</p>
              <p><strong>Context-Blind:</strong> System cannot account for personal circumstances.</p>
              <p><strong>Trend-Based:</strong> Requires minimum 3 months for reliable analysis.</p>
              <p><strong>Not a Replacement For:</strong> HR expertise, legal advice, or personal judgment.</p>
            </div>
          </div>

        </div>

        {/* footer */}
        <div className="p-5 border-t border-gray-100">
          <button onClick={handleSave} disabled={saving} className="btn btn-primary w-full">
            {saving ? <><span className="spinner" style={{width:16,height:16}} /> Saving...</> : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}