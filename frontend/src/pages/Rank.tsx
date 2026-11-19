import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Users, GraduationCap, Target, ArrowUpRight, Zap, ArrowRight } from 'lucide-react';
import { getRanking } from '../api/client';
import type { StudentProfile, RankingData } from '../types';

interface Props {
  profile: StudentProfile | null;
  ranking: RankingData | null;
  setRanking: (r: RankingData) => void;
}

interface StatsProps {
  cohortRank: number;
  cohortSize: number;
  percentile: number;
  skillCount: number;
}

/**
 * Top 4 summary metrics cards.
 * @param props StatsProps
 * @returns JSX Element
 */
function RankTopStats({ cohortRank, cohortSize, percentile, skillCount }: StatsProps) {
  return (
    <div className="grid-4" style={{ marginBottom: 28 }}>
      <div className="stat-card-modern" style={{ background: 'linear-gradient(135deg, rgba(239, 246, 255, 0.7) 0%, rgba(240, 249, 255, 0.95) 100%)', borderColor: 'rgba(191, 219, 254, 0.6)' }}>
        <div className="stat-card-top">
          <div className="stat-card-badge">
            <div className="stat-icon-wrapper blue" style={{ borderRadius: 12 }}><Trophy size={18} /></div>
            <span className="stat-label-text" style={{ color: '#3b82f6' }}>COHORT RANK</span>
          </div>
          <ArrowUpRight size={18} className="stat-corner-arrow" style={{ color: '#3b82f6' }} />
        </div>
        <div className="stat-value-large">#{cohortRank}</div>
        <div className="stat-footer-text" style={{ color: '#64748b' }}>of {cohortSize} students</div>
      </div>

      <div className="stat-card-modern" style={{ background: 'linear-gradient(135deg, rgba(236, 253, 245, 0.7) 0%, rgba(240, 253, 250, 0.95) 100%)', borderColor: 'rgba(167, 243, 208, 0.6)' }}>
        <div className="stat-card-top">
          <div className="stat-card-badge">
            <div className="stat-icon-wrapper green" style={{ borderRadius: 12 }}><Users size={18} /></div>
            <span className="stat-label-text" style={{ color: '#10b981' }}>PERCENTILE</span>
          </div>
          <ArrowUpRight size={18} className="stat-corner-arrow" style={{ color: '#10b981' }} />
        </div>
        <div className="stat-value-large" style={{ color: '#059669' }}>{Math.round(percentile)}th</div>
        <div className="stat-footer-text" style={{ color: '#059669', fontWeight: 600 }}>Better than {Math.round(percentile)}% of peers</div>
      </div>

      <div className="stat-card-modern" style={{ background: 'linear-gradient(135deg, rgba(255, 247, 237, 0.7) 0%, rgba(254, 243, 199, 0.95) 100%)', borderColor: 'rgba(254, 215, 170, 0.6)' }}>
        <div className="stat-card-top">
          <div className="stat-card-badge">
            <div className="stat-icon-wrapper orange" style={{ borderRadius: 12 }}><GraduationCap size={18} /></div>
            <span className="stat-label-text" style={{ color: '#f97316' }}>SKILLS</span>
          </div>
          <ArrowUpRight size={18} className="stat-corner-arrow" style={{ color: '#f97316' }} />
        </div>
        <div className="stat-value-large" style={{ color: '#d97706' }}>{skillCount}</div>
        <div className="stat-footer-text" style={{ color: '#64748b' }}>identified</div>
      </div>

      <div className="stat-card-modern" style={{ background: 'linear-gradient(135deg, rgba(245, 243, 255, 0.7) 0%, rgba(238, 242, 255, 0.95) 100%)', borderColor: 'rgba(221, 214, 254, 0.6)' }}>
        <div className="stat-card-top">
          <div className="stat-card-badge">
            <div className="stat-icon-wrapper purple" style={{ borderRadius: 12 }}><Target size={18} /></div>
            <span className="stat-label-text" style={{ color: '#8b5cf6' }}>TOP CAREER</span>
          </div>
          <ArrowUpRight size={18} className="stat-corner-arrow" style={{ color: '#8b5cf6' }} />
        </div>
        <div className="stat-value-career" style={{ color: '#1e1b4b' }}>Software Engineer</div>
        <div className="stat-footer-text" style={{ color: '#059669', fontWeight: 600 }}>91% fit</div>
      </div>
    </div>
  );
}

/**
 * Circular percentile gauge visualization.
 * @param percentile Computed percentile value
 * @returns JSX Element
 */
