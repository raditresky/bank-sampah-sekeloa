import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authApi, LoginPayload, RegisterPayload } from '../api/auth.api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isWarga: boolean;
  loading: boolean;
  login: (payload: LoginPayload, rememberMe?: boolean) => Promise<void>;
  register: (payload: RegisterPayload, rememberMe?: boolean) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user') || sessionStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const res = await authApi.getMe();
          setUser(res.data);
          if (localStorage.getItem('token')) {
            localStorage.setItem('user', JSON.stringify(res.data));
          } else {
            sessionStorage.setItem('user', JSON.stringify(res.data));
          }
        } catch (e) {
          console.error('Session expired or invalid', e);
          setUser(null);
          setToken(null);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('user');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const login = async (payload: LoginPayload, rememberMe: boolean = true) => {
    const res = await authApi.login(payload);
    setToken(res.data.token);
    setUser(res.data.user);
    
    // Simpan pilihan remember me
    localStorage.setItem('rememberMe', rememberMe ? 'true' : 'false');
    if (rememberMe) {
      localStorage.setItem('savedNomorHp', payload.nomorHp);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
    } else {
      localStorage.removeItem('savedNomorHp');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.setItem('token', res.data.token);
      sessionStorage.setItem('user', JSON.stringify(res.data.user));
    }
  };

  const register = async (payload: RegisterPayload, rememberMe: boolean = true) => {
    const res = await authApi.register(payload);
    setToken(res.data.token);
    setUser(res.data.user);
    if (rememberMe) {
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.setItem('token', res.data.token);
      sessionStorage.setItem('user', JSON.stringify(res.data.user));
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
  };

  const refreshUser = async () => {
    if (token) {
      try {
        const res = await authApi.getMe();
        setUser(res.data);
        if (localStorage.getItem('token')) {
          localStorage.setItem('user', JSON.stringify(res.data));
        } else {
          sessionStorage.setItem('user', JSON.stringify(res.data));
        }
      } catch (err) {
        console.error('Failed to refresh user', err);
      }
    }
  };

  const isAdmin = user?.role === 'ADMIN_RW';
  const isWarga = user?.role === 'WARGA';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isAdmin,
        isWarga,
        loading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

