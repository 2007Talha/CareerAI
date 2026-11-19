import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  DollarSign,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  Search,
  ArrowRight,
  MessageSquare,
} from 'lucide-react';
import { getCareerMatches } from '../api/client';
import type { StudentProfile, CareerMatchesResponse, GapsResponse } from '../types';

interface Props {
  profile: StudentProfile | null;
  careerMatches: CareerMatchesResponse | null;
  setCareerMatches: (m: CareerMatchesResponse) => void;
  setSelectedCareerId: (id: string) => void;
  setGaps: (g: GapsResponse | null) => void;
}

export default function Careers({
  profile,
  careerMatches,
  setCareerMatches,
  setSelectedCareerId,
  setGaps,
}: Props) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'high_fit' | 'high_salary' | 'high_growth'>('all');

  useEffect(() => {
    if (profile && !careerMatches) {
      getCareerMatches(profile.id).then(setCareerMatches).catch(console.error);
    }
  }, [profile]);

  if (!profile) return null;

  const handleSelectCareer = (careerId: string, targetPath: '/roadmap' | '/coach' = '/roadmap') => {
    setSelectedCareerId(careerId);
    setGaps(null); // Reset gaps to trigger fresh calculation for newly selected career
    navigate(targetPath);
  };

  const getFitBadgeColors = (pct: number) => {
    if (pct >= 70) {
      return {
        bg: '#ecfdf5',
        text: '#059669',
        border: '#a7f3d0',
        gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        label: 'Strong Match',
      };
    }
    if (pct >= 40) {
      return {
        bg: '#fff7ed',
        text: '#ea580c',
        border: '#fed7aa',
        gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
        label: 'Moderate Fit',
      };
    }
    return {
      bg: '#fef2f2',
      text: '#dc2626',
      border: '#fecaca',
      gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      label: 'Emerging Fit',
    };
  };

  const rawMatches = careerMatches?.matches || [];

  // Filter & sorting
  const filteredMatches = rawMatches
    .filter((match) => {
      const query = searchTerm.toLowerCase();
      const matchesSearch =
        match.career.name.toLowerCase().includes(query) ||
        match.career.description.toLowerCase().includes(query) ||
        match.reasons.some((r) => r.toLowerCase().includes(query));

      if (!matchesSearch) return false;

      if (filterType === 'high_fit') return match.fit_percentage >= 50;
      if (filterType === 'high_salary') return (match.career.avg_salary_usd || 0) >= 120000;
      if (filterType === 'high_growth') {
        const growth = (match.career.growth_outlook || '').toLowerCase();
        return growth.includes('high') || growth.includes('rapid') || growth.includes('faster');
      }
      return true;
    })
    .sort((a, b) => {
      if (filterType === 'high_salary') {
        return (b.career.avg_salary_usd || 0) - (a.career.avg_salary_usd || 0);
      }
      return b.fit_percentage - a.fit_percentage;
    });

  const bestMatch = rawMatches[0];

  return (
    <div className="animate-fade-in" style={{ paddingBottom: 40 }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 20,
          marginBottom: 28,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1 className="page-title" style={{ margin: 0, fontSize: '1.85rem' }}>Career Matches</h1>
            <span
              style={{
                background: '#eff6ff',
                color: '#2563eb',
                fontWeight: 700,
                fontSize: '0.8rem',
                padding: '3px 10px',
                borderRadius: 9999,
                border: '1px solid #dbeafe',
              }}
            >
              {rawMatches.length} Evaluated Roles
            </span>
          </div>
          <p className="page-description" style={{ margin: 0 }}>
            Fit percentages computed by re-weighting your skills and project context against industry job descriptions.
          </p>
        </div>

        {bestMatch && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '8px 16px',
              background: '#ecfdf5',
              borderRadius: 9999,
              border: '1px solid #a7f3d0',
            }}
          >
            <Sparkles size={16} style={{ color: '#059669' }} />
            <div style={{ fontSize: '0.84rem', color: '#065f46' }}>
              Top Match: <strong>{bestMatch.career.name}</strong> ({bestMatch.fit_percentage.toFixed(0)}%)
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          borderRadius: 20,
          border: '1px solid #e2e8f0',
          background: '#ffffff',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: 11, color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search roles, required skills, keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 14px 8px 38px',
              borderRadius: 9999,
              border: '1px solid #cbd5e1',
              fontSize: '0.88rem',
              outline: 'none',
              background: '#f8fafc',
            }}
          />
        </div>

        <div style={{ display: 'flex', background: '#f1f5f9', padding: 3, borderRadius: 9999, flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Roles' },
            { id: 'high_fit', label: 'High Fit (50%+)' },
            { id: 'high_salary', label: 'Highest Salary' },
            { id: 'high_growth', label: 'High Growth' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id as any)}
              style={{
                padding: '6px 14px',
                borderRadius: 9999,
                border: 'none',
                background: filterType === tab.id ? '#ffffff' : 'transparent',
                color: filterType === tab.id ? '#0f172a' : '#64748b',
                fontWeight: filterType === tab.id ? 700 : 500,
                fontSize: '0.8rem',
                cursor: 'pointer',
                boxShadow: filterType === tab.id ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Career Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {filteredMatches.map((match, i) => {
          const colors = getFitBadgeColors(match.fit_percentage);
          const isTopPick = i === 0 && filterType === 'all';

          return (
            <div
              key={match.career.id}
              className="card"
              style={{
                padding: 24,
                borderRadius: 22,
                border: isTopPick ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                background: '#ffffff',
                boxShadow: isTopPick
                  ? '0 10px 30px rgba(59, 130, 246, 0.08)'
                  : '0 4px 20px rgba(0, 0, 0, 0.03)',
                display: 'flex',
                flexDirection: 'column',
                gap: 18,
                position: 'relative',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
            >
              {isTopPick && (
                <div
                  style={{
                    position: 'absolute',
                    top: -12,
                    left: 28,
                    background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                    color: '#ffffff',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '3px 12px',
                    borderRadius: 9999,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
                  }}
                >
                  ⭐ Top Matched Career
                </div>
              )}

              {/* Main row: Fit circular badge + Title + Stats */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                  {/* Radial Fit Badge */}
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: '50%',
                      background: colors.gradient,
                      color: '#ffffff',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: `0 6px 16px ${colors.border}`,
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ fontSize: '1.35rem', fontWeight: 800, lineHeight: 1 }}>
                      {match.fit_percentage.toFixed(0)}%
                    </span>
                    <span style={{ fontSize: '0.62rem', fontWeight: 600, opacity: 0.9, textTransform: 'uppercase' }}>
                      Fit
                    </span>
                  </div>

                  {/* Title & Metadata */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span
                        style={{
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          color: '#64748b',
                          textTransform: 'uppercase',
                        }}
                      >
                        Rank #{match.match_rank}
                      </span>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 6,
                          background: colors.bg,
                          color: colors.text,
                          border: `1px solid ${colors.border}`,
                        }}
                      >
                        {colors.label}
                      </span>
                    </div>

                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                      {match.career.name}
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#64748b', maxWidth: 640 }}>
                      {match.career.description}
                    </p>
                  </div>
                </div>

                {/* Salary & Growth Pill badges */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  {match.career.avg_salary_usd && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '8px 14px',
                        background: '#f8fafc',
                        borderRadius: 12,
                        border: '1px solid #e2e8f0',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        color: '#0f172a',
                      }}
                    >
                      <DollarSign size={15} style={{ color: '#10b981' }} />
                      <span>${(match.career.avg_salary_usd / 1000).toFixed(0)}k <span style={{ fontWeight: 400, color: '#64748b' }}>avg salary</span></span>
                    </div>
                  )}

                  {match.career.growth_outlook && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '8px 14px',
                        background: '#f8fafc',
                        borderRadius: 12,
                        border: '1px solid #e2e8f0',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        color: '#0f172a',
                      }}
                    >
                      <TrendingUp size={15} style={{ color: '#3b82f6' }} />
                      <span>{match.career.growth_outlook} <span style={{ fontWeight: 400, color: '#64748b' }}>growth</span></span>
                    </div>
                  )}
                </div>
              </div>

              {/* Match rationale cards */}
              <div
                style={{
                  background: '#f8faff',
                  padding: '14px 18px',
                  borderRadius: 14,
                  border: '1px solid #e2e8f0',
                }}
              >
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
                  Why this role matches your profile
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 8 }}>
                  {match.reasons.map((reason, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.83rem', color: '#475569' }}>
                      <CheckCircle2 size={15} style={{ color: '#10b981', flexShrink: 0, marginTop: 2 }} />
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action buttons footer */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: 8,
                  borderTop: '1px solid #f1f5f9',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                  Click to inspect the exact skill gap breakdown and generate an action roadmap.
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleSelectCareer(match.career.id, '/coach')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      borderRadius: 9999,
                      padding: '8px 14px',
                      fontSize: '0.82rem',
                    }}
                  >
                    <MessageSquare size={14} /> Ask Coach
                  </button>

                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleSelectCareer(match.career.id, '/roadmap')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      borderRadius: 9999,
                      padding: '8px 16px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
                    }}
                  >
                    View Roadmap & Gaps <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredMatches.length === 0 && rawMatches.length > 0 && (
          <div
            className="card"
            style={{
              padding: '48px 20px',
              textAlign: 'center',
              color: '#94a3b8',
              borderRadius: 20,
            }}
          >
            <Compass size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <div style={{ fontSize: '1.05rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
              No careers match your filter
            </div>
            <div style={{ fontSize: '0.84rem' }}>
              Try searching with a broader keyword or switch the filter to "All Roles".
            </div>
          </div>
        )}

        {!careerMatches && (
          <div
            className="card"
            style={{
              padding: '60px 20px',
              textAlign: 'center',
              borderRadius: 20,
              background: '#ffffff',
            }}
          >
            <Compass className="animate-spin" size={44} style={{ margin: '0 auto 16px', color: '#2563eb' }} />
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
              Evaluating Career Fits...
            </div>
            <div style={{ fontSize: '0.86rem', color: '#64748b', maxWidth: 440, margin: '0 auto' }}>
              Calculating weighted compatibility against real industry engineering standards and your resume projects.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
