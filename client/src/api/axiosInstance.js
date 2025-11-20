import axios from 'axios';
import { refreshToken } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: xóa Content-Type khi gửi FormData
axiosInstance.interceptors.request.use(
  (config) => {
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error),
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      const user = JSON.parse(localStorage.getItem('user'));
      console.log('userádsadsadsad', user);

      if (user?.refreshToken) {
        try {
          const refreshResponse = await refreshToken(user.refreshToken);

          const updatedUserData = {
            ...user,
            token: refreshResponse.data.accessToken,
            refreshToken: refreshResponse.data.refreshToken,
          };
          localStorage.setItem('user', JSON.stringify(updatedUserData));

          error.config.headers['Authorization'] = `Bearer ${refreshResponse.data.accessToken}`;
          return axiosInstance(error.config);
        } catch (refreshError) {
          console.error('Refresh token failed', refreshError);
          localStorage.clear();
          window.location.href = '/signin';
        }
      }
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
