'use client';

import { useEffect } from 'react';
import { setupAuthListener } from '@/lib/session';

/**
 * Sets up the auth state listener that syncs session cookies
 * This component should be included once in your app layout
 */
export default function AuthListener() {
  useEffect(() => {
    const unsubscribe = setupAuthListener();
    return unsubscribe;
  }, []);

  return null;
}
