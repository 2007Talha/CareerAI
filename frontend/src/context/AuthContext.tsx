import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile as firebaseUpdateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../firebase/config';
import type { StudentProfile } from '../types';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
}

interface AuthContextType {
  currentUser: AuthUser | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string, name: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  saveUserProfile: (profile: StudentProfile) => void;
  getUserProfile: () => StudentProfile | null;
  hasCompletedOnboarding: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_USER_KEY = 'careerai_auth_user';
const LOCAL_STORAGE_USERS_DB = 'careerai_registered_users';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, (fbUser: FirebaseUser | null) => {
        if (fbUser) {
          setCurrentUser({
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
            photoURL: fbUser.photoURL,
          });
        } else {
          setCurrentUser(null);
        }
        setLoading(false);
      });
      return unsubscribe;
    } else {
      // Local fallback auth session
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
        if (stored) {
          setCurrentUser(JSON.parse(stored));
        }
      } catch (err) {
        console.error('Failed to parse local auth user', err);
      }
      setLoading(false);
    }
  }, []);

  const login = async (email: string, pass: string) => {
    if (isFirebaseConfigured && auth) {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      setCurrentUser({
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: cred.user.displayName || email.split('@')[0],
      });
    } else {
      // Local mock login validation
      const usersStr = localStorage.getItem(LOCAL_STORAGE_USERS_DB);
      const users: Record<string, { pass: string; name: string; uid: string }> = usersStr
        ? JSON.parse(usersStr)
        : {};

      const existing = users[email.toLowerCase()];
      if (!existing) {
        throw new Error('User not found. Please sign up first.');
      }
      if (existing.pass !== pass) {
        throw new Error('Invalid password.');
      }

      const user: AuthUser = {
        uid: existing.uid,
        email,
        displayName: existing.name,
      };
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(user));
      setCurrentUser(user);
    }
  };

  const signup = async (email: string, pass: string, name: string) => {
    if (isFirebaseConfigured && auth) {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      await firebaseUpdateProfile(cred.user, { displayName: name });
      setCurrentUser({
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: name,
      });
    } else {
      // Local mock register
      const usersStr = localStorage.getItem(LOCAL_STORAGE_USERS_DB);
      const users: Record<string, { pass: string; name: string; uid: string }> = usersStr
        ? JSON.parse(usersStr)
        : {};

      if (users[email.toLowerCase()]) {
        throw new Error('Email is already registered. Please log in.');
      }

      const uid = 'usr_' + Math.random().toString(36).substring(2, 12);
      users[email.toLowerCase()] = { pass, name, uid };
      localStorage.setItem(LOCAL_STORAGE_USERS_DB, JSON.stringify(users));

      const user: AuthUser = { uid, email, displayName: name };
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(user));
      setCurrentUser(user);
    }
  };

  const loginWithGoogle = async () => {
    if (isFirebaseConfigured && auth && googleProvider) {
      try {
        const cred = await signInWithPopup(auth, googleProvider);
        const resolvedName = cred.user.displayName || cred.user.email?.split('@')[0] || 'Candidate';
        const user: AuthUser = {
          uid: cred.user.uid,
          email: cred.user.email,
          displayName: resolvedName,
          photoURL: cred.user.photoURL,
        };
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(user));
        setCurrentUser(user);
      } catch (err: any) {
        if (err.code === 'auth/unauthorized-domain') {
          throw new Error(
            'This domain (career-ai-in.netlify.app) must be authorized in Firebase Console -> Authentication -> Settings -> Authorized Domains. Alternatively, please log in with Email & Password.'
          );
        }
        throw err;
      }
    } else {
      // Local fallback mode when Firebase client is uninitialized
      const localName = localStorage.getItem('careerai_last_username') || 'Student Candidate';
      const fallbackUser: AuthUser = {
        uid: 'usr_candidate_' + Math.random().toString(36).substring(2, 9),
        email: 'candidate@university.edu',
        displayName: localName,
      };
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(fallbackUser));
      setCurrentUser(fallbackUser);
    }
  };

  const logout = async () => {
    if (isFirebaseConfigured && auth) {
      await firebaseSignOut(auth);
    } else {
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    }
    setCurrentUser(null);
  };

  const saveUserProfile = (profile: StudentProfile) => {
    if (!currentUser) return;
    const storageKey = `careerai_profile_${currentUser.uid}`;
    localStorage.setItem(storageKey, JSON.stringify(profile));
    localStorage.setItem('careerai_student_profile', JSON.stringify(profile));
  };

  const getUserProfile = (): StudentProfile | null => {
    if (!currentUser) return null;
    const storageKey = `careerai_profile_${currentUser.uid}`;
    let stored = localStorage.getItem(storageKey);
    if (!stored) {
      stored = localStorage.getItem('careerai_student_profile');
    }
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  };

  const hasCompletedOnboarding = Boolean(currentUser && getUserProfile() !== null);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        login,
        signup,
        loginWithGoogle,
        logout,
        saveUserProfile,
        getUserProfile,
        hasCompletedOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
