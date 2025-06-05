import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authCookie = request.cookies.get('auth');
  const isAuthenticated = authCookie?.value === 'true';

  // Public routes that don't require authentication
  const publicRoutes = ['/signin', '/api/send-code', '/api/verify-code'];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // If user is authenticated and trying to access signin, redirect to home
  if (isAuthenticated && pathname === '/signin') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If user is not authenticated and trying to access protected route, redirect to signin
  if (!isAuthenticated && !isPublicRoute && pathname !== '/') {
    return NextResponse.redirect(new URL('/signin', request.url));
  }

  // If user is not authenticated and accessing root, redirect to signin
  if (!isAuthenticated && pathname === '/') {
    return NextResponse.redirect(new URL('/signin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
