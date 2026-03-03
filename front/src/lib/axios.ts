import axios from 'axios';
import { useAuthStore } from '../features/authStore';

const apiClient = axios.create({
  baseURL: import.meta.env['VITE_API_BASE_URL'],
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);
export default apiClient;