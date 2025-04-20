import axios from 'axios';

// .env faylida ko'rsatilgan URL-ni olish
// Agar .env faylda ko'rsatilmagan bo'lsa, default URL ishlatiladi
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Axios instance yaratish
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor - har bir so'rovga auth token qo'shish
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - xatoliklarni boshqarish
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 401 Unauthorized xatosi bo'lsa, token muddati tugagan bo'lishi mumkin
    if (error.response && error.response.status === 401) {
      // Token muddati tugaganda, localStorage'dan token o'chiriladi va login sahifasiga yo'naltiriladi
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
