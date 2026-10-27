import axios from 'axios';

// In production (Vercel), API calls go through Vercel rewrites → Render backend.
// In development, CRA proxy (package.json "proxy") forwards /api → localhost:4000.
const BASE_URL = process.env.REACT_APP_API_URL
  ? `${process.env.REACT_APP_API_URL}/api`
  : '/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Response interceptor
api.interceptors.response.use(
  response => response,
  error => {
    const msg = error.response?.data?.error || error.message || 'Network error';
    return Promise.reject(new Error(msg));
  }
);

export const createUser = (data) => api.post('/users', data).then(r => r.data);
export const getUser = (id) => api.get(`/users/${id}`).then(r => r.data);
export const updateUser = (id, data) => api.put(`/users/${id}`, data).then(r => r.data);
export const addSkills = (userId, skills) => api.post(`/users/${userId}/skills`, { skills }).then(r => r.data);

export const submitAssessment = (data) => api.post('/assessments', data).then(r => r.data);
export const getAssessment = (id) => api.get(`/assessments/${id}`).then(r => r.data);

export const getSessions = (track) => api.get('/sessions', { params: track ? { track } : {} }).then(r => r.data);
export const getTracks = () => api.get('/sessions/tracks').then(r => r.data);
export const bookmarkSession = (user_id, session_id) => api.post('/sessions/bookmarks', { user_id, session_id }).then(r => r.data);
export const getBookmarks = (userId) => api.get(`/sessions/bookmarks/${userId}`).then(r => r.data);
export const removeBookmark = (user_id, session_id) => api.delete('/sessions/bookmarks', { data: { user_id, session_id } }).then(r => r.data);

export const getMetrics = () => api.get('/observability/metrics').then(r => r.data);
export const getGuardrailReport = () => api.get('/observability/guardrail-report').then(r => r.data);

export default api;
