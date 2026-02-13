// components/ProtectedRoute.tsx
"use client";

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/authContext';

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { checkAuthStatus } = useAuth();
  const router = useRouter();

  // Direct localStorage check that doesn't depend on state
  useEffect(() => {
    // Quick check authentication directly from localStorage
    if (typeof window !== 'undefined') {
      const isAuthenticatedFromStorage = checkAuthStatus();
      
      if (!isAuthenticatedFromStorage) {
        console.log('[ProtectedRoute] No auth data, redirecting to login');
        router.replace('/login');
      }
    }
  }, [router, checkAuthStatus]);

  // Render children immediately - auth provider handles the rest
  return <>{children}</>;
};

export default ProtectedRoute;