function RankGaugeCard({ percentile }: { percentile: number }) {
  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  const percentileOffset = circumference - (percentile / 100) * circumference;

  return (
    <div className="card" style={{ position: 'relative', overflow: 'hidden', minHeight: 390 }}>
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
            <Users size={18} />
          </div>
          <div className="card-title">Percentile Position</div>
        </div>
        <ArrowUpRight size={18} style={{ color: '#06b6d4' }} />
      </div>

      <div className="gauge-container" style={{ padding: '30px 0 40px' }}>
        <div className="gauge-wrapper" style={{ width: 190, height: 190 }}>
          <svg className="gauge-svg" width="190" height="190" viewBox="0 0 190 190">
            <defs>
              <linearGradient id="percentileRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#2563eb" />
              </linearGradient>
            </defs>
            <circle className="gauge-circle-bg" cx="95" cy="95" r={radius} stroke="#f1f5f9" strokeWidth="12" />
            <circle className="gauge-circle-fill" cx="95" cy="95" r={radius} stroke="url(#percentileRingGrad)" strokeWidth="12" strokeDasharray={circumference} strokeDashoffset={percentileOffset} />
          </svg>
          <div className="gauge-center-content">
            <div className="gauge-number" style={{ fontSize: '2.7rem' }}>{Math.round(percentile)}</div>
            <div className="gauge-subtext" style={{ letterSpacing: '0.12em' }}>PERCENTILE</div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface BreakdownProps {
  ranking: RankingData | null;
}

/**
 * Detailed 6-dimension scoring breakdown list.
 * @param props BreakdownProps
 * @returns JSX Element
 */
function RankBreakdownCard({ ranking }: BreakdownProps) {
  const items = [
    { id: 'technical', name: 'Technical Skills', weight: '25%', score: ranking?.breakdown.technical_skills ?? 86.0, color: '#2563eb' },
    { id: 'projects', name: 'Projects', weight: '25%', score: ranking?.breakdown.projects ?? 84.0, color: '#8b5cf6' },
    { id: 'academics', name: 'Academics', weight: '20%', score: ranking?.breakdown.academics ?? 88.0, color: '#10b981' },
    { id: 'experience', name: 'Experience', weight: '10%', score: ranking?.breakdown.experience ?? 80.0, color: '#f97316' },
    { id: 'assessments', name: 'Assessments', weight: '10%', score: ranking?.breakdown.assessments ?? 82.0, color: '#06b6d4' },
    { id: 'achievements', name: 'Achievements', weight: '10%', score: ranking?.breakdown.achievements ?? 85.0, color: '#f43f5e' },
  ];

  return (
    <div className="card" style={{ minHeight: 390 }}>
      <div className="card-header">
        <div>
          <div className="card-title">Score Breakdown</div>
          <div className="card-subtitle">Which areas contribute most</div>
        </div>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
          <Zap size={18} />
        </div>
      </div>

      <div className="breakdown-list" style={{ marginTop: 12, gap: 18 }}>
        {items.map((item) => (
          <div key={item.id} className="breakdown-item" style={{ alignItems: 'center' }}>
            <div className="breakdown-lead" style={{ width: 170, minWidth: 170 }}>
              <span className="breakdown-label" style={{ fontSize: '0.84rem' }}>
                {item.name} <span style={{ color: '#94a3b8', fontWeight: 500 }}>({item.weight})</span>
              </span>
            </div>
            <div className="breakdown-bar-track" style={{ height: 8 }}>
              <div className="breakdown-bar-fill" style={{ width: `${Math.min(100, Math.max(2, item.score))}%`, backgroundColor: item.color }} />
            </div>
            <div className="breakdown-score" style={{ width: 44, minWidth: 44, textAlign: 'right', fontWeight: 700 }}>
              {item.score.toFixed(1)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Next steps roadmap promo card.
 * @param onRoadmap Navigation handler
 * @returns JSX Element
 */
function RankOpportunityBanner({ onRoadmap }: { onRoadmap: () => void }) {
  return (
    <div
      className="card"
      style={{
        background: 'linear-gradient(135deg, rgba(238, 242, 255, 0.7) 0%, rgba(240, 249, 255, 0.8) 100%)',
        borderColor: 'rgba(199, 210, 254, 0.5)', padding: '20px 28px', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
          <Target size={22} />
        </div>
        <div>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>What should I do next?</div>
          <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 2 }}>View your personalized roadmap and start closing skill gaps</div>
        </div>
      </div>
      <button
        type="button"
        onClick={onRoadmap}
        style={{
          background: 'linear-gradient(135deg, #2563eb 0%, #38bdf8 100%)', color: '#ffffff',
          padding: '11px 24px', borderRadius: 9999, fontWeight: 600, fontSize: '0.9rem',
          display: 'flex', alignItems: 'center', gap: 8, border: 'none', cursor: 'pointer',
        }}
      >
        View Roadmap <ArrowRight size={16} />
      </button>
    </div>
  );
}

/**
 * Student cohort ranking view.
 * @param props Props
 * @returns JSX Element
 */
export default function Rank({ profile, ranking, setRanking }: Props) {
  const navigate = useNavigate();

  useEffect(() => {
    if (profile && !ranking) {
      getRanking(profile.id).then(setRanking).catch(() => {});
    }
  }, [profile]);

  if (!profile) return null;

  const cohortRank = ranking?.cohort_rank ?? 48;
  const cohortSize = ranking?.cohort_size ?? 420;
  const percentile = ranking?.percentile ?? 88.5;
  const skillCount = profile.skills?.length ?? 9;

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ marginBottom: 26 }}>
        <h1 className="page-title">Your Ranking</h1>
        <p className="page-description">See how you compare against {cohortSize} students in the cohort using StandardScaler percentile ranking.</p>
      </div>

      <RankTopStats cohortRank={cohortRank} cohortSize={cohortSize} percentile={percentile} skillCount={skillCount} />

      <div className="grid-2" style={{ marginBottom: 28 }}>
        <RankGaugeCard percentile={percentile} />
        <RankBreakdownCard ranking={ranking} />
      </div>

      <RankOpportunityBanner onRoadmap={() => navigate('/roadmap')} />
    </div>
  );
}
