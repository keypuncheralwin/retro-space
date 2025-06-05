'use client';

import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';

export default function Home() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/signin');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <h1 className="text-xl font-semibold text-gray-900">Welcome Back!</h1>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                Sign Out
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Account Information</h2>

            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-500">Email:</span>
                <p className="text-gray-900">{user?.email}</p>
              </div>

              {user?.displayName && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Name:</span>
                  <p className="text-gray-900">{user.displayName}</p>
                </div>
              )}

              <div>
                <span className="text-sm font-medium text-gray-500">User ID:</span>
                <p className="text-gray-900 font-mono text-sm">{user?.uid}</p>
              </div>

              <div>
                <span className="text-sm font-medium text-gray-500">Email Verified:</span>
                <p className="text-gray-900">
                  {user?.emailVerified ? (
                    <span className="text-green-600">✓ Verified</span>
                  ) : (
                    <span className="text-red-600">✗ Not verified</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-blue-900 mb-2">
              🎉 Authentication Successful!
            </h3>
            <p className="text-blue-700">
              You have successfully signed in using the passwordless email authentication flow. Your
              session is now active and protected by Firebase Auth.
            </p>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
