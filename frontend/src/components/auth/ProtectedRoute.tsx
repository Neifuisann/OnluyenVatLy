'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requireStudent?: boolean;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({
  children,
  requireAuth = true,
  requireAdmin = false,
  requireStudent = false,
  redirectTo,
  fallback,
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isLoading) {
      return; // Still checking auth status
    }

    // If no authentication required, always render
    if (!requireAuth) {
      setShouldRender(true);
      return;
    }

    // Check if user is authenticated
    if (!isAuthenticated || !user) {
      const defaultRedirect = requireAdmin ? '/admin/login' : '/student/login';
      const redirect = redirectTo || defaultRedirect;
      
      // Add current path as redirect parameter
      const currentPath = window.location.pathname + window.location.search;
      const redirectUrl = `${redirect}?redirect=${encodeURIComponent(currentPath)}`;
      
      router.push(redirectUrl);
      return;
    }

    // Check admin requirements
    if (requireAdmin && user.type !== 'admin') {
      router.push('/admin/login');
      return;
    }

    // Check student requirements
    if (requireStudent && user.type !== 'student') {
      router.push('/student/login');
      return;
    }

    // All checks passed
    setShouldRender(true);
  }, [isAuthenticated, isLoading, user, requireAuth, requireAdmin, requireStudent, redirectTo, router]);

  // Show loading while checking authentication
  if (isLoading) {
    return fallback || <LoadingSpinner />;
  }

  // Don't render if authentication checks haven't passed
  if (!shouldRender) {
    return fallback || <LoadingSpinner />;
  }

  return <>{children}</>;
}

// Convenience components for specific use cases
export function AdminRoute({ children, ...props }: Omit<ProtectedRouteProps, 'requireAdmin'>) {
  return (
    <ProtectedRoute requireAdmin {...props}>
      {children}
    </ProtectedRoute>
  );
}

export function StudentRoute({ children, ...props }: Omit<ProtectedRouteProps, 'requireStudent'>) {
  return (
    <ProtectedRoute requireStudent {...props}>
      {children}
    </ProtectedRoute>
  );
}

export function PublicRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requireAuth={false}>
      {children}
    </ProtectedRoute>
  );
}
