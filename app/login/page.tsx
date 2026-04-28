'use client';

import React, { useState, Suspense } from 'react';
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';
import { GraduationCap, Chrome, ArrowRight, Loader2, ShieldAlert, Mail, Lock, User } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';

function LoginContent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [method, setMethod] = useState<'google' | 'email'>('google');
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const loginType = searchParams.get('type');
  const isInstitutional = loginType === 'institution';

  // Toggle mode
  const toggleMode = () => {
    setAuthMode(prev => prev === 'login' ? 'signup' : 'login');
    setError(null);
  };

  if (!loginType) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors duration-300">
        <div className="max-w-4xl w-full grid md:grid-cols-2 gap-6">
          {/* Student Login Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="group cursor-pointer"
            onClick={() => router.push('/login?type=student')}
          >
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 h-full border-2 border-transparent hover:border-indigo-500 transition-all shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-500/10 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <GraduationCap className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-3xl font-display font-bold text-slate-900 dark:text-white mb-4">Student Portal</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                Log in to submit applications, track your admission status, and manage your student profile.
              </p>
              <div className="mt-auto px-8 py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-bold flex items-center gap-2 group-hover:gap-4 transition-all">
                Continue as Student <ArrowRight className="w-5 h-5" />
              </div>
            </div>
          </motion.div>

          {/* Institutional Login Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="group cursor-pointer"
            onClick={() => router.push('/login?type=institution')}
          >
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 h-full border-2 border-transparent hover:border-amber-500 transition-all shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-amber-50 dark:bg-amber-500/10 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <ShieldAlert className="w-12 h-12 text-amber-600 dark:text-amber-400" />
              </div>
              <h2 className="text-3xl font-display font-bold text-slate-900 dark:text-white mb-4">Institute Login</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                Access the staff management portal to review applications, manage programs, and analyze data.
              </p>
              <div className="mt-auto px-8 py-4 bg-amber-600 text-white rounded-2xl font-bold flex items-center gap-2 group-hover:gap-4 transition-all shadow-lg shadow-amber-900/20">
                Staff & Admin Portal <ArrowRight className="w-5 h-5" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      await finalizeLogin(user);
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Failed to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let user;
      if (authMode === 'signup') {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        user = result.user;
        if (fullName) {
          await updateProfile(user, { displayName: fullName });
        }
      } else {
        try {
          const result = await signInWithEmailAndPassword(auth, email, password);
          user = result.user;
        } catch (authError: any) {
          // If user doesn't exist in Auth, check if they are a pre-registered staff in Firestore
          if (authError.code === 'auth/user-not-found' || authError.code === 'auth/invalid-credential') {
            // Check if they are a pre-registered staff in Firestore using their email as doc ID
            const staffEmail = email.toLowerCase().trim();
            const staffDocRef = doc(db, 'users', staffEmail);
            
            let staffDoc;
            try {
              staffDoc = await getDoc(staffDocRef);
            } catch (permError) {
              console.error("Permission error checking staff doc:", permError);
              throw authError; // Rethrow original auth error if we can't even check staff status
            }
            
            if (staffDoc.exists()) {
              const staffData = staffDoc.data();
              if (staffData.password === password) {
                // Valid pre-registered staff! Create their auth account automatically
                const result = await createUserWithEmailAndPassword(auth, email, password);
                user = result.user;
                if (staffData.displayName) {
                  await updateProfile(user, { displayName: staffData.displayName });
                }
              } else {
                throw new Error("Invalid password for pre-registered staff account.");
              }
            } else {
              // If it's auth/invalid-credential, it might mean email/password is disabled in Firebase console
              if (authError.code === 'auth/invalid-credential') {
                throw new Error("Invalid credentials. If you are sure your password is correct, please ensure 'Email/Password' authentication is enabled in the Firebase Console.");
              }
              throw authError;
            }
          } else {
            throw authError;
          }
        }
      }
      await finalizeLogin(user, fullName);
    } catch (err: any) {
      console.error("Email auth error:", err);
      let msg = err.message || "Authentication failed.";
      if (err.code === 'auth/user-not-found') msg = "No account found with this email.";
      if (err.code === 'auth/wrong-password') msg = "Incorrect password.";
      if (err.code === 'auth/email-already-in-use') msg = "An account already exists with this email.";
      if (err.code === 'auth/invalid-credential') msg = "Invalid credentials. Please verify your email and password, and ensure Email/Password auth is enabled in Firebase Console.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const finalizeLogin = async (user: any, nameOverride?: string) => {
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
          displayName: user.displayName || nameOverride || invitationData.displayName,
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
          return;
        }
      } else {
        // No profile found. Check if this is an institutional login attempt
        if (isInstitutional) {
          // Block unauthorized institutional access
          await auth.signOut();
          setError("Your account is not registered as an institutional member. Please contact your system administrator.");
          return;
        }

        // Create default student profile
        const isSuperAdmin = user.email === 'masif4732714@gmail.com';
        
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || nameOverride,
          role: isSuperAdmin ? 'super_admin' : 'student',
          isApproved: isSuperAdmin ? true : false, 
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
          return;
        }
        
        if (!isApproved && existingRole !== 'super_admin') {
          await auth.signOut();
          setError("Your institutional access is currently pending approval. Please notify your Super Admin.");
          return;
        }
      }
    }

    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors duration-300">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-100 dark:shadow-slate-950/50 p-8 lg:p-12 border border-slate-50 dark:border-slate-800">
          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 shadow-lg ${
              isInstitutional 
              ? 'bg-amber-500 shadow-amber-900/40' 
              : 'bg-slate-900 dark:bg-indigo-600 shadow-slate-200 dark:shadow-indigo-900/40'
            }`}>
              {isInstitutional ? <ShieldAlert className="w-8 h-8 text-white" /> : <GraduationCap className="w-8 h-8 text-white" />}
            </div>
            <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white mb-2">
              {isInstitutional ? 'Institutional Access' : authMode === 'signup' ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              {isInstitutional 
                ? 'Authorized staff management portal' 
                : authMode === 'signup' ? 'Join thousands of students' : 'Sign in to manage your admissions'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm rounded-xl">
              <p className="font-bold mb-1">Error:</p>
              {error}
            </div>
          )}

          <div className="mb-8">
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-6">
              <button 
                onClick={() => setMethod('google')}
                className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${method === 'google' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}
              >
                Google
              </button>
              <button 
                onClick={() => setMethod('email')}
                className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${method === 'email' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}
              >
                Email
              </button>
            </div>

            {method === 'google' ? (
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
                    {isInstitutional ? 'Staff Identity Provider' : 'Continue with Google'}
                    <ArrowRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-indigo-600" />
                  </>
                )}
              </button>
            ) : (
              <form onSubmit={handleEmailAuth} className="space-y-4">
                {authMode === 'signup' && (
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="Full Name"
                      disabled={loading}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-500/10 outline-none transition-all"
                    />
                  </div>
                )}
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="Email Address"
                    disabled={loading}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-500/10 outline-none transition-all"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="Password"
                    disabled={loading}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-500/10 outline-none transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-4 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all ${
                    isInstitutional 
                    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-900/20' 
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-900/20'
                  }`}
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {authMode === 'login' ? 'Login to Portal' : 'Create Account'}
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
                
                {!isInstitutional && (
                  <button
                    type="button"
                    onClick={toggleMode}
                    className="w-full py-2 text-sm text-slate-500 hover:text-indigo-600 font-medium transition-colors"
                  >
                    {authMode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Login"}
                  </button>
                )}
              </form>
            )}
          </div>

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
