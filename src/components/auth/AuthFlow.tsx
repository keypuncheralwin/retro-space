'use client';

import { useState, useEffect, FormEvent } from 'react';
import { signInWithCustomToken, updateProfile, User } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/client'; 


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

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // If user is authenticated and has a display name, move to authenticated step
        // Otherwise, if they just signed in and might need to set a name, this will be handled by verifyCode logic
        if(currentUser.displayName){
            setCurrentStep('authenticated');
        }
      } else {
        setCurrentStep('enterEmail');
        setEmail('');
        setCode('');
        setDisplayName('');
      }
    });
    return () => unsubscribe();
  }, []);

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
    if (!code) {
      setError('Please enter the verification code.');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to verify code.');
      } else {
        // Sign in with custom token
        const userCredential = await signInWithCustomToken(auth, data.customToken);
        setUser(userCredential.user);
        // firebaseUid state removed, userCredential.user.uid is available directly or via auth.currentUser.uid

        if (data.isNewUser || !userCredential.user.displayName) {
          // Check Firestore first for existing display name if Firebase Auth doesn't have it
          const userDocRef = doc(db, 'users', userCredential.user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists() && userDocSnap.data().displayName) {
            // Update Firebase Auth profile if Firestore has it but Auth doesn't
            await updateProfile(userCredential.user, { displayName: userDocSnap.data().displayName });
            setCurrentStep('authenticated');
          } else {
            setCurrentStep('enterName');
            setMessage('Welcome! Please set your display name.');
          }
        } else {
          setCurrentStep('authenticated');
        }
        setCode(''); // Clear code input
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    }
    setIsLoading(false);
  };

  const handleSetName = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!displayName.trim()) {
      setError('Please enter a display name.');
      return;
    }
    if (!auth.currentUser) {
      setError('Not authenticated. Please try logging in again.');
      setCurrentStep('enterEmail');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const currentUser = auth.currentUser;
      await updateProfile(currentUser, { displayName });

      // Store/update display name and email in Firestore
      const userDocRef = doc(db, 'users', currentUser.uid);
      await setDoc(userDocRef, { 
        email: currentUser.email,
        displayName: displayName.trim(),
        uid: currentUser.uid 
      }, { merge: true });

      setUser({ ...currentUser }); // Force re-render with updated user info
      setCurrentStep('authenticated');
      setMessage('Display name updated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to set display name.');
    }
    setIsLoading(false);
  };

  const handleSignOut = async () => {
    await auth.signOut();
    // State will be reset by onAuthStateChanged effect
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
      <div className="max-w-md mx-auto mt-10 p-6 bg-card text-card-foreground rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-center mb-4">Welcome, {user.displayName || email}!</h2>
        <p className="text-center mb-6">You are signed in.</p>
        {message && <p className="text-sm text-green-500 mb-4 text-center">{message}</p>}
        <button
          onClick={handleSignOut}
          className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-card text-card-foreground rounded-lg shadow-md">
        {currentStep !== 'enterEmail' && (
          <div className="text-center">
            <h1 className="text-3xl font-bold">Check Your Email</h1>
            <p className="text-muted-foreground mt-2">
              We've sent an email with your code to <span className="font-semibold text-primary">{email}</span>.
            </p>
          </div>
        )}

        {error && <p className="text-sm text-red-500 bg-red-500/10 p-3 rounded-md text-center">{error}</p>}
        {message && currentStep !== 'enterName' && <p className="text-sm text-green-500 bg-green-500/10 p-3 rounded-md text-center">{message}</p>}

        {currentStep === 'enterEmail' && (
          <form onSubmit={handleSendCode} className="space-y-6">
            <h1 className="text-3xl font-bold text-center">Sign In / Sign Up</h1>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
                Email address
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
                className="appearance-none block w-full px-3 py-2 border border-border rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-background text-foreground"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || timer > 0}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
            >
              {isLoading ? 'Sending...' : 'Send Code'}
            </button>
          </form>
        )}

        {currentStep === 'enterCode' && (
          <form onSubmit={handleVerifyCode} className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-1">
                 <label htmlFor="code" className="block text-sm font-medium text-foreground">
                    Enter the code*
                 </label>
                 <button type="button" onClick={handleEditEmail} className="text-sm text-primary hover:underline">Edit Email</button>
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
                className="appearance-none block w-full px-3 py-2 border border-border rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-center tracking-[1em] bg-background text-foreground"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
            >
              {isLoading ? 'Verifying...' : 'Continue'}
            </button>
            <div className="text-center text-sm">
              {timer > 0 ? (
                <p className="text-muted-foreground">Didn't receive an email? Resend in {timer}s</p>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSendCode()} // Re-use handleSendCode for resend
                  disabled={isLoading}
                  className="font-medium text-primary hover:text-primary/80 disabled:opacity-50"
                >
                  Didn't receive an email? Resend
                </button>
              )}
            </div>
          </form>
        )}

        {currentStep === 'enterName' && (
          <form onSubmit={handleSetName} className="space-y-6">
            <h2 className="text-2xl font-semibold text-center">Welcome!</h2>
            <p className="text-center text-muted-foreground">Please enter your name to complete your profile.</p>
            {message && <p className="text-sm text-green-500 mb-4 text-center">{message}</p>}
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-foreground mb-1">
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
                className="appearance-none block w-full px-3 py-2 border border-border rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-background text-foreground"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save and Continue'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
