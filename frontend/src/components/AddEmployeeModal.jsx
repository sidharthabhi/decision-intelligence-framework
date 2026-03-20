import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { employeeApi } from '../services/api.js'
import { toast } from './Toast.jsx'

const ROLES = {
  petrol_bunk:          ['fuel_attendant','cashier','service_manager','cleaner'],
  retail_store:         ['cashier','sales_associate','inventory_staff','department_manager'],
  electronics_showroom: ['sales_associate','cashier','technical_support','inventory_staff','store_manager'],
  pharmacy:             ['pharmacist','pharmacy_technician','cashier','inventory_staff','store_manager'],
  mall_management:      ['security_personnel','housekeeping_staff','front_desk_staff','maintenance_technician','mall_supervisor'],
  warehouse:            ['forklift_operator','picker_packer','inventory_clerk','receiving_shipping','warehouse_supervisor'],
  small_office:         ['general_staff','manager'],
}

export default function AddEmployeeModal({ onClose, onAdded }) {
  const { business } = useAuth()
  const roles = ROLES[business?.business_type] || ['general_staff']

  const [form, setForm]     = useState({ employee_id: '', name: '', role: roles[0] })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.employee_id.trim()) { setError('Employee ID is required'); return }
    if (!form.name.trim())        { setError('Name is required');        return }

    setError('')
    setLoading(true)
    try {
      await employeeApi.create({
        employee_id: form.employee_id.trim().toUpperCase(),
        name:        form.name.trim(),
        role:        form.role,
      })
      toast.success(`Employee ${form.employee_id.toUpperCase()} added successfully`)
      onAdded()
      onClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add employee')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-box w-full max-w-md p-6"
        onClick={e => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">➕ Add Employee Manually</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-all duration-150"
          >
            ✕
          </button>
        </div>

        {/* error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 animate-slide-down">
            {error}
          </div>
        )}

        {/* form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Employee ID <span className="text-red-500">*</span>
            </label>
            <input
              name="employee_id"
              value={form.employee_id}
              onChange={handleChange}
              placeholder="e.g. EMP011"
              className="input"
              style={{ textTransform: 'uppercase' }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Ramesh Babu"
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Role <span className="text-red-500">*</span>
            </label>
            <select name="role" value={form.role} onChange={handleChange} className="select">
              {roles.map(r => (
                <option key={r} value={r}>
                  {r.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          {/* info note */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700">
            ℹ️ Employee will have no performance data until next upload.
            They will appear in the list but no suggestion will be generated yet.
          </div>

          {/* actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary flex-1">
              {loading ? <><span className="spinner" style={{width:16,height:16}} /> Adding...</> : 'Add Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}