'use client';

import React, { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { GraduationCap, Chrome, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user profile exists
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // Create default profile
        // Check if this is the super admin email
        const isSuperAdmin = user.email === 'masif4732714@gmail.com';
        
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          role: isSuperAdmin ? 'super_admin' : 'student',
          createdAt: serverTimestamp(),
        });
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-50 p-8 lg:p-12 border border-slate-50">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-900 rounded-2xl mb-6 shadow-lg shadow-slate-200">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-display font-bold text-slate-900 mb-2">Welcome Back</h1>
            <p className="text-slate-500">Sign in to manage your admissions</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 text-sm rounded-xl break-words">
              <p className="font-bold mb-1">Sign-in Error:</p>
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
            className="w-full flex items-center justify-center gap-3 px-6 py-4 border border-slate-100 rounded-2xl text-slate-700 font-semibold hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            ) : (
              <>
                <Chrome className="w-5 h-5 text-indigo-500" />
                Continue with Google
                <ArrowRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-indigo-600" />
              </>
            )}
          </button>

          <div className="mt-10 pt-8 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-400">
              By signing in, you agree to our <br />
              <Link href="#" className="text-slate-600 hover:underline">Terms of Service</Link> and <Link href="#" className="text-slate-600 hover:underline">Privacy Policy</Link>
            </p>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <Link href="/" className="text-slate-500 hover:text-slate-900 text-sm font-medium transition-colors">
            ← Back to Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
