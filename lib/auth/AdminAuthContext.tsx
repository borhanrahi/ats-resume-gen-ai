'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { adminAuthService, AdminSessionManager } from './adminAuth';
import { AdminUser, AdminPermission } from '../../types/admin';

// Admin authentication state
export interface AdminAuthState {
  user: AdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  sessionToken: string | null;
}

// Admin authentication context type
export interface AdminAuthContextType extends AdminAuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: AdminPermission) => boolean;
  canManageAdmin: (targetAdmin: AdminUser) => boolean;
  refreshUser: () => Promise<void>;
}

// Create the context
const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

// Provider props
interface AdminAuthProviderProps {
  children: ReactNode;
}

// Admin auth provider component
export const AdminAuthProvider: React.FC<AdminAuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AdminAuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    sessionToken: null
  });

  // Initialize admin authentication state
  const initializeAdminAuth = useCallback(async () => {
    try {
      // Check for stored session
      const { user: storedUser, sessionToken } = AdminSessionManager.getSession();
      
      if (storedUser && sessionToken && AdminSessionManager.isSessionValid(sessionToken)) {
        // Validate session with server
        const validatedUser = await adminAuthService.validateAdminSession();
        
        if (validatedUser) {
          setState({
            user: validatedUser,
            isLoading: false,
            isAuthenticated: true,
            sessionToken
          });
        } else {
          // Session invalid, clear stored data
          AdminSessionManager.clearSession();
          setState({
            user: null,
            isLoading: false,
            isAuthenticated: false,
            sessionToken: null
          });
        }
      } else {
        // No valid session found
        AdminSessionManager.clearSession();
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          sessionToken: null
        });
      }
    } catch (error) {
      console.error('Admin auth initialization failed:', error);
      AdminSessionManager.clearSession();
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        sessionToken: null
      });
    }
  }, []);

  // Initialize auth state on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      console.warn('[AdminAuthContext] Auth check timed out. Forcing loading state to false.');
      setState(prev => ({ ...prev, isLoading: false }));
    }, 10000); // 10-second timeout

    initializeAdminAuth().finally(() => {
      clearTimeout(timer);
    });

    return () => clearTimeout(timer);
  }, [initializeAdminAuth]);

  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const { user, sessionToken } = await adminAuthService.adminLogin(email, password);
      
      // Store session
      AdminSessionManager.setSession(user, sessionToken);
      
      setState({
        user,
        sessionToken,
        isLoading: false,
        isAuthenticated: true
      });
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      if (state.user) {
        await adminAuthService.adminLogout(state.user.id);
      }
      
      AdminSessionManager.clearSession();
      
      setState({
        user: null,
        sessionToken: null,
        isLoading: false,
        isAuthenticated: false
      });
    } catch (error) {
      console.error('Admin logout failed:', error);
      // Even if logout fails, clear local state
      AdminSessionManager.clearSession();
      setState({
        user: null,
        sessionToken: null,
        isLoading: false,
        isAuthenticated: false
      });
    }
  };

  // Check if admin has specific permission
  const hasPermission = (permission: AdminPermission): boolean => {
    if (!state.user) return false;
    return adminAuthService.hasPermission(state.user, permission);
  };

  // Check if admin can manage another admin
  const canManageAdmin = (targetAdmin: AdminUser): boolean => {
    if (!state.user) return false;
    return adminAuthService.canManageAdmin(state.user, targetAdmin);
  };

  // Refresh user data
  const refreshUser = async (): Promise<void> => {
    try {
      const validatedUser = await adminAuthService.validateAdminSession();
      
      if (validatedUser && state.sessionToken) {
        setState(prev => ({
          ...prev,
          user: validatedUser
        }));
        
        // Update stored session
        AdminSessionManager.setSession(validatedUser, state.sessionToken);
      } else {
        // Session invalid, logout
        await logout();
      }
    } catch (error) {
      console.error('Admin user refresh failed:', error);
      await logout();
    }
  };

  // Context value
  const contextValue: AdminAuthContextType = {
    ...state,
    login,
    logout,
    hasPermission,
    canManageAdmin,
    refreshUser
  };

  return (
    <AdminAuthContext.Provider value={contextValue}>
      {children}
    </AdminAuthContext.Provider>
  );
};

// Hook to use admin auth context
export const useAdminAuth = (): AdminAuthContextType => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

// Hook for checking admin authentication status
export const useAdminAuthStatus = () => {
  const { isAuthenticated, isLoading, user } = useAdminAuth();
  return { isAuthenticated, isLoading, user };
};

// Hook for checking admin permissions
export const useAdminPermissions = () => {
  const { user, hasPermission, canManageAdmin } = useAdminAuth();
  
  return {
    user,
    hasPermission,
    canManageAdmin,
    isSuperAdmin: user?.role === 'super_admin',
    isAdmin: user?.role === 'admin',
    isModerator: user?.role === 'moderator'
  };
};

// Hook for admin role-based rendering
export const useAdminRole = () => {
  const { user } = useAdminAuth();
  
  const checkRole = (requiredRole: AdminUser['role'] | AdminUser['role'][]): boolean => {
    if (!user) return false;
    
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    return roles.includes(user.role);
  };
  
  const checkMinimumRole = (minimumRole: AdminUser['role']): boolean => {
    if (!user) return false;
    
    const roleHierarchy = {
      moderator: 1,
      admin: 2,
      super_admin: 3
    };
    
    return roleHierarchy[user.role] >= roleHierarchy[minimumRole];
  };
  
  return {
    user,
    role: user?.role,
    checkRole,
    checkMinimumRole
  };
};