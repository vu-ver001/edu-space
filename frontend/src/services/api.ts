import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8081',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// 1. Cho phép request quét nhiều tên key khác nhau để chắc chắn tìm thấy token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('eduspace_token') || localStorage.getItem('token') || localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 2. Xử lý response 401 an toàn
api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Không xóa token nếu request là login thử mật khẩu
    if (err?.response?.status === 401 && !err.config?.url?.includes('/api/auth/login')) {
      localStorage.removeItem('eduspace_token');
      localStorage.removeItem('token');
      localStorage.removeItem('accessToken');

      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  },
);

export default api;