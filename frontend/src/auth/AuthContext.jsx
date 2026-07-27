import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { fetchCurrentUser, loginRequest } from '../api/authApi.js';
import {
  clearToken,
  getToken,
  onUnauthorized,
} from './tokenStorage.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [bootstrapping, setBootstrapping] = useState(true);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const login = useCallback(async (email, password) => {
    const result = await loginRequest(email, password);
    setUser(result.user);
    return result;
  }, []);

  useEffect(() => {
    const unsub = onUnauthorized(() => {
      setUser(null);
    });

    async function bootstrap() {
      if (!getToken()) {
        setBootstrapping(false);
        return;
      }

      try {
        const me = await fetchCurrentUser();
        setUser(me.user);
      } catch {
        clearToken();
        setUser(null);
      } finally {
        setBootstrapping(false);
      }
    }

    bootstrap();
    return unsub;
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      bootstrapping,
      login,
      logout,
    }),
    [user, bootstrapping, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
