import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, TrendingUp, CheckCircle2, Search, ArrowRight, MessageSquare } from 'lucide-react';
import { getCareerMatches } from '../api/client';
import type { StudentProfile, CareerMatchesResponse, GapsResponse, CareerFitResult } from '../types';

interface Props {
  profile: StudentProfile | null;
  careerMatches: CareerMatchesResponse | null;
  setCareerMatches: (m: CareerMatchesResponse) => void;
  setSelectedCareerId: (id: string) => void;
  setGaps: (g: GapsResponse | null) => void;
}

/**
 * Returns color tokens according to fit percentage.
 * @param pct Fit percentage
 * @returns Color tokens object
 */
function getFitBadgeColors(pct: number) {
  if (pct >= 70) {
    return { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0', gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', label: 'Strong Match' };
  }
  if (pct >= 40) {
    return { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa', gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', label: 'Moderate Fit' };
  }
  return { bg: '#fef2f2', text: '#dc2626', border: '#fecaca', gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', label: 'Emerging Fit' };
}

interface FilterProps {
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  filterType: string;
  setFilterType: (f: 'all' | 'high_fit' | 'high_salary' | 'high_growth') => void;
}

/**
 * Filter bar with search input and category pills.
 * @param props FilterProps
 * @returns JSX Element
 */
function CareersFilterBar({ searchTerm, setSearchTerm, filterType, setFilterType }: FilterProps) {
  const tabs = [
    { id: 'all', label: 'All Roles' },
    { id: 'high_fit', label: 'High Fit (50%+)' },
    { id: 'high_salary', label: 'Highest Salary' },
    { id: 'high_growth', label: 'High Growth' },
  ];

  return (
    <div className="card" style={{ padding: '16px 20px', borderRadius: 20, border: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
      <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
        <Search size={16} style={{ position: 'absolute', left: 14, top: 11, color: '#94a3b8' }} />
        <input type="text" placeholder="Search roles, required skills, keywords..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '8px 14px 8px 38px', borderRadius: 9999, border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', background: '#f8fafc' }} />
      </div>

      <div style={{ display: 'flex', background: '#f1f5f9', padding: 3, borderRadius: 9999, flexWrap: 'wrap' }}>
        {tabs.map((tab) => (
          <button key={tab.id} type="button" onClick={() => setFilterType(tab.id as 'all' | 'high_fit' | 'high_salary' | 'high_growth')} style={{ padding: '6px 14px', borderRadius: 9999, border: 'none', background: filterType === tab.id ? '#ffffff' : 'transparent', color: filterType === tab.id ? '#0f172a' : '#64748b', fontWeight: filterType === tab.id ? 700 : 500, fontSize: '0.8rem', cursor: 'pointer' }}>
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}

interface CardProps {
  match: CareerFitResult;
  isTopPick: boolean;
  onSelect: (careerId: string, path: '/roadmap' | '/coach') => void;
}

/**
 * Individual career match recommendation card.
 * @param props CardProps
 * @returns JSX Element
 */
function CareerMatchHeader({ match, colors }: { match: CareerFitResult; colors: ReturnType<typeof getFitBadgeColors> }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: colors.gradient, color: '#ffffff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: '1.35rem', fontWeight: 800 }}>{match.fit_percentage.toFixed(0)}%</span>
          <span style={{ fontSize: '0.62rem', fontWeight: 600 }}>Fit</span>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b' }}>Rank #{match.match_rank}</span>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}>{colors.label}</span>
          </div>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{match.career.name}</h3>
          <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#64748b', maxWidth: 640 }}>{match.career.description}</p>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {match.career.avg_salary_usd && <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: '0.82rem', fontWeight: 700 }}><DollarSign size={15} color="#10b981" /> ${(match.career.avg_salary_usd / 1000).toFixed(0)}k avg</div>}
        {match.career.growth_outlook && <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: '0.82rem', fontWeight: 700 }}><TrendingUp size={15} color="#3b82f6" /> {match.career.growth_outlook}</div>}
      </div>
    </div>
  );
}

function CareerMatchCard({ match, isTopPick, onSelect }: CardProps) {
  const colors = getFitBadgeColors(match.fit_percentage);

  return (
    <div className="card" style={{ padding: 24, borderRadius: 22, border: isTopPick ? '2px solid #3b82f6' : '1px solid #e2e8f0', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: 18, position: 'relative' }}>
      {isTopPick && <div style={{ position: 'absolute', top: -12, left: 28, background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)', color: '#ffffff', fontSize: '0.72rem', fontWeight: 700, padding: '3px 12px', borderRadius: 9999 }}>⭐ Top Matched Career</div>}
      <CareerMatchHeader match={match} colors={colors} />
      <div style={{ background: '#f8faff', padding: '14px 18px', borderRadius: 14, border: '1px solid #e2e8f0' }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', marginBottom: 8 }}>Why this role matches your profile</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 8 }}>
          {match.reasons.map((r, idx) => <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.83rem', color: '#475569' }}><CheckCircle2 size={15} color="#10b981" style={{ flexShrink: 0, marginTop: 2 }} /><span>{r}</span></div>)}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid #f1f5f9', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Inspect skill gaps and view your personalized roadmap.</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => onSelect(match.career.id, '/coach')} style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 9999, padding: '8px 14px', fontSize: '0.82rem' }}><MessageSquare size={14} /> Ask Coach</button>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => onSelect(match.career.id, '/roadmap')} style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 9999, padding: '8px 16px', fontSize: '0.82rem' }}>View Skill Gaps <ArrowRight size={14} /></button>
        </div>
      </div>
    </div>
  );
}

/**
 * Filter logic helper.
 * @param matches Raw matches
 * @param searchTerm Search query
 * @param filterType Active filter
 * @returns Filtered matches
 */
function filterMatches(matches: CareerFitResult[], searchTerm: string, filterType: string) {
  const query = searchTerm.toLowerCase();
  return matches.filter((m) => {
    const textMatch = m.career.name.toLowerCase().includes(query) || m.career.description.toLowerCase().includes(query);
    if (!textMatch) return false;
    if (filterType === 'high_fit') return m.fit_percentage >= 50;
    if (filterType === 'high_salary') return (m.career.avg_salary_usd || 0) >= 120000;
    return true;
  });
}

/**
 * Careers discovery view.
 * @param props Props
 * @returns JSX Element
 */
export default function Careers({ profile, careerMatches, setCareerMatches, setSelectedCareerId, setGaps }: Props) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'high_fit' | 'high_salary' | 'high_growth'>('all');

  useEffect(() => {
    if (profile && !careerMatches) {
      getCareerMatches(profile.id).then(setCareerMatches).catch(() => {});
    }
  }, [profile]);

  if (!profile) return null;

  const handleSelect = (careerId: string, path: '/roadmap' | '/coach') => {
    setSelectedCareerId(careerId);
    setGaps(null);
    navigate(path);
  };

  const rawMatches = careerMatches?.matches || [];
  const filtered = filterMatches(rawMatches, searchTerm, filterType);

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ marginBottom: 26 }}>
        <h1 className="page-title">Career Matches</h1>
        <p className="page-description">Roles mapped to your skills, projects, and experiences.</p>
      </div>

      <CareersFilterBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} filterType={filterType} setFilterType={setFilterType} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {filtered.map((match, i) => (
          <CareerMatchCard key={match.career.id} match={match} isTopPick={i === 0 && filterType === 'all'} onSelect={handleSelect} />
        ))}
      </div>
    </div>
  );
}
