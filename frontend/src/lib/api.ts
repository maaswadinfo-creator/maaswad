import axios, { AxiosError } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const api = axios.create({ baseURL: API_URL, headers: { 'Content-Type': 'application/json' } });

const tokens = {
  get access() { return localStorage.getItem('mw_access'); },
  get refresh() { return localStorage.getItem('mw_refresh'); },
  set(access: string, refresh?: string) {
    localStorage.setItem('mw_access', access);
    if (refresh) localStorage.setItem('mw_refresh', refresh);
  },
  clear() { localStorage.removeItem('mw_access'); localStorage.removeItem('mw_refresh'); },
};
export { tokens };

api.interceptors.request.use((cfg) => {
  if (tokens.access) cfg.headers.Authorization = `Bearer ${tokens.access}`;
  return cfg;
});

let refreshing = false;
api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as any;
    if (error.response?.status === 401 && !original?._retry && tokens.refresh) {
      original._retry = true;
      if (!refreshing) {
        refreshing = true;
        try {
          const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken: tokens.refresh });
          tokens.set(data.data.accessToken, data.data.refreshToken);
        } catch { tokens.clear(); } finally { refreshing = false; }
      }
      original.headers.Authorization = `Bearer ${tokens.access}`;
      return api(original);
    }
    return Promise.reject(error);
  }
);

export const getErrorMessage = (e: unknown): string => {
  const err = e as AxiosError<{ message: string }>;
  return err.response?.data?.message || err.message || 'Something went wrong';
};
