'use client';

import { createContext, useContext, useEffect, useState, ReactNode, Suspense } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { auth } from '@/lib/firebase/client';
import { AnimatePresence, motion } from 'framer-motion';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import styles from '@/styles/LoadingAnimation.module.css';

type NavigationContextType = {
  isLoading: boolean;
  isAuthenticated: boolean;
  hasCompletedProfile: boolean; // Add this to track profile completion status
  redirectToLogin: () => void;
  redirectToDashboard: () => void;
};

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

const publicPaths = ['/auth', '/', '/about', '/features'];

// Loading animation component that matches the site theme
function RetroSpaceLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-r from-slate-900 to-indigo-950">
      <div className={styles.loader}></div>
    </div>
  );
}

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Track whether the user has completed their profile (has a display name)
  const [hasCompletedProfile, setHasCompletedProfile] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setIsAuthenticated(!!user);
      
      // Check if the user has a display name
      if (user) {
        console.log('🔑 NavigationProvider: Auth state changed, checking profile completion');
        if (user.displayName) {
          console.log('✅ NavigationProvider: User has display name in Auth profile:', user.displayName);
          setHasCompletedProfile(true);
        } else {
          // Check Firestore as a backup
          console.log('🔍 NavigationProvider: No display name in Auth, checking Firestore...');
          try {
            const userDocRef = doc(db, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);
            
            const hasNameInFirestore = userDocSnap.exists() && userDocSnap.data().displayName;
            console.log('🔍 NavigationProvider: User has name in Firestore:', hasNameInFirestore);
            setHasCompletedProfile(hasNameInFirestore);
          } catch (err) {
            console.error('❌ NavigationProvider: Error checking user profile:', err);
            setHasCompletedProfile(false);
          }
        }
      } else {
        setHasCompletedProfile(false);
      }
      
      setIsLoading(false);
      setIsInitialized(true);
    });

    return () => unsubscribe();
  }, []);

  // We're keeping critical redirects while letting middleware handle initial route protection
  // This gives us the best of both worlds - no flash AND proper redirects after auth state changes
  useEffect(() => {
    if (!isInitialized) return;

    console.log('🧭 NavigationProvider: Navigation check -', 
      'authenticated:', isAuthenticated, 
      'hasCompletedProfile:', hasCompletedProfile, 
      'path:', pathname);
    
    // Only handle redirects after state changes, not initial page load redirects
    // This prevents the flash while maintaining necessary redirects
    if (isAuthenticated && hasCompletedProfile && pathname === '/auth') {
      // After successful login, redirect to dashboard
      console.log('✅ NavigationProvider: User authenticated with complete profile, redirecting to dashboard');
      router.push('/dashboard');
    } else if (!isAuthenticated && pathname.startsWith('/dashboard')) {
      // After logout, redirect to home page
      console.log('⚠️ NavigationProvider: User logged out, redirecting to landing page');
      router.push('/');
    }
  }, [isAuthenticated, hasCompletedProfile, pathname, isInitialized, router]);

  const redirectToLogin = () => {
    router.push('/auth');
  };

  const redirectToDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <NavigationContext.Provider
      value={{
        isLoading,
        isAuthenticated,
        hasCompletedProfile,
        redirectToLogin,
        redirectToDashboard,
      }}
    >
      <AnimatePresence mode="wait">
        {isLoading ? (
          <RetroSpaceLoader key="loader" />
        ) : (
          <Suspense key="content" fallback={<RetroSpaceLoader />}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </Suspense>
        )}
      </AnimatePresence>
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}
