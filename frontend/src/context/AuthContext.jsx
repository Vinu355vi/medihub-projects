import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { LOCAL_STORAGE_KEYS } from '../utils/constants';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);
const normalizeRole = (role) => String(role || '').replace('ROLE_', '').toUpperCase();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem(LOCAL_STORAGE_KEYS.USER);
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem(LOCAL_STORAGE_KEYS.TOKEN));

  const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:8080';

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
      setUser(null);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/auth/me`);
      const normalizedUser = {
        ...response.data,
        role: normalizeRole(response.data?.role),
      };
      setUser(normalizedUser);
      localStorage.setItem(LOCAL_STORAGE_KEYS.USER, JSON.stringify(normalizedUser));
    } catch (error) {
      console.error('Failed to fetch user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${BASE_URL}/auth/login`, {
        email,
        password
      });
      const { token, user } = response.data;
      const normalizedUser = {
        ...user,
        role: normalizeRole(user?.role),
      };
      localStorage.setItem(LOCAL_STORAGE_KEYS.TOKEN, token);
      localStorage.setItem(LOCAL_STORAGE_KEYS.USER, JSON.stringify(normalizedUser));
      setToken(token);
      setUser(normalizedUser);
      toast.success('Login successful!');
      return { success: true, user: normalizedUser };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
      return { success: false, error: error.response?.data };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post(`${BASE_URL}/auth/register`, userData);
      toast.success('Registration successful! Please login.');
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
      return { success: false, error: error.response?.data };
    }
  };

  const logout = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.TOKEN);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.USER);
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
    toast.info('Logged out successfully');
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await axios.put(`${BASE_URL}/auth/profile`, profileData);
      setUser(response.data);
      localStorage.setItem(LOCAL_STORAGE_KEYS.USER, JSON.stringify(response.data));
      toast.success('Profile updated successfully!');
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
      return { success: false };
    }
  };

  const value = {
    user,
    setUser,
    token,
    loading,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user,
    isAdmin: normalizeRole(user?.role) === 'ADMIN',
    isDoctor: normalizeRole(user?.role) === 'DOCTOR',
    isPatient: normalizeRole(user?.role) === 'PATIENT'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
