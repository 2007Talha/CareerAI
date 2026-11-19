import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  Loader2,
  Sparkles,
  Link as LinkIcon,
  Edit3,
  Lightbulb,
  FileText,
  AlertCircle,
  Bell,
  ChevronDown,
  LogOut,
} from 'lucide-react';
import { uploadResume, createProfile, importLinkedInProfile } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { StudentProfile } from '../types';

interface Props {
  setProfile: (profile: StudentProfile) => void;
}

type Tab = 'upload' | 'linkedin' | 'manual';

interface HeaderProps {
  displayName: string;
  onLogout: () => Promise<void>;
  onHome: () => void;
}

/**
 * Top bar header for onboarding page.
 */
function OnboardingHeader({ displayName, onLogout, onHome }: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header style={{ height: 72, padding: '0 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={onHome}>
        <img src="/logo-icon.png" alt="CareerAI" style={{ width: 34, height: 34, objectFit: 'contain' }} />
        <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>CareerAI</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <button className="header-icon-btn" aria-label="Notifications"><Bell size={20} /><span className="notification-dot" /></button>
        <div style={{ position: 'relative' }}>
          <div className="header-user-profile" onClick={() => setDropdownOpen(!dropdownOpen)}>
            <div className="user-avatar"><span className="user-avatar-fallback">{displayName.charAt(0).toUpperCase()}</span></div>
            <span className="user-name">{displayName}</span>
            <ChevronDown size={16} className="user-dropdown-arrow" />
          </div>
          {dropdownOpen && (
            <div style={{ position: 'absolute', top: 48, right: 0, background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.08)', padding: 6, minWidth: 140, zIndex: 100 }}>
              <button type="button" onClick={async () => { setDropdownOpen(false); await onLogout(); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, border: 'none', background: 'none', color: '#dc2626', fontSize: '0.86rem', fontWeight: 500, cursor: 'pointer', textAlign: 'left' }}>
                <LogOut size={14} /> Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

/**
 * Tab switcher component for resume, linkedin, manual.
 */
function OnboardingTabs({ activeTab, onSelect }: { activeTab: Tab; onSelect: (t: Tab) => void }) {
  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'upload', label: 'Resume Upload', icon: <Upload size={16} /> },
    { id: 'linkedin', label: 'LinkedIn URL', icon: <LinkIcon size={16} /> },
    { id: 'manual', label: 'Manual Entry', icon: <Edit3 size={16} /> },
  ];

  return (
    <div style={{ display: 'flex', background: '#ffffff', padding: 6, borderRadius: 9999, boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)', border: '1px solid #e2e8f0', marginBottom: 28 }}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onSelect(tab.id)}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '10px 16px',
            borderRadius: 9999,
            background: activeTab === tab.id ? '#2563eb' : 'transparent',
            color: activeTab === tab.id ? '#ffffff' : '#64748b',
            fontWeight: 600,
            fontSize: '0.88rem',
            cursor: 'pointer',
            border: 'none',
            boxShadow: activeTab === tab.id ? '0 4px 12px rgba(37, 99, 235, 0.28)' : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Dropzone file upload block.
 */
function OnboardingDropzone({ onFile }: { onFile: (file: File) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div
      style={{
        border: isDragging ? '2px dashed #2563eb' : '2px dashed #93c5fd',
        borderRadius: 24,
        background: isDragging ? '#eff6ff' : '#ffffff',
        padding: '50px 30px',
        textAlign: 'center',
        cursor: 'pointer',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)',
        marginBottom: 20,
      }}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) onFile(f); }}
      onClick={() => fileInputRef.current?.click()}
    >
      <div style={{ width: 68, height: 68, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', color: '#2563eb' }}>
        <Upload size={32} />
      </div>
      <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Drop your resume here or click to browse</div>
      <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Supports PDF and DOCX • Max 10MB</div>
      <input ref={fileInputRef} type="file" accept=".pdf,.docx" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
    </div>
  );
}

/**
 * Helpful tip card for LinkedIn PDF export.
 */
function OnboardingLinkedInTip() {
  return (
    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 16, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a', flexShrink: 0 }}>
          <Lightbulb size={20} />
        </div>
        <div style={{ fontSize: '0.84rem', color: '#166534', lineHeight: 1.45 }}>
          <strong>LinkedIn Tip:</strong> On LinkedIn, click <em>More → Save to PDF</em> to download your profile, then drop it right here!
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, opacity: 0.85 }}>
        <FileText size={28} style={{ color: '#0d9488', transform: 'rotate(-8deg)' }} />
        <FileText size={32} style={{ color: '#059669', marginLeft: -12 }} />
      </div>
    </div>
  );
}

/**
 * LinkedIn URL importer form.
 */
function OnboardingLinkedInForm({ onSubmit }: { onSubmit: (url: string) => void }) {
  const [url, setUrl] = useState('');

  return (
    <div className="card" style={{ padding: 28, borderRadius: 24 }}>
      <form onSubmit={(e) => { e.preventDefault(); if (url.trim()) onSubmit(url.trim()); }}>
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>LinkedIn Profile URL</label>
          <input type="url" required value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.linkedin.com/in/username" style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }} />
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 6 }}>Paste your public LinkedIn URL (e.g. https://www.linkedin.com/in/alex-smith)</div>
        </div>
        <button type="submit" style={{ width: '100%', background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)', color: '#ffffff', padding: '12px 20px', borderRadius: 9999, fontWeight: 600, border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)' }}>
          Fetch Profile Details
        </button>
      </form>
    </div>
  );
}

/**
 * Manual Profile form input grid.
 */
function OnboardingManualForm({ initialName, initialEmail, onSubmit }: { initialName: string; initialEmail: string; onSubmit: (data: { full_name: string; email: string; university: string; degree: string; graduation_year: string; gpa: string }) => void }) {
  const [formData, setFormData] = useState({ full_name: initialName, email: initialEmail, university: '', degree: '', graduation_year: '', gpa: '' });

  return (
    <div className="card" style={{ padding: 28, borderRadius: 24 }}>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }}>
        <div className="grid-2" style={{ gap: 16, marginBottom: 20 }}>
          <div><label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Full Name *</label><input required value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} placeholder="e.g. Alex Rivera" style={{ width: '100%', marginTop: 4, padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1' }} /></div>
          <div><label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Email</label><input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="e.g. alex@example.com" style={{ width: '100%', marginTop: 4, padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1' }} /></div>
          <div><label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>University</label><input value={formData.university} onChange={(e) => setFormData({ ...formData, university: e.target.value })} placeholder="e.g. University of California" style={{ width: '100%', marginTop: 4, padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1' }} /></div>
          <div><label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Degree</label><input value={formData.degree} onChange={(e) => setFormData({ ...formData, degree: e.target.value })} placeholder="e.g. B.S. Computer Science" style={{ width: '100%', marginTop: 4, padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1' }} /></div>
          <div><label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Graduation Year</label><input type="number" value={formData.graduation_year} onChange={(e) => setFormData({ ...formData, graduation_year: e.target.value })} placeholder="2025" style={{ width: '100%', marginTop: 4, padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1' }} /></div>
          <div><label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>GPA (out of 10)</label><input type="number" step="0.01" max="10" value={formData.gpa} onChange={(e) => setFormData({ ...formData, gpa: e.target.value })} placeholder="8.5" style={{ width: '100%', marginTop: 4, padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1' }} /></div>
        </div>
        <button type="submit" style={{ width: '100%', background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)', color: '#ffffff', padding: '12px 20px', borderRadius: 9999, fontWeight: 600, border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)' }}>Create Profile</button>
      </form>
    </div>
  );
}

/**
 * Processing spinner banner card.
 */
function OnboardingProcessing({ message }: { message: string }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '60px 30px', borderRadius: 24, border: '1px solid #e2e8f0' }}>
      <Loader2 size={44} style={{ color: '#2563eb', margin: '0 auto 20px', animation: 'spin 1s linear infinite' }} />
      <div style={{ color: '#0f172a', fontWeight: 600, fontSize: '1rem', marginBottom: 6 }}>Processing Resume with AI...</div>
      <div style={{ color: '#64748b', fontSize: '0.86rem' }}>{message}</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/**
 * Main Onboarding page coordinator.
 */
function useOnboardingSubmissions(navigate: ReturnType<typeof useNavigate>, setProfile: Props['setProfile'], saveUserProfile: (p: StudentProfile) => void) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingMessage, setProcessingMessage] = useState('Gemini is parsing your resume and extracting structured skills...');

  const handleFile = useCallback(async (file: File) => {
    setError(null); setProcessingMessage('Gemini is parsing your resume and extracting structured profile data...'); setIsProcessing(true);
    try {
      const res = await uploadResume(file);
      if (res?.extracted_profile) { saveUserProfile(res.extracted_profile); setProfile(res.extracted_profile); navigate('/dashboard'); }
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed to process resume. Please try again.'); setIsProcessing(false); }
  }, [navigate, setProfile, saveUserProfile]);

  const handleLinkedIn = useCallback(async (url: string) => {
    setError(null); setProcessingMessage('Fetching profile details from LinkedIn & extracting structured skills...'); setIsProcessing(true);
    try {
      const res = await importLinkedInProfile(url);
      if (res?.extracted_profile) { saveUserProfile(res.extracted_profile); setProfile(res.extracted_profile); navigate('/dashboard'); }
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed to import LinkedIn profile. Please check the URL.'); setIsProcessing(false); }
  }, [navigate, setProfile, saveUserProfile]);

  const handleManual = useCallback(async (d: { full_name: string; email: string; university: string; degree: string; graduation_year: string; gpa: string }) => {
    setError(null);
    try {
      const p = await createProfile({ full_name: d.full_name || 'Student Candidate', email: d.email || undefined, university: d.university || undefined, degree: d.degree || undefined, graduation_year: d.graduation_year ? parseInt(d.graduation_year) : undefined, gpa: d.gpa ? parseFloat(d.gpa) : undefined, skills: [], projects: [], experiences: [] });
      saveUserProfile(p); setProfile(p); navigate('/dashboard');
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed to create profile'); }
  }, [navigate, setProfile, saveUserProfile]);

  return { isProcessing, error, processingMessage, handleFile, handleLinkedIn, handleManual };
}

export default function Onboarding({ setProfile }: Props) {
  const navigate = useNavigate();
  const { currentUser, saveUserProfile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('upload');
  const { isProcessing, error, processingMessage, handleFile, handleLinkedIn, handleManual } = useOnboardingSubmissions(navigate, setProfile, saveUserProfile);

  useEffect(() => {
    if (!currentUser) navigate('/login');
  }, [currentUser, navigate]);

  const displayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User';

  return (
    <div style={{ minHeight: '100vh', background: '#f8faff', display: 'flex', flexDirection: 'column' }}>
      <OnboardingHeader displayName={displayName} onLogout={logout} onHome={() => navigate('/')} />
      <main id="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ maxWidth: 680, width: '100%' }} className="animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 9999, padding: '5px 14px', fontSize: '0.8rem', fontWeight: 600 }}>
              <Sparkles size={14} /><span>Get Started</span>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.025em', marginBottom: 8 }}>Upload Your Resume</h1>
            <p style={{ fontSize: '0.95rem', color: '#64748b' }}>We'll extract your skills, projects, and experience using AI.</p>
          </div>
          <OnboardingTabs activeTab={activeTab} onSelect={setActiveTab} />
          {error && <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 14, color: '#dc2626', fontSize: '0.88rem', marginBottom: 20 }}><AlertCircle size={18} />{error}</div>}
          {isProcessing ? <OnboardingProcessing message={processingMessage} /> : activeTab === 'upload' ? (<><OnboardingDropzone onFile={handleFile} /><OnboardingLinkedInTip /></>) : activeTab === 'linkedin' ? <OnboardingLinkedInForm onSubmit={handleLinkedIn} /> : <OnboardingManualForm initialName={currentUser?.displayName || ''} initialEmail={currentUser?.email || ''} onSubmit={handleManual} />}
        </div>
      </main>
    </div>
  );
}
