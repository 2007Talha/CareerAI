import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Upload, BarChart3, Target, MessageCircle, Sparkles, Shield, ArrowRight, LogIn } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();
  const { currentUser, hasCompletedOnboarding } = useAuth();

  const handleGetStarted = () => {
    if (currentUser) {
      if (hasCompletedOnboarding) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    } else {
      navigate('/signup');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-body)', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <header
        style={{
          height: 76,
          padding: '0 48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #e2e8f0',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => navigate('/')}>
          <img
            src="/logo-icon.png"
            alt="CareerAI Logo"
            style={{ width: 36, height: 36, objectFit: 'contain' }}
          />
          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            CareerAI
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {currentUser ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate(hasCompletedOnboarding ? '/dashboard' : '/onboarding')}
              style={{ padding: '9px 20px', borderRadius: 9999 }}
            >
              Go to {hasCompletedOnboarding ? 'Dashboard' : 'Onboarding'} <ArrowRight size={15} />
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => navigate('/login')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#475569',
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '8px 16px',
                  borderRadius: 9999,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#0f172a')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#475569')}
              >
                <LogIn size={16} />
                Log In
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleGetStarted}
                style={{
                  background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                  color: '#ffffff',
                  padding: '9px 22px',
                  borderRadius: 9999,
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
                }}
              >
                Get Started
              </button>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main id="main-content" className="hero" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 24px' }}>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 880, textAlign: 'center' }}>
          <div className="hero-badge" style={{ margin: '0 auto 20px auto' }}>
            <Sparkles size={16} />
            <span>AI-Powered Career Readiness Assessment</span>
          </div>

          <h1 className="hero-title" style={{ fontSize: '3.4rem', lineHeight: 1.15, fontWeight: 800, color: '#0f172a', marginBottom: 20 }}>
            Know Your{' '}
            <span className="hero-title-gradient">Career Readiness</span>
            <br />Before It Matters
          </h1>

          <p className="hero-subtitle" style={{ fontSize: '1.15rem', color: '#64748b', maxWidth: 640, margin: '0 auto 32px auto', lineHeight: 1.6 }}>
            Upload your resume, get a transparent readiness score, discover your
            skill gaps, and receive a personalized roadmap to your dream career.
          </p>

          <div className="hero-actions" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 24 }}>
            <button
              className="btn btn-primary btn-lg"
              onClick={handleGetStarted}
              style={{
                background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                color: '#ffffff',
                padding: '14px 32px',
                borderRadius: 9999,
                fontSize: '1.05rem',
                fontWeight: 600,
                boxShadow: '0 8px 24px rgba(37, 99, 235, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <Upload size={20} />
              Get Started
            </button>

            {!currentUser && (
              <button
                type="button"
                onClick={() => navigate('/login')}
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  color: '#334155',
                  padding: '14px 28px',
                  borderRadius: 9999,
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                Already have an account? Log In
              </button>
            )}
          </div>

          <div className="hero-features" id="features" style={{ marginTop: 48 }}>
            <div className="hero-feature">
              <BarChart3 className="hero-feature-icon" />
              <div className="hero-feature-title">Transparent Scoring</div>
              <div className="hero-feature-text">
                Deterministic formula — not a black-box LLM number
              </div>
            </div>
            <div className="hero-feature">
              <Target className="hero-feature-icon" />
              <div className="hero-feature-title">Career-Specific Gaps</div>
              <div className="hero-feature-text">
                Prioritized skill gaps with concrete action items
              </div>
            </div>
            <div className="hero-feature">
              <MessageCircle className="hero-feature-icon" />
              <div className="hero-feature-title">AI Coach</div>
              <div className="hero-feature-text">
                Grounded in your actual data, not generic advice
              </div>
            </div>
            <div className="hero-feature">
              <Shield className="hero-feature-icon" />
              <div className="hero-feature-title">Bias-Aware</div>
              <div className="hero-feature-text">
                Protected attributes excluded from scoring
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
