import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authApi, type LoginResult } from '@/api/auth';

const TOKEN_KEY = 'plms_access_token';
const REFRESH_KEY = 'plms_refresh_token';
const USER_KEY = 'plms_user_info';

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string>(localStorage.getItem(TOKEN_KEY) || '');
  const refreshToken = ref<string>(localStorage.getItem(REFRESH_KEY) || '');
  const user = ref<LoginResult['user'] | null>(
    JSON.parse(localStorage.getItem(USER_KEY) || 'null')
  );

  const isLoggedIn = computed(() => !!accessToken.value);
  const roles = computed(() => user.value?.roles || []);
  const permissions = computed(() => user.value?.permissions || []);
  const isAdmin = computed(() => roles.value.includes('ADMIN'));
  const isPM = computed(() => roles.value.includes('PM') || isAdmin.value);

  const setTokens = (access: string, refresh: string) => {
    accessToken.value = access;
    refreshToken.value = refresh;
    localStorage.setItem(TOKEN_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  };

  const setUser = (u: LoginResult['user']) => {
    user.value = u;
    localStorage.setItem(USER_KEY, JSON.stringify(u));
  };

  const login = async (username: string, password: string) => {
    const result = await authApi.login({ username, password });
    setTokens(result.accessToken, result.refreshToken);
    setUser(result.user);
    return result;
  };

  const logout = () => {
    accessToken.value = '';
    refreshToken.value = '';
    user.value = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  };

  const refresh = async () => {
    if (!refreshToken.value) return null;
    try {
      const res = await authApi.refresh(refreshToken.value);
      accessToken.value = res.accessToken;
      localStorage.setItem(TOKEN_KEY, res.accessToken);
      return res;
    } catch {
      logout();
      return null;
    }
  };

  const fetchMe = async () => {
    const res = await authApi.me();
    setUser(res as any);
    return res;
  };

  const hasPermission = (code: string) => permissions.value.includes(code);
  const hasRole = (role: string) => roles.value.includes(role);

  return {
    accessToken,
    refreshToken,
    user,
    isLoggedIn,
    roles,
    permissions,
    isAdmin,
    isPM,
    login,
    logout,
    refresh,
    fetchMe,
    setUser,
    hasPermission,
    hasRole,
  };
});
