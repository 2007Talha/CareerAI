import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function AuthBrandHeader({ onLogo }: { onLogo: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32, cursor: 'pointer' }} onClick={onLogo}>
      <img src="/logo-icon.png" alt="CareerAI Logo" style={{ width: 44, height: 44, objectFit: 'contain' }} />
      <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>CareerAI</span>
    </div>
  );
}

function AuthTabs({ isLogin, onSelectTab }: { isLogin: boolean; onSelectTab: (login: boolean) => void }) {
  return (
    <div style={{ display: 'flex', background: '#f1f5f9', padding: 4, borderRadius: 9999, marginBottom: 24 }}>
      <button type="button" onClick={() => onSelectTab(true)} style={{ flex: 1, padding: '9px 16px', borderRadius: 9999, border: 'none', background: isLogin ? '#ffffff' : 'transparent', color: isLogin ? '#0f172a' : '#64748b', fontWeight: isLogin ? 700 : 500, fontSize: '0.88rem', cursor: 'pointer', boxShadow: isLogin ? '0 2px 6px rgba(0,0,0,0.06)' : 'none' }}>Log In</button>
      <button type="button" onClick={() => onSelectTab(false)} style={{ flex: 1, padding: '9px 16px', borderRadius: 9999, border: 'none', background: !isLogin ? '#ffffff' : 'transparent', color: !isLogin ? '#0f172a' : '#64748b', fontWeight: !isLogin ? 700 : 500, fontSize: '0.88rem', cursor: 'pointer', boxShadow: !isLogin ? '0 2px 6px rgba(0,0,0,0.06)' : 'none' }}>Sign Up</button>
    </div>
  );
}

function AuthGoogleButton({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={loading} style={{ width: '100%', padding: '12px 20px', borderRadius: 9999, border: '1px solid #cbd5e1', background: '#ffffff', color: '#1e293b', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" /></svg>
      <span>Continue with Google</span>
    </button>
  );
}

interface AuthFormProps {
  isLogin: boolean;
  name: string;
  setName: (s: string) => void;
  email: string;
  setEmail: (s: string) => void;
  password: string;
  setPassword: (s: string) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onGoogle: () => void;
}

function AuthFormFields({ isLogin, name, setName, email, setEmail, password, setPassword, loading, onSubmit, onGoogle }: AuthFormProps) {
  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {!isLogin && (
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: 6 }}>Full Name</label>
          <div style={{ position: 'relative' }}><User size={18} style={{ position: 'absolute', left: 14, top: 12, color: '#94a3b8' }} /><input type="text" required placeholder="e.g. Alex Rivera" value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%', padding: '10px 14px 10px 42px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }} /></div>
        </div>
      )}
      <div>
        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: 6 }}>Email Address</label>
        <div style={{ position: 'relative' }}><Mail size={18} style={{ position: 'absolute', left: 14, top: 12, color: '#94a3b8' }} /><input type="email" required placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '10px 14px 10px 42px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }} /></div>
      </div>
      <div>
        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: 6 }}>Password</label>
        <div style={{ position: 'relative' }}><Lock size={18} style={{ position: 'absolute', left: 14, top: 12, color: '#94a3b8' }} /><input type="password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '10px 14px 10px 42px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }} /></div>
      </div>
      <button type="submit" disabled={loading} style={{ marginTop: 10, padding: '12px 20px', borderRadius: 9999, border: 'none', background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)', color: '#ffffff', fontWeight: 600, fontSize: '0.92rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)' }}>
        {loading ? <Loader2 size={18} className="animate-spin" /> : <>{isLogin ? 'Log In with Email' : 'Sign Up with Email'} <ArrowRight size={16} /></>}
      </button>
      <div style={{ display: 'flex', alignItems: 'center', margin: '4px 0', gap: 12 }}><div style={{ flex: 1, height: 1, background: '#e2e8f0' }} /><span style={{ fontSize: '0.78rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>or</span><div style={{ flex: 1, height: 1, background: '#e2e8f0' }} /></div>
      <AuthGoogleButton onClick={onGoogle} loading={loading} />
    </form>
  );
}

function useAuthHandlers(isLogin: boolean, email: string, pass: string, name: string) {
  const navigate = useNavigate();
  const { login, signup, loginWithGoogle, getUserProfile } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null); setLoading(true);
    try {
      if (isLogin) { await login(email, pass); navigate(getUserProfile() ? '/dashboard' : '/onboarding'); }
      else { if (!name.trim()) throw new Error('Please enter your full name'); await signup(email, pass, name.trim()); navigate('/onboarding'); }
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Authentication failed.'); }
    finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setError(null); setLoading(true);
    try { await loginWithGoogle(); navigate(getUserProfile() ? '/dashboard' : '/onboarding'); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : 'Google sign-in failed.'); }
    finally { setLoading(false); }
  };

  return { error, setError, loading, handleSubmit, handleGoogle };
}

export default function Auth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const { error, setError, loading, handleSubmit, handleGoogle } = useAuthHandlers(isLogin, email, password, name);

  return (
    <main id="main-content" style={{ minHeight: '100vh', background: '#f8faff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px 20px' }}>
      <AuthBrandHeader onLogo={() => navigate('/')} />
      <div className="card" style={{ maxWidth: 440, width: '100%', padding: 36, borderRadius: 24, boxShadow: '0 8px 30px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
        <AuthTabs isLogin={isLogin} onSelectTab={(tab) => { setIsLogin(tab); setError(null); }} />
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p style={{ fontSize: '0.86rem', color: '#64748b' }}>{isLogin ? 'Enter your details to access your career assessment' : 'Join CareerAI to discover your readiness and skills'}</p>
        </div>
        {error && <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, color: '#dc2626', fontSize: '0.85rem', marginBottom: 20 }}><AlertCircle size={18} /><span>{error}</span></div>}
        <AuthFormFields isLogin={isLogin} name={name} setName={setName} email={email} setEmail={setEmail} password={password} setPassword={setPassword} loading={loading} onSubmit={handleSubmit} onGoogle={handleGoogle} />
        <div style={{ marginTop: 22, padding: '10px 14px', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={14} style={{ color: '#2563eb', flexShrink: 0 }} /><span>Mandatory resume or profile upload is required after sign up to generate your readiness rubric.</span>
        </div>
      </div>
    </main>
  );
}
