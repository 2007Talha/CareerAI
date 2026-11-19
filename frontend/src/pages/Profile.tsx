import { useState } from 'react';
import {
  User,
  Mail,
  GraduationCap,
  Calendar,
  Award,
  Medal,
  ChevronDown,
  ChevronUp,
  Code,
  Briefcase,
  Edit2,
  Sparkles,
} from 'lucide-react';
import type { StudentProfile } from '../types';

interface Props {
  profile: StudentProfile | null;
  setProfile: (p: StudentProfile) => void;
}

export default function Profile({ profile, setProfile }: Props) {
  const [skillsOpen, setSkillsOpen] = useState(true);
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    full_name: profile?.full_name || '',
    email: profile?.email || '',
    university: profile?.university || '',
    degree: profile?.degree || '',
    graduation_year: profile?.graduation_year?.toString() || '2025',
    gpa: profile?.gpa?.toString() || '8.5',
  });

  if (!profile) return null;

  const handleSave = () => {
    setProfile({
      ...profile,
      full_name: editForm.full_name,
      email: editForm.email,
      university: editForm.university,
      degree: editForm.degree,
      graduation_year: parseInt(editForm.graduation_year) || 2025,
      gpa: parseFloat(editForm.gpa) || 8.5,
      gpa_scale: 10.0,
    });
    setIsEditing(false);
  };

  const skillColors = [
    { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
    { bg: '#f5f3ff', text: '#7c3aed', border: '#ddd6fe' },
    { bg: '#f0fdfa', text: '#0d9488', border: '#99f6e4' },
    { bg: '#fdf2f8', text: '#db2777', border: '#fbcfe8' },
    { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa' },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 26 }}>
        <h1 className="page-title">My Profile</h1>
        <p className="page-description">
          Your extracted profile data. This is what feeds the scoring formula. Review and confirm to proceed.
        </p>
      </div>

      {/* Basic Information Card (Photo 3) */}
      <div className="card" style={{ marginBottom: 20, padding: 26 }}>
        <div
          className="card-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 22,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563eb',
              }}
            >
              <User size={18} />
            </div>
            <div className="card-title" style={{ fontSize: '1.15rem' }}>
              Basic Information
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (isEditing) handleSave();
              else setIsEditing(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: 9999,
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#334155',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              transition: 'all 0.2s',
            }}
          >
            <Edit2 size={13} style={{ color: '#2563eb' }} />
            {isEditing ? 'Save' : 'Edit'}
          </button>
        </div>

        {isEditing ? (
          <div className="grid-2" style={{ gap: 16 }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Full Name</label>
              <input
                className="form-input"
                style={{ width: '100%', marginTop: 4, padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Email</label>
              <input
                className="form-input"
                style={{ width: '100%', marginTop: 4, padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>University</label>
              <input
                className="form-input"
                style={{ width: '100%', marginTop: 4, padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                value={editForm.university}
                onChange={(e) => setEditForm({ ...editForm, university: e.target.value })}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Degree</label>
              <input
                className="form-input"
                style={{ width: '100%', marginTop: 4, padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                value={editForm.degree}
                onChange={(e) => setEditForm({ ...editForm, degree: e.target.value })}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Graduation</label>
              <input
                className="form-input"
                style={{ width: '100%', marginTop: 4, padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                value={editForm.graduation_year}
                onChange={(e) => setEditForm({ ...editForm, graduation_year: e.target.value })}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>GPA (out of 10)</label>
              <input
                className="form-input"
                type="number"
                step="0.01"
                max="10"
                style={{ width: '100%', marginTop: 4, padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                value={editForm.gpa}
                onChange={(e) => setEditForm({ ...editForm, gpa: e.target.value })}
              />
            </div>
          </div>
        ) : (
          /* 2x3 Grid of Field Chips (Photo 3) */
          <div className="grid-2" style={{ gap: 14 }}>
            {/* Name */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 18px',
                background: '#f8fafc',
                borderRadius: 14,
                border: '1px solid #e2e8f0',
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: '#eff6ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2563eb',
                }}
              >
                <User size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Name</div>
                <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#0f172a' }}>
                  {profile.full_name}
                </div>
              </div>
            </div>

            {/* Email */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 18px',
                background: '#f8fafc',
                borderRadius: 14,
                border: '1px solid #e2e8f0',
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: '#eff6ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2563eb',
                }}
              >
                <Mail size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Email</div>
                <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#0f172a' }}>
                  {profile.email || 'engineeringcandidate@exemple.com'}
                </div>
              </div>
            </div>

            {/* University */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 18px',
                background: '#f8fafc',
                borderRadius: 14,
                border: '1px solid #e2e8f0',
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: '#ecfdf5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10b981',
                }}
              >
                <GraduationCap size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>University</div>
                <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#0f172a' }}>
                  {profile.university || 'University'}
                </div>
              </div>
            </div>

            {/* Degree */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 18px',
                background: '#f8fafc',
                borderRadius: 14,
                border: '1px solid #e2e8f0',
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: '#ecfdf5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10b981',
                }}
              >
                <Award size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Degree</div>
                <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#0f172a' }}>
                  {profile.degree || 'B.Tech Computer Science'}
                </div>
              </div>
            </div>

            {/* Graduation Year */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 18px',
                background: '#f8fafc',
                borderRadius: 14,
                border: '1px solid #e2e8f0',
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: '#fffbeb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#f59e0b',
                }}
              >
                <Calendar size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Graduation</div>
                <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#0f172a' }}>
                  {profile.graduation_year || 2025}
                </div>
              </div>
            </div>

            {/* GPA */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 18px',
                background: '#f8fafc',
                borderRadius: 14,
                border: '1px solid #e2e8f0',
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: '#fffbeb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#f59e0b',
                }}
              >
                <Medal size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>GPA</div>
                <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#0f172a' }}>
                  {profile.gpa ? `${profile.gpa} / ${profile.gpa_scale || 10}` : '8.5 / 10'}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#2563eb', fontWeight: 500, marginTop: 2 }}>
                  {profile.gpa && (profile.gpa_scale || 10) > 0
                    ? `${((profile.gpa / (profile.gpa_scale || 10)) * 100).toFixed(1)}%`
                    : '85.0%'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Skills Card (Photo 3) */}
      <div className="card" style={{ marginBottom: 20, padding: 26 }}>
        <div
          className="card-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: skillsOpen ? 18 : 0,
            cursor: 'pointer',
          }}
          onClick={() => setSkillsOpen(!skillsOpen)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: '#f5f3ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#8b5cf6',
              }}
            >
              <Sparkles size={18} />
            </div>
            <div className="card-title" style={{ fontSize: '1.15rem' }}>
              Skills ({profile.skills.length})
            </div>
          </div>
          {skillsOpen ? <ChevronUp size={20} style={{ color: '#94a3b8' }} /> : <ChevronDown size={20} style={{ color: '#94a3b8' }} />}
        </div>

        {skillsOpen && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, paddingTop: 4 }}>
            {profile.skills.map((skill, idx) => {
              const colorTheme = skillColors[idx % skillColors.length];
              return (
                <div
                  key={skill.id || idx}
                  style={{
                    background: colorTheme.bg,
                    border: `1px solid ${colorTheme.border}`,
                    color: colorTheme.text,
                    borderRadius: 9999,
                    padding: '6px 14px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                  }}
                  title={skill.evidence || ''}
                >
                  <span>{skill.skill_name}</span>
                  <span
                    style={{
                      background: 'rgba(255, 255, 255, 0.8)',
                      padding: '1px 6px',
                      borderRadius: 9999,
                      fontSize: '0.72rem',
                      fontWeight: 700,
                    }}
                  >
                    L{skill.proficiency}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Projects Card (Photo 3) */}
      <div className="card" style={{ marginBottom: 20, padding: 26 }}>
        <div
          className="card-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: projectsOpen ? 18 : 0,
            cursor: 'pointer',
          }}
          onClick={() => setProjectsOpen(!projectsOpen)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: '#ecfdf5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981',
              }}
            >
              <Briefcase size={18} />
            </div>
            <div className="card-title" style={{ fontSize: '1.15rem' }}>
              Projects ({profile.projects.length})
            </div>
          </div>
          {projectsOpen ? <ChevronUp size={20} style={{ color: '#94a3b8' }} /> : <ChevronDown size={20} style={{ color: '#94a3b8' }} />}
        </div>

        {projectsOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {profile.projects.map((proj, idx) => (
              <div
                key={proj.id || idx}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 16,
                  padding: 20,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 16,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: '#eff6ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#2563eb',
                    flexShrink: 0,
                  }}
                >
                  <Code size={22} />
                </div>

                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 8,
                      marginBottom: 6,
                    }}
                  >
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                      {proj.title}
                    </div>
                    <span
                      style={{
                        background: '#f5f3ff',
                        color: '#7c3aed',
                        border: '1px solid #ddd6fe',
                        padding: '3px 10px',
                        borderRadius: 9999,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                      }}
                    >
                      COMPLEXITY: {proj.complexity || 3}/5
                    </span>
                  </div>

                  <p style={{ fontSize: '0.86rem', color: '#475569', lineHeight: 1.5, margin: 0 }}>
                    {proj.description || 'Designed and engineered end-to-end full stack software application featured in resume portfolio.'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
