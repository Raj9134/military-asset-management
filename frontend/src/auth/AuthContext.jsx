import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api, { setSessionExpiredHandler } from "../api/client.js";
import { authApi } from "../api/endpoints.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // On mount, a stored token is checked rather than trusted. A token can be
  // revoked by a password change or an account being deactivated, and the only
  // way to know is to ask the server.
  useEffect(() => {
    let cancelled = false;

    const restore = async () => {
      if (!api.session.access) {
        setLoading(false);
        return;
      }
      try {
        const result = await authApi.me();
        if (!cancelled) {
          setUser(result.user);
          setPermissions(result.permissions);
        }
      } catch {
        api.session.clear();
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    restore();
    return () => {
      cancelled = true;
    };
  }, []);

  // An expired session has to clear local state too, otherwise the interface
  // keeps rendering pages for a user who is no longer signed in.
  useEffect(() => {
    setSessionExpiredHandler(() => {
      setUser(null);
      setPermissions([]);
    });
  }, []);

  const login = useCallback(async (credentials) => {
    const result = await authApi.login(credentials);
    setUser(result.user);
    const profile = await authApi.me();
    setPermissions(profile.permissions);
    return result;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setPermissions([]);
    }
  }, []);

  const value = useMemo(
    () => ({ user, permissions, loading, login, logout, setUser }),
    [user, permissions, loading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return context;
}
