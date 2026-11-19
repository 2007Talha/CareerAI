import { useState } from 'react';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import {
  Zap,
  Code,
  Layers,
  Wrench,
  Brain,
  Search,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  BarChart3,
  X,
} from 'lucide-react';
import type { StudentProfile, SkillEntry } from '../types';

interface Props {
  profile: StudentProfile | null;
  setProfile?: (p: StudentProfile) => void;
}

const PROFICIENCY_CONFIG: Record<number, { label: string; color: string; bg: string }> = {
  1: { label: 'Beginner', color: '#94a3b8', bg: '#f1f5f9' },
  2: { label: 'Elementary', color: '#3b82f6', bg: '#eff6ff' },
  3: { label: 'Intermediate', color: '#0ea5e9', bg: '#e0f2fe' },
  4: { label: 'Advanced', color: '#8b5cf6', bg: '#f5f3ff' },
  5: { label: 'Expert', color: '#10b981', bg: '#ecfdf5' },
};

function resolveSkillCategory(name: string): 'language' | 'framework' | 'tool' | 'concept' {
  const lower = name.toLowerCase();
  const langs = new Set(['python', 'javascript', 'typescript', 'java', 'c++', 'c#', 'go', 'rust', 'sql', 'r', 'bash', 'html', 'css']);
  const fws = new Set(['react', 'node.js', 'django', 'flask', 'fastapi', 'spring boot', 'tensorflow', 'pytorch', 'scikit-learn', 'express.js', 'next.js', 'pandas', 'numpy', 'vue', 'angular']);
  const tools = new Set(['docker', 'kubernetes', 'aws', 'gcp', 'azure', 'git', 'postgresql', 'mongodb', 'redis', 'linux', 'terraform', 'jenkins', 'ci/cd', 'kafka', 'postman']);
  if (langs.has(lower)) return 'language';
  if (fws.has(lower)) return 'framework';
  if (tools.has(lower)) return 'tool';
  return 'concept';
}

/**
 * 4 Category Metric Cards (Languages, Frameworks, Tools, Concepts).
 */
