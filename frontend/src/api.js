// frontend/src/api.js
import axios from 'axios';

// ✅ CORRECT BACKEND URL
const API_URL = 'https://taskflow-pro-mvp.onrender.com/api';

console.log('🔗 API URL: - api.js:7', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('📡 Request: - api.js:23', config.method.toUpperCase(), config.url);
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle responses - ✅ NO REDIRECT on 401
api.interceptors.response.use(
  (response) => {
    console.log('📥 Response: - api.js:32', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ API Error: - api.js:36', error.response?.status, error.response?.data);
    // ✅ DO NOT redirect - let the Login page handle it
    return Promise.reject(error);
  }
);

export default api;