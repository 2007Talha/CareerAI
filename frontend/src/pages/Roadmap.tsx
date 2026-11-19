import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Sparkles,
  TrendingUp,
  BookOpen,
  Loader2,
} from 'lucide-react';
import { getSkillGaps, getRoadmap, recalculateScore } from '../api/client';
import type {
  StudentProfile,
  GapsResponse,
  RoadmapResponse,
  RoadmapItem,
  RecalculateResponse,
  CareerMatchesResponse,
} from '../types';

interface Props {
  profile: StudentProfile | null;
  selectedCareerId: string;
  gaps: GapsResponse | null;
  setGaps: (g: GapsResponse | null) => void;
  roadmap: RoadmapResponse | null;
  setRoadmap: (r: RoadmapResponse | null) => void;
  careerMatches?: CareerMatchesResponse | null;
  setSelectedCareerId?: (id: string) => void;
}

/**
 * Top header with target career dropdown.
 */
function RoadmapHeader({ careerName, matches, selectedId, onSelect }: { careerName: string; matches?: CareerMatchesResponse | null; selectedId: string; onSelect?: (id: string) => void }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 20, marginBottom: 28 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <h1 className="page-title" style={{ margin: 0, fontSize: '1.85rem' }}>Personalized Roadmap</h1>
          <span style={{ background: '#eff6ff', color: '#2563eb', fontWeight: 700, fontSize: '0.8rem', padding: '3px 10px', borderRadius: 9999, border: '1px solid #dbeafe' }}>Action Plan</span>
        </div>
        <p className="page-description" style={{ margin: 0 }}>Curated sequence of milestones to close skill gaps for <strong>{careerName}</strong>.</p>
      </div>
      {matches && onSelect && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>Target Role:</span>
          <select value={selectedId} onChange={(e) => onSelect(e.target.value)} style={{ padding: '8px 14px', borderRadius: 9999, border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', background: '#ffffff', outline: 'none', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
            {matches.matches.map((m) => <option key={m.career.id} value={m.career.id}>{m.career.name} ({m.fit_percentage.toFixed(0)}% fit)</option>)}
          </select>
        </div>
      )}
    </div>
  );
}

/**
 * Progress status and score recalculation banner.
 */
function RoadmapProgressBanner({ completed, total, pct, recalculating, onRecalc, result }: { completed: number; total: number; pct: number; recalculating: boolean; onRecalc: () => void; result: RecalculateResponse | null }) {
  return (
    <div className="card" style={{ padding: '20px 24px', borderRadius: 22, border: '1px solid #e2e8f0', background: 'linear-gradient(135deg, #ffffff 0%, #f8faff 100%)', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)', marginBottom: 24 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}><Sparkles size={18} style={{ color: '#2563eb' }} /><h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>Roadmap Completion Status</h3></div>
          <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b' }}>{completed} of {total} action milestones checked off ({pct}%)</p>
        </div>
        <button onClick={onRecalc} disabled={completed === 0 || recalculating} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, borderRadius: 9999, padding: '10px 18px', fontSize: '0.86rem', fontWeight: 600, opacity: completed === 0 ? 0.6 : 1, cursor: completed === 0 ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.2)' }}>
          <TrendingUp size={16} /><span>{recalculating ? 'Simulating...' : 'Recalculate Projected Score'}</span>
        </button>
      </div>
      <div style={{ height: 10, background: '#e2e8f0', borderRadius: 9999, overflow: 'hidden' }}><div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #2563eb 0%, #10b981 100%)', borderRadius: 9999, transition: 'width 0.4s ease' }} /></div>
      {result && (
        <div style={{ marginTop: 16, padding: '14px 18px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div><div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#065f46', textTransform: 'uppercase' }}>Projected Score Improvement</div><div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#047857' }}>{result.previous_score.toFixed(1)} → {result.new_score.toFixed(1)} <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#059669' }}>(+{result.score_change.toFixed(1)} points)</span></div></div>
          <div style={{ fontSize: '0.78rem', color: '#065f46', maxWidth: 400 }}>Calculated deterministically through the CareerAI rubric with your verified completed items.</div>
        </div>
      )}
    </div>
  );
}

/**
 * Progression path overview matrix.
 */
