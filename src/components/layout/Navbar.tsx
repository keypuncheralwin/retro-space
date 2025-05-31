'use client';

import Link from 'next/link';
import { Rocket, LogOut, User, ChevronDown } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { auth } from '@/lib/firebase/client';
import { useRouter } from 'next/navigation';

type NavbarProps = {
  transparent?: boolean;
};

export function Navbar({ transparent = false }: NavbarProps) {
  const [user, setUser] = useState(auth.currentUser);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  // Monitor auth state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Generate avatar text (initials) from display name
  const generateAvatarText = () => {
    if (!user?.displayName) return '?';
    
    const names = user.displayName.split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    } else {
      return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
    }
  };

  // Generate random color based on user ID (will be consistent for the same user)
  const generateAvatarColor = () => {
    if (!user?.uid) return 'bg-blue-700';
    
    const colors = [
      'bg-blue-600', 'bg-indigo-600', 'bg-purple-600', 
      'bg-pink-600', 'bg-red-600', 'bg-orange-600',
      'bg-amber-600', 'bg-yellow-600', 'bg-lime-600',
      'bg-green-600', 'bg-emerald-600', 'bg-teal-600',
      'bg-cyan-600', 'bg-sky-600', 'bg-violet-600',
    ];
    
    // Simple hash function to get a consistent color
    const hash = user.uid.split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);
    
    return colors[hash % colors.length];
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 ${transparent ? 'bg-transparent' : 'bg-[#0a051a]/90 backdrop-blur-sm border-b border-blue-800/20'}`}>
      <div className="container mx-auto flex items-center justify-between p-4">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-white">
          <Rocket className="h-6 w-6 text-blue-400" />
          <span>Retro Space</span>
        </Link>

        <div className="flex items-center space-x-3">
          {!user && (
            <>
              <Link
                href="/auth"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-800 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 bg-gradient-to-r from-blue-800 to-indigo-900 hover:from-blue-900 hover:to-indigo-950 text-white h-10 px-4 py-2 shadow-lg shadow-blue-800/20"
              >
                Sign In
              </Link>
            </>
          )}
          
          {user && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 focus:outline-none"
              >
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${generateAvatarColor()} text-white font-semibold shadow-md`}>
                  {generateAvatarText()}
                </div>
                <ChevronDown className="h-4 w-4 text-blue-300" />
              </button>
              
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-60 rounded-md shadow-lg bg-slate-800/90 backdrop-blur-sm border border-blue-800/30 z-50">
                  <div className="p-3 border-b border-blue-900/30">
                    <p className="font-medium text-white">{user.displayName}</p>
                    <p className="text-sm text-blue-300 truncate">{user.email}</p>
                  </div>
                  <div className="p-2">
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2 px-3 py-2 text-sm text-blue-200 hover:bg-blue-900/20 rounded-md transition-colors w-full text-left"
                    >
                      <User className="h-4 w-4" />
                      Dashboard
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-red-300 hover:bg-red-900/20 rounded-md transition-colors w-full text-left mt-1"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
