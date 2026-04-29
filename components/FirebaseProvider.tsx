'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot, getDoc, getDocFromServer, updateDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
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
  isApproved?: boolean;
  instituteId?: string;
  password?: string;
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
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setIsAuthReady(true);

      // Clean up previous profile listener if any
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (firebaseUser) {
        setLoading(true);
        // Listen to user profile changes
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        unsubscribeProfile = onSnapshot(userDocRef, async (docSnap) => {
          try {
            if (docSnap.exists()) {
              const data = docSnap.data() as UserProfile;
              
              if (firebaseUser.email === 'masif4732714@gmail.com' && data.role !== 'super_admin') {
                await updateDoc(userDocRef, { role: 'super_admin' });
              }
              setProfile(data);
            } else {
              // Check if there is an invited profile waiting with the email as key
              if (firebaseUser.email) {
                const emailKey = firebaseUser.email.toLowerCase().trim();
                const invitedDocRef = doc(db, 'users', emailKey);
                
                try {
                  const invitedSnap = await getDoc(invitedDocRef);
                  
                  if (invitedSnap.exists()) {
                    const invitedData = invitedSnap.data() as any;
                    // Found an invited profile! Move it to the UID-based document
                    const newProfile = {
                      ...invitedData,
                      uid: firebaseUser.uid,
                      isInvited: false, // Mark as no longer pending invite
                      updatedAt: serverTimestamp()
                    };
                    delete (newProfile as any).password; // Remove plain password for better security
                    
                    await setDoc(userDocRef, newProfile);
                    await deleteDoc(invitedDocRef);
                    setProfile(newProfile as UserProfile);
                    setLoading(false);
                    return;
                  }
                } catch (err) {
                  console.error("Error checking invited profile:", err);
                  // Non-critical, continue to default profile
                }
              }

              // Default profile for new users (usually students)
              setProfile({
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                role: 'student',
                displayName: firebaseUser.displayName || '',
              });
            }
            setLoading(false);
          } catch (err) {
            console.error("Error in profile snapshot sync:", err);
            setLoading(false);
          }
        }, (error) => {
          console.error("Profile listener error - Full details:", {
            code: (error as any).code,
            message: (error as any).message,
            uid: firebaseUser.uid,
            email: firebaseUser.email
          });
          setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, []);

  return (
    <FirebaseContext.Provider value={{ user, profile, loading, isAuthReady }}>
      {children}
    </FirebaseContext.Provider>
  );
};
