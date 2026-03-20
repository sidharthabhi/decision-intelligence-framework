export default function OverwriteModal({ message, onConfirm, onCancel }) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div
        className="modal-box max-w-md w-full p-6"
        onClick={e => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-lg flex-shrink-0">
            ⚠️
          </div>
          <h2 className="text-lg font-bold text-gray-900">
            Warning: Data Already Exists
          </h2>
        </div>

        {/* body */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-800">
          <p>{message}</p>
          <p className="mt-2 font-semibold">
            This will <span className="underline">permanently replace</span> all
            previous data for this month. This action cannot be undone.
          </p>
        </div>

        {/* actions */}
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn btn-secondary flex-1">
            Cancel
          </button>
          <button onClick={onConfirm} className="btn btn-danger flex-1">
            Replace Data
          </button>
        </div>
      </div>
    </div>
  )
}