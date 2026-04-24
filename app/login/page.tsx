'use client';

import React, { useState, Suspense } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';
import { GraduationCap, Chrome, ArrowRight, Loader2, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';

function LoginContent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const loginType = searchParams.get('type');
  const isInstitutional = loginType === 'institution';

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user profile exists by UID
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // Check for invited staff by email
        const staffQuery = query(
          collection(db, 'users'), 
          where('email', '==', user.email?.toLowerCase()),
          where('role', 'in', ['admin', 'admission_officer', 'super_admin'])
        );
        
        const staffDocs = await getDocs(staffQuery);
        
        if (!staffDocs.empty) {
          // Claim invited account
          const invitationDoc = staffDocs.docs[0];
          const invitationData = invitationDoc.data();
          
          await setDoc(userDocRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || invitationData.displayName,
            role: invitationData.role,
            assignedPrograms: invitationData.assignedPrograms || [],
            isApproved: false, // Must be approved after claiming
            createdAt: invitationData.createdAt || serverTimestamp(),
            updatedAt: serverTimestamp(),
          });

          // Delete the invitation placeholder
          if (invitationDoc.id !== user.uid) {
            await deleteDoc(invitationDoc.ref);
          }

          // Force fresh check for approval if staff
          if (isInstitutional) {
            await auth.signOut();
            setError("Your account has been claimed but is now awaiting final validation from the Super Admin.");
            setLoading(false);
            return;
          }
        } else {
          // No profile found. Check if this is an institutional login attempt
          if (isInstitutional) {
            // Block unauthorized institutional access
            await auth.signOut();
            setError("Your account is not registered as an institutional member. Please contact your system administrator.");
            setLoading(false);
            return;
          }

          // Create default student profile
          const isSuperAdmin = user.email === 'masif4732714@gmail.com';
          
          await setDoc(userDocRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            role: isSuperAdmin ? 'super_admin' : 'student',
            isApproved: isSuperAdmin ? true : false, // Students might also need approval if mandated
            createdAt: serverTimestamp(),
          });
        }
      } else {
        // Existing user. Check if they have the right role for institutional login
        const userData = userDoc.data();
        const existingRole = userData?.role;
        const isApproved = userData?.isApproved;
        const hasStaffRole = ['admin', 'super_admin', 'admission_officer'].includes(existingRole);
        
        if (isInstitutional) {
          if (!hasStaffRole) {
            await auth.signOut();
            setError("Standard student accounts cannot use the institutional gateway.");
            setLoading(false);
            return;
          }
          
          if (!isApproved && existingRole !== 'super_admin') {
            await auth.signOut();
            setError("Your institutional access is currently pending approval. Please notify your Super Admin.");
            setLoading(false);
            return;
          }
        }
      }

      router.push('/dashboard');
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Failed to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors duration-300">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-100 dark:shadow-slate-950/50 p-8 lg:p-12 border border-slate-50 dark:border-slate-800">
          <div className="text-center mb-10">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 shadow-lg ${
              isInstitutional 
              ? 'bg-amber-500 shadow-amber-900/40' 
              : 'bg-slate-900 dark:bg-indigo-600 shadow-slate-200 dark:shadow-indigo-900/40'
            }`}>
              {isInstitutional ? <ShieldAlert className="w-8 h-8 text-white" /> : <GraduationCap className="w-8 h-8 text-white" />}
            </div>
            <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white mb-2">
              {isInstitutional ? 'Institutional Access' : 'Welcome Back'}
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              {isInstitutional 
                ? 'Authorized staff management portal' 
                : 'Sign in to manage your admissions'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm rounded-xl break-words">
              <p className="font-bold mb-1">Access Denied:</p>
              {error}
              {error.includes('auth/unauthorized-domain') && (
                <p className="mt-2 text-xs opacity-80">
                  This domain is not authorized in Firebase. Please ensure the app URL is added to the Authorized Domains in Firebase Console.
                </p>
              )}
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className={`w-full flex items-center justify-center gap-3 px-6 py-4 border rounded-2xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed group ${
              isInstitutional
              ? 'border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100 hover:bg-amber-50 dark:hover:bg-amber-900/20'
              : 'border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            ) : (
              <>
                <Chrome className="w-5 h-5 text-indigo-500" />
                {isInstitutional ? 'Login as Staff' : 'Continue with Google'}
                <ArrowRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-indigo-600" />
              </>
            )}
          </button>

          <div className="mt-10 pt-8 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-sm text-slate-400 dark:text-slate-500">
              {isInstitutional ? (
                <>Restricted to authorized identity providers only.</>
              ) : (
                <>
                  By signing in, you agree to our <br />
                  <Link href="#" className="text-slate-600 dark:text-slate-400 hover:underline">Terms of Service</Link> and <Link href="#" className="text-slate-600 dark:text-slate-400 hover:underline">Privacy Policy</Link>
                </>
              )}
            </p>
          </div>
        </div>
        
        <div className="mt-8 text-center flex flex-col gap-4">
          <Link href="/" className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm font-medium transition-colors">
            ← Back to Home
          </Link>
          {isInstitutional && (
             <Link href="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm font-bold">
               Switch to Student Login
             </Link>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
