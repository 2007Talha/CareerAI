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

export default function Skills({ profile, setProfile }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillProficiency, setNewSkillProficiency] = useState<number>(3);
  const [newSkillCategory, setNewSkillCategory] = useState<string>('language');
  const [newSkillEvidence, setNewSkillEvidence] = useState('');

  if (!profile) return null;

  // Known categories definition
  const languageSkills = new Set(['python', 'javascript', 'typescript', 'java', 'c++', 'c#', 'go', 'rust', 'sql', 'r', 'bash', 'html', 'css']);
  const frameworkSkills = new Set(['react', 'node.js', 'django', 'flask', 'fastapi', 'spring boot', 'tensorflow', 'pytorch', 'scikit-learn', 'express.js', 'next.js', 'pandas', 'numpy', 'vue', 'angular']);
  const toolSkills = new Set(['docker', 'kubernetes', 'aws', 'gcp', 'azure', 'git', 'postgresql', 'mongodb', 'redis', 'linux', 'terraform', 'jenkins', 'ci/cd', 'kafka', 'postman']);

  const getSkillCategory = (name: string): 'language' | 'framework' | 'tool' | 'concept' => {
    const lower = name.toLowerCase();
    if (languageSkills.has(lower)) return 'language';
    if (frameworkSkills.has(lower)) return 'framework';
    if (toolSkills.has(lower)) return 'tool';
    return 'concept';
  };

  const categoryMap: Record<'language' | 'framework' | 'tool' | 'concept', SkillEntry[]> = {
    language: [],
    framework: [],
    tool: [],
    concept: [],
  };

  profile.skills.forEach(s => {
    const cat = getSkillCategory(s.skill_name);
    categoryMap[cat].push(s);
  });

  // Filter skills
  const filteredSkills = profile.skills.filter(s => {
    const matchesSearch = s.skill_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.evidence && s.evidence.toLowerCase().includes(searchTerm.toLowerCase()));
    const cat = getSkillCategory(s.skill_name);
    const matchesCat = selectedCategory === 'all' || selectedCategory === cat;
    return matchesSearch && matchesCat;
  });

  // Top skills for radar chart
  const topSkills = [...profile.skills]
    .sort((a, b) => b.proficiency - a.proficiency)
    .slice(0, 8)
    .map(s => ({
      subject: s.skill_name,
      value: s.proficiency * 20,
      fullMark: 100,
    }));

  const proficiencyLabels: Record<number, { label: string; color: string; bg: string }> = {
    1: { label: 'Beginner', color: '#94a3b8', bg: '#f1f5f9' },
    2: { label: 'Elementary', color: '#3b82f6', bg: '#eff6ff' },
    3: { label: 'Intermediate', color: '#0ea5e9', bg: '#e0f2fe' },
    4: { label: 'Advanced', color: '#8b5cf6', bg: '#f5f3ff' },
    5: { label: 'Expert', color: '#10b981', bg: '#ecfdf5' },
  };

  const avgProficiency = profile.skills.length > 0
    ? (profile.skills.reduce((acc, s) => acc + s.proficiency, 0) / profile.skills.length).toFixed(1)
    : '0.0';

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;

    const newSkill: SkillEntry = {
      id: 'skl_' + Math.random().toString(36).substring(2, 9),
      skill_name: newSkillName.trim(),
      proficiency: Number(newSkillProficiency),
      evidence: newSkillEvidence.trim() || undefined,
      source: 'manual',
    };

    const updatedProfile: StudentProfile = {
      ...profile,
      skills: [...profile.skills, newSkill],
      updated_at: new Date().toISOString(),
    };

    if (setProfile) {
      setProfile(updatedProfile);
    }
    localStorage.setItem('careerai_student_profile', JSON.stringify(updatedProfile));

    setNewSkillName('');
    setNewSkillEvidence('');
    setShowAddModal(false);
  };

  const handleDeleteSkill = (id: string) => {
    const updatedProfile: StudentProfile = {
      ...profile,
      skills: profile.skills.filter(s => s.id !== id),
      updated_at: new Date().toISOString(),
    };
    if (setProfile) {
      setProfile(updatedProfile);
    }
    localStorage.setItem('careerai_student_profile', JSON.stringify(updatedProfile));
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: 40 }}>
      {/* Top Header & Metrics Banner */}
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
            <h1 className="page-title" style={{ margin: 0, fontSize: '1.85rem' }}>Skills Portfolio</h1>
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
              {profile.skills.length} Extracted & Validated
            </span>
          </div>
          <p className="page-description" style={{ margin: 0 }}>
            Skills verified from your uploaded resume and projects, scored across 5 proficiency tiers.
          </p>
        </div>

        {setProfile && (
          <button
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              borderRadius: 9999,
              fontWeight: 600,
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
            }}
          >
            <Plus size={16} /> Add New Skill
          </button>
        )}
      </div>

      {/* 4 Category Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16,
          marginBottom: 28,
        }}
      >
        {[
          {
            label: 'Languages',
            items: categoryMap.language,
            icon: Code,
            color: '#2563eb',
            bg: '#eff6ff',
            border: '#dbeafe',
          },
          {
            label: 'Frameworks & Libs',
            items: categoryMap.framework,
            icon: Layers,
            color: '#10b981',
            bg: '#ecfdf5',
            border: '#a7f3d0',
          },
          {
            label: 'Tools & Cloud',
            items: categoryMap.tool,
            icon: Wrench,
            color: '#f97316',
            bg: '#fff7ed',
            border: '#fed7aa',
          },
          {
            label: 'Core Concepts',
            items: categoryMap.concept,
            icon: Brain,
            color: '#8b5cf6',
            bg: '#f5f3ff',
            border: '#ddd6fe',
          },
        ].map(cat => {
          const Icon = cat.icon;
          return (
            <div
              key={cat.label}
              className="card"
              style={{
                padding: '20px 22px',
                borderRadius: 20,
                border: `1px solid ${cat.border}`,
                background: '#ffffff',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {cat.label}
                  </span>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 12,
                      background: cat.bg,
                      color: cat.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={18} />
                  </div>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>
                  {cat.items.length}
                </div>
              </div>

              {/* Sample tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {cat.items.slice(0, 4).map(s => (
                  <span
                    key={s.id}
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      background: cat.bg,
                      color: cat.color,
                      padding: '3px 8px',
                      borderRadius: 6,
                    }}
                  >
                    {s.skill_name}
                  </span>
                ))}
                {cat.items.length > 4 && (
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#94a3b8', alignSelf: 'center' }}>
                    +{cat.items.length - 4} more
                  </span>
                )}
                {cat.items.length === 0 && (
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
                    None listed yet
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid: Radar Chart + Skill Distribution */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: 20,
          marginBottom: 28,
        }}
      >
        {/* Radar Chart */}
        <div
          className="card"
          style={{
            padding: 24,
            borderRadius: 20,
            border: '1px solid #e2e8f0',
            background: '#ffffff',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                Top Skills Radar
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                Balanced assessment across highest evaluated proficiencies
              </p>
            </div>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Zap size={18} />
            </div>
          </div>

          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={topSkills}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }}
                />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: 8,
                    color: '#ffffff',
                    fontSize: '0.8rem',
                  }}
                  formatter={(val: unknown) => [`${Number(val)}% Proficiency`, 'Score']}
                />
                <Radar
                  dataKey="value"
                  stroke="#2563eb"
                  fill="#3b82f6"
                  fillOpacity={0.25}
                  strokeWidth={2.5}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Skill Portfolio Highlights */}
        <div
          className="card"
          style={{
            padding: 24,
            borderRadius: 20,
            border: '1px solid #e2e8f0',
            background: '#ffffff',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                  Proficiency Breakdown
                </h2>
                <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                  Distribution of mastery across all {profile.skills.length} skills
                </p>
              </div>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: '#ecfdf5',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <BarChart3 size={18} />
              </div>
            </div>

            {/* Average stat callout */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '14px 18px',
                background: '#f8faff',
                borderRadius: 14,
                border: '1px solid #e0e7ff',
                marginBottom: 20,
              }}
            >
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#2563eb', lineHeight: 1 }}>
                {avgProficiency}
                <span style={{ fontSize: '1rem', color: '#94a3b8', fontWeight: 500 }}>/5</span>
              </div>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b' }}>
                  Average Portfolio Depth
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Estimated through projects, repositories, and coursework
                </div>
              </div>
            </div>

            {/* Tier bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[5, 4, 3, 2, 1].map(tier => {
                const count = profile.skills.filter(s => s.proficiency === tier).length;
                const pct = profile.skills.length > 0 ? (count / profile.skills.length) * 100 : 0;
                const tierInfo = proficiencyLabels[tier];

                return (
                  <div key={tier}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: 4 }}>
                      <span style={{ color: '#334155' }}>
                        Level {tier} — {tierInfo.label}
                      </span>
                      <span style={{ color: '#64748b' }}>
                        {count} skill{count !== 1 ? 's' : ''} ({pct.toFixed(0)}%)
                      </span>
                    </div>
                    <div style={{ height: 8, background: '#f1f5f9', borderRadius: 9999, overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${pct}%`,
                          background: tierInfo.color,
                          borderRadius: 9999,
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            style={{
              marginTop: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: '0.78rem',
              color: '#64748b',
              padding: '10px 14px',
              background: '#f8fafc',
              borderRadius: 10,
              border: '1px solid #e2e8f0',
            }}
          >
            <Sparkles size={14} style={{ color: '#2563eb', flexShrink: 0 }} />
            <span>Adding real github repos and verified course projects raises your skill tiers automatically.</span>
          </div>
        </div>
      </div>

      {/* Skills Explorer & Catalog */}
      <div
        className="card"
        style={{
          padding: 24,
          borderRadius: 20,
          border: '1px solid #e2e8f0',
          background: '#ffffff',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            marginBottom: 20,
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
              All Identified Skills
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#64748b' }}>
              Detailed contextual view of every competence on your profile
            </p>
          </div>

          {/* Search Bar & Category Filters */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
            <div style={{ position: 'relative', minWidth: 220 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: 11, color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search skill or evidence..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 36px',
                  borderRadius: 9999,
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  outline: 'none',
                  background: '#f8fafc',
                }}
              />
            </div>

            {/* Filter Tabs */}
            <div
              style={{
                display: 'flex',
                background: '#f1f5f9',
                padding: 3,
                borderRadius: 9999,
              }}
            >
              {[
                { id: 'all', label: 'All' },
                { id: 'language', label: 'Languages' },
                { id: 'framework', label: 'Frameworks' },
                { id: 'tool', label: 'Tools' },
                { id: 'concept', label: 'Concepts' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 9999,
                    border: 'none',
                    background: selectedCategory === tab.id ? '#ffffff' : 'transparent',
                    color: selectedCategory === tab.id ? '#0f172a' : '#64748b',
                    fontWeight: selectedCategory === tab.id ? 700 : 500,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    boxShadow: selectedCategory === tab.id ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Skills Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 14,
          }}
        >
          {filteredSkills.map(skill => {
            const cat = getSkillCategory(skill.skill_name);
            const tierInfo = proficiencyLabels[skill.proficiency] || proficiencyLabels[3];

            return (
              <div
                key={skill.id}
                style={{
                  padding: '16px 18px',
                  borderRadius: 16,
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
                className="skill-card-hover"
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                    <div>
                      <span style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                        {skill.skill_name}
                      </span>
                      <span
                        style={{
                          marginLeft: 8,
                          fontSize: '0.68rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          padding: '2px 6px',
                          borderRadius: 6,
                          background: '#f1f5f9',
                          color: '#64748b',
                        }}
                      >
                        {cat}
                      </span>
                    </div>

                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '3px 9px',
                        borderRadius: 9999,
                        color: tierInfo.color,
                        background: tierInfo.bg,
                        border: `1px solid ${tierInfo.color}33`,
                        flexShrink: 0,
                      }}
                    >
                      {tierInfo.label} ({skill.proficiency}/5)
                    </span>
                  </div>

                  {/* Level meter dots */}
                  <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
                    {[1, 2, 3, 4, 5].map(step => (
                      <div
                        key={step}
                        style={{
                          flex: 1,
                          height: 4,
                          borderRadius: 2,
                          background: step <= skill.proficiency ? tierInfo.color : '#e2e8f0',
                        }}
                      />
                    ))}
                  </div>

                  {/* Context / Evidence */}
                  {skill.evidence && (
                    <div
                      style={{
                        fontSize: '0.78rem',
                        color: '#475569',
                        background: '#f8fafc',
                        padding: '6px 10px',
                        borderRadius: 8,
                        border: '1px solid #f1f5f9',
                        fontStyle: 'italic',
                        marginBottom: 10,
                      }}
                    >
                      "{skill.evidence}"
                    </div>
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: 8,
                    borderTop: '1px solid #f1f5f9',
                    fontSize: '0.72rem',
                    color: '#94a3b8',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle2 size={12} style={{ color: '#10b981' }} />
                    {skill.source === 'extracted' ? 'Resume Extracted' : 'User Verified'}
                  </span>

                  {setProfile && (
                    <button
                      onClick={() => handleDeleteSkill(skill.id)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        padding: 4,
                        borderRadius: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'color 0.15s ease',
                      }}
                      title="Remove skill"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {filteredSkills.length === 0 && (
            <div
              style={{
                gridColumn: '1 / -1',
                padding: '48px 20px',
                textAlign: 'center',
                color: '#94a3b8',
              }}
            >
              <Search size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <div style={{ fontSize: '1rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                No matching skills found
              </div>
              <div style={{ fontSize: '0.84rem' }}>
                Try searching for a different keyword or select another category filter.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Skill Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20,
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: 460,
              width: '100%',
              padding: 28,
              borderRadius: 24,
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
              border: '1px solid #e2e8f0',
              background: '#ffffff',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
                Add Custom Skill
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  border: 'none',
                  background: '#f1f5f9',
                  borderRadius: 9999,
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b',
                  cursor: 'pointer',
                }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddSkill} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                  Skill Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Next.js, Kubernetes, PyTorch"
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 12,
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                  Category
                </label>
                <select
                  value={newSkillCategory}
                  onChange={(e) => setNewSkillCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 12,
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    outline: 'none',
                    background: '#ffffff',
                  }}
                >
                  <option value="language">Programming Language</option>
                  <option value="framework">Framework / Library</option>
                  <option value="tool">Developer Tool / Cloud</option>
                  <option value="concept">Core CS Concept / Methodology</option>
                </select>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
                    Proficiency Level
                  </label>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#2563eb' }}>
                    {proficiencyLabels[newSkillProficiency].label} ({newSkillProficiency}/5)
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={newSkillProficiency}
                  onChange={(e) => setNewSkillProficiency(Number(e.target.value))}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                  Context or Evidence (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Built microservices with 10k users"
                  value={newSkillEvidence}
                  onChange={(e) => setNewSkillEvidence(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 12,
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    flex: 1,
                    padding: '11px',
                    borderRadius: 9999,
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#64748b',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    flex: 1,
                    padding: '11px',
                    borderRadius: 9999,
                    fontWeight: 600,
                    fontSize: '0.88rem',
                  }}
                >
                  Save Skill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
