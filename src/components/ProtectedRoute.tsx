'use client';

import { useRequireAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function ProtectedRoute({
  children,
  fallback = (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-gray-600">Loading...</div>
    </div>
  ),
}: ProtectedRouteProps) {
  const { user, loading } = useRequireAuth();

  if (loading) {
    return <>{fallback}</>;
  }

  if (!user) {
    return null; // Will redirect to signin
  }

  return <>{children}</>;
}
