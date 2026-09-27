import React, { createContext, useContext, useMemo, useState } from 'react';
import { decodeJwt, getToken, normalizeRole, TOKEN_KEY } from './api.js';

const USER_KEY = 'page-pine.user';
const AuthContext = createContext(null);

function readStoredUser(token) {
  try {
    const stored = JSON.parse(localStorage.getItem(USER_KEY) || '{}');
    const claims = token ? decodeJwt(token) : {};
    return {
      ...stored,
      id: stored.id || claims.userId || claims.sub || '',
      studentId: stored.studentId || claims.studentId || '',
      name: stored.name || claims.name || claims.fullName || '',
      email: stored.email || claims.email || '',
      role: normalizeRole(stored.role, stored.roles, claims.role, claims.roles, claims.authorities, claims.authority),
    };
  } catch {
    return {};
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getToken());
  const [user, setUser] = useState(() => readStoredUser(getToken()));

  function login(nextToken, nextUser) {
    localStorage.setItem(TOKEN_KEY, nextToken);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser({});
  }

  const value = useMemo(() => ({
    token,
    user,
    role: normalizeRole(user.role, user.roles),
    isAuthenticated: Boolean(token),
    login,
    logout,
  }), [token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
