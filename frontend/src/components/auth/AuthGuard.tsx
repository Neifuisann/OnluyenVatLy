'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export interface AuthGuardProps {
  children: React.ReactNode;
  redirectIfAuthenticated?: string;
  allowedRoles?: ('student' | 'admin')[];
  redirectIfUnauthorized?: string;
}

/**
 * AuthGuard component for handling authentication-based redirects
 * Useful for login pages that should redirect authenticated users away
 */
export function AuthGuard({
  children,
  redirectIfAuthenticated,
  allowedRoles,
  redirectIfUnauthorized,
}: AuthGuardProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) {
      return; // Still checking auth status
    }

    // Redirect authenticated users away from login pages
    if (redirectIfAuthenticated && isAuthenticated && user) {
      // Determine redirect based on user type
      let redirectPath = redirectIfAuthenticated;
      
      if (redirectIfAuthenticated === 'auto') {
        redirectPath = user.type === 'admin' ? '/admin' : '/lessons';
      }
      
      router.push(redirectPath);
      return;
    }

    // Check role-based access
    if (allowedRoles && isAuthenticated && user) {
      if (!allowedRoles.includes(user.type)) {
        const redirect = redirectIfUnauthorized || (user.type === 'admin' ? '/admin' : '/lessons');
        router.push(redirect);
        return;
      }
    }
  }, [isAuthenticated, isLoading, user, redirectIfAuthenticated, allowedRoles, redirectIfUnauthorized, router]);

  return <>{children}</>;
}

// Convenience component for login pages
export function LoginGuard({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard redirectIfAuthenticated="auto">
      {children}
    </AuthGuard>
  );
}

// Component for admin-only pages
export function AdminOnlyGuard({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard 
      allowedRoles={['admin']} 
      redirectIfUnauthorized="/admin/login"
    >
      {children}
    </AuthGuard>
  );
}

// Component for student-only pages
export function StudentOnlyGuard({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard 
      allowedRoles={['student']} 
      redirectIfUnauthorized="/student/login"
    >
      {children}
    </AuthGuard>
  );
}
