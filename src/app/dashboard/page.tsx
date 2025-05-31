'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/client';
import { useNavigation } from '@/components/providers/NavigationProvider';
import { PageTransition } from '@/components/ui/PageTransition';
import { Navbar } from '@/components/layout/Navbar';
// Import any additional components as needed

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useNavigation();

  // Handle unauthenticated state
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth');
    }
  }, [isLoading, isAuthenticated, router]);

  // Show loading state only when authenticated and still loading data
  // Don't show dashboard loading text when signing out (when isAuthenticated is false)
  if (isLoading && isAuthenticated) {
    return (
      <PageTransition>
        <div className="flex min-h-screen items-center justify-center bg-[#0E0525]">
          <div className="h-12 w-12 rounded-full border-t-2 border-b-2 border-blue-400 animate-spin"></div>
        </div>
      </PageTransition>
    );
  }
  
  // Don't render dashboard content when not authenticated
  if (!isAuthenticated) return null;

  // Dashboard will be built dynamically based on user data

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#0E0525] text-white relative pb-16">
        {/* Background elements */}
        <div className="absolute inset-0 bg-space-dots pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0c1e44]/30 to-[#0E0525] pointer-events-none"></div>
        
        <Navbar />
        
        <div className="pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {/* Dashboard header */}
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Your Mission Control</h1>
            <p className="text-blue-200 mt-2">Welcome back, {auth.currentUser?.displayName}.</p>
          </div>
          
          {/* Empty dashboard state */}
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-blue-200 mb-4">Your dashboard content will appear here.</p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
