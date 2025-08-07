import { NextRequest, NextResponse } from 'next/server';
import { adminAuthService } from './adminAuth';
import { AdminUser, AdminPermission } from '../../types/admin';

// Admin authorization result
export interface AdminAuthResult {
  isAuthorized: boolean;
  user: AdminUser | null;
  error?: string;
  statusCode?: number;
}

// Admin middleware options
export interface AdminMiddlewareOptions {
  requiredRole?: AdminUser['role'] | AdminUser['role'][];
  requiredPermission?: AdminPermission | AdminPermission[];
  allowSelfAccess?: boolean; // Allow access to own resources
  logAction?: string; // Action to log for audit trail
}

// Admin authorization middleware
export class AdminMiddleware {
  // Verify admin authentication and authorization
  static async verifyAdmin(
    request: NextRequest,
    options: AdminMiddlewareOptions = {}
  ): Promise<AdminAuthResult> {
    try {
      // Extract session token from headers or cookies
      const sessionToken = AdminMiddleware.extractSessionToken(request);
      
      if (!sessionToken) {
        return {
          isAuthorized: false,
          user: null,
          error: 'No session token provided',
          statusCode: 401
        };
      }

      // Validate admin session
      const adminUser = await adminAuthService.validateAdminSession();
      
      if (!adminUser) {
        return {
          isAuthorized: false,
          user: null,
          error: 'Invalid or expired session',
          statusCode: 401
        };
      }

      // Check role requirements
      if (options.requiredRole) {
        const hasRequiredRole = AdminMiddleware.checkRole(adminUser, options.requiredRole);
        if (!hasRequiredRole) {
          await adminAuthService.logAdminAction(
            adminUser.id,
            'unauthorized_access_attempt',
            {
              requiredRole: options.requiredRole,
              userRole: adminUser.role,
              path: request.nextUrl.pathname
            }
          );
          
          return {
            isAuthorized: false,
            user: adminUser,
            error: `Insufficient role. Required: ${Array.isArray(options.requiredRole) ? options.requiredRole.join(' or ') : options.requiredRole}`,
            statusCode: 403
          };
        }
      }

      // Check permission requirements
      if (options.requiredPermission) {
        const hasRequiredPermission = AdminMiddleware.checkPermission(adminUser, options.requiredPermission);
        if (!hasRequiredPermission) {
          await adminAuthService.logAdminAction(
            adminUser.id,
            'unauthorized_access_attempt',
            {
              requiredPermission: options.requiredPermission,
              userPermissions: adminUser.permissions,
              path: request.nextUrl.pathname
            }
          );
          
          return {
            isAuthorized: false,
            user: adminUser,
            error: `Insufficient permissions. Required: ${Array.isArray(options.requiredPermission) ? options.requiredPermission.join(', ') : options.requiredPermission}`,
            statusCode: 403
          };
        }
      }

      // Check self-access for resource-specific operations
      if (options.allowSelfAccess) {
        const resourceUserId = AdminMiddleware.extractResourceUserId(request);
        if (resourceUserId && resourceUserId !== adminUser.id && adminUser.role !== 'super_admin') {
          return {
            isAuthorized: false,
            user: adminUser,
            error: 'Access denied. Can only access own resources.',
            statusCode: 403
          };
        }
      }

      // Log successful access if action is specified
      if (options.logAction) {
        await adminAuthService.logAdminAction(
          adminUser.id,
          options.logAction,
          {
            path: request.nextUrl.pathname,
            method: request.method,
            userAgent: request.headers.get('user-agent'),
            ip: AdminMiddleware.getClientIP(request)
          }
        );
      }

      return {
        isAuthorized: true,
        user: adminUser
      };
    } catch (error: any) {
      console.error('Admin middleware error:', error);
      return {
        isAuthorized: false,
        user: null,
        error: 'Internal authentication error',
        statusCode: 500
      };
    }
  }

  // Extract session token from request
  private static extractSessionToken(request: NextRequest): string | null {
    // Try Authorization header first
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Try cookie
    const sessionCookie = request.cookies.get('admin_session');
    if (sessionCookie) {
      return sessionCookie.value;
    }

    // Try custom header
    const sessionHeader = request.headers.get('x-admin-session');
    if (sessionHeader) {
      return sessionHeader;
    }

    return null;
  }

  // Extract resource user ID from request (for self-access checks)
  private static extractResourceUserId(request: NextRequest): string | null {
    // Try URL parameters
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId') || url.searchParams.get('id');
    if (userId) return userId;

    // Try path segments
    const pathSegments = url.pathname.split('/');
    const userIndex = pathSegments.findIndex(segment => segment === 'users');
    if (userIndex !== -1 && pathSegments[userIndex + 1]) {
      return pathSegments[userIndex + 1];
    }

    return null;
  }

  // Get client IP address
  private static getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    if (realIP) {
      return realIP;
    }
    
    return 'unknown';
  }

  // Check if user has required role
  private static checkRole(user: AdminUser, requiredRole: AdminUser['role'] | AdminUser['role'][]): boolean {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    return roles.includes(user.role);
  }

  // Check if user has required permission
  private static checkPermission(user: AdminUser, requiredPermission: AdminPermission | AdminPermission[]): boolean {
    const permissions = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];
    return permissions.every(permission => adminAuthService.hasPermission(user, permission));
  }

  // Create error response
  static createErrorResponse(result: AdminAuthResult): NextResponse {
    return NextResponse.json(
      {
        error: result.error || 'Unauthorized',
        code: result.statusCode || 401,
        timestamp: new Date().toISOString()
      },
      { status: result.statusCode || 401 }
    );
  }
}

