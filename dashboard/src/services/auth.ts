import { HttpClient, Logger } from '@/types/core';
import { container } from '@/lib/container';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: Permission[];
  createdAt: Date;
  lastLoginAt?: Date;
}

export enum UserRole {
  ADMIN = 'admin',
  OPERATOR = 'operator',
  VIEWER = 'viewer'
}

export enum Permission {
  ACCOUNTS_READ = 'accounts:read',
  ACCOUNTS_WRITE = 'accounts:write',
  ACCOUNTS_DELETE = 'accounts:delete',
  JOBS_READ = 'jobs:read',
  JOBS_WRITE = 'jobs:write',
  PROXIES_READ = 'proxies:read',
  PROXIES_WRITE = 'proxies:write',
  CONFIG_READ = 'config:read',
  CONFIG_WRITE = 'config:write',
  ANALYTICS_READ = 'analytics:read'
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export class AuthService {
  private httpClient: HttpClient;
  private logger: Logger;
  private tokenKey = 'auth_token';
  private refreshTokenKey = 'refresh_token';
  private userKey = 'auth_user';

  constructor() {
    this.httpClient = container.resolve<HttpClient>('HttpClient');
    this.logger = container.resolve<Logger>('Logger');
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      this.logger.info('Attempting login', { email: credentials.email });
      
      const response = await this.httpClient.post<LoginResponse>('/auth/login', credentials);
      
      this.storeTokens(response.data.accessToken, response.data.refreshToken);
      this.storeUser(response.data.user);
      
      this.logger.info('Login successful', { userId: response.data.user.id });
      return response.data;
    } catch (error) {
      this.logger.error('Login failed', error as Error, { email: credentials.email });
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      const refreshToken = this.getRefreshToken();
      if (refreshToken) {
        await this.httpClient.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      this.logger.warn('Logout request failed', { error: (error as Error).message });
    } finally {
      this.clearTokens();
      this.logger.info('User logged out');
    }
  }

  async refreshAccessToken(): Promise<string> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await this.httpClient.post<{ accessToken: string; expiresIn: number }>('/auth/refresh', {
        refreshToken
      });

      this.storeTokens(response.data.accessToken, refreshToken);
      this.logger.debug('Access token refreshed');
      
      return response.data.accessToken;
    } catch (error) {
      this.logger.error('Token refresh failed', error as Error);
      this.clearTokens();
      throw error;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    const token = this.getAccessToken();
    if (!token) {
      return null;
    }

    try {
      const response = await this.httpClient.get<User>('/auth/me');
      this.storeUser(response.data);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get current user', error as Error);
      this.clearTokens();
      return null;
    }
  }

  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.tokenKey);
  }

  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.refreshTokenKey);
  }

  getStoredUser(): User | null {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem(this.userKey);
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  hasPermission(permission: Permission): boolean {
    const user = this.getStoredUser();
    return user?.permissions.includes(permission) ?? false;
  }

  hasRole(role: UserRole): boolean {
    const user = this.getStoredUser();
    return user?.role === role;
  }

  private storeTokens(accessToken: string, refreshToken: string): void {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem(this.tokenKey, accessToken);
    localStorage.setItem(this.refreshTokenKey, refreshToken);
  }

  private storeUser(user: User): void {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  private clearTokens(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.userKey);
  }
}

export class PermissionGuard {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  requirePermission(permission: Permission): boolean {
    if (!this.authService.isAuthenticated()) {
      throw new Error('Authentication required');
    }

    if (!this.authService.hasPermission(permission)) {
      throw new Error(`Permission ${permission} required`);
    }

    return true;
  }

  requireRole(role: UserRole): boolean {
    if (!this.authService.isAuthenticated()) {
      throw new Error('Authentication required');
    }

    if (!this.authService.hasRole(role)) {
      throw new Error(`Role ${role} required`);
    }

    return true;
  }

  requireAnyPermission(permissions: Permission[]): boolean {
    if (!this.authService.isAuthenticated()) {
      throw new Error('Authentication required');
    }

    const hasAnyPermission = permissions.some(permission => 
      this.authService.hasPermission(permission)
    );

    if (!hasAnyPermission) {
      throw new Error(`One of permissions [${permissions.join(', ')}] required`);
    }

    return true;
  }
}
