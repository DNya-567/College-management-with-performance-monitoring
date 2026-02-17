/* eslint-disable react-refresh/only-export-components */
// Auth state container for the app; exposes login/logout and current user.
// Must NOT handle routing, define API calls, or render UI beyond the provider.

import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { login as apiLogin, me as apiMe } from "../api/auth.api";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const setAuthState = useCallback((nextUser) => {
    setUser(nextUser);
    setIsAuthenticated(Boolean(nextUser));
  }, []);

  const loadCurrentUser = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setAuthState(null);
      setLoading(false);
      return;
    }

    try {
      const response = await apiMe();
      const nextUser = response?.data?.user ?? response?.data ?? null;
      setAuthState(nextUser);
    } catch {
      setAuthState(null);
    } finally {
      setLoading(false);
    }
  }, [setAuthState]);

  useEffect(() => {
    void loadCurrentUser();
  }, [loadCurrentUser]);

  const login = useCallback(
    async (email, password) => {
      const response = await apiLogin({ email, password });
      const token = response?.data?.token || response?.data?.accessToken || null;

      if (token) {
        localStorage.setItem("token", token);
      }

      await loadCurrentUser();
    },
    [loadCurrentUser]
  );

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setAuthState(null);
  }, [setAuthState]);

  const value = useMemo(
    () => ({ user, isAuthenticated, loading, login, logout }),
    [user, isAuthenticated, loading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
