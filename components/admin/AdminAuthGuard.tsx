'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth, useAdminPermissions } from '../../lib/auth/AdminAuthContext';
import { AdminUser, AdminPermission } from '../../types/admin';
import { Shield, Loader2, AlertTriangle, Lock } from 'lucide-react';

interface AdminAuthGuardProps {
  children: React.ReactNode;
  requiredRole?: AdminUser['role'] | AdminUser['role'][];
  requiredPermission?: AdminPermission | AdminPermission[];
  fallbackPath?: string;
  showFallback?: boolean;
}

export default function AdminAuthGuard({
  children,
  requiredRole,
  requiredPermission,
  fallbackPath = '/admin/login',
  showFallback = true
}: AdminAuthGuardProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAdminAuth();
  const { hasPermission } = useAdminPermissions();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;

    // Check authentication
    if (!isAuthenticated || !user) {
      setAuthError('Authentication required');
      setIsAuthorized(false);
      if (!showFallback) {
        router.push(fallbackPath);
      }
      return;
    }

    // Check role requirements
    if (requiredRole) {
      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      const hasRequiredRole = roles.includes(user.role);
      
      if (!hasRequiredRole) {
        setAuthError(`Access denied. Required role: ${Array.isArray(requiredRole) ? requiredRole.join(' or ') : requiredRole}`);
        setIsAuthorized(false);
        return;
      }
    }

    // Check permission requirements
    if (requiredPermission) {
      const permissions = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];
      const hasRequiredPermissions = permissions.every(permission => hasPermission(permission));
      
      if (!hasRequiredPermissions) {
        setAuthError(`Access denied. Missing required permissions: ${permissions.join(', ')}`);
        setIsAuthorized(false);
        return;
      }
    }

    // All checks passed
    setAuthError(null);
    setIsAuthorized(true);
  }, [isAuthenticated, isLoading, user, requiredRole, requiredPermission, hasPermission, router, fallbackPath, showFallback]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            Verifying Admin Access
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Please wait while we authenticate your session...
          </p>
        </div>
      </div>
    );
  }

  // Not authorized and showing fallback
  if (!isAuthorized && showFallback) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-6">
              {!isAuthenticated ? (
                <Lock className="w-10 h-10 text-red-600" />
              ) : (
                <AlertTriangle className="w-10 h-10 text-red-600" />
              )}
            </div>
            
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              {!isAuthenticated ? 'Authentication Required' : 'Access Denied'}
            </h1>
            
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {authError || 'You do not have permission to access this area.'}
            </p>
            
            {!isAuthenticated ? (
              <button
                onClick={() => router.push(fallbackPath)}
                className="w-full h-12 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Shield className="w-5 h-5" />
                <span>Go to Admin Login</span>
              </button>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-xl">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Current Role: <span className="font-semibold text-slate-900 dark:text-white">{user?.role}</span>
                  </p>
                  {requiredRole && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      Required Role: <span className="font-semibold text-red-600">
                        {Array.isArray(requiredRole) ? requiredRole.join(' or ') : requiredRole}
                      </span>
                    </p>
                  )}
                </div>
                
                <button
                  onClick={() => router.push('/admin')}
                  className="w-full h-12 bg-slate-600 text-white rounded-xl font-semibold hover:bg-slate-700 transition-colors"
                >
                  Return to Admin Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Not authorized and not showing fallback (redirect handled in useEffect)
  if (!isAuthorized) {
    return null;
  }

  // Authorized - render children
  return <>{children}</>;
}

// Higher-order component for admin route protection
export function withAdminAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    requiredRole?: AdminUser['role'] | AdminUser['role'][];
    requiredPermission?: AdminPermission | AdminPermission[];
    fallbackPath?: string;
  }
) {
  return function AdminProtectedComponent(props: P) {
    return (
      <AdminAuthGuard
        requiredRole={options?.requiredRole}
        requiredPermission={options?.requiredPermission}
        fallbackPath={options?.fallbackPath}
      >
        <Component {...props} />
      </AdminAuthGuard>
    );
  };
}

// Component for role-based rendering
interface AdminRoleGateProps {
  children: React.ReactNode;
  requiredRole?: AdminUser['role'] | AdminUser['role'][];
  requiredPermission?: AdminPermission | AdminPermission[];
  fallback?: React.ReactNode;
}

export function AdminRoleGate({
  children,
  requiredRole,
  requiredPermission,
  fallback = null
}: AdminRoleGateProps) {
  const { user } = useAdminAuth();
  const { hasPermission } = useAdminPermissions();

  if (!user) {
    return <>{fallback}</>;
  }

  // Check role requirements
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const hasRequiredRole = roles.includes(user.role);
    
    if (!hasRequiredRole) {
      return <>{fallback}</>;
    }
  }

  // Check permission requirements
  if (requiredPermission) {
    const permissions = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];
    const hasRequiredPermissions = permissions.every(permission => hasPermission(permission));
    
    if (!hasRequiredPermissions) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}