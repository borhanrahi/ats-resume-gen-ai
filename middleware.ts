import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define protected routes that require authentication
const protectedRoutes = ['/dashboard', '/editor'];

// Define premium routes that require premium subscription
const premiumRoutes = ['/dashboard', '/editor'];

// Define admin routes that require admin access
const adminRoutes = ['/admin'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  const isPremiumRoute = premiumRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  const isAdminRoute = adminRoutes.some(route => 
    pathname.startsWith(route)
  );

  // For protected routes, we'll let the client-side AuthGuard handle the authentication
  // This middleware is mainly for SEO and preventing unnecessary server-side rendering
  // of protected content for unauthenticated users
  
  if (isProtectedRoute || isPremiumRoute || isAdminRoute) {
    // Add headers to indicate this is a protected route
    const response = NextResponse.next();
    
    if (isProtectedRoute) {
      response.headers.set('x-requires-auth', 'true');
    }
    
    if (isPremiumRoute) {
      response.headers.set('x-requires-premium', 'true');
    }
    
    if (isAdminRoute) {
      response.headers.set('x-requires-admin', 'true');
    }
    
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};