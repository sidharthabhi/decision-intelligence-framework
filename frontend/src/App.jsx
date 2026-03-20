import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import BusinessSetup from './pages/BusinessSetup.jsx'
import Dashboard from './pages/Dashboard.jsx'

export default function App() {
  const { loading } = useAuth()

  // wait for auth to resolve before rendering routes
  // prevents flash of login page when user is already logged in
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="spinner spinner-dark" style={{ width: 36, height: 36, borderWidth: 3 }} />
          <p className="text-sm text-slate-500 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Routes>
        {/* public routes — redirect to dashboard if already logged in */}
        <Route path="/login"  element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

        {/* needs auth but no business yet */}
        <Route path="/setup" element={
          <ProtectedRoute requireBusiness={false}>
            <BusinessSetup />
          </ProtectedRoute>
        } />

        {/* needs auth + business */}
        <Route path="/dashboard" element={
          <ProtectedRoute requireBusiness={true}>
            <Dashboard />
          </ProtectedRoute>
        } />

        {/* catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>

      {/* global toast container — rendered here so it's always on top */}
      <div id="toast-root" className="toast-container" />
    </>
  )
}