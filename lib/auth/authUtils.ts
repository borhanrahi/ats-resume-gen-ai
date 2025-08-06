import { AppwriteException } from 'appwrite';
import { authService, AppwriteUser, UserSession, TokenManager } from './appwrite';

// Authentication state management
export interface AuthState {
  user: AppwriteUser | null;
  session: UserSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isPremium: boolean;
}

// Authentication context type
export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  sendPasswordRecovery: (email: string) => Promise<void>;
  sendEmailVerification: () => Promise<void>;
  updateProfile: (data: { name?: string; email?: string }) => Promise<void>;
  refreshUser: () => Promise<void>;
}

// Session validation
export const validateSession = async (): Promise<{
  isValid: boolean;
  user: AppwriteUser | null;
  session: UserSession | null;
}> => {
  try {
    const session = await authService.getCurrentSession();
    if (!session) {
      return { isValid: false, user: null, session: null };
    }

    // Check if session is expired
    const isExpired = new Date(session.expire) < new Date();
    if (isExpired) {
      // Silently log out if the session is expired
      try {
        await authService.logout();
      } catch (logoutError) {
        // Ignore errors during silent logout
      }
      return { isValid: false, user: null, session: null };
    }

    const user = await authService.getCurrentUser();
    if (!user) {
      return { isValid: false, user: null, session: null };
    }

    return { isValid: true, user, session };
  } catch (error: any) {
    // If the error is 401, it means the user is not logged in. This is an expected state.
    // If the error is an AppwriteException with a 401 code, it's an expected state for unauthenticated users.
    if (error instanceof Error && error.name === 'AppwriteException' && (error as any).code === 401) {
      // This is not an application error, but an expected state. Return gracefully.
      return { isValid: false, user: null, session: null };
    }
    // For any other unexpected errors, log them.
    console.error('An unexpected error occurred during session validation:', error);
    return { isValid: false, user: null, session: null };
  }
};

// Check if user has premium access
export const checkPremiumAccess = (user: AppwriteUser | null): boolean => {
  if (!user?.subscription) return false;
  
  const { plan, status, expiresAt } = user.subscription;
  
  if (plan !== 'premium') return false;
  if (status !== 'active') return false;
  if (new Date(expiresAt) < new Date()) return false;
  
  return true;
};

// Get user role for admin access
export const getUserRole = (user: AppwriteUser | null): 'user' | 'admin' | 'super_admin' | null => {
  if (!user) return null;
  
  // Check user preferences for admin role
  const role = user.prefs?.role as string;
  if (['admin', 'super_admin'].includes(role)) {
    return role as 'admin' | 'super_admin';
  }
  
  return 'user';
};

// Authentication error types
export type AuthError = 
  | 'INVALID_CREDENTIALS'
  | 'USER_EXISTS'
  | 'WEAK_PASSWORD'
  | 'INVALID_EMAIL'
  | 'RATE_LIMITED'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

// Parse authentication errors
export const parseAuthError = (error: any): { type: AuthError; message: string } => {
  const message = error?.message || 'An unknown error occurred';
  
  if (message.includes('Invalid credentials')) {
    return { type: 'INVALID_CREDENTIALS', message };
  }
  if (message.includes('already exists')) {
    return { type: 'USER_EXISTS', message };
  }
  if (message.includes('password')) {
    return { type: 'WEAK_PASSWORD', message };
  }
  if (message.includes('email')) {
    return { type: 'INVALID_EMAIL', message };
  }
  if (message.includes('Too many requests')) {
    return { type: 'RATE_LIMITED', message };
  }
  if (message.includes('network') || message.includes('fetch')) {
    return { type: 'NETWORK_ERROR', message: 'Network error. Please check your connection.' };
  }
  
  return { type: 'UNKNOWN_ERROR', message };
};

// Local storage keys for auth state
export const AUTH_STORAGE_KEYS = {
  USER: 'auth_user',
  SESSION: 'auth_session',
  PREFERENCES: 'auth_preferences'
} as const;

// Persist auth state to localStorage
export const persistAuthState = (user: AppwriteUser | null, session: UserSession | null): void => {
  if (typeof window === 'undefined') return;
  
  try {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEYS.USER);
    }
    
    if (session) {
      localStorage.setItem(AUTH_STORAGE_KEYS.SESSION, JSON.stringify(session));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEYS.SESSION);
    }
  } catch (error) {
    console.error('Failed to persist auth state:', error);
  }
};

// Restore auth state from localStorage
export const restoreAuthState = (): { user: AppwriteUser | null; session: UserSession | null } => {
  if (typeof window === 'undefined') {
    return { user: null, session: null };
  }
  
  try {
    const userStr = localStorage.getItem(AUTH_STORAGE_KEYS.USER);
    const sessionStr = localStorage.getItem(AUTH_STORAGE_KEYS.SESSION);
    
    const user = userStr ? JSON.parse(userStr) : null;
    const session = sessionStr ? JSON.parse(sessionStr) : null;
    
    // Validate session expiry
    if (session && new Date(session.expire) < new Date()) {
      localStorage.removeItem(AUTH_STORAGE_KEYS.USER);
      localStorage.removeItem(AUTH_STORAGE_KEYS.SESSION);
      return { user: null, session: null };
    }
    
    return { user, session };
  } catch (error) {
    console.error('Failed to restore auth state:', error);
    return { user: null, session: null };
  }
};

// Clear all auth data
export const clearAuthState = (): void => {
  if (typeof window === 'undefined') return;
  
  Object.values(AUTH_STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
  
  TokenManager.removeToken();
};

// Password validation
export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Generate secure random password
export const generateSecurePassword = (length: number = 12): string => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  // Ensure at least one character from each required category
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Uppercase
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Lowercase
  password += '0123456789'[Math.floor(Math.random() * 10)]; // Number
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // Special
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

// Rate limiting for auth operations
class AuthRateLimiter {
  private attempts: Map<string, { count: number; lastAttempt: number }> = new Map();
  private readonly maxAttempts = 5;
  private readonly windowMs = 15 * 60 * 1000; // 15 minutes
  
  canAttempt(identifier: string): boolean {
    const now = Date.now();
    const record = this.attempts.get(identifier);
    
    if (!record) {
      this.attempts.set(identifier, { count: 1, lastAttempt: now });
      return true;
    }
    
    // Reset if window has passed
    if (now - record.lastAttempt > this.windowMs) {
      this.attempts.set(identifier, { count: 1, lastAttempt: now });
      return true;
    }
    
    // Check if under limit
    if (record.count < this.maxAttempts) {
      record.count++;
      record.lastAttempt = now;
      return true;
    }
    
    return false;
  }
  
  getRemainingTime(identifier: string): number {
    const record = this.attempts.get(identifier);
    if (!record) return 0;
    
    const elapsed = Date.now() - record.lastAttempt;
    return Math.max(0, this.windowMs - elapsed);
  }
}

export const authRateLimiter = new AuthRateLimiter();