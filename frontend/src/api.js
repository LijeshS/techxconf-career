import axios from 'axios';

// All API calls go to /api/* which Vercel routes to serverless functions
const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  r => r,
  err => Promise.reject(new Error(err.response?.data?.error || err.message || 'Network error'))
);

export const createUser = d => api.post('/users', d).then(r => r.data);
export const getUser = id => api.get(`/users?id=${id}`).then(r => r.data);
export const updateUser = (id, d) => api.put(`/users?id=${id}`, d).then(r => r.data);

export const submitAssessment = d => api.post('/assessments', d).then(r => r.data);
export const getAssessment = id => api.get(`/assessments?id=${id}`).then(r => r.data);

export const getSessions = track => api.get('/sessions' + (track ? `?track=${encodeURIComponent(track)}` : '')).then(r => r.data);
export const bookmarkSession = (user_id, session_id) => api.post('/sessions', { user_id, session_id }).then(r => r.data);
export const getBookmarks = userId => api.get(`/sessions?bookmarks=1&userId=${userId}`).then(r => r.data);
export const removeBookmark = (user_id, session_id) => api.delete('/sessions', { data: { user_id, session_id } }).then(r => r.data);

export const getMetrics = () => api.get('/observability').then(r => r.data);
export const getGuardrailReport = () => api.get('/observability?report=guardrails').then(r => r.data);

export default api;