function SkillCategoryCards({ categoryMap }: { categoryMap: Record<'language' | 'framework' | 'tool' | 'concept', SkillEntry[]> }) {
  const cards = [
    { label: 'Languages', items: categoryMap.language, icon: Code, color: '#2563eb', bg: '#eff6ff', border: '#dbeafe' },
    { label: 'Frameworks & Libs', items: categoryMap.framework, icon: Layers, color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0' },
    { label: 'Tools & Cloud', items: categoryMap.tool, icon: Wrench, color: '#f97316', bg: '#fff7ed', border: '#fed7aa' },
    { label: 'Core Concepts', items: categoryMap.concept, icon: Brain, color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 28 }}>
      {cards.map((cat) => {
        const Icon = cat.icon;
        return (
          <div key={cat.label} className="card" style={{ padding: '20px 22px', borderRadius: 20, border: `1px solid ${cat.border}`, background: '#ffffff', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{cat.label}</span>
                <div style={{ width: 36, height: 36, borderRadius: 12, background: cat.bg, color: cat.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={18} /></div>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>{cat.items.length}</div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {cat.items.slice(0, 4).map((s) => <span key={s.id} style={{ fontSize: '0.72rem', fontWeight: 600, background: cat.bg, color: cat.color, padding: '3px 8px', borderRadius: 6 }}>{s.skill_name}</span>)}
              {cat.items.length > 4 && <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#94a3b8', alignSelf: 'center' }}>+{cat.items.length - 4} more</span>}
              {cat.items.length === 0 && <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>None listed yet</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Radar Chart component for top skills.
 */
function SkillRadarCard({ skills }: { skills: SkillEntry[] }) {
  const data = [...skills].sort((a, b) => b.proficiency - a.proficiency).slice(0, 8).map((s) => ({ subject: s.skill_name, value: s.proficiency * 20, fullMark: 100 }));

  return (
    <div className="card" style={{ padding: 24, borderRadius: 20, border: '1px solid #e2e8f0', background: '#ffffff', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div><h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>Top Skills Radar</h2><p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#64748b' }}>Balanced assessment across highest proficiencies</p></div>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Zap size={18} /></div>
      </div>
      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid stroke="#e2e8f0" /><PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }} /><PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: 8, color: '#ffffff', fontSize: '0.8rem' }} formatter={(val: unknown) => [`${Number(val)}% Proficiency`, 'Score']} />
            <Radar dataKey="value" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.25} strokeWidth={2.5} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/**
 * Breakdown of proficiency distribution across tiers 1-5.
 */
function SkillProficiencyCard({ skills }: { skills: SkillEntry[] }) {
  const avg = skills.length > 0 ? (skills.reduce((acc, s) => acc + s.proficiency, 0) / skills.length).toFixed(1) : '0.0';

  return (
    <div className="card" style={{ padding: 24, borderRadius: 20, border: '1px solid #e2e8f0', background: '#ffffff', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div><h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>Proficiency Breakdown</h2><p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#64748b' }}>Distribution of mastery across {skills.length} skills</p></div>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BarChart3 size={18} /></div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px', background: '#f8faff', borderRadius: 14, border: '1px solid #e0e7ff', marginBottom: 20 }}>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#2563eb', lineHeight: 1 }}>{avg}<span style={{ fontSize: '1rem', color: '#94a3b8', fontWeight: 500 }}>/5</span></div>
          <div><div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b' }}>Average Portfolio Depth</div><div style={{ fontSize: '0.78rem', color: '#64748b' }}>Estimated through verified projects & coursework</div></div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[5, 4, 3, 2, 1].map((tier) => {
            const count = skills.filter((s) => s.proficiency === tier).length;
            const pct = skills.length > 0 ? (count / skills.length) * 100 : 0;
            const tierInfo = PROFICIENCY_CONFIG[tier];
            return (
              <div key={tier}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: 4 }}><span style={{ color: '#334155' }}>Level {tier} — {tierInfo.label}</span><span style={{ color: '#64748b' }}>{count} skill{count !== 1 ? 's' : ''} ({pct.toFixed(0)}%)</span></div>
                <div style={{ height: 8, background: '#f1f5f9', borderRadius: 9999, overflow: 'hidden' }}><div style={{ height: '100%', width: `${pct}%`, background: tierInfo.color, borderRadius: 9999, transition: 'width 0.4s ease' }} /></div>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', color: '#64748b', padding: '10px 14px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
        <Sparkles size={14} style={{ color: '#2563eb', flexShrink: 0 }} /><span>Adding GitHub repositories raises your skill tiers automatically.</span>
      </div>
    </div>
  );
}

/**
 * Filter header with search input and category pills.
 */
function SkillSearchHeader({ search, onSearch, category, onCategory }: { search: string; onSearch: (s: string) => void; category: string; onCategory: (c: string) => void }) {
  const tabs = [{ id: 'all', label: 'All' }, { id: 'language', label: 'Languages' }, { id: 'framework', label: 'Frameworks' }, { id: 'tool', label: 'Tools' }, { id: 'concept', label: 'Concepts' }];

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
      <div><h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>All Identified Skills</h2><p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#64748b' }}>Detailed contextual view of every competence on your profile</p></div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
        <div style={{ position: 'relative', minWidth: 220 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: 11, color: '#94a3b8' }} />
          <input type="text" placeholder="Search skill or evidence..." value={search} onChange={(e) => onSearch(e.target.value)} style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: 9999, border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', background: '#f8fafc' }} />
        </div>
        <div style={{ display: 'flex', background: '#f1f5f9', padding: 3, borderRadius: 9999 }}>
          {tabs.map((t) => (
            <button key={t.id} onClick={() => onCategory(t.id)} style={{ padding: '6px 14px', borderRadius: 9999, border: 'none', background: category === t.id ? '#ffffff' : 'transparent', color: category === t.id ? '#0f172a' : '#64748b', fontWeight: category === t.id ? 700 : 500, fontSize: '0.8rem', cursor: 'pointer', boxShadow: category === t.id ? '0 2px 6px rgba(0,0,0,0.06)' : 'none', transition: 'all 0.15s ease' }}>{t.label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Individual skill item card.
 */
function SkillCardItem({ skill, onDelete }: { skill: SkillEntry; onDelete?: (id: string) => void }) {
  const cat = resolveSkillCategory(skill.skill_name);
  const tier = PROFICIENCY_CONFIG[skill.proficiency] || PROFICIENCY_CONFIG[3];

  return (
    <div style={{ padding: '16px 18px', borderRadius: 16, border: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }} className="skill-card-hover">
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
          <div><span style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>{skill.skill_name}</span><span style={{ marginLeft: 8, fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', padding: '2px 6px', borderRadius: 6, background: '#f1f5f9', color: '#64748b' }}>{cat}</span></div>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 9px', borderRadius: 9999, color: tier.color, background: tier.bg, border: `1px solid ${tier.color}33`, flexShrink: 0 }}>{tier.label} ({skill.proficiency}/5)</span>
        </div>
        <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>{[1, 2, 3, 4, 5].map((s) => <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: s <= skill.proficiency ? tier.color : '#e2e8f0' }} />)}</div>
        {skill.evidence && <div style={{ fontSize: '0.78rem', color: '#475569', background: '#f8fafc', padding: '6px 10px', borderRadius: 8, border: '1px solid #f1f5f9', fontStyle: 'italic', marginBottom: 10 }}>"{skill.evidence}"</div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid #f1f5f9', fontSize: '0.72rem', color: '#94a3b8' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle2 size={12} style={{ color: '#10b981' }} />{skill.source === 'extracted' ? 'Resume Extracted' : 'User Verified'}</span>
        {onDelete && <button onClick={() => onDelete(skill.id)} style={{ border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer', padding: 4 }} title="Remove skill"><Trash2 size={14} /></button>}
      </div>
    </div>
  );
}

/**
 * Modal to add a custom skill.
 */
function AddSkillModal({ isOpen, onClose, onAdd }: { isOpen: boolean; onClose: () => void; onAdd: (name: string, prof: number, cat: string, ev: string) => void }) {
  const [name, setName] = useState('');
  const [prof, setProf] = useState(3);
  const [cat, setCat] = useState('language');
  const [evidence, setEvidence] = useState('');

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
      <div className="card" style={{ maxWidth: 460, width: '100%', padding: 28, borderRadius: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.15)', border: '1px solid #e2e8f0', background: '#ffffff' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>Add Custom Skill</h3>
          <button onClick={onClose} style={{ border: 'none', background: '#f1f5f9', borderRadius: 9999, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', cursor: 'pointer' }}><X size={16} /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); if (name.trim()) { onAdd(name.trim(), prof, cat, evidence.trim()); setName(''); setEvidence(''); onClose(); } }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div><label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: 6 }}>Skill Name</label><input type="text" required placeholder="e.g. Next.js, Kubernetes, PyTorch" value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }} /></div>
          <div><label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: 6 }}>Category</label><select value={cat} onChange={(e) => setCat(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', background: '#ffffff' }}><option value="language">Programming Language</option><option value="framework">Framework / Library</option><option value="tool">Developer Tool / Cloud</option><option value="concept">Core CS Concept</option></select></div>
          <div><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>Proficiency Level</label><span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#2563eb' }}>{PROFICIENCY_CONFIG[prof].label} ({prof}/5)</span></div><input type="range" min="1" max="5" value={prof} onChange={(e) => setProf(Number(e.target.value))} style={{ width: '100%', cursor: 'pointer' }} /></div>
          <div><label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: 6 }}>Context or Evidence (Optional)</label><input type="text" placeholder="e.g. Built microservices with 10k users" value={evidence} onChange={(e) => setEvidence(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }} /></div>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}><button type="button" onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: 9999, border: '1px solid #cbd5e1', background: '#ffffff', color: '#64748b', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' }}>Cancel</button><button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '11px', borderRadius: 9999, fontWeight: 600, fontSize: '0.88rem' }}>Save Skill</button></div>
        </form>
      </div>
    </div>
  );
}

/**
 * Skills Portfolio view.
 */
function SkillsPortfolioHeader({ count, onAddSkill }: { count: number; onAddSkill?: () => void }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 20, marginBottom: 28 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}><h1 className="page-title" style={{ margin: 0, fontSize: '1.85rem' }}>Skills Portfolio</h1><span style={{ background: '#eff6ff', color: '#2563eb', fontWeight: 700, fontSize: '0.8rem', padding: '3px 10px', borderRadius: 9999, border: '1px solid #dbeafe' }}>{count} Extracted & Validated</span></div>
        <p className="page-description" style={{ margin: 0 }}>Skills verified from your uploaded resume and projects, scored across 5 proficiency tiers.</p>
      </div>
      {onAddSkill && <button className="btn btn-primary" onClick={onAddSkill} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 9999, fontWeight: 600, boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)' }}><Plus size={16} /> Add New Skill</button>}
    </div>
  );
}

function SkillsCatalogCard({ skills, search, onSearch, category, onCategory, onDelete }: { skills: SkillEntry[]; search: string; onSearch: (s: string) => void; category: string; onCategory: (c: string) => void; onDelete?: (id: string) => void }) {
  return (
    <div className="card" style={{ padding: 24, borderRadius: 20, border: '1px solid #e2e8f0', background: '#ffffff', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
      <SkillSearchHeader search={search} onSearch={onSearch} category={category} onCategory={onCategory} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
        {skills.map((s) => <SkillCardItem key={s.id} skill={s} onDelete={onDelete} />)}
        {skills.length === 0 && <div style={{ gridColumn: '1 / -1', padding: '48px 20px', textAlign: 'center', color: '#94a3b8' }}><Search size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} /><div style={{ fontSize: '1rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>No matching skills found</div><div style={{ fontSize: '0.84rem' }}>Try searching for a different keyword or select another category filter.</div></div>}
      </div>
    </div>
  );
}

function useFilteredSkills(skills: SkillEntry[], search: string, cat: string) {
  const categoryMap: Record<'language' | 'framework' | 'tool' | 'concept', SkillEntry[]> = { language: [], framework: [], tool: [], concept: [] };
  skills.forEach((s) => categoryMap[resolveSkillCategory(s.skill_name)].push(s));
  const filtered = skills.filter((s) => {
    const matchesSearch = s.skill_name.toLowerCase().includes(search.toLowerCase()) || (s.evidence && s.evidence.toLowerCase().includes(search.toLowerCase()));
    const matchesCat = cat === 'all' || cat === resolveSkillCategory(s.skill_name);
    return matchesSearch && matchesCat;
  });
  return { categoryMap, filtered };
}

export default function Skills({ profile, setProfile }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  if (!profile) return null;
  const { categoryMap, filtered } = useFilteredSkills(profile.skills, searchTerm, selectedCategory);

  const handleAddSkill = (name: string, prof: number, _cat: string, evidence: string) => {
    const newSkill: SkillEntry = { id: 'skl_' + Math.random().toString(36).substring(2, 9), skill_name: name, proficiency: prof, evidence: evidence || undefined, source: 'manual' };
    const updated: StudentProfile = { ...profile, skills: [...profile.skills, newSkill], updated_at: new Date().toISOString() };
    if (setProfile) setProfile(updated);
    localStorage.setItem('careerai_student_profile', JSON.stringify(updated));
  };

  const handleDeleteSkill = (id: string) => {
    const updated: StudentProfile = { ...profile, skills: profile.skills.filter((s) => s.id !== id), updated_at: new Date().toISOString() };
    if (setProfile) setProfile(updated);
    localStorage.setItem('careerai_student_profile', JSON.stringify(updated));
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: 40 }}>
      <SkillsPortfolioHeader count={profile.skills.length} onAddSkill={setProfile ? () => setShowAddModal(true) : undefined} />
      <SkillCategoryCards categoryMap={categoryMap} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20, marginBottom: 28 }}>
        <SkillRadarCard skills={profile.skills} />
        <SkillProficiencyCard skills={profile.skills} />
      </div>
      <SkillsCatalogCard skills={filtered} search={searchTerm} onSearch={setSearchTerm} category={selectedCategory} onCategory={setSelectedCategory} onDelete={setProfile ? handleDeleteSkill : undefined} />
      <AddSkillModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onAdd={handleAddSkill} />
    </div>
  );
}
