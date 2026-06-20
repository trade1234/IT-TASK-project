// frontend/src/hooks/useAuth.js
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    console.log('🔍 useAuth init  token: - useAuth.js:16', !!token, 'storedUser:', !!storedUser);
    
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        verifyToken();
      } catch (e) {
        console.error('Error parsing stored user: - useAuth.js:23', e);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async () => {
    try {
      console.log('🔍 Verifying token... - useAuth.js:35');
      const response = await api.get('/auth/profile');
      console.log('✅ Token verified: - useAuth.js:37', response.data.user.email);
      setUser(response.data.user);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    } catch (err) {
      console.error('❌ Token verification failed: - useAuth.js:41', err);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      console.log('🔐 Login attempt: - useAuth.js:53', email);
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data.success) {
        const { token, user } = response.data;
        console.log('✅ Login successful: - useAuth.js:58', user.email);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);
        return true;
      }
      return false;
    } catch (err) {
      console.error('❌ Login error: - useAuth.js:66', err);
      setError(err.response?.data?.message || 'Login failed');
      return false;
    }
  };

  const logout = async () => {
    console.log('🔄 Logout called - useAuth.js:73');
    
    try {
      await api.post('/auth/logout');
      console.log('✅ Logout API successful - useAuth.js:77');
    } catch (error) {
      console.warn('⚠️ Logout API error: - useAuth.js:79', error.message);
    }
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login', { replace: true });
    console.log('🚀 Redirected to login - useAuth.js:86');
  };

  const register = async (userData) => {
    try {
      setError(null);
      const response = await api.post('/auth/register', userData);
      
      if (response.data.success) {
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Registration error: - useAuth.js:103', err);
      setError(err.response?.data?.message || 'Registration failed');
      return false;
    }
  };

  // ✅ Update user function
  const updateUser = (updatedUser) => {
    if (updatedUser) {
      console.log('🔄 Updating user: - useAuth.js:112', updatedUser);
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  // ✅ Check if user is admin
  const isAdmin = user?.role === 'admin' || user?.role === 'Admin';

  return {
    user,
    loading,
    error,
    login,
    logout,
    register,
    setUser,
    updateUser,
    isAdmin
  };
};