'use client';

import { useAuth } from '@/lib/auth/AuthContext';

export default function AuthStatusIndicator() {
  const { isLoading, isAuthenticated, user } = useAuth();

  if (isLoading) {
    return (
      <div className="bg-yellow-500 text-white text-center p-2 text-sm">
        Waiting for connection...
      </div>
    );
  }

  return null; // Don't render anything if not loading
}
