import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Upload, BarChart3, Target, MessageCircle, Sparkles, Shield, ArrowRight, LogIn } from 'lucide-react';

interface HeaderProps {
  currentUser: unknown;
  hasCompletedOnboarding: boolean;
  onGetStarted: () => void;
  onLogin: () => void;
  onLogo: () => void;
}

/**
 * Top navigation header for public landing page.
 * @param props HeaderProps
 * @returns JSX Element
 */
function LandingHeader({ currentUser, hasCompletedOnboarding, onGetStarted, onLogin, onLogo }: HeaderProps) {
  return (
    <header style={{ height: 76, padding: '0 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 50 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={onLogo}>
        <img src="/logo-icon.png" alt="CareerAI Logo" style={{ width: 36, height: 36, objectFit: 'contain' }} />
        <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>CareerAI</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {currentUser ? (
          <button type="button" className="btn btn-primary" onClick={onGetStarted} style={{ padding: '9px 20px', borderRadius: 9999 }}>
            Go to {hasCompletedOnboarding ? 'Dashboard' : 'Onboarding'} <ArrowRight size={15} />
          </button>
        ) : (
          <>
            <button type="button" onClick={onLogin} style={{ background: 'none', border: 'none', color: '#475569', fontSize: '0.92rem', fontWeight: 600, cursor: 'pointer', padding: '8px 16px', borderRadius: 9999, display: 'flex', alignItems: 'center', gap: 6 }}><LogIn size={16} /> Log In</button>
            <button type="button" className="btn btn-primary" onClick={onGetStarted} style={{ background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)', color: '#ffffff', padding: '9px 22px', borderRadius: 9999, fontWeight: 600, fontSize: '0.9rem', border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)' }}>Get Started</button>
          </>
        )}
      </div>
    </header>
  );
}

/**
 * Hero introduction banner with typography.
 * @returns JSX Element
 */
function LandingHeroHeader() {
  return (
    <>
      <div className="hero-badge" style={{ margin: '0 auto 20px auto' }}><Sparkles size={16} /><span>AI-Powered Career Readiness Assessment</span></div>
      <h1 className="hero-title" style={{ fontSize: '3.4rem', lineHeight: 1.15, fontWeight: 800, color: '#0f172a', marginBottom: 20 }}>
        Know Your <span className="hero-title-gradient">Career Readiness</span><br />Before It Matters
      </h1>
      <p className="hero-subtitle" style={{ fontSize: '1.15rem', color: '#64748b', maxWidth: 640, margin: '0 auto 32px auto', lineHeight: 1.6 }}>
        Upload your resume, get a transparent readiness score, discover your skill gaps, and receive a personalized roadmap to your dream career.
      </p>
    </>
  );
}

interface ActionProps {
  currentUser: unknown;
  onGetStarted: () => void;
  onLogin: () => void;
}

/**
 * Call-to-action buttons in landing hero.
 * @param props ActionProps
 * @returns JSX Element
 */
function LandingHeroActions({ currentUser, onGetStarted, onLogin }: ActionProps) {
  return (
    <div className="hero-actions" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 24 }}>
      <button type="button" className="btn btn-primary btn-lg" onClick={onGetStarted} style={{ background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)', color: '#ffffff', padding: '14px 32px', borderRadius: 9999, fontSize: '1.05rem', fontWeight: 600, boxShadow: '0 8px 24px rgba(37, 99, 235, 0.3)', display: 'flex', alignItems: 'center', gap: 10, border: 'none', cursor: 'pointer' }}>
        <Upload size={20} /> Get Started
      </button>
      {!currentUser && (
        <button type="button" onClick={onLogin} style={{ background: '#ffffff', border: '1px solid #cbd5e1', color: '#334155', padding: '14px 28px', borderRadius: 9999, fontSize: '1rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          Already have an account? Log In
        </button>
      )}
    </div>
  );
}

/**
 * Feature highlight grid for landing page.
 * @returns JSX Element
 */
function LandingFeatures() {
  const features = [
    { icon: BarChart3, title: 'Transparent Scoring', desc: 'Deterministic formula — not a black-box LLM number' },
    { icon: Target, title: 'Career-Specific Gaps', desc: 'Prioritized skill gaps with concrete action items' },
    { icon: MessageCircle, title: 'AI Coach', desc: 'Grounded in your actual data, not generic advice' },
    { icon: Shield, title: 'Bias-Aware', desc: 'Protected attributes excluded from scoring' },
  ];

  return (
    <div className="hero-features" id="features" style={{ marginTop: 48 }}>
      {features.map((f) => (
        <div key={f.title} className="hero-feature">
          <f.icon className="hero-feature-icon" />
          <div className="hero-feature-title">{f.title}</div>
          <div className="hero-feature-text">{f.desc}</div>
        </div>
      ))}
    </div>
  );
}

/**
 * Public Landing page.
 * @returns JSX Element
 */
export default function Landing() {
  const navigate = useNavigate();
  const { currentUser, hasCompletedOnboarding } = useAuth();

  const handleGetStarted = () => {
    if (currentUser) {
      navigate(hasCompletedOnboarding ? '/dashboard' : '/onboarding');
    } else {
      navigate('/signup');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-body)', display: 'flex', flexDirection: 'column' }}>
      <LandingHeader
        currentUser={currentUser}
        hasCompletedOnboarding={hasCompletedOnboarding}
        onGetStarted={handleGetStarted}
        onLogin={() => navigate('/login')}
        onLogo={() => navigate('/')}
      />
      <main id="main-content" className="hero" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 24px' }}>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 880, textAlign: 'center' }}>
          <LandingHeroHeader />
          <LandingHeroActions currentUser={currentUser} onGetStarted={handleGetStarted} onLogin={() => navigate('/login')} />
          <LandingFeatures />
        </div>
      </main>
    </div>
  );
}
