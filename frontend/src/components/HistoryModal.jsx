import { useState, useEffect } from 'react'
import { uploadApi } from '../services/api.js'

const STATUS_BADGE = {
  success: 'bg-green-100 text-green-700',
  failed:  'bg-red-100  text-red-700',
}

export default function HistoryModal({ onClose }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    uploadApi.history()
      .then(r => setHistory(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-box w-full max-w-2xl flex flex-col"
        style={{ maxHeight: '80vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            📁 Upload History
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-all duration-150"
          >
            ✕
          </button>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="skeleton h-12 w-full" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">📭</p>
              <p className="text-gray-500 text-sm">No uploads yet</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                  <th className="text-left pb-3 font-semibold">Month</th>
                  <th className="text-center pb-3 font-semibold">Upload Date</th>
                  <th className="text-center pb-3 font-semibold">Employees</th>
                  <th className="text-center pb-3 font-semibold">New</th>
                  <th className="text-center pb-3 font-semibold">Absent</th>
                  <th className="text-center pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <tr
                    key={h.id}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors duration-150 animate-fade-in"
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <td className="py-3 font-semibold text-gray-900">{h.month}</td>
                    <td className="py-3 text-center text-gray-500">
                      {new Date(h.uploaded_at).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </td>
                    <td className="py-3 text-center font-semibold text-gray-900">
                      {h.employees_processed}
                    </td>
                    <td className="py-3 text-center text-green-600 font-medium">
                      {h.new_employees > 0 ? `+${h.new_employees}` : '—'}
                    </td>
                    <td className="py-3 text-center text-yellow-600 font-medium">
                      {h.absent_employees > 0 ? h.absent_employees : '—'}
                    </td>
                    <td className="py-3 text-center">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${STATUS_BADGE[h.status] || STATUS_BADGE.success}`}>
                        ✓ {h.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* footer */}
        <div className="p-5 border-t border-gray-100">
          <button onClick={onClose} className="btn btn-secondary w-full">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}