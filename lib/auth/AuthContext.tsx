'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { authService, AppwriteUser, UserSession } from './appwrite';
import { 
  AuthContextType, 
  AuthState, 
  validateSession, 
  checkPremiumAccess,
  persistAuthState,
  restoreAuthState,
  clearAuthState,
  parseAuthError,
  authRateLimiter
} from './authUtils';

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
    isPremium: false
  });

  // Initialize authentication state
  const initializeAuth = useCallback(async () => {
    try {
      // First, check for a session in local storage
      const storedSession = restoreAuthState().session;
      
      if (storedSession) {
        // Validate the stored session
        const { isValid, user, session } = await validateSession();
        
        if (isValid && user && session) {
          setState({
            user,
            session,
            isLoading: false,
            isAuthenticated: true,
            isPremium: checkPremiumAccess(user)
          });
          persistAuthState(user, session);
        } else {
          // If no session is validated, ensure the state is cleared.
          setState({
            user: null,
            session: null,
            isLoading: false,
            isAuthenticated: false,
            isPremium: false,
          });
          clearAuthState();
        }
      } else {
        // If no session exists in local storage, consider the user logged out
        setState({
          user: null,
          session: null,
          isLoading: false,
          isAuthenticated: false,
          isPremium: false,
        });
        clearAuthState();
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
      // Ensure state is cleared on initialization failure.
      setState({
        user: null,
        session: null,
        isLoading: false,
        isAuthenticated: false,
        isPremium: false,
      });
      clearAuthState();
    }
  }, []);

  // Initialize auth state on mount
  useEffect(() => {
    console.log('[AuthContext] Initializing authentication...');
    const timer = setTimeout(() => {
      console.warn('[AuthContext] Auth check timed out. Forcing loading state to false.');
      setState(prev => ({ ...prev, isLoading: false }));
    }, 5000); // 5-second timeout as a failsafe

    initializeAuth().finally(() => {
      console.log('[AuthContext] Initialization complete.');
      clearTimeout(timer);
    });

    return () => clearTimeout(timer);
  }, [initializeAuth]);

  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    // Rate limiting check
    if (!authRateLimiter.canAttempt(email)) {
      const remainingTime = authRateLimiter.getRemainingTime(email);
      const minutes = Math.ceil(remainingTime / (60 * 1000));
      throw new Error(`Too many login attempts. Please try again in ${minutes} minutes.`);
    }

    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const session = await authService.login(email, password);
      const user = await authService.getCurrentUser();
      
      if (user && session) {
        const newState = {
          user,
          session,
          isLoading: false,
          isAuthenticated: true,
          isPremium: checkPremiumAccess(user)
        };
        
        setState(newState);
        persistAuthState(user, session);
      } else {
        throw new Error('Failed to retrieve user information');
      }
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      const { message } = parseAuthError(error);
      throw new Error(message);
    }
  };

  // Signup function
  const signup = async (email: string, password: string, name: string): Promise<void> => {
    // Rate limiting check
    if (!authRateLimiter.canAttempt(email)) {
      const remainingTime = authRateLimiter.getRemainingTime(email);
      const minutes = Math.ceil(remainingTime / (60 * 1000));
      throw new Error(`Too many signup attempts. Please try again in ${minutes} minutes.`);
    }

    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const user = await authService.createAccount(email, password, name);
      const session = await authService.login(email, password);
      
      if (user && session) {
        const newState = {
          user,
          session,
          isLoading: false,
          isAuthenticated: true,
          isPremium: checkPremiumAccess(user)
        };
        
        setState(newState);
        persistAuthState(user, session);
        
        // Send email verification
        try {
          await authService.sendEmailVerification();
        } catch (verificationError) {
          console.warn('Email verification failed:', verificationError);
          // Don't throw here as the account was created successfully
        }
      } else {
        throw new Error('Failed to create account');
      }
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      const { message } = parseAuthError(error);
      throw new Error(message);
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      await authService.logout();
      
      setState({
        user: null,
        session: null,
        isLoading: false,
        isAuthenticated: false,
        isPremium: false
      });
      
      clearAuthState();
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout fails, clear local state
      setState({
        user: null,
        session: null,
        isLoading: false,
        isAuthenticated: false,
        isPremium: false
      });
      clearAuthState();
    }
  };

  // Google OAuth login
  const loginWithGoogle = async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      await authService.loginWithGoogle();
      // OAuth will redirect, so we don't need to update state here
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      const { message } = parseAuthError(error);
      throw new Error(message);
    }
  };

  // Send password recovery email
  const sendPasswordRecovery = async (email: string): Promise<void> => {
    try {
      await authService.sendPasswordRecovery(email);
    } catch (error) {
      const { message } = parseAuthError(error);
      throw new Error(message);
    }
  };

  // Send email verification
  const sendEmailVerification = async (): Promise<void> => {
    try {
      await authService.sendEmailVerification();
    } catch (error) {
      const { message } = parseAuthError(error);
      throw new Error(message);
    }
  };

  // Update user profile
  const updateProfile = async (data: { name?: string; email?: string }): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      let updatedUser = state.user;
      
      if (data.name && updatedUser) {
        updatedUser = await authService.updateName(data.name);
      }
      
      if (data.email && updatedUser) {
        // Email update requires current password, which should be handled separately
        throw new Error('Email update requires password confirmation');
      }
      
      if (updatedUser) {
        setState(prev => ({
          ...prev,
          user: updatedUser,
          isLoading: false
        }));
        persistAuthState(updatedUser, state.session);
      }
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      const { message } = parseAuthError(error);
      throw new Error(message);
    }
  };

  // Refresh user data
  const refreshUser = async (): Promise<void> => {
    try {
      const { isValid, user, session } = await validateSession();
      
      if (isValid && user && session) {
        setState(prev => ({
          ...prev,
          user,
          session,
          isAuthenticated: true,
          isPremium: checkPremiumAccess(user)
        }));
        persistAuthState(user, session);
      } else {
        setState({
          user: null,
          session: null,
          isLoading: false,
          isAuthenticated: false,
          isPremium: false
        });
        clearAuthState();
      }
    } catch (error) {
      console.error('User refresh failed:', error);
    }
  };

  // Context value
  const contextValue: AuthContextType = {
    ...state,
    login,
    signup,
    logout,
    loginWithGoogle,
    sendPasswordRecovery,
    sendEmailVerification,
    updateProfile,
    refreshUser
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Hook for checking authentication status
export const useAuthStatus = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  return { isAuthenticated, isLoading, user };
};

// Hook for checking premium status
export const usePremiumStatus = () => {
  const { isPremium, user } = useAuth();
  return { 
    isPremium, 
    subscription: user?.subscription,
    isExpiringSoon: user?.subscription ? 
      new Date(user.subscription.expiresAt).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000 : 
      false
  };
};