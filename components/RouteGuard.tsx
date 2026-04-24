'use client';

import React, { useEffect } from 'react';
import { useFirebase } from './FirebaseProvider';
import { useRouter, usePathname } from 'next/navigation';
import { LoadingSpinner } from './LoadingSpinner';

const PUBLIC_ROUTES = ['/', '/login', '/programs'];
const ADMIN_ROUTES = ['/admin'];
const STUDENT_ROUTES = ['/dashboard', '/apply', '/applications'];

export const RouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, loading, isAuthReady } = useFirebase();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading || !isAuthReady) return;

    const isPublicRoute = PUBLIC_ROUTES.some(route => 
      pathname === route || pathname.startsWith('/programs/')
    );
    
    const isAdminRoute = ADMIN_ROUTES.some(route => pathname.startsWith(route));
    const isStudentRoute = STUDENT_ROUTES.some(route => pathname.startsWith(route));

    if (!user && !isPublicRoute) {
      // Redirect to login if not authenticated and trying to access private route
      router.push('/login');
      return;
    }

    if (user && profile) {
      // If logged in and on login page, go to dashboard
      if (pathname === '/login') {
        router.push('/dashboard');
        return;
      }

      // Role-based checks
      if (isAdminRoute) {
        const hasAdminAccess = ['super_admin', 'admin', 'admission_officer'].includes(profile.role);
        if (!hasAdminAccess) {
          router.push('/dashboard');
        }
      }
    }
  }, [user, profile, loading, isAuthReady, pathname, router]);

  // Show loader only on initial boot for private routes
  const isPublicRoute = PUBLIC_ROUTES.some(route => 
    pathname === route || pathname.startsWith('/programs/')
  );

  if (loading && !isPublicRoute) {
    return <LoadingSpinner />;
  }

  return <>{children}</>;
};
