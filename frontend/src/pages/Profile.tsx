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

const SKILL_COLOR_THEMES = [
  { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
  { bg: '#f5f3ff', text: '#7c3aed', border: '#ddd6fe' },
  { bg: '#f0fdfa', text: '#0d9488', border: '#99f6e4' },
  { bg: '#fdf2f8', text: '#db2777', border: '#fbcfe8' },
  { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa' },
];

/**
 * 2x3 Grid of Basic Information summary chips.
 */
function ProfileBasicInfoGrid({ profile }: { profile: StudentProfile }) {
  const gpaPercent = profile.gpa && (profile.gpa_scale || 10) > 0 ? `${((profile.gpa / (profile.gpa_scale || 10)) * 100).toFixed(1)}%` : '85.0%';

  return (
    <div className="grid-2" style={{ gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: '#f8fafc', borderRadius: 14, border: '1px solid #e2e8f0' }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}><User size={20} /></div>
        <div><div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Name</div><div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#0f172a' }}>{profile.full_name}</div></div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: '#f8fafc', borderRadius: 14, border: '1px solid #e2e8f0' }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}><Mail size={20} /></div>
        <div><div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Email</div><div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#0f172a' }}>{profile.email || 'engineeringcandidate@example.com'}</div></div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: '#f8fafc', borderRadius: 14, border: '1px solid #e2e8f0' }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}><GraduationCap size={20} /></div>
        <div><div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>University</div><div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#0f172a' }}>{profile.university || 'University'}</div></div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: '#f8fafc', borderRadius: 14, border: '1px solid #e2e8f0' }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}><Award size={20} /></div>
        <div><div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Degree</div><div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#0f172a' }}>{profile.degree || 'B.Tech Computer Science'}</div></div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: '#f8fafc', borderRadius: 14, border: '1px solid #e2e8f0' }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}><Calendar size={20} /></div>
        <div><div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Graduation</div><div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#0f172a' }}>{profile.graduation_year || 2025}</div></div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: '#f8fafc', borderRadius: 14, border: '1px solid #e2e8f0' }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}><Medal size={20} /></div>
        <div><div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>GPA</div><div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#0f172a' }}>{profile.gpa ? `${profile.gpa} / ${profile.gpa_scale || 10}` : '8.5 / 10'}</div><div style={{ fontSize: '0.7rem', color: '#2563eb', fontWeight: 500, marginTop: 2 }}>{gpaPercent}</div></div>
      </div>
    </div>
  );
}

/**
 * Edit form for basic profile attributes.
 */
function ProfileBasicInfoEditForm({ form, setForm }: { form: { full_name: string; email: string; university: string; degree: string; graduation_year: string; gpa: string }; setForm: (f: { full_name: string; email: string; university: string; degree: string; graduation_year: string; gpa: string }) => void }) {
  return (
    <div className="grid-2" style={{ gap: 16 }}>
      <div><label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Full Name</label><input className="form-input" style={{ width: '100%', marginTop: 4, padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
      <div><label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Email</label><input className="form-input" style={{ width: '100%', marginTop: 4, padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
      <div><label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>University</label><input className="form-input" style={{ width: '100%', marginTop: 4, padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }} value={form.university} onChange={(e) => setForm({ ...form, university: e.target.value })} /></div>
      <div><label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Degree</label><input className="form-input" style={{ width: '100%', marginTop: 4, padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }} value={form.degree} onChange={(e) => setForm({ ...form, degree: e.target.value })} /></div>
      <div><label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Graduation</label><input className="form-input" style={{ width: '100%', marginTop: 4, padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }} value={form.graduation_year} onChange={(e) => setForm({ ...form, graduation_year: e.target.value })} /></div>
      <div><label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>GPA (out of 10)</label><input className="form-input" type="number" step="0.01" max="10" style={{ width: '100%', marginTop: 4, padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }} value={form.gpa} onChange={(e) => setForm({ ...form, gpa: e.target.value })} /></div>
    </div>
  );
}

/**
 * Expandable Skills badge list card.
 */
function ProfileSkillsCard({ skills }: { skills: StudentProfile['skills'] }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="card" style={{ marginBottom: 20, padding: 26 }}>
      <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: open ? 18 : 0, cursor: 'pointer' }} onClick={() => setOpen(!open)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6' }}><Sparkles size={18} /></div>
          <div className="card-title" style={{ fontSize: '1.15rem' }}>Skills ({skills.length})</div>
        </div>
        {open ? <ChevronUp size={20} style={{ color: '#94a3b8' }} /> : <ChevronDown size={20} style={{ color: '#94a3b8' }} />}
      </div>
      {open && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, paddingTop: 4 }}>
          {skills.map((skill, idx) => {
            const theme = SKILL_COLOR_THEMES[idx % SKILL_COLOR_THEMES.length];
            return (
              <div key={skill.id || idx} style={{ background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text, borderRadius: 9999, padding: '6px 14px', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }} title={skill.evidence || ''}>
                <span>{skill.skill_name}</span>
                <span style={{ background: 'rgba(255, 255, 255, 0.8)', padding: '1px 6px', borderRadius: 9999, fontSize: '0.72rem', fontWeight: 700 }}>L{skill.proficiency}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Expandable Projects showcase card.
 */
function ProfileProjectsCard({ projects }: { projects: StudentProfile['projects'] }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="card" style={{ marginBottom: 20, padding: 26 }}>
      <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: open ? 18 : 0, cursor: 'pointer' }} onClick={() => setOpen(!open)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}><Briefcase size={18} /></div>
          <div className="card-title" style={{ fontSize: '1.15rem' }}>Projects ({projects.length})</div>
        </div>
        {open ? <ChevronUp size={20} style={{ color: '#94a3b8' }} /> : <ChevronDown size={20} style={{ color: '#94a3b8' }} />}
      </div>
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {projects.map((proj, idx) => (
            <div key={proj.id || idx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', flexShrink: 0 }}><Code size={22} /></div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>{proj.title}</div>
                  <span style={{ background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe', padding: '3px 10px', borderRadius: 9999, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em' }}>COMPLEXITY: {proj.complexity || 3}/5</span>
                </div>
                <p style={{ fontSize: '0.86rem', color: '#475569', lineHeight: 1.5, margin: 0 }}>{proj.description || 'Designed and engineered end-to-end full stack software application featured in resume portfolio.'}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Student profile view and basic info editor.
 */
function ProfileBasicInfoCard({ profile, isEditing, editForm, setEditForm, onSave, onToggleEdit }: { profile: StudentProfile; isEditing: boolean; editForm: { full_name: string; email: string; university: string; degree: string; graduation_year: string; gpa: string }; setEditForm: (f: { full_name: string; email: string; university: string; degree: string; graduation_year: string; gpa: string }) => void; onSave: () => void; onToggleEdit: () => void }) {
  return (
    <div className="card" style={{ marginBottom: 20, padding: 26 }}>
      <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}><User size={18} /></div>
          <div className="card-title" style={{ fontSize: '1.15rem' }}>Basic Information</div>
        </div>
        <button type="button" onClick={() => (isEditing ? onSave() : onToggleEdit())} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 9999, background: '#ffffff', border: '1px solid #cbd5e1', color: '#334155', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', transition: 'all 0.2s' }}>
          <Edit2 size={13} style={{ color: '#2563eb' }} /> {isEditing ? 'Save' : 'Edit'}
        </button>
      </div>
      {isEditing ? <ProfileBasicInfoEditForm form={editForm} setForm={setEditForm} /> : <ProfileBasicInfoGrid profile={profile} />}
    </div>
  );
}

export default function Profile({ profile, setProfile }: Props) {
  const [isEditing, setIsEditing] = useState(false);
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

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ marginBottom: 26 }}>
        <h1 className="page-title">My Profile</h1>
        <p className="page-description">Your extracted profile data. This is what feeds the scoring formula. Review and confirm to proceed.</p>
      </div>
      <ProfileBasicInfoCard profile={profile} isEditing={isEditing} editForm={editForm} setEditForm={setEditForm} onSave={handleSave} onToggleEdit={() => setIsEditing(true)} />
      <ProfileSkillsCard skills={profile.skills} />
      <ProfileProjectsCard projects={profile.projects} />
    </div>
  );
}
