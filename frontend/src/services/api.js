import axios from 'axios';

// .env faylida ko'rsatilgan URL-ni olish
// Agar .env faylda ko'rsatilmagan bo'lsa, default URL ishlatiladi
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// API URLni konsolga chiqarish - env faylidan to'g'ri olinayotganini tekshirish
console.log('API URL:', API_URL);

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
      // Log outgoing request with token (masked for security)
      console.log('API Request:', {
        url: config.url,
        method: config.method,
        hasToken: !!token,
        tokenPrefix: token ? token.substring(0, 10) + '...' : null
      });
      
      // Add token to headers
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn('No auth token available for request:', config.url);
    }
    
    return config;
  },
  (error) => {
    console.error('API Request Interceptor Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - xatoliklarni boshqarish
api.interceptors.response.use(
  (response) => {
    // Log the response (excluding potentially large data)
    console.log('API Response:', {
      url: response.config.url,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      hasData: !!response.data
    });
    return response;
  },
  (error) => {
    // Log detailed error information
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      data: error.response?.data
    });
    
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
