'use client';

import { useState, useEffect } from 'react';
import { 
  User as FirebaseUser, 
  signInWithCustomToken, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { clearSessionCookie } from '@/lib/session';

/**
 * Hook that wraps Firebase Auth state
 */
export function useAuth() {
  const [user, setUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [loading, setLoading] = useState(!auth.currentUser);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithToken = async (customToken: string): Promise<void> => {
    await signInWithCustomToken(auth, customToken);
  };

  const logout = async (): Promise<void> => {
    await signOut(auth);
    await clearSessionCookie();
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    
    displayName: user?.displayName || null,
    email: user?.email || null,
    uid: user?.uid || null,
    emailVerified: user?.emailVerified || false,
    
    signInWithToken,
    logout,
  };
}

/**
 * Hook for components that require authentication
 */
export function useRequireAuth() {
  const { user, loading } = useAuth();
  
  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/signin';
    }
  }, [user, loading]);

  return { user, loading };
}