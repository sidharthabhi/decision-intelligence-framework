import axios from 'axios'

// ── axios instance ────────────────────────────────────────────
const api = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
})

// ── request interceptor — attach JWT ─────────────────────────
api.interceptors.request.use(config => {
  const token =
    localStorage.getItem('token') ||
    sessionStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── response interceptor — auto logout on 401 ────────────────
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      sessionStorage.removeItem('token')
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// ── auth ──────────────────────────────────────────────────────
export const authApi = {
  signup:   (data) => api.post('/auth/signup', data),
  login:    (data) => api.post('/auth/login',  data),
  logout:   ()     => api.post('/auth/logout'),
  me:       ()     => api.get('/auth/me'),
  updateMe: (data) => api.put('/auth/me', data),
  refresh:  (data) => api.post('/auth/refresh', data),
}

// ── business ──────────────────────────────────────────────────
export const businessApi = {
  get:        ()     => api.get('/business'),
  create:     (data) => api.post('/business', data),
  update:     (data) => api.put('/business',  data),
  changeType: (data) => api.post('/business/change-type', data),
  delete:     ()     => api.delete('/business'),
  roles:      ()     => api.get('/business/roles'),
}

// ── employees ─────────────────────────────────────────────────
export const employeeApi = {
  list:         (params)       => api.get('/employees', { params }),
  get:          (id)           => api.get(`/employees/${id}`),
  create:       (data)         => api.post('/employees', data),
  update:       (id, data)     => api.put(`/employees/${id}`, data),
  markInactive: (id)           => api.post(`/employees/${id}/inactive`),
  reactivate:   (id)           => api.post(`/employees/${id}/reactivate`),
  getNotes:     (id)           => api.get(`/employees/${id}/notes`),
  addNote:      (id, data)     => api.post(`/employees/${id}/notes`, data),
  deleteNote:   (id, noteId)   => api.delete(`/employees/${id}/notes/${noteId}`),
}

// ── upload ────────────────────────────────────────────────────
export const uploadApi = {
  upload: (formData) =>
    api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  template: (month, year) =>
    api.get('/upload/template', {
      params: { month, year },
      responseType: 'blob',
    }),
  history: () => api.get('/upload/history'),
}

// ── analytics ─────────────────────────────────────────────────
export const analyticsApi = {
  dashboard:          ()    => api.get('/analytics/dashboard'),
  employeeHistory:    (id)  => api.get(`/analytics/employee/${id}/history`),
  suggestionsSummary: ()    => api.get('/analytics/suggestions-summary'),
}

export default api