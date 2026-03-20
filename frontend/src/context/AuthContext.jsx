import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi, businessApi } from '../services/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,     setUser]     = useState(null)
  const [business, setBusiness] = useState(null)
  const [loading,  setLoading]  = useState(true)  // true until auth resolves

  // ── resolve auth on first load ───────────────────────────────
  // reads token from storage and fetches user + business
  // this runs once — prevents flash of login page
useEffect(() => {
  const token =
    localStorage.getItem('token') ||
    sessionStorage.getItem('token')

  if (!token) {
    setTimeout(() => setLoading(false), 0)
    return
  }

  Promise.all([authApi.me(), businessApi.get()])
    .then(([userRes, bizRes]) => {
      setUser(userRes.data)
      setBusiness(bizRes.data)
      setLoading(false)        // ← moved inside .then()
    })
    .catch(() => {
      localStorage.removeItem('token')
      sessionStorage.removeItem('token')
      setUser(null)
      setBusiness(null)
      setLoading(false)        // ← moved inside .catch()
    })
}, [])

  // ── login ────────────────────────────────────────────────────
  const login = useCallback(async (email, password, remember) => {
    const res   = await authApi.login({ email, password })
    const token = res.data.access_token

    // store based on remember-me
    if (remember) {
      localStorage.setItem('token', token)
    } else {
      sessionStorage.setItem('token', token)
    }

    // fetch user info
    const userRes = await authApi.me()
    setUser(userRes.data)

    // try to fetch business — may not exist yet (new user)
    try {
      const bizRes = await businessApi.get()
      setBusiness(bizRes.data)
      return { hasBusiness: true }
    } catch {
      setBusiness(null)
      return { hasBusiness: false }
    }
  }, [])

  // ── signup ───────────────────────────────────────────────────
  const signup = useCallback(async (fullName, email, password) => {
    const res   = await authApi.signup({ full_name: fullName, email, password })
    const token = res.data.access_token

    // new user — session only (no remember-me on signup)
    sessionStorage.setItem('token', token)

    const userRes = await authApi.me()
    setUser(userRes.data)
    setBusiness(null)   // new user never has a business yet
  }, [])

  // ── logout ───────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem('token')
    sessionStorage.removeItem('token')
    setUser(null)
    setBusiness(null)
  }, [])

  // ── setup business ───────────────────────────────────────────
  const setupBusiness = useCallback(async (data) => {
    const res = await businessApi.create(data)
    setBusiness(res.data)
    return res.data
  }, [])

  // ── refresh business ─────────────────────────────────────────
  // called after settings update or type change
  const refreshBusiness = useCallback(async () => {
    try {
      const res = await businessApi.get()
      setBusiness(res.data)
    } catch {
      setBusiness(null)
    }
  }, [])

  const value = {
    user,
    business,
    loading,
    login,
    signup,
    logout,
    setupBusiness,
    refreshBusiness,
    setBusiness,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// ── hook ─────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}