function RoadmapProgressionMatrix({ phases, activePhase, onSelectPhase, totalHours, careerName }: { phases: { id: string; label: string; color: string; bg: string; border: string; desc: string; count: number; hours: number; completed: number }[]; activePhase: string; onSelectPhase: (p: string) => void; totalHours: number; careerName: string }) {
  return (
    <div className="card" style={{ padding: '20px 24px', borderRadius: 22, border: '1px solid #e2e8f0', background: '#ffffff', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)', marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div><h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>{careerName} Progression Path</h2><p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b' }}>Structured 4-stage career trajectory from baseline skills to deployable portfolio projects</p></div>
        <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Total Effort: <strong style={{ color: '#0f172a' }}>{totalHours} Hours</strong></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        {phases.map((p, idx) => {
          const isActive = activePhase.toLowerCase() === p.id.toLowerCase();
          return (
            <div key={p.id} onClick={() => onSelectPhase(activePhase === p.id ? 'all' : p.id)} style={{ padding: '16px', borderRadius: 16, border: `1px solid ${isActive ? p.color : p.border}`, background: isActive ? p.bg : '#ffffff', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: isActive ? `0 4px 14px ${p.border}` : '0 2px 6px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 20, height: 20, borderRadius: '50%', background: p.color, color: '#ffffff', fontSize: '0.72rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{idx + 1}</span><span style={{ fontSize: '0.9rem', fontWeight: 700, color: p.color }}>{p.label}</span></div>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: 9999 }}>{p.completed}/{p.count} done</span>
              </div>
              <p style={{ margin: '0 0 10px', fontSize: '0.76rem', color: '#64748b', minHeight: 32 }}>{p.desc}</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600 }}><span style={{ color: p.color }}>{p.count} Milestones</span><span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} /> ~{p.hours}h</span></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Skill Gaps breakdown list card.
 */
function RoadmapSkillGapsCard({ gaps, careerName }: { gaps: GapsResponse['gaps']; careerName: string }) {
  const critical = gaps.filter((g) => g.classification === 'critical');
  const developing = gaps.filter((g) => g.classification === 'developing');
  const strong = gaps.filter((g) => g.classification === 'strong');

  return (
    <div className="card" style={{ padding: 24, borderRadius: 22, border: '1px solid #e2e8f0', background: '#ffffff', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)', marginBottom: 24 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 18 }}>
        <div><h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>Identified Skill Gaps for {careerName}</h2><p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#64748b' }}>Specific competencies where evaluated depth is below target rubric requirements</p></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: 9999, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>{critical.length} Critical</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: 9999, background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa' }}>{developing.length} Developing</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: 9999, background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>{strong.length} Strong</span>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
        {gaps.map((gap) => {
          const isCrit = gap.classification === 'critical';
          const isStr = gap.classification === 'strong';
          const badge = isCrit ? { bg: '#fef2f2', text: '#dc2626', border: '#fecaca', bar: '#ef4444' } : isStr ? { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0', bar: '#10b981' } : { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa', bar: '#f97316' };
          const ratio = Math.min(100, Math.round((gap.current_level / gap.target_level) * 100));
          return (
            <div key={gap.skill_name} style={{ padding: '14px 16px', borderRadius: 16, border: `1px solid ${badge.border}`, background: '#ffffff', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}><span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>{gap.skill_name}</span><span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', padding: '2px 8px', borderRadius: 6, background: badge.bg, color: badge.text }}>{gap.classification}</span></div>
              <div style={{ height: 6, background: '#f1f5f9', borderRadius: 9999, overflow: 'hidden', marginBottom: 8 }}><div style={{ height: '100%', width: `${ratio}%`, background: badge.bar, borderRadius: 9999 }} /></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: '#64748b' }}><span>L{gap.current_level} → L{gap.target_level}</span><span style={{ fontWeight: 600, color: badge.text }}>Priority: {gap.priority_score.toFixed(1)}</span></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Individual action item card on timeline.
 */
function RoadmapActionItem({ item, idx, isCompleted, onToggle }: { item: RoadmapItem; idx: number; isCompleted: boolean; onToggle: () => void }) {
  const phaseColors: Record<string, { bg: string; text: string; border: string }> = {
    foundation: { bg: '#f5f3ff', text: '#7c3aed', border: '#ddd6fe' },
    advanced: { bg: '#fffbeb', text: '#b45309', border: '#fde68a' },
    portfolio: { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' },
  };
  const theme = phaseColors[(item.phase || '').toLowerCase()] || { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' };

  return (
    <div style={{ padding: '18px 20px', borderRadius: 18, border: isCompleted ? '1px solid #a7f3d0' : '1px solid #e2e8f0', background: isCompleted ? '#f0fdf4' : '#ffffff', display: 'flex', alignItems: 'flex-start', gap: 16, transition: 'all 0.2s ease', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
      <button onClick={onToggle} style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: isCompleted ? '#10b981' : '#eff6ff', color: isCompleted ? '#ffffff' : '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.92rem', cursor: 'pointer', flexShrink: 0, boxShadow: isCompleted ? '0 2px 8px rgba(16, 185, 129, 0.3)' : 'none' }}>
        {isCompleted ? <CheckCircle2 size={20} /> : item.priority_order || idx + 1}
      </button>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 4 }}>
          <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: isCompleted ? '#065f46' : '#0f172a', textDecoration: isCompleted ? 'line-through' : 'none' }}>{item.action_title}</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {item.phase && <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: theme.bg, color: theme.text, border: `1px solid ${theme.border}` }}>{item.phase}</span>}
            {item.gap_skill_name && <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: '#f1f5f9', color: '#334155' }}>{item.gap_skill_name}</span>}
            {item.estimated_hours && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: '#64748b', background: '#f8fafc', padding: '3px 8px', borderRadius: 6, border: '1px solid #e2e8f0' }}><Clock size={12} /> ~{item.estimated_hours}h</span>}
          </div>
        </div>
        <p style={{ margin: '0 0 10px', fontSize: '0.85rem', color: isCompleted ? '#047857' : '#475569', lineHeight: 1.55 }}>{item.action_detail}</p>
        {item.resource_url && (
          <a href={item.resource_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 600, color: '#2563eb', textDecoration: 'none', background: '#eff6ff', padding: '4px 10px', borderRadius: 6, border: '1px solid #dbeafe' }}>
            <BookOpen size={13} /><span>Recommended Learning Resource</span><ExternalLink size={12} />
          </a>
        )}
      </div>
    </div>
  );
}

/**
 * Filter tab switcher for roadmap phases.
 */
function RoadmapTabs({ selected, onSelect }: { selected: string; onSelect: (id: string) => void }) {
  const tabs = [{ id: 'all', label: 'All' }, { id: 'Foundation', label: 'Foundation' }, { id: 'Core', label: 'Core' }, { id: 'Advanced', label: 'Advanced' }, { id: 'Portfolio', label: 'Portfolio' }, { id: 'critical', label: 'Critical' }, { id: 'developing', label: 'Developing' }];

  return (
    <div style={{ display: 'flex', background: '#f1f5f9', padding: 3, borderRadius: 9999, flexWrap: 'wrap', gap: 4 }}>
      {tabs.map((tab) => (
        <button key={tab.id} onClick={() => onSelect(tab.id)} style={{ padding: '6px 12px', borderRadius: 9999, border: 'none', background: selected.toLowerCase() === tab.id.toLowerCase() ? '#ffffff' : 'transparent', color: selected.toLowerCase() === tab.id.toLowerCase() ? '#0f172a' : '#64748b', fontWeight: selected.toLowerCase() === tab.id.toLowerCase() ? 700 : 500, fontSize: '0.78rem', cursor: 'pointer', boxShadow: selected.toLowerCase() === tab.id.toLowerCase() ? '0 2px 6px rgba(0,0,0,0.06)' : 'none', transition: 'all 0.15s ease' }}>{tab.label}</button>
      ))}
    </div>
  );
}

/**
 * Main Roadmap view coordinator.
 */
function buildPhasesSummary(allItems: RoadmapItem[], completedItems: Set<string>) {
  const configs = [
    { id: 'Foundation', label: 'Foundation', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', desc: 'Core fundamentals, languages & tools' },
    { id: 'Core', label: 'Core', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', desc: 'Domain frameworks & key mechanics' },
    { id: 'Advanced', label: 'Advanced', color: '#b45309', bg: '#fffbeb', border: '#fde68a', desc: 'Architecture & high-scale design' },
    { id: 'Portfolio', label: 'Portfolio', color: '#047857', bg: '#ecfdf5', border: '#a7f3d0', desc: 'Production-ready capstone project' },
  ];
  return configs.map((p) => {
    const inPhase = allItems.filter((it) => (it.phase || 'Core').toLowerCase() === p.id.toLowerCase());
    return { ...p, count: inPhase.length, hours: inPhase.reduce((a, b) => a + (b.estimated_hours || 0), 0), completed: inPhase.filter((it) => completedItems.has(it.id)).length };
  });
}

function filterRoadmapItems(allItems: RoadmapItem[], phase: string, gaps: GapsResponse | null) {
  if (phase === 'all') return allItems;
  if (phase === 'critical' || phase === 'developing') {
    return allItems.filter((item) => gaps?.gaps.find((g) => g.skill_name.toLowerCase() === (item.gap_skill_name || '').toLowerCase())?.classification === phase);
  }
  return allItems.filter((item) => (item.phase || 'Core').toLowerCase() === phase.toLowerCase());
}

function RoadmapMilestonesListCard({ items, completedItems, onToggle, loading, hasRoadmap, selectedPhase, onSelectPhase }: { items: RoadmapItem[]; completedItems: Set<string>; onToggle: (id: string) => void; loading: boolean; hasRoadmap: boolean; selectedPhase: string; onSelectPhase: (p: string) => void }) {
  return (
    <div className="card" style={{ padding: 24, borderRadius: 22, border: '1px solid #e2e8f0', background: '#ffffff', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
        <div><h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>Prioritized Milestones</h2><p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#64748b' }}>Check off items as you study or implement them to unlock score upgrades</p></div>
        <RoadmapTabs selected={selectedPhase} onSelect={onSelectPhase} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {items.map((item, idx) => <RoadmapActionItem key={item.id} item={item} idx={idx} isCompleted={completedItems.has(item.id)} onToggle={() => onToggle(item.id)} />)}
        {loading && !hasRoadmap && <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}><Loader2 size={36} className="animate-spin" style={{ margin: '0 auto 12px', color: '#2563eb' }} /><div style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>Generating Curated Roadmap...</div><div style={{ fontSize: '0.84rem' }}>Mapping targeted actions to your identified skill gaps.</div></div>}
        {items.length === 0 && hasRoadmap && !loading && <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>No milestones found in this phase. Switch filter to &quot;All Milestones&quot;.</div>}
      </div>
    </div>
  );
}

function useRoadmapData(profileId: string | undefined, careerId: string, setGaps: Props['setGaps'], setRoadmap: Props['setRoadmap']) {
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [recalcResult, setRecalcResult] = useState<RecalculateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [recalculating, setRecalculating] = useState(false);

  useEffect(() => {
    if (profileId && careerId) {
      setLoading(true);
      getSkillGaps(profileId, careerId).then((g) => { setGaps(g); return getRoadmap(profileId, careerId); }).then((r) => { setRoadmap(r); setLoading(false); }).catch(() => setLoading(false));
    }
  }, [profileId, careerId, setGaps, setRoadmap]);

  const toggleComplete = (itemId: string) => {
    const next = new Set(completedItems);
    if (next.has(itemId)) next.delete(itemId); else next.add(itemId);
    setCompletedItems(next);
  };

  const handleRecalculate = async () => {
    if (!profileId || completedItems.size === 0 || recalculating) return;
    setRecalculating(true);
    try {
      const res = await recalculateScore(profileId, Array.from(completedItems));
      setRecalcResult(res);
    } catch {
      // Graceful fallback
    } finally {
      setRecalculating(false);
    }
  };

  return { completedItems, setCompletedItems, recalcResult, setRecalcResult, loading, recalculating, toggleComplete, handleRecalculate };
}

export default function Roadmap({ profile, selectedCareerId, gaps, setGaps, roadmap, setRoadmap, careerMatches, setSelectedCareerId }: Props) {
  const [selectedPhase, setSelectedPhase] = useState<string>('all');
  const { completedItems, setCompletedItems, recalcResult, setRecalcResult, loading, recalculating, toggleComplete, handleRecalculate } = useRoadmapData(profile?.id, selectedCareerId, setGaps, setRoadmap);

  if (!profile) return null;

  const currentCareer = careerMatches?.matches?.find((m) => m.career.id === selectedCareerId)?.career || { id: selectedCareerId, name: gaps?.career_name || 'Software Engineer' };
  const allItems = roadmap?.items || [];
  const progressPercent = allItems.length > 0 ? Math.round((completedItems.size / allItems.length) * 100) : 0;
  const totalHours = allItems.reduce((acc, it) => acc + (it.estimated_hours || 0), 0);
  const phasesSummary = buildPhasesSummary(allItems, completedItems);
  const filteredItems = filterRoadmapItems(allItems, selectedPhase, gaps);

  const handleSelectCareer = (id: string) => {
    if (setSelectedCareerId) setSelectedCareerId(id);
    setGaps(null);
    setRoadmap(null);
    setCompletedItems(new Set());
    setRecalcResult(null);
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: 40 }}>
      <RoadmapHeader careerName={currentCareer.name} matches={careerMatches} selectedId={selectedCareerId} onSelect={setSelectedCareerId ? handleSelectCareer : undefined} />
      <RoadmapProgressBanner completed={completedItems.size} total={allItems.length} pct={progressPercent} recalculating={recalculating} onRecalc={handleRecalculate} result={recalcResult} />
      {allItems.length > 0 && <RoadmapProgressionMatrix phases={phasesSummary} activePhase={selectedPhase} onSelectPhase={setSelectedPhase} totalHours={totalHours} careerName={currentCareer.name} />}
      {gaps && gaps.gaps.length > 0 && <RoadmapSkillGapsCard gaps={gaps.gaps} careerName={currentCareer.name} />}
      <RoadmapMilestonesListCard items={filteredItems} completedItems={completedItems} onToggle={toggleComplete} loading={loading} hasRoadmap={Boolean(roadmap)} selectedPhase={selectedPhase} onSelectPhase={setSelectedPhase} />
    </div>
  );
}
