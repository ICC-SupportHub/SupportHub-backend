// frontend/src/contexts/AuthContext.jsx
"use client";
import React from "react";
import { apiAuth } from "@/lib/api";

const AuthCtx = React.createContext({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    apiAuth
      .me()
      .then((u) => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    await apiAuth.login({ email, password }); // 쿠키 세션 설정
    const me = await apiAuth.me();
    setUser(me);
  };

  const logout = async () => {
    await apiAuth.logout();
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => React.useContext(AuthCtx);
