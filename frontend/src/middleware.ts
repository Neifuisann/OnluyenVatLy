import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define route patterns
const publicRoutes = [
  '/',
  '/login',
  '/student/login',
  '/student/register',
  '/admin/login',
  '/admin', // Added for simplified demo
  '/admin/*', // Added for simplified demo
  '/gallery',
  '/api/auth/student/login',
  '/api/auth/admin/login',
  '/api/auth/student/register',
  '/api/csrf-token',
];

// Route definitions for future use
// const adminRoutes = [
//   '/admin',
//   '/admin/dashboard',
//   '/admin/students',
//   '/admin/lessons',
//   '/admin/settings',
//   '/admin/ai-tools',
//   '/admin/statistics',
// ];

// const studentRoutes = [
//   '/lessons',
//   '/lesson',
//   '/profile',
//   '/settings',
//   '/results',
//   '/quiz',
//   '/practice',
//   '/history',
//   '/leaderboard',
// ];

// Helper function to check if a path matches any pattern
function matchesPattern(path: string, patterns: string[]): boolean {
  return patterns.some(pattern => {
    if (pattern.endsWith('*')) {
      return path.startsWith(pattern.slice(0, -1));
    }
    return path === pattern || path.startsWith(pattern + '/');
  });
}

// Helper function to check authentication from cookies
function isAuthenticated(request: NextRequest): { isAuth: boolean; userType: 'student' | 'admin' | null } {
  const sessionCookie = request.cookies.get('connect.sid');
  
  // Basic check - if no session cookie, not authenticated
  if (!sessionCookie) {
    return { isAuth: false, userType: null };
  }

  // For now, we'll rely on the session cookie presence
  // In a more robust implementation, you might decode the session
  // or make a quick API call to verify the session
  
  // We can't easily determine user type from middleware without making API calls
  // So we'll let the client-side components handle the specific role checks
  return { isAuth: true, userType: null };
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files and API routes (except auth)
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.') ||
    (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/'))
  ) {
    return NextResponse.next();
  }

  const { isAuth } = isAuthenticated(request);

  // Allow access to public routes
  if (matchesPattern(pathname, publicRoutes)) {
    return NextResponse.next();
  }

  // Redirect unauthenticated users to login
  if (!isAuth) {
    const loginUrl = new URL('/student/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // For authenticated users, let client-side components handle role-specific redirects
  // This is because we can't easily determine user type in middleware without API calls
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
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
