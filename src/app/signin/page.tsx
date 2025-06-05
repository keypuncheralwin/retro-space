'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  ApiResponse,
  SendCodeRequest,
  VerifyCodeRequest,
  SignInState,
  VerifyCodeResponseData,
} from '@/types';

export default function SignIn() {
  const router = useRouter();
  const { signInWithToken } = useAuth();
  const [state, setState] = useState<SignInState>({
    step: 'email',
    email: '',
    isNewUser: false,
    timeLeft: 0,
  });
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (state.timeLeft > 0) {
      interval = setInterval(() => {
        setState((prev) => ({ ...prev, timeLeft: prev.timeLeft - 1 }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [state.timeLeft]);

  const handleSendCode = async (email: string) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email } as SendCodeRequest),
      });

      const data: ApiResponse = await response.json();

      if (data.success) {
        setState((prev) => ({
          ...prev,
          step: 'code',
          email,
          timeLeft: 40,
        }));
      } else {
        setError(data.error || 'Failed to send code');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (code.length !== 4) {
      setError('Please enter a 4-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: state.email,
          code,
          name: state.step === 'name' ? name : undefined,
        } as VerifyCodeRequest),
      });

      const data: ApiResponse<VerifyCodeResponseData> = await response.json();

      if (data.success && data.data) {
        // Check if name is required for new user
        if (data.data.nameRequired) {
          setState((prev) => ({ ...prev, step: 'name', isNewUser: true }));
          return;
        }

        // Sign in successful - we have the custom token
        if (data.data.customToken) {
          await signInWithToken(data.data.customToken);
          router.push('/');
        } else {
          setError('Authentication error: No token received');
        }
      } else {
        setError(data.error || 'Invalid code');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    handleSendCode(email);
  };

  const handleCodeSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleVerifyCode();
  };

  const handleNameSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    handleVerifyCode();
  };

  const formatTime = (seconds: number) => {
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <h1 className="text-2xl font-semibold text-center text-gray-900 mb-8">Sign In</h1>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {state.step === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your email"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Code'}
              </button>
            </form>
          )}

          {state.step === 'code' && (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">We sent a 4-digit code to</p>
                <p className="font-medium text-gray-900">{state.email}</p>
              </div>

              <form onSubmit={handleCodeSubmit} className="space-y-6">
                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                    Verification code
                  </label>
                  <input
                    id="code"
                    type="text"
                    maxLength={4}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0000"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || code.length !== 4}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Verifying...' : 'Verify Code'}
                </button>
              </form>

              <div className="text-center">
                {state.timeLeft > 0 ? (
                  <p className="text-sm text-gray-500">
                    Resend code in {formatTime(state.timeLeft)}
                  </p>
                ) : (
                  <button
                    onClick={() => handleSendCode(state.email)}
                    disabled={loading}
                    className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
                  >
                    Resend code
                  </button>
                )}
              </div>

              <button
                onClick={() => setState((prev) => ({ ...prev, step: 'email', timeLeft: 0 }))}
                className="w-full text-sm text-gray-500 hover:text-gray-700"
              >
                Use a different email
              </button>
            </div>
          )}

          {state.step === 'name' && (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Welcome! Please enter your name to complete setup.
                </p>
              </div>

              <form onSubmit={handleNameSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Your name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your name"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Completing...' : 'Complete Setup'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
