import { create } from 'zustand';
import api from '../utils/api';

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  loading: false,
  error: null,

  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),

  loadFromStorage: () => {
    try {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        set({
          token: storedToken,
          user: JSON.parse(storedUser)
        });
      }
    } catch (error) {
      console.error('Error loading from storage:', error);
    }
  },

  register: async (name, email, password, department) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/auth/register', {
        name,
        email,
        password,
        department
      });

      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      set({
        user,
        token,
        loading: false
      });

      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/auth/login', {
        email,
        password
      });

      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      set({
        user,
        token,
        loading: false
      });

      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({
      user: null,
      token: null,
      error: null
    });
  },

  getCurrentUser: async () => {
    set({ loading: true });
    try {
      const response = await api.get('/auth/me');
      set({ user: response.data.user, loading: false });
      return response.data.user;
    } catch (error) {
      set({ loading: false, error: error.response?.data?.message });
      throw error;
    }
  }
}));
