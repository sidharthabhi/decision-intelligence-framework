import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

// ── Toast store (singleton outside React) ─────────────────────
let listeners = []
let toasts = []
let nextId = 0

function notify(listeners) {
  listeners.forEach(l => l([...toasts]))
}

export const toast = {
  show(message, type = 'info', duration = 3000) {
    const id = ++nextId
    toasts = [...toasts, { id, message, type, hiding: false }]
    notify(listeners)

    setTimeout(() => {
      // start hide animation
      toasts = toasts.map(t => t.id === id ? { ...t, hiding: true } : t)
      notify(listeners)
      // remove after animation
      setTimeout(() => {
        toasts = toasts.filter(t => t.id !== id)
        notify(listeners)
      }, 300)
    }, duration)

    return id
  },
  success: (msg, dur) => toast.show(msg, 'success', dur),
  error:   (msg, dur) => toast.show(msg, 'error',   dur),
  warning: (msg, dur) => toast.show(msg, 'warning', dur),
  info:    (msg, dur) => toast.show(msg, 'info',    dur),
}

// ── Icons ─────────────────────────────────────────────────────
const ICONS = {
  success: '✓',
  error:   '✕',
  warning: '⚠',
  info:    'ℹ',
}

// ── ToastContainer ────────────────────────────────────────────
export function ToastContainer() {
  const [items, setItems] = useState([])

  useEffect(() => {
    listeners.push(setItems)
    return () => { listeners = listeners.filter(l => l !== setItems) }
  }, [])

  const root = document.getElementById('toast-root')
  if (!root) return null

  return createPortal(
    <>
      {items.map(t => (
        <div key={t.id} className={`toast ${t.type} ${t.hiding ? 'hiding' : ''}`}>
          <span style={{ fontSize: 14, fontWeight: 700 }}>{ICONS[t.type]}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </>,
    root
  )
}