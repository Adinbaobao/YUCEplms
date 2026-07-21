import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '@/stores/auth';

const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 30000,
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const auth = useAuthStore();
    if (auth.accessToken) {
      config.headers.Authorization = `Bearer ${auth.accessToken}`;
    }
    return config;
  },
  (err) => Promise.reject(err)
);

// 响应拦截器
api.interceptors.response.use(
  (response: AxiosResponse) => {
    const data = response.data;
    if (data && typeof data === 'object' && 'code' in data) {
      if (data.code === 0) return data;
      ElMessage.error(data.message || '请求失败');
      return Promise.reject(data);
    }
    return data;
  },
  async (err) => {
    const status = err.response?.status;
    const message = err.response?.data?.message || err.message || '网络错误';

    if (status === 401) {
      const auth = useAuthStore();
      // 尝试刷新 token
      if (auth.refreshToken && !err.config._retry) {
        err.config._retry = true;
        try {
          const res = await auth.refresh();
          if (res) {
            err.config.headers.Authorization = `Bearer ${auth.accessToken}`;
            return api(err.config);
          }
        } catch {
          // refresh failed
        }
      }
      auth.logout();
      ElMessage.error('登录已过期，请重新登录');
      setTimeout(() => {
        if (!location.pathname.startsWith('/login')) {
          location.href = '/login';
        }
      }, 500);
    } else if (status === 403) {
      ElMessage.error('权限不足');
    } else if (status === 404) {
      ElMessage.error('资源不存在');
    } else if (status >= 500) {
      ElMessage.error('服务器错误，请稍后再试');
    } else {
      ElMessage.error(message);
    }
    return Promise.reject(err);
  }
);

export default api;
export { api };
