'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CurrentUserSession, UserRole, Permission, ROLE_PERMISSIONS } from '@hrms/shared';
import { authApi } from '@/services/endpoints';
import { toast } from 'sonner';

interface AuthContextType {
  user: CurrentUserSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (...roles: UserRole[]) => boolean;
  hasPermission: (...permissions: Permission[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUserSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  // Load active user session on startup
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('access_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await authApi.getMe();
        if (response.success && response.data) {
          setUser(response.data);
          localStorage.setItem('current_user', JSON.stringify(response.data));
        }
      } catch {
        localStorage.removeItem('access_token');
        localStorage.removeItem('current_user');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, passwordCandidate: string) => {
    setIsLoading(true);
    try {
      const response = await authApi.login({ email, password: passwordCandidate });
      if (response.success && response.data) {
        const { user: userSession, accessToken } = response.data;
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('current_user', JSON.stringify(userSession));
        setUser(userSession);
        toast.success(`Welcome back, ${userSession.firstName}!`);
        router.push('/dashboard');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Invalid credentials or login failed';
      toast.error(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore network errors during logout
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('current_user');
      setUser(null);
      toast.info('Signed out successfully');
      router.push('/login');
    }
  };

  const hasRole = (...roles: UserRole[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const hasPermission = (...permissions: Permission[]) => {
    if (!user) return false;
    const allowed = ROLE_PERMISSIONS[user.role] || [];
    return permissions.every((p) => allowed.includes(p));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        hasRole,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
