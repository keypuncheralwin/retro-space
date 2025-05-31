'use client';

import AuthFlow from '@/components/auth/AuthFlow';
import { PageTransition } from '@/components/ui/PageTransition';
import { useNavigation } from '@/components/providers/NavigationProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { Rocket } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';

export default function AuthPage() {
  // Get auth state AND hasCompletedProfile from navigation context
  const { isAuthenticated, isLoading, hasCompletedProfile } = useNavigation();
  const router = useRouter();
  
  // Only redirect authenticated users with completed profiles to dashboard
  useEffect(() => {
    console.log('🔍 AuthPage: Checking redirect logic -',
              'authenticated:', isAuthenticated,
              'profile complete:', hasCompletedProfile);
              
    // Only redirect if the user is authenticated AND has a complete profile
    if (!isLoading && isAuthenticated && hasCompletedProfile) {
      console.log('✅ AuthPage: Redirecting completed user to dashboard');
      router.push('/dashboard');
    } else if (!isLoading && isAuthenticated && !hasCompletedProfile) {
      console.log('⚠️ AuthPage: User needs to complete profile, staying on auth page');
      // Stay on auth page to let the user complete their profile
    }
  }, [isAuthenticated, hasCompletedProfile, isLoading, router]);

  if (isLoading) return null; // Let NavigationProvider handle loading state
  
  return (
    <PageTransition>
      <main className="flex flex-col h-screen bg-[#0E0525] text-white relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 bg-space-dots pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0c1e44]/30 to-[#0E0525] pointer-events-none"></div>
        
        {/* Header with navbar */}
        <Navbar transparent={true} />
        
        {/* Auth Container */}
        <div className="flex items-center justify-center flex-1 px-4 relative z-10">
          <div className="w-full max-w-md">
            <div className="bg-slate-800/80 backdrop-blur-sm p-6 rounded-lg border border-blue-800/30 shadow-lg shadow-blue-800/10">
              <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold text-white mb-2">Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Retro Space</span></h1>
                <p className="text-blue-200 text-sm">Sign in to continue your retrospective journey</p>
              </div>
              
              <AuthFlow />
            </div>
            
            <div className="mt-6 text-center">
              <Link 
                href="/" 
                className="text-blue-300 hover:text-blue-200 text-sm font-medium transition-colors duration-200"
              >
                ← Back to home
              </Link>
            </div>
          </div>
        </div>
        
        {/* Footer with subtle design elements */}
        <footer className="py-6 text-center relative z-10">
          <div className="flex justify-center space-x-2 opacity-70">
            <div className="w-2 h-2 rounded-full bg-blue-800/40"></div>
            <div className="w-2 h-2 rounded-full bg-blue-900/40"></div>
            <div className="w-2 h-2 rounded-full bg-blue-800/40"></div>
          </div>
        </footer>
      </main>
    </PageTransition>
  );
}
