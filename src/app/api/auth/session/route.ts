import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase/admin';

// Session duration in seconds (14 days)
const SESSION_DURATION = 60 * 60 * 24 * 14;

/**
 * POST handler to create a session cookie
 */
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    
    if (!token) {
      return NextResponse.json(
        { error: 'Missing Firebase ID token' },
        { status: 400 }
      );
    }

    // Create a session cookie using the Firebase Admin SDK
    const sessionCookie = await adminAuth.createSessionCookie(token, {
      expiresIn: SESSION_DURATION * 1000, // milliseconds
    });

    // Set the cookie in the response
    // Use response cookies instead of direct cookie API
    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: 'session',
      value: sessionCookie,
      maxAge: SESSION_DURATION,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'strict',
    });

    return response;
  } catch (error) {
    console.error('Failed to create session cookie:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 401 }
    );
  }
}

/**
 * DELETE handler to clear the session cookie
 */
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('session');
  return response;
}
