import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { api, type AdminUser } from './api';

interface AuthCtx {
  admin: AdminUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx>({
  admin: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.auth.getSession()
      .then(({ admin: a, csrfToken }) => {
        setAdmin(a);
        if (csrfToken) sessionStorage.setItem('adminCsrfToken', csrfToken);
      })
      .catch(() => setAdmin(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const { admin: a, csrfToken } = await api.auth.login(username, password);
    setAdmin(a);
    if (csrfToken) sessionStorage.setItem('adminCsrfToken', csrfToken);
  }, []);

  const logout = useCallback(async () => {
    await api.auth.logout().catch(() => {});
    sessionStorage.removeItem('adminCsrfToken');
    setAdmin(null);
  }, []);

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
