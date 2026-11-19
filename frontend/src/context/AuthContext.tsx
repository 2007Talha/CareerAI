import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile as firebaseUpdateProfile,
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
  hasCompletedOnboarding: boolean;
  saveUserProfile: (profile: StudentProfile) => void;
  getUserProfile: () => StudentProfile | null;
}

const LOCAL_STORAGE_USER_KEY = 'careerai_mock_user';
const LOCAL_STORAGE_PROFILE_KEY = 'careerai_student_profile';
const LOCAL_STORAGE_USERS_DB = 'careerai_registered_users_db';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function localMockLogin(email: string, pass: string): AuthUser {
  if (!email || !email.includes('@')) throw new Error('Please enter a valid email address');
  if (!pass || pass.length < 6) throw new Error('Password must be at least 6 characters');

  let users: Record<string, { pass: string; name: string; uid: string }> = {};
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_USERS_DB);
    if (raw) users = JSON.parse(raw);
  } catch {
    // fallback
  }

  const existing = users[email.toLowerCase()];
  if (existing && existing.pass !== pass) throw new Error('Invalid email or password');

  const displayName = existing ? existing.name : email.split('@')[0];
  const uid = existing ? existing.uid : 'usr_' + Math.random().toString(36).substring(2, 10);
  const user: AuthUser = { uid, email, displayName };
  localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(user));
  return user;
}

function localMockSignup(email: string, pass: string, name: string): AuthUser {
  if (!email || !email.includes('@')) throw new Error('Please enter a valid email address');
  if (!pass || pass.length < 6) throw new Error('Password must be at least 6 characters');
  if (!name.trim()) throw new Error('Please enter your full name');

  let users: Record<string, { pass: string; name: string; uid: string }> = {};
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_USERS_DB);
    if (raw) users = JSON.parse(raw);
  } catch {
    // fallback
  }

  const uid = 'usr_' + Math.random().toString(36).substring(2, 12);
  users[email.toLowerCase()] = { pass, name, uid };
  localStorage.setItem(LOCAL_STORAGE_USERS_DB, JSON.stringify(users));

  const user: AuthUser = { uid, email, displayName: name };
  localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(user));
  return user;
}

async function performGoogleLogin(): Promise<AuthUser> {
  if (isFirebaseConfigured && auth && googleProvider) {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const name = cred.user.displayName || cred.user.email?.split('@')[0] || 'Candidate';
      const user: AuthUser = { uid: cred.user.uid, email: cred.user.email, displayName: name, photoURL: cred.user.photoURL };
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(user));
      return user;
    } catch (err: unknown) {
      const authErr = err as { code?: string };
      if (authErr.code === 'auth/unauthorized-domain') {
        throw new Error('This domain must be authorized in Firebase Console -> Authentication -> Settings -> Authorized Domains. Alternatively, please log in with Email & Password.');
      }
      throw err instanceof Error ? err : new Error(String(err));
    }
  }
  const localName = localStorage.getItem('careerai_last_username') || 'Student Candidate';
  const fallback: AuthUser = { uid: 'usr_candidate_' + Math.random().toString(36).substring(2, 9), email: 'candidate@university.edu', displayName: localName };
  localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(fallback));
  return fallback;
}

function useAuthStateSubscription() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      return onAuthStateChanged(auth, (user) => {
        if (user) {
          setCurrentUser({ uid: user.uid, email: user.email, displayName: user.displayName || user.email?.split('@')[0] || 'User', photoURL: user.photoURL });
        } else {
          setCurrentUser(null);
        }
        setLoading(false);
      });
    }
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
      if (stored) setCurrentUser(JSON.parse(stored));
    } catch {
      // safe
    }
    setLoading(false);
  }, []);

  return { currentUser, setCurrentUser, loading };
}

async function handleFirebaseOrMockLogin(email: string, pass: string): Promise<AuthUser> {
  if (isFirebaseConfigured && auth) {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    return { uid: cred.user.uid, email: cred.user.email, displayName: cred.user.displayName || email.split('@')[0] };
  }
  return localMockLogin(email, pass);
}

async function handleFirebaseOrMockSignup(email: string, pass: string, name: string): Promise<AuthUser> {
  if (isFirebaseConfigured && auth) {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await firebaseUpdateProfile(cred.user, { displayName: name });
    return { uid: cred.user.uid, email: cred.user.email, displayName: name };
  }
  return localMockSignup(email, pass, name);
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, setCurrentUser, loading } = useAuthStateSubscription();

  const login = async (email: string, pass: string) => {
    const user = await handleFirebaseOrMockLogin(email, pass);
    setCurrentUser(user);
  };

  const signup = async (email: string, pass: string, name: string) => {
    const user = await handleFirebaseOrMockSignup(email, pass, name);
    setCurrentUser(user);
  };

  const loginWithGoogle = async () => {
    const user = await performGoogleLogin();
    setCurrentUser(user);
  };

  const logout = async () => {
    if (isFirebaseConfigured && auth) await firebaseSignOut(auth);
    else localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    setCurrentUser(null);
  };

  const saveUserProfile = (profile: StudentProfile) => localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(profile));
  const getUserProfile = (): StudentProfile | null => {
    try { const raw = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, login, signup, loginWithGoogle, logout, hasCompletedOnboarding: Boolean(getUserProfile()), saveUserProfile, getUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
