import { AuthService, UserRole, Permission } from '@/services/auth'

// Mock the container
jest.mock('@/lib/container', () => ({
  container: {
    resolve: jest.fn().mockImplementation((token: string) => {
      if (token === 'HttpClient') {
        return {
          post: jest.fn(),
          get: jest.fn(),
        }
      }
      if (token === 'Logger') {
        return {
          info: jest.fn(),
          error: jest.fn(),
          warn: jest.fn(),
          debug: jest.fn(),
        }
      }
      return {}
    }),
  },
}))

describe('AuthService', () => {
  let authService: AuthService
  let mockHttpClient: any
  let mockLogger: any

  beforeEach(() => {
    authService = new AuthService()
    mockHttpClient = (authService as any).httpClient
    mockLogger = (authService as any).logger
    
    // Clear localStorage
    localStorage.clear()
  })

  describe('login', () => {
    it('should login successfully and store tokens', async () => {
      const mockResponse = {
        data: {
          user: {
            id: '1',
            email: 'test@example.com',
            name: 'Test User',
            role: UserRole.ADMIN,
            permissions: [Permission.ACCOUNTS_READ],
            createdAt: new Date(),
          },
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          expiresIn: 3600,
        },
      }

      mockHttpClient.post.mockResolvedValue(mockResponse)

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password',
      })

      expect(mockHttpClient.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password',
      })

      expect(result).toEqual(mockResponse.data)
      expect(localStorage.getItem('auth_token')).toBe('access-token')
      expect(localStorage.getItem('refresh_token')).toBe('refresh-token')
    })

    it('should handle login failure', async () => {
      const error = new Error('Invalid credentials')
      mockHttpClient.post.mockRejectedValue(error)

      await expect(authService.login({
        email: 'test@example.com',
        password: 'wrong-password',
      })).rejects.toThrow('Invalid credentials')

      expect(mockLogger.error).toHaveBeenCalledWith('Login failed', error, {
        email: 'test@example.com',
      })
    })
  })

  describe('logout', () => {
    it('should logout and clear tokens', async () => {
      localStorage.setItem('auth_token', 'access-token')
      localStorage.setItem('refresh_token', 'refresh-token')

      mockHttpClient.post.mockResolvedValue({})

      await authService.logout()

      expect(mockHttpClient.post).toHaveBeenCalledWith('/auth/logout', {
        refreshToken: 'refresh-token',
      })

      expect(localStorage.getItem('auth_token')).toBeNull()
      expect(localStorage.getItem('refresh_token')).toBeNull()
    })
  })

  describe('token management', () => {
    it('should get access token from localStorage', () => {
      localStorage.setItem('auth_token', 'test-token')
      expect(authService.getAccessToken()).toBe('test-token')
    })

    it('should return null when no token exists', () => {
      expect(authService.getAccessToken()).toBeNull()
    })

    it('should check authentication status', () => {
      expect(authService.isAuthenticated()).toBe(false)

      localStorage.setItem('auth_token', 'test-token')
      expect(authService.isAuthenticated()).toBe(true)
    })
  })

  describe('permissions', () => {
    beforeEach(() => {
      const user = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: UserRole.ADMIN,
        permissions: [Permission.ACCOUNTS_READ, Permission.ACCOUNTS_WRITE],
        createdAt: new Date(),
      }
      localStorage.setItem('auth_user', JSON.stringify(user))
    })

    it('should check if user has permission', () => {
      expect(authService.hasPermission(Permission.ACCOUNTS_READ)).toBe(true)
      expect(authService.hasPermission(Permission.ACCOUNTS_DELETE)).toBe(false)
    })

    it('should check if user has role', () => {
      expect(authService.hasRole(UserRole.ADMIN)).toBe(true)
      expect(authService.hasRole(UserRole.VIEWER)).toBe(false)
    })
  })
})
