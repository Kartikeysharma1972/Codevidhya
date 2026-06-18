import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/dashboard';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateGrade: (grade) => api.put('/auth/update-grade', { grade }),
  updateLanguage: (language) => api.put('/auth/update-language', { language }),
};

export const aiAPI = {
  conceptExplainer: (data) => api.post('/ai/concept-explainer', data),
  conceptExplainerImage: (formData) => api.post('/ai/concept-explainer/image', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  conceptExplainerFile: (formData) => api.post('/ai/concept-explainer/file', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  summarize: (formData) => api.post('/ai/summarize', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  projectIdeas: (data) => api.post('/ai/project-ideas', data),
  generateMockTest: (data) => api.post('/ai/mock-test/generate', data),
  submitMockTest: (data) => api.post('/ai/mock-test/submit', data),
  focusArea: (data) => api.post('/ai/focus-area', data),
  searchImage: (query, subject) => api.get('/ai/search-image', { params: { q: query, subject } }),
  searchImages: (query, subject, count, grade) => api.get('/ai/search-images', { params: { q: query, subject, count, grade } }),
};

export const sessionAPI = {
  list: (tool) => api.get('/sessions', { params: { tool } }),
  get: (id) => api.get(`/sessions/${id}`),
  delete: (id) => api.delete(`/sessions/${id}`),
  testHistory: () => api.get('/sessions/tests/history'),
  getTest: (id) => api.get(`/sessions/tests/${id}`),
};

export const curriculumAPI = {
  getSubjects: (grade) => api.get(`/curriculum/subjects/${grade}`),
  getChapters: (grade, subject) => api.get(`/curriculum/chapters/${grade}/${encodeURIComponent(subject)}`),
};

export default api;
