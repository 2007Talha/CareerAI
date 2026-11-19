import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import {
  TrendingUp,
  Target,
  Trophy,
  Users,
  GraduationCap,
  ArrowUpRight,
  Code,
  Folder,
  Briefcase,
  FileText,
  Star,
  Zap,
  BarChart2,
  ArrowRight,
} from 'lucide-react';
import { getRanking, getCareerMatches } from '../api/client';
import type { StudentProfile, RankingData, CareerMatchesResponse } from '../types';

interface Props {
  profile: StudentProfile | null;
  ranking: RankingData | null;
  setRanking: (r: RankingData) => void;
  careerMatches: CareerMatchesResponse | null;
  setCareerMatches: (m: CareerMatchesResponse) => void;
}

export default function Dashboard({
  profile,
  ranking,
  setRanking,
  careerMatches,
  setCareerMatches,
}: Props) {
  const navigate = useNavigate();
  // Toggle between horizontal breakdown list (Photo 1) and radar chart (Photo 4)
  const [viewMode, setViewMode] = useState<'list' | 'radar'>('list');

  useEffect(() => {
    if (profile && !ranking) {
      Promise.all([
        getRanking(profile.id).catch(() => null),
        getCareerMatches(profile.id).catch(() => null),
      ]).then(([r, m]) => {
        if (r) setRanking(r);
        if (m) setCareerMatches(m);
      });
    }
  }, [profile]);

  if (!profile) return null;

  const displayName = profile.full_name.split(' ')[0] || 'Alex';

  // Metrics from ranking or fallback to demo values
  const cohortRank = ranking?.cohort_rank ?? 4;
  const cohortSize = ranking?.cohort_size ?? 6;
  const percentile = ranking?.percentile ?? 33;
  const overallScore = ranking?.overall_score ?? 42.2;
  const skillCount = profile.skills?.length ?? 4;

  const topCareer = careerMatches?.matches?.[0]?.career.name ?? 'Software Engineer';
  const topFit = careerMatches?.matches?.[0]?.fit_percentage ?? 35;

  const breakdownItems = [
    {
      id: 'technical',
      name: 'Technical Skills',
      weight: '25%',
      score: ranking?.breakdown.technical_skills ?? 51.8,
      level: 'Advanced (4/5)',
      color: '#2563eb',
      bgLight: '#eff6ff',
      icon: Code,
    },
    {
      id: 'projects',
      name: 'Projects',
      weight: '25%',
      score: ranking?.breakdown.projects ?? 29.1,
      level: 'Advanced (4/5)',
      color: '#8b5cf6',
      bgLight: '#f5f3ff',
      icon: Folder,
    },
    {
      id: 'academics',
      name: 'Academics',
      weight: '20%',
      score: ranking?.breakdown.academics ?? 96.0,
      level: 'Intermediate (3/5)',
      color: '#10b981',
      bgLight: '#ecfdf5',
      icon: GraduationCap,
    },
    {
      id: 'experience',
      name: 'Experience',
      weight: '10%',
      score: ranking?.breakdown.experience ?? 27.7,
      level: 'Intermediate (3/5)',
      color: '#f97316',
      bgLight: '#fff7ed',
      icon: Briefcase,
    },
    {
      id: 'assessments',
      name: 'Assessments',
      weight: '10%',
      score: ranking?.breakdown.assessments ?? 0.0,
      level: 'Beginner (1/5)',
      color: '#06b6d4',
      bgLight: '#ecfeff',
      icon: FileText,
    },
    {
      id: 'achievements',
      name: 'Achievements',
      weight: '10%',
      score: ranking?.breakdown.achievements ?? 0.0,
      level: 'Beginner (1/5)',
      color: '#f43f5e',
      bgLight: '#fff1f2',
      icon: Star,
    },
  ];

  const radarData = [
    { subject: 'Technical', value: ranking?.breakdown.technical_skills ?? 51.8, fullMark: 100 },
    { subject: 'Projects', value: ranking?.breakdown.projects ?? 29.1, fullMark: 100 },
    { subject: 'Academics', value: ranking?.breakdown.academics ?? 96.0, fullMark: 100 },
    { subject: 'Experience', value: ranking?.breakdown.experience ?? 27.7, fullMark: 100 },
    { subject: 'Assessments', value: ranking?.breakdown.assessments ?? 0.0, fullMark: 100 },
    { subject: 'Achievements', value: ranking?.breakdown.achievements ?? 0.0, fullMark: 100 },
  ];

  // Gauge calculation
  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  const scoreOffset = circumference - (overallScore / 100) * circumference;

  return (
    <div className="animate-fade-in">
      {/* Welcome Banner */}
      <div
        className="page-header"
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 26,
        }}
      >
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>👋</span> Welcome back, <span className="page-title-accent">{displayName}!</span>
          </h1>
          <p className="page-description">
            Your career readiness overview. Score computed via transparent weighted formula.
          </p>
        </div>
        <div
          className="slogan-text"
          style={{
            fontFamily: 'var(--font-family-handwriting, Caveat, cursive)',
            fontSize: '1.5rem',
            lineHeight: 1.15,
            color: '#475569',
            textAlign: 'right',
            transform: 'rotate(-4deg)',
            paddingTop: 4,
            userSelect: 'none',
          }}
        >
          Better Skills<br />Bigger Dreams
        </div>
      </div>

      {/* Top 4 Stat Metric Cards (Photo 1) */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        {/* Cohort Rank Card */}
        <div
          className="stat-card-modern"
          style={{
            background: 'linear-gradient(135deg, rgba(239, 246, 255, 0.7) 0%, rgba(240, 249, 255, 0.95) 100%)',
            borderColor: 'rgba(191, 219, 254, 0.6)',
          }}
        >
          <div className="stat-card-top">
            <div className="stat-card-badge">
              <div className="stat-icon-wrapper blue" style={{ borderRadius: 12 }}>
                <Trophy size={18} />
              </div>
              <span className="stat-label-text" style={{ color: '#3b82f6' }}>COHORT RANK</span>
            </div>
            <ArrowUpRight size={18} className="stat-corner-arrow" style={{ color: '#3b82f6' }} />
          </div>
          <div className="stat-value-large">#{cohortRank}</div>
          <div className="stat-footer-text" style={{ color: '#64748b' }}>
            of {cohortSize} students
          </div>
        </div>

        {/* Percentile Card */}
        <div
          className="stat-card-modern"
          style={{
            background: 'linear-gradient(135deg, rgba(236, 253, 245, 0.7) 0%, rgba(240, 253, 250, 0.95) 100%)',
            borderColor: 'rgba(167, 243, 208, 0.6)',
          }}
        >
          <div className="stat-card-top">
            <div className="stat-card-badge">
              <div className="stat-icon-wrapper green" style={{ borderRadius: 12 }}>
                <Users size={18} />
              </div>
              <span className="stat-label-text" style={{ color: '#10b981' }}>PERCENTILE</span>
            </div>
            <ArrowUpRight size={18} className="stat-corner-arrow" style={{ color: '#10b981' }} />
          </div>
          <div className="stat-value-large" style={{ color: '#059669' }}>
            {Math.round(percentile)}th
          </div>
          <div className="stat-footer-text" style={{ color: '#059669', fontWeight: 600 }}>
            Better than {Math.round(percentile)}% of peers
          </div>
        </div>

        {/* Skills Identified Card */}
        <div
          className="stat-card-modern"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 247, 237, 0.7) 0%, rgba(254, 243, 199, 0.95) 100%)',
            borderColor: 'rgba(254, 215, 170, 0.6)',
          }}
        >
          <div className="stat-card-top">
            <div className="stat-card-badge">
              <div className="stat-icon-wrapper orange" style={{ borderRadius: 12 }}>
                <GraduationCap size={18} />
              </div>
              <span className="stat-label-text" style={{ color: '#f97316' }}>SKILLS</span>
            </div>
            <ArrowUpRight size={18} className="stat-corner-arrow" style={{ color: '#f97316' }} />
          </div>
          <div className="stat-value-large" style={{ color: '#d97706' }}>
            {skillCount}
          </div>
          <div className="stat-footer-text" style={{ color: '#64748b' }}>
            identified
          </div>
        </div>

        {/* Top Career Card */}
        <div
          className="stat-card-modern"
          style={{
            background: 'linear-gradient(135deg, rgba(245, 243, 255, 0.7) 0%, rgba(238, 242, 255, 0.95) 100%)',
            borderColor: 'rgba(221, 214, 254, 0.6)',
          }}
        >
          <div className="stat-card-top">
            <div className="stat-card-badge">
              <div className="stat-icon-wrapper purple" style={{ borderRadius: 12 }}>
                <Target size={18} />
              </div>
              <span className="stat-label-text" style={{ color: '#8b5cf6' }}>TOP CAREER</span>
            </div>
            <ArrowUpRight size={18} className="stat-corner-arrow" style={{ color: '#8b5cf6' }} />
          </div>
          <div className="stat-value-career" style={{ color: '#1e1b4b' }}>
            {topCareer}
          </div>
          <div className="stat-footer-text" style={{ color: '#059669', fontWeight: 600 }}>
            {Math.round(topFit)}% fit
          </div>
        </div>
      </div>

      {/* Main Grid: Readiness Score Gauge & Score Breakdown */}
      <div className="grid-2" style={{ marginBottom: 28 }}>
        {/* Left: Readiness Score Card */}
        <div className="card" style={{ position: 'relative', overflow: 'hidden', minHeight: 390 }}>
          <div className="card-header">
            <div>
              <div className="card-title">Readiness Score</div>
              <div className="card-subtitle">Deterministic weighted formula</div>
            </div>
            <div className="score-badge-pill" style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
              <TrendingUp size={14} /> +12% vs last month
            </div>
          </div>

          <div className="gauge-container" style={{ padding: '24px 0 36px' }}>
            <div className="gauge-wrapper" style={{ width: 190, height: 190 }}>
              <svg className="gauge-svg" width="190" height="190" viewBox="0 0 190 190">
                <defs>
                  <linearGradient id="scoreRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#2563eb" />
                  </linearGradient>
                </defs>
                <circle
                  className="gauge-circle-bg"
                  cx="95"
                  cy="95"
                  r={radius}
                  stroke="#f1f5f9"
                  strokeWidth="12"
                />
                <circle
                  className="gauge-circle-fill"
                  cx="95"
                  cy="95"
                  r={radius}
                  stroke="url(#scoreRingGrad)"
                  strokeWidth="12"
                  strokeDasharray={circumference}
                  strokeDashoffset={scoreOffset}
                />
              </svg>

              <div className="gauge-center-content">
                <div className="gauge-number" style={{ fontSize: '2.5rem' }}>
                  {overallScore.toFixed(1)}
                </div>
                <div className="gauge-subtext" style={{ letterSpacing: '0.1em' }}>
                  OUT OF 100
                </div>
              </div>
            </div>
          </div>

          {/* Decorative soft wave at the bottom */}
          <svg
            viewBox="0 0 400 70"
            fill="none"
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              width: '100%',
              opacity: 0.45,
              pointerEvents: 'none',
            }}
          >
            <path
              d="M0 45C100 25 220 60 400 30V70H0V45Z"
              fill="url(#waveGradientBlue)"
            />
            <defs>
              <linearGradient id="waveGradientBlue" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#bfdbfe" />
                <stop offset="100%" stopColor="#e0e7ff" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Right: Score Breakdown Card (Photo 1 & Photo 4 Toggle) */}
        <div className="card" style={{ minHeight: 390 }}>
          <div className="card-header">
            <div>
              <div className="card-title">Score Breakdown</div>
              <div className="card-subtitle">Which areas contribute most</div>
            </div>
            {/* View Switcher: List vs Radar */}
            <div style={{ display: 'flex', gap: 6, background: '#f1f5f9', padding: 3, borderRadius: 10 }}>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                title="Bar list view"
                style={{
                  padding: '5px 8px',
                  borderRadius: 7,
                  background: viewMode === 'list' ? '#ffffff' : 'transparent',
                  color: viewMode === 'list' ? '#2563eb' : '#64748b',
                  boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <BarChart2 size={16} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('radar')}
                title="Radar chart view"
                style={{
                  padding: '5px 8px',
                  borderRadius: 7,
                  background: viewMode === 'radar' ? '#ffffff' : 'transparent',
                  color: viewMode === 'radar' ? '#2563eb' : '#64748b',
                  boxShadow: viewMode === 'radar' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Zap size={16} />
              </button>
            </div>
          </div>

          {viewMode === 'list' ? (
            /* Horizontal Progress Bars View (Photo 1) */
            <div className="breakdown-list" style={{ marginTop: 8 }}>
              {breakdownItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <div key={item.id} className="breakdown-item">
                    <div className="breakdown-lead" style={{ width: 170, minWidth: 170 }}>
                      <div
                        className="breakdown-icon-box"
                        style={{ background: item.bgLight, color: item.color }}
                      >
                        <IconComponent size={14} />
                      </div>
                      <span className="breakdown-label" style={{ fontSize: '0.84rem' }}>
                        {item.name} <span style={{ color: '#94a3b8', fontWeight: 500 }}>({item.weight})</span>
                      </span>
                    </div>

                    <div className="breakdown-bar-track" style={{ height: 8 }}>
                      <div
                        className="breakdown-bar-fill"
                        style={{
                          width: `${Math.min(100, Math.max(2, item.score))}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>

                    <div className="breakdown-score" style={{ width: 42, minWidth: 42 }}>
                      {item.score.toFixed(1)}
                    </div>

                    <div
                      className="breakdown-level"
                      style={{
                        fontSize: '0.75rem',
                        color: '#64748b',
                        width: 105,
                        minWidth: 105,
                        textAlign: 'right',
                      }}
                    >
                      {item.level}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Radar Chart View (Photo 4) */
            <div style={{ width: '100%', height: 280, marginTop: 10 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius={85}>
                  <PolarGrid stroke="rgba(148, 163, 184, 0.25)" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }}
                  />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    name="Student Score"
                    dataKey="value"
                    stroke="#2563eb"
                    fill="#3b82f6"
                    fillOpacity={0.25}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Action Card (Photo 1 & Photo 5) */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(238, 242, 255, 0.7) 0%, rgba(240, 249, 255, 0.8) 100%)',
          borderColor: 'rgba(199, 210, 254, 0.5)',
          padding: '20px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: '#eff6ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2563eb',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.12)',
            }}
          >
            <Target size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
              What should I do next?
            </div>
            <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 2 }}>
              View your personalized roadmap and start closing skill gaps
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/roadmap')}
          style={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
            color: '#ffffff',
            padding: '11px 24px',
            borderRadius: 9999,
            fontWeight: 600,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 4px 14px rgba(79, 70, 229, 0.25)',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
        >
          View Roadmap <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
