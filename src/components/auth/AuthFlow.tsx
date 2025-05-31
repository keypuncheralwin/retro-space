'use client';

import { useState, useEffect, FormEvent } from 'react';
import { signInWithCustomToken, updateProfile, User } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/client';
import { setSessionCookie } from '@/lib/firebase/sessionCookie';


type AuthStep = 'enterEmail' | 'enterCode' | 'enterName' | 'authenticated';

export default function AuthFlow() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [currentStep, setCurrentStep] = useState<AuthStep>('enterEmail');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [timer, setTimer] = useState(0);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Create a ref to track if we're in the verification process
  const [inVerificationFlow, setInVerificationFlow] = useState(false);

  useEffect(() => {
    // This effect only runs once at component mount - it sets up the auth state listener
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      console.log('🔄 Auth state changed, user:', currentUser?.uid, 'currentStep:', currentStep, 'inVerificationFlow:', inVerificationFlow);
      setUser(currentUser);
      
      // CRITICAL: Don't override authentication flow steps
      // If we're verifying a code, entering a name, or explicitly marked as in verification flow, don't change steps
      if (currentStep === 'enterCode' || currentStep === 'enterName' || inVerificationFlow) {
        console.log('⚠️ In active auth flow, not changing step automatically');
        return;
      }
      
      if (currentUser) {
        // User is signed in
        if (!currentUser.displayName) {
          console.log('🔍 User has no display name, checking Firestore');
          // Check if they have a name in Firestore
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists() && userDocSnap.data().displayName) {
            // Has name in Firestore, update Auth profile
            console.log('✅ Found name in Firestore, updating Auth profile');
            await updateProfile(currentUser, { displayName: userDocSnap.data().displayName });
            setCurrentStep('authenticated');
          } else {
            // No name anywhere, direct to name input
            console.log('✅ No display name found, directing to name input');
            setCurrentStep('enterName');
            setMessage('Please set your display name to complete your profile.');
          }
        } else {
          // Has a display name, they're authenticated
          console.log('✅ User has display name, setting authenticated');
          setCurrentStep('authenticated');
        }
      } else {
        // No user, reset to email input
        console.log('ℹ️ No user, resetting to email input');
        setCurrentStep('enterEmail');
        setEmail('');
        setCode('');
        setDisplayName('');
      }
    });
    
    return () => unsubscribe();
  }, [currentStep, inVerificationFlow]);  // Now depends on currentStep and inVerificationFlow

  const handleSendCode = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to send code.');
      } else {
        setMessage(`We've sent a verification code to ${email}.`);
        setCurrentStep('enterCode');
        setTimer(30); // Start 30-second timer
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    }
    setIsLoading(false);
  };

  const handleVerifyCode = async (e?: FormEvent) => {
    e?.preventDefault();
    console.log('🔍 handleVerifyCode called, code length:', code?.length);
    
    if (!code) {
      setError('Please enter the verification code.');
      return;
    }
    
    // Set the verification flow flag to prevent auth state listener from interfering
    setInVerificationFlow(true);
    setIsLoading(true);
    setError(null);
    setMessage(null);
    
    try {
      console.log('🔍 Sending code verification request to API for email:', email);
      // 1. Verify the code with our API
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      
      const data = await response.json();
      console.log('🔍 API response:', JSON.stringify(data, null, 2));
      
      if (!response.ok) {
        console.error('❌ API error:', data.error);
        setError(data.error || 'Failed to verify code.');
        setIsLoading(false);
        setInVerificationFlow(false);
        return;
      }
      
      // 2. Sign in with the custom token
      console.log('🔍 Signing in with custom token...');
      const userCredential = await signInWithCustomToken(auth, data.customToken);
      const currentUser = userCredential.user;
      console.log('🔍 Signed in user:', {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName,
        isNewUser: data.isNewUser
      });
      
      // Set session cookie for middleware-based auth - this prevents the auth flash
      console.log('🔍 Setting session cookie for middleware auth...');
      await setSessionCookie(currentUser);
      
      setUser(currentUser);
      
      // 3. Check if this is a new user from the API response
      console.log('🔍 Checking if new user. API isNewUser flag:', data.isNewUser, 'type:', typeof data.isNewUser);
      if (data.isNewUser === true) {
        console.log('✅ New user confirmed from API, directing to name input');
        setCurrentStep('enterName');
        setMessage('Welcome! Please set your display name to complete your profile.');
        setIsLoading(false);
        // Keep inVerificationFlow true until name is set
        return;
      }
      
      // 4. If not marked as new but has no display name, still ask for a name
      console.log('🔍 Checking for display name. Current value:', currentUser.displayName);
      if (!currentUser.displayName) {
        console.log('🔍 No display name in Firebase Auth, checking Firestore...');
        // Check Firestore as a backup
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        console.log('🔍 Firestore user doc exists:', userDocSnap.exists(), 
                    'displayName:', userDocSnap.exists() ? userDocSnap.data().displayName : 'N/A');
        
        if (!userDocSnap.exists() || !userDocSnap.data().displayName) {
          console.log('✅ No display name in Firestore either, directing to name input');
          setCurrentStep('enterName');
          setMessage('Please set your display name to complete your profile.');
          setIsLoading(false);
          // Keep inVerificationFlow true until name is set
          return;
        }
        
        // User has a name in Firestore but not in Auth, update Auth
        if (userDocSnap.data().displayName) {
          console.log('🔍 Found name in Firestore, updating Auth profile');
          await updateProfile(currentUser, { 
            displayName: userDocSnap.data().displayName 
          });
          console.log('✅ Updated Auth profile with display name from Firestore');
        }
      }
      
      // 5. User has a display name or we've set one, show success and redirect
      console.log('✅ User fully authenticated with display name:', currentUser.displayName);
      
      // Instead of changing step, we'll keep showing the verification UI
      // but with a success message and loading state
      setMessage('Login successful! Redirecting to dashboard...');
      setIsLoading(true); // Keep loading state active during redirect
      
      // 6. Delay redirect slightly to show success message
      console.log('🔙 Redirecting authenticated user to dashboard in 1 second');
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000); // 1 second delay for visual feedback
      
    } catch (err: any) {
      console.error('❌ Verification error:', err);
      setError(err.message || 'An unexpected error occurred during verification.');
      setInVerificationFlow(false);
    }
    
    setIsLoading(false);
    console.log('🔍 handleVerifyCode completed, currentStep:', currentStep);
  };

  const handleSetName = async (e?: FormEvent) => {
    e?.preventDefault();
    console.log('🔍 handleSetName called, displayName:', displayName);
    
    if (!displayName || displayName.trim() === '') {
      console.log('❌ No display name provided');
      setError('Please enter your name.');
      return;
    }
    
    // We're still in the verification flow until name is set
    // Make sure inVerificationFlow is true to prevent auth listener from interfering
    setInVerificationFlow(true);
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      const currentUser = auth.currentUser;
      console.log('🔍 Current auth user:', currentUser?.uid);
      
      if (!currentUser) {
        console.error('❌ No authenticated user found when setting name');
        setError('You must be logged in to set your display name.');
        setIsLoading(false);
        setInVerificationFlow(false);
        return;
      }
      
      // 1. Update Firebase Auth profile
      console.log('🔍 Updating Firebase Auth profile with name:', displayName.trim());
      await updateProfile(currentUser, { displayName: displayName.trim() });
      console.log('✅ Firebase Auth profile updated successfully');
      
      // 2. Store in Firestore
      console.log('🔍 Storing display name in Firestore...');
      const userRef = doc(db, 'users', currentUser.uid);
      await setDoc(userRef, { 
        displayName: displayName.trim(),
        email: currentUser.email,
        updatedAt: new Date()
      }, { merge: true });
      console.log('✅ Firestore user document updated successfully');
      
      // 3. Set session cookie for middleware
      console.log('🔍 Setting session cookie after profile completion...');
      await setSessionCookie(currentUser);
      console.log('✅ Session cookie set successfully');
      
      // 4. Refresh the user to ensure we have the latest profile
      console.log('🔍 Reloading user to get fresh profile data...');
      await currentUser.reload();
      setUser(auth.currentUser); // Update our local state with refreshed user
      
      // 5. Instead of showing the authenticated screen, redirect to dashboard
      console.log('🔍 Profile complete, redirecting to dashboard');
      
      // Allow auth state changes again before redirecting
      setInVerificationFlow(false);
      
      // Use window.location to force a complete page reload and navigation
      window.location.href = '/dashboard';
      
    } catch (err: any) {
      console.error('❌ Error setting display name:', err);
      setError(err.message || 'Failed to update profile.');
      setInVerificationFlow(false);
    }
    
    setIsLoading(false);
    console.log('🔍 handleSetName completed, redirecting to dashboard');
  };

  const handleSignOut = async () => {
    try {
      // Clear session cookie first
      await fetch('/api/auth/session', {
        method: 'DELETE',
      });
      console.log('🗑️ Session cookie cleared');
      
      // Then sign out from Firebase
      await auth.signOut();
      console.log('🚪 Signed out from Firebase');
      
      // Redirect to landing page
      console.log('🔙 Redirecting to landing page after logout');
      window.location.href = '/';
      
      // State will be reset by onAuthStateChanged effect
    } catch (error) {
      console.error('❌ Error during sign out:', error);
    }
  };

  const handleEditEmail = () => {
    setCurrentStep('enterEmail');
    setCode('');
    setError(null);
    setMessage(null);
    setTimer(0);
  }

  if (currentStep === 'authenticated' && user) {
    return (
      <div>
        {error && (
          <div className="mb-6 p-3 bg-red-900/20 border border-red-500/30 text-red-300 rounded-md text-sm">
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
        {currentStep !== 'enterEmail' && 
          <div className="mb-4 text-center">
            <h1 className="text-3xl font-bold">Check Your Email</h1>
            <p className="text-muted-foreground mt-2">
              We've sent an email with your code to <span className="font-semibold text-primary">{email}</span>.
            </p>
          </div>
        }

        {error && <p className="text-sm text-red-500 bg-red-500/10 p-3 rounded-md text-center">{error}</p>}
        {message && currentStep !== 'enterName' && <p className="text-sm text-green-500 bg-green-500/10 p-3 rounded-md text-center">{message}</p>}

        {currentStep === 'enterEmail' && (
          <form onSubmit={handleSendCode} className="space-y-4">
            <h1 className="text-2xl font-bold text-center">Sign In / Sign Up</h1>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-blue-200 mb-1">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="appearance-none block w-full px-4 py-3 border border-blue-800/50 rounded-md shadow-sm shadow-blue-900/20 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-slate-900/70 text-blue-100 transition duration-200"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-md shadow-blue-800/20 text-sm font-medium text-white bg-gradient-to-r from-blue-800 to-indigo-900 hover:from-blue-900 hover:to-indigo-950 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-800 disabled:opacity-50 transition-all duration-300 transform hover:scale-[1.02]"
            >
              {isLoading ? 'Sending...' : 'Continue with Email'}
            </button>
          </form>
        )}

        {currentStep === 'enterCode' && (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                 <label htmlFor="code" className="block text-sm font-medium text-blue-200">
                    Enter the code
                 </label>
                 <button 
                    type="button" 
                    onClick={handleEditEmail} 
                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Edit Email
                  </button>
              </div>
              <input
                id="code"
                name="code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{4}"
                maxLength={4}
                autoComplete="one-time-code"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                placeholder="_ _ _ _"
                className="appearance-none block w-full px-4 py-3 border border-blue-800/50 rounded-md shadow-sm shadow-blue-900/20 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-center tracking-[1em] bg-slate-900/70 text-blue-100 transition duration-200"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-md shadow-blue-800/20 text-sm font-medium text-white bg-gradient-to-r from-blue-800 to-indigo-900 hover:from-blue-900 hover:to-indigo-950 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-800 disabled:opacity-50 transition-all duration-300 transform hover:scale-[1.02]"
            >
              {isLoading ? 'Verifying...' : 'Continue'}
            </button>
            <div className="text-center text-sm mt-4">
              {timer > 0 ? (
                <p className="text-slate-400">Didn't receive an email? Resend in {timer}s</p>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSendCode()} // Re-use handleSendCode for resend
                  disabled={isLoading}
                  className="font-medium text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
                >
                  Didn't receive an email? Resend
                </button>
              )}
            </div>
          </form>
        )}

        {currentStep === 'enterName' && (
          <form onSubmit={handleSetName} className="space-y-4">
            <h2 className="text-xl font-semibold text-center text-white">Welcome aboard!</h2>
            <p className="text-center text-blue-200 mb-2">Please enter your name to complete your profile.</p>
            {message && <p className="text-sm text-emerald-400 mb-4 text-center">{message}</p>}
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-blue-200 mb-1">
                Display Name
              </label>
              <input
                id="displayName"
                name="displayName"
                type="text"
                autoComplete="name"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your Name"
                className="appearance-none block w-full px-4 py-3 border border-blue-800/50 rounded-md shadow-sm shadow-blue-900/20 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-slate-900/70 text-blue-100 transition duration-200"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-md shadow-blue-800/20 text-sm font-medium text-white bg-gradient-to-r from-blue-800 to-indigo-900 hover:from-blue-900 hover:to-indigo-950 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-800 disabled:opacity-50 transition-all duration-300 transform hover:scale-[1.02]"
            >
              {isLoading ? 'Saving...' : 'Save and Continue'}
            </button>
          </form>
        )}
    </div>
  );
}