// Higher-order function for protecting API routes
export function withAdminAuth(
  handler: (request: NextRequest, context: { user: AdminUser }) => Promise<NextResponse>,
  options: AdminMiddlewareOptions = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authResult = await AdminMiddleware.verifyAdmin(request, options);
    
    if (!authResult.isAuthorized || !authResult.user) {
      return AdminMiddleware.createErrorResponse(authResult);
    }

    try {
      return await handler(request, { user: authResult.user });
    } catch (error: any) {
      console.error('Admin API handler error:', error);
      
      // Log the error
      await adminAuthService.logAdminAction(
        authResult.user.id,
        'api_error',
        {
          path: request.nextUrl.pathname,
          method: request.method,
          error: error.message,
          stack: error.stack
        }
      );
      
      return NextResponse.json(
        {
          error: 'Internal server error',
          code: 500,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  };
}

// Middleware for different admin roles
export const withSuperAdminAuth = (
  handler: (request: NextRequest, context: { user: AdminUser }) => Promise<NextResponse>
) => withAdminAuth(handler, { requiredRole: 'super_admin', logAction: 'super_admin_api_access' });

export const withAdminRoleAuth = (
  handler: (request: NextRequest, context: { user: AdminUser }) => Promise<NextResponse>
) => withAdminAuth(handler, { requiredRole: ['super_admin', 'admin'], logAction: 'admin_api_access' });

export const withModeratorAuth = (
  handler: (request: NextRequest, context: { user: AdminUser }) => Promise<NextResponse>
) => withAdminAuth(handler, { requiredRole: ['super_admin', 'admin', 'moderator'], logAction: 'moderator_api_access' });

// Middleware for specific permissions
export const withUserManagementAuth = (
  handler: (request: NextRequest, context: { user: AdminUser }) => Promise<NextResponse>
) => withAdminAuth(handler, { requiredPermission: 'user_management', logAction: 'user_management_access' });

export const withPaymentManagementAuth = (
  handler: (request: NextRequest, context: { user: AdminUser }) => Promise<NextResponse>
) => withAdminAuth(handler, { requiredPermission: 'payment_management', logAction: 'payment_management_access' });

export const withAIModelConfigAuth = (
  handler: (request: NextRequest, context: { user: AdminUser }) => Promise<NextResponse>
) => withAdminAuth(handler, { requiredPermission: 'ai_model_config', logAction: 'ai_model_config_access' });

export const withSystemAnalyticsAuth = (
  handler: (request: NextRequest, context: { user: AdminUser }) => Promise<NextResponse>
) => withAdminAuth(handler, { requiredPermission: 'system_analytics', logAction: 'system_analytics_access' });

export const withFeatureManagementAuth = (
  handler: (request: NextRequest, context: { user: AdminUser }) => Promise<NextResponse>
) => withAdminAuth(handler, { requiredPermission: 'feature_management', logAction: 'feature_management_access' });

// Rate limiting for admin APIs
export class AdminRateLimiter {
  private static requests: Map<string, { count: number; resetTime: number }> = new Map();
  private static readonly WINDOW_MS = 15 * 60 * 1000; // 15 minutes
  private static readonly MAX_REQUESTS = 100; // Max requests per window

  static checkRateLimit(adminId: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const key = `admin_${adminId}`;
    const record = AdminRateLimiter.requests.get(key);

    if (!record || now > record.resetTime) {
      // New window or expired window
      const resetTime = now + AdminRateLimiter.WINDOW_MS;
      AdminRateLimiter.requests.set(key, { count: 1, resetTime });
      return { allowed: true, remaining: AdminRateLimiter.MAX_REQUESTS - 1, resetTime };
    }

    if (record.count >= AdminRateLimiter.MAX_REQUESTS) {
      return { allowed: false, remaining: 0, resetTime: record.resetTime };
    }

    record.count++;
    return { 
      allowed: true, 
      remaining: AdminRateLimiter.MAX_REQUESTS - record.count, 
      resetTime: record.resetTime 
    };
  }
}

// Middleware with rate limiting
export function withAdminRateLimit(
  handler: (request: NextRequest, context: { user: AdminUser }) => Promise<NextResponse>,
  options: AdminMiddlewareOptions = {}
) {
  return withAdminAuth(async (request: NextRequest, context: { user: AdminUser }) => {
    // Check rate limit
    const rateLimit = AdminRateLimiter.checkRateLimit(context.user.id);
    
    if (!rateLimit.allowed) {
      await adminAuthService.logAdminAction(
        context.user.id,
        'rate_limit_exceeded',
        {
          path: request.nextUrl.pathname,
          method: request.method,
          resetTime: new Date(rateLimit.resetTime).toISOString()
        }
      );
      
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          code: 429,
          resetTime: rateLimit.resetTime,
          timestamp: new Date().toISOString()
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': AdminRateLimiter.MAX_REQUESTS.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.resetTime.toString()
          }
        }
      );
    }

    // Add rate limit headers to successful responses
    const response = await handler(request, context);
    response.headers.set('X-RateLimit-Limit', AdminRateLimiter.MAX_REQUESTS.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimit.resetTime.toString());
    
    return response;
  }, options);
}