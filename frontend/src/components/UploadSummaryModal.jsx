export default function UploadSummaryModal({ result, onClose }) {
  const { summary } = result

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-box w-full max-w-lg flex flex-col"
        style={{ maxHeight: '85vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xl">
              ✓
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Upload Successful</h2>
              <p className="text-sm text-gray-500">{result.month} {result.year} data processed</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-all duration-150"
          >
            ✕
          </button>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* stat boxes */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-blue-700">{summary.total_processed}</p>
              <p className="text-xs text-blue-600 font-medium mt-1">Total Processed</p>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-green-700">{summary.new_employees?.length || 0}</p>
              <p className="text-xs text-green-600 font-medium mt-1">New Employees</p>
            </div>
          </div>

          {/* new employees */}
          {summary.new_employees?.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 animate-slide-down">
              <p className="text-sm font-semibold text-green-800 mb-2">✓ New Employees Added:</p>
              <div className="flex flex-wrap gap-1.5">
                {summary.new_employees.map(id => (
                  <span key={id} className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">
                    {id}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* absent employees */}
          {summary.absent_employees?.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 animate-slide-down">
              <p className="text-sm font-semibold text-yellow-800 mb-2">⚠️ Absent Employees (not in upload):</p>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {summary.absent_employees.map(id => (
                  <span key={id} className="text-xs bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full font-medium">
                    {id}
                  </span>
                ))}
              </div>
              <p className="text-xs text-yellow-700">These employees were not found in this upload. Verify their status.</p>
            </div>
          )}

          {/* 2 month missing */}
          {summary.two_month_missing?.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 animate-slide-down">
              <p className="text-sm font-semibold text-red-800 mb-2">🚨 Missing 2+ Consecutive Months:</p>
              <div className="flex flex-wrap gap-1.5">
                {summary.two_month_missing.map(id => (
                  <span key={id} className="text-xs bg-red-100 text-red-700 px-2.5 py-1 rounded-full font-medium">
                    {id}
                  </span>
                ))}
              </div>
              <p className="text-xs text-red-700 mt-2">Consider marking these employees as inactive.</p>
            </div>
          )}

          {/* name changes */}
          {summary.name_changes?.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 animate-slide-down">
              <p className="text-sm font-semibold text-blue-800 mb-2">ℹ️ Name Changes Detected:</p>
              {summary.name_changes.map((nc, i) => (
                <p key={i} className="text-xs text-blue-700 mt-1">
                  <span className="font-mono font-semibold">{nc.employee_id}</span>:{' '}
                  <span className="line-through text-gray-400">{nc.old_name}</span>{' '}
                  → <span className="font-semibold">{nc.new_name}</span>
                </p>
              ))}
            </div>
          )}

          {/* reactivations */}
          {summary.reactivations?.length > 0 && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 animate-slide-down">
              <p className="text-sm font-semibold text-purple-800 mb-2">🔄 Employees Reactivated:</p>
              <div className="flex flex-wrap gap-1.5">
                {summary.reactivations.map(id => (
                  <span key={id} className="text-xs bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full font-medium">
                    {id}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* warnings */}
          {summary.warnings?.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">ℹ️ Warnings:</p>
              {summary.warnings.map((w, i) => (
                <p key={i} className="text-xs text-gray-600 mt-1">• {w}</p>
              ))}
            </div>
          )}
        </div>

        {/* footer */}
        <div className="p-5 border-t border-gray-100">
          <button onClick={onClose} className="btn btn-primary w-full">
            View Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}