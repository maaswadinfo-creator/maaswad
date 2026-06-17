import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, tokens } from '@/lib/api';
import type { Role, User } from '@/types';

interface AuthState {
  user: User | null;
  activeRole: Role | null;
  loading: boolean;
  requestOtp: (p: { channel: 'phone' | 'email'; phone?: string; email?: string }) => Promise<{ devOtp?: string }>;
  verifyOtp: (p: { channel: 'phone' | 'email'; phone?: string; email?: string; code: string; name?: string }) => Promise<void>;
  firebaseLogin: (idToken: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (role: Role) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [activeRole, setActiveRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    if (!tokens.access) { setLoading(false); return; }
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.data.user);
      setActiveRole(data.data.activeRole);
    } catch { tokens.clear(); setUser(null); } finally { setLoading(false); }
  };

  useEffect(() => { refreshUser(); }, []);

  const requestOtp: AuthState['requestOtp'] = async (p) => {
    const { data } = await api.post('/auth/otp/request', p);
    return data.data;
  };

  const verifyOtp: AuthState['verifyOtp'] = async (p) => {
    const { data } = await api.post('/auth/otp/verify', p);
    tokens.set(data.data.accessToken, data.data.refreshToken);
    setUser(data.data.user);
    setActiveRole(data.data.activeRole);
  };

  const firebaseLogin: AuthState['firebaseLogin'] = async (idToken, name) => {
    const { data } = await api.post('/auth/firebase', { idToken, name });
    tokens.set(data.data.accessToken, data.data.refreshToken);
    setUser(data.data.user);
    setActiveRole(data.data.activeRole);
  };

  const switchRole = async (role: Role) => {
    const { data } = await api.post('/auth/switch-role', { role });
    tokens.set(data.data.accessToken, data.data.refreshToken);
    setActiveRole(data.data.activeRole);
    await refreshUser();
  };

  const logout = async () => {
    try { await api.post('/auth/logout', { refreshToken: tokens.refresh }); } catch { /* ignore */ }
    tokens.clear(); setUser(null); setActiveRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, activeRole, loading, requestOtp, verifyOtp, firebaseLogin, logout, switchRole, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
