'use client';

import React, { useEffect } from 'react';
import { useFirebase } from '@/components/FirebaseProvider';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useFirebase();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (profile) {
        const isStaff = ['admin', 'super_admin', 'admission_officer'].includes(profile.role);
        const isApproved = profile.isApproved || profile.role === 'super_admin';
        
        if (!isStaff) {
          router.push('/dashboard');
        } else if (!isApproved) {
          router.push('/login?error=pending_approval');
        }
      }
    }
  }, [user, profile, loading, router]);

  if (loading || (user && !profile)) {
    return <LoadingSpinner />;
  }

  // Final double check for roles and approval before rendering
  if (user && profile) {
    const isStaff = ['admin', 'super_admin', 'admission_officer'].includes(profile.role);
    const isApproved = profile.isApproved || profile.role === 'super_admin';
    if (!isStaff || !isApproved) return null;
  }

  return <>{children}</>;
}
