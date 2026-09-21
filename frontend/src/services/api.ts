import axios from 'axios';

// Client HTTP dung chung: tu gan JWT, tu ve /login khi gap 401.
// Moi domain (auth, spaces, bookings, ...) viet 1 service rieng
// import instance nay, khong tu tao axios moi.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8081',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('eduspace_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Không xóa token hay redirect nếu request là login thử mật khẩu
    if (err?.response?.status === 401 && !err.config?.url?.includes('/api/auth/login')) {
      localStorage.removeItem('eduspace_token');
    }
    return Promise.reject(err);
  },
);

export default api;
