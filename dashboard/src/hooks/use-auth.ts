'use client';

import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { AuthService, User, LoginRequest, AuthState, Permission, UserRole } from '@/services/auth';
import { toast } from '@/components/ui/toaster';

interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
  hasRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const authService = new AuthService();

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const token = authService.getAccessToken();
      const user = authService.getStoredUser();

      if (token && user) {
        setState({
          user,
          accessToken: token,
          refreshToken: authService.getRefreshToken(),
          isAuthenticated: true,
          isLoading: false,
        });

        try {
          const currentUser = await authService.getCurrentUser();
          if (currentUser) {
            setState(prev => ({ ...prev, user: currentUser }));
          }
        } catch (error) {
          console.warn('Failed to refresh user data:', error);
        }
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const login = async (credentials: LoginRequest) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const response = await authService.login(credentials);
      
      setState({
        user: response.user,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });

      toast.success('Login successful', `Welcome back, ${response.user.name}!`);
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      toast.error('Login failed', (error as Error).message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      
      setState({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
      });

      toast.info('Logged out', 'You have been successfully logged out');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Logout failed', 'Please try again');
    }
  };

  const refreshToken = async () => {
    try {
      const newToken = await authService.refreshAccessToken();
      setState(prev => ({ ...prev, accessToken: newToken }));
    } catch (error) {
      console.error('Token refresh failed:', error);
      await logout();
    }
  };

  const hasPermission = (permission: Permission): boolean => {
    return authService.hasPermission(permission);
  };

  const hasRole = (role: UserRole): boolean => {
    return authService.hasRole(role);
  };

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    refreshToken,
    hasPermission,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function usePermission(permission: Permission): boolean {
  const { hasPermission } = useAuth();
  return hasPermission(permission);
}

export function useRole(role: UserRole): boolean {
  const { hasRole } = useAuth();
  return hasRole(role);
}

export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = '/login';
    }
  }, [isAuthenticated, isLoading]);

  return { isAuthenticated, isLoading };
}
