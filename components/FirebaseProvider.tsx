'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot, getDoc, getDocFromServer, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

// Connection test
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. The client is offline.");
    }
  }
}
testConnection();

interface UserProfile {
  uid: string;
  email: string;
  role: 'super_admin' | 'admin' | 'admission_officer' | 'student' | 'parent' | 'guest';
  displayName?: string;
  studentUid?: string; // For parents
  theme?: 'light' | 'dark';
}

interface FirebaseContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthReady: boolean;
}

const FirebaseContext = createContext<FirebaseContextType>({
  user: null,
  profile: null,
  loading: true,
  isAuthReady: false,
});

export const useFirebase = () => useContext(FirebaseContext);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Always apply dark theme
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.add('dark');
  }, []);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setIsAuthReady(true);

      if (firebaseUser) {
        // Listen to user profile changes
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const unsubscribeProfile = onSnapshot(userDocRef, async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            
            // Sync theme from profile if it exists (deprecated but keeping for profile structure compatibility if needed)
            if (firebaseUser.email === 'masif4732714@gmail.com' && data.role !== 'super_admin') {
              await updateDoc(userDocRef, { role: 'super_admin' });
            }
            setProfile(data);
          } else {
            // Default profile for new users (usually students)
            setProfile({
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              role: 'student',
              displayName: firebaseUser.displayName || '',
            });
          }
          setLoading(false);
        }, (error) => {
          console.error("Profile listener error:", error);
          setLoading(false);
        });

        return () => unsubscribeProfile();
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, [user]);

  return (
    <FirebaseContext.Provider value={{ user, profile, loading, isAuthReady }}>
      {children}
    </FirebaseContext.Provider>
  );
};
