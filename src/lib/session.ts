'use client';

import { auth } from './firebase';
import { User } from 'firebase/auth';

/**
 * Sets a session cookie with Firebase ID token
 * This allows our middleware to access auth state
 */
export async function setSessionCookie(user: User): Promise<void> {
  if (!user) return;

  try {
    // Get the token from Firebase Auth
    const token = await user.getIdToken(true);

    // Call our API endpoint to set the cookie
    await fetch('/api/auth/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    console.log('📝 Session cookie set successfully');
  } catch (error) {
    console.error('Failed to set session cookie:', error);
  }
}

/**
 * Clears the session cookie
 */
export async function clearSessionCookie(): Promise<void> {
  try {
    await fetch('/api/auth/session', {
      method: 'DELETE',
    });

    console.log('🗑️ Session cookie cleared');
  } catch (error) {
    console.error('Failed to clear session cookie:', error);
  }
}

/**
 * Sets up an auth state listener that syncs the session cookie
 * Call this once in your app (e.g., in layout or main component)
 */
export function setupAuthListener(): () => void {
  return auth.onAuthStateChanged(async (user) => {
    if (user) {
      await setSessionCookie(user);
    } else {
      await clearSessionCookie();
    }
  });
}
