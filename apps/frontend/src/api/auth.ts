import { api } from './index';

export interface LoginParams {
  username: string;
  password: string;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    username: string;
    email: string;
    fullName: string;
    phone?: string;
    avatar?: string;
    roles: string[];
    permissions: string[];
    department?: { id: string; name: string };
  };
}

export const authApi = {
  login: (params: LoginParams) => api.post<LoginResult>('/auth/login', params),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  refresh: (refreshToken: string) => api.post<{ accessToken: string; expiresIn: number }>('/auth/refresh', { refreshToken }),
  changePassword: (oldPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { oldPassword, newPassword }),
};
