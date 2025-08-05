'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2, Lock, Crown, AlertTriangle } from 'lucide-react';
import { useAuth, useAuthStatus, usePremiumStatus } from '@/lib/auth/AuthContext';
import { getUserRole } from '@/lib/auth/authUtils';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requirePremium?: boolean;
  requireAdmin?: boolean;
  fallbackPath?: string;
  showFallback?: boolean;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requireAuth = false,
  requirePremium = false,
  requireAdmin = false,
  fallbackPath,
  showFallback = true
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, user } = useAuthStatus();
  const { isPremium } = usePremiumStatus();
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setHasChecked(true);
    }
  }, [isLoading]);

  // Show loading while checking authentication
  if (isLoading || !hasChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Check authentication requirement
  if (requireAuth && !isAuthenticated) {
    if (fallbackPath) {
      router.push(fallbackPath);
      return null;
    }

    if (showFallback) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
          <div className="max-w-md w-full text-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 md:p-8">
              <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Authentication Required
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                You need to sign in to access this page.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => router.push(`/auth/login?redirect=${encodeURIComponent(pathname)}`)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => router.push(`/auth/signup?redirect=${encodeURIComponent(pathname)}`)}
                  className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  Create Account
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return null;
  }

  // Check premium requirement
  if (requirePremium && !isPremium) {
    if (fallbackPath) {
      router.push(fallbackPath);
      return null;
    }

    if (showFallback) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
          <div className="max-w-md w-full text-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 md:p-8">
              <Crown className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Premium Required
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                This feature is only available to premium subscribers.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/pricing')}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  Upgrade to Premium
                </button>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return null;
  }

  // Check admin requirement
  if (requireAdmin) {
    const userRole = getUserRole(user);
    const isAdmin = userRole === 'admin' || userRole === 'super_admin';

    if (!isAdmin) {
      if (fallbackPath) {
        router.push(fallbackPath);
        return null;
      }

      if (showFallback) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
            <div className="max-w-md w-full text-center">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 md:p-8">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Access Denied
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  You don&apos;t have permission to access this page.
                </p>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          </div>
        );
      }

      return null;
    }
  }

  // All checks passed, render children
  return <>{children}</>;
};

// Higher-order component for protecting pages
export const withAuthGuard = <P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<AuthGuardProps, 'children'> = {}
) => {
  const WrappedComponent = (props: P) => (
    <AuthGuard {...options}>
      <Component {...props} />
    </AuthGuard>
  );

  WrappedComponent.displayName = `withAuthGuard(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Specific guard components for common use cases
export const RequireAuth: React.FC<{ children: React.ReactNode; fallbackPath?: string }> = ({ 
  children, 
  fallbackPath = '/auth/login' 
}) => (
  <AuthGuard requireAuth fallbackPath={fallbackPath}>
    {children}
  </AuthGuard>
);

export const RequirePremium: React.FC<{ children: React.ReactNode; fallbackPath?: string }> = ({ 
  children, 
  fallbackPath = '/pricing' 
}) => (
  <AuthGuard requireAuth requirePremium fallbackPath={fallbackPath}>
    {children}
  </AuthGuard>
);

export const RequireAdmin: React.FC<{ children: React.ReactNode; fallbackPath?: string }> = ({ 
  children, 
  fallbackPath = '/dashboard' 
}) => (
  <AuthGuard requireAuth requireAdmin fallbackPath={fallbackPath}>
    {children}
  </AuthGuard>
);

// Hook for checking access permissions
export const useAccessControl = () => {
  const { isAuthenticated, user } = useAuthStatus();
  const { isPremium } = usePremiumStatus();
  const userRole = getUserRole(user);

  return {
    isAuthenticated,
    isPremium,
    isAdmin: userRole === 'admin' || userRole === 'super_admin',
    isSuperAdmin: userRole === 'super_admin',
    userRole,
    canAccess: {
      auth: isAuthenticated,
      premium: isAuthenticated && isPremium,
      admin: isAuthenticated && (userRole === 'admin' || userRole === 'super_admin'),
      superAdmin: isAuthenticated && userRole === 'super_admin'
    }
  };
};