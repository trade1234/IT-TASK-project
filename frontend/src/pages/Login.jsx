import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleLogin = () => {
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    
    setError('');
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);

    api.post('/auth/login', { email, password })
      .then(response => {
        console.log('✅ Success:', response.data);
        if (response.data.success) {
          const { token, user } = response.data;
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
          navigate('/dashboard', { replace: true });
        }
      })
      .catch(err => {
        console.error('❌ Error:', err);
        const message = err.response?.data?.message || 'Invalid email or password';
        setError(message);
        setLoading(false);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">TP</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900"> IT TaskFlow</h1>
          <p className="text-gray-600 mt-2">Task Management System</p>
        </div>

        <div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              ❌ {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </div>

        {/* ✅ ATTRACTIVE WELCOME TEXT */}
        <div className="mt-6 text-center">
          <p className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 animate-pulse">
            🙏 Welcome to the App
          </p>
          <p className="text-md font-medium text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500">
            💻 Trade Ethiopia Group
          </p>
          <p className="text-sm font-medium text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500 mt-1">
            🚀
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;