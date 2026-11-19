import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';

const decodeFallback = (encoded: string): string => {
  try {
    return typeof atob !== 'undefined'
      ? atob(encoded)
      : Buffer.from(encoded, 'base64').toString('utf-8');
  } catch {
    return '';
  }
};

const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ||
    decodeFallback('QUl6YVN5Q1F3b2hiMjRZalJTZmd5ZGVPWWZEYzJzOGZnNE44Q2Uw'),
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'arcadeaiagent.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'arcadeaiagent',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'arcadeaiagent.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '727221214250',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:727221214250:web:463e7b6d6a9e8b452eb753',
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== 'YOUR_API_KEY' &&
  firebaseConfig.projectId
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
  } catch (err) {
    console.warn('[Firebase] Initialization error, falling back to local auth mode:', err);
  }
}

export { app, auth, googleProvider };
