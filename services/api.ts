
import axios from 'axios';

// Switch to your backend URL
const API_URL = 'http://localhost:8000/api'; 

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Add Access Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Handle Token Refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');

      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);

          api.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // If refresh fails, logout user
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/'; // Redirect to login
        }
      }
    }
    return Promise.reject(error);
  }
);

// --- Auth Services ---
export const authService = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { accessToken, refreshToken, data } = response.data;
    
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    return data.user;
  },
  logout: () => {
    localStorage.clear();
    window.location.reload();
  },
  getCurrentUser: () => {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  }
};

// --- Admin Services ---
export const adminService = {
    getUsers: async () => {
        const res = await api.get('/users');
        return res.data;
    },
    addUser: async (userData: any) => {
        const res = await api.post('/auth/register', userData);
        return res.data;
    },
    deleteUser: async (id: number) => {
        await api.delete(`/users/${id}`);
        return true;
    }
};

// --- Data Services (Migration Helper) ---
// Use these to fetch/save data instead of localStorage directly in the future
export const dataService = {
    fetchSettings: async (key: string) => {
        try {
            const res = await api.get(`/settings/${key}`);
            return res.data;
        } catch(e) { return []; }
    },
    saveSettings: async (key: string, data: any) => {
        await api.post(`/settings/${key}`, data);
    }
};

export default api;