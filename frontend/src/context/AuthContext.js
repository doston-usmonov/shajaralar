import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Auth statusini tekshirish
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Token bilan user ma'lumotlarini olish
        const response = await api.get('/user');
        setUser(response.data);
        setAuthError(null);
      } catch (error) {
        console.error('Authentication check failed:', error);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login funksiyasi
  const login = async (email, password) => {
    try {
      setLoading(true);
      // Login so'rovi
      const response = await api.post('/login', {
        email,
        password
      });
      
      // Token saqlash
      localStorage.setItem('token', response.data.token);
      
      // User ma'lumotlarini state-ga qo'shish
      setUser(response.data.user);
      setAuthError(null);
      
      return response.data;
    } catch (error) {
      console.error('Login failed:', error);
      setAuthError(error.response?.data?.message || 'Login failed. Please check your credentials.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Ro'yxatdan o'tish funksiyasi
  const register = async (name, email, password, password_confirmation) => {
    try {
      setLoading(true);
      // Register so'rovi
      const response = await api.post('/register', {
        name,
        email,
        password,
        password_confirmation
      });
      
      // Token saqlash
      localStorage.setItem('token', response.data.token);
      
      // User ma'lumotlarini state-ga qo'shish
      setUser(response.data.user);
      setAuthError(null);
      
      return response.data;
    } catch (error) {
      console.error('Registration failed:', error);
      setAuthError(error.response?.data?.message || 'Registration failed. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout funksiyasi
  const logout = async () => {
    try {
      setLoading(true);
      
      // Logout so'rovi (optional, token-based auth bo'lganligi uchun)
      if (user) {
        await api.post('/logout');
      }
      
      // Local storage-dan tokenni o'chirish
      localStorage.removeItem('token');
      
      // User state-ni o'chirish
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Context value
  const value = {
    user,
    loading,
    authError,
    login,
    register,
    logout,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
