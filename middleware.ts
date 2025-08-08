import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/invite',
  '/api/auth',
  '/api/public'
];

// Define auth routes that should redirect to dashboard if user is already authenticated
const authRoutes = [
  '/auth/login',
  '/auth/register'
];

// Define routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/onboarding',
  '/profile',
  '/settings'
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // For client-side Firebase auth, we can't reliably check authentication server-side
  // Instead, we'll allow the request to proceed and let the client-side auth handle redirects
  // This is a more reliable approach for Firebase client-side authentication
  
  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some(route => 
    pathname.startsWith(route) || pathname === route
  );
  
  // Check if the current path is an auth route
  const isAuthRoute = authRoutes.some(route => 
    pathname.startsWith(route) || pathname === route
  );
  
  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  // For client-side auth, we'll let the client handle authentication checks
  // The auth context will handle redirects appropriately
  
  // For client-side auth, we'll let the client handle authentication checks
  // The auth context will handle redirects appropriately
  
  // Allow all requests to proceed - client-side auth will handle redirects
  
  // Allow the request to continue
  return NextResponse.next();
}

// Configure which paths the middleware should run on
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