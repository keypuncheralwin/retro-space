import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Get Firebase Auth session cookie if it exists
  const session = request.cookies.get('session')?.value;
  
  // Check if user is logged in based on cookie
  const isLoggedIn = !!session;
  
  // Define public paths that don't require authentication
  const isPublicPath = [
    '/',
    '/about',
    '/features'
  ].some(path => request.nextUrl.pathname === path);
  
  // The auth page is special - only non-authenticated users should access it
  const isAuthPage = request.nextUrl.pathname === '/auth';
  
  // Redirect authenticated users away from auth page
  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // Redirect unauthenticated users to auth page if they try to access protected routes
  if (!isLoggedIn && !isPublicPath && !isAuthPage) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }
  
  // Allow the request to proceed normally
  return NextResponse.next();
}

// Configure paths that should trigger middleware
export const config = {
  matcher: [
    // Paths which will use this middleware
    '/((?!api|_next/static|_next/image|favicon.ico|images|fonts).*)',
  ],
};
