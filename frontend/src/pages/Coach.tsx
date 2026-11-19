import { useState, useRef, useEffect } from 'react';
import { Bot, User, Send, Sparkles, Target, Zap, Briefcase, HelpCircle, Copy, Check, Loader2 } from 'lucide-react';
import { sendCoachMessage } from '../api/client';
import type { StudentProfile, CoachMessage, RankingData, CareerMatchesResponse } from '../types';

interface Props {
  profile: StudentProfile | null;
  selectedCareerId: string;
  ranking?: RankingData | null;
  careerMatches?: CareerMatchesResponse | null;
}

interface Question {
  title: string;
  prompt: string;
  icon: typeof Target;
}

/**
 * Builds suggested prompts tailored to target role.
 * @param careerName Target career name
 * @returns Array of questions
 */
function getSuggestedQuestions(careerName: string): Question[] {
  return [
    { title: 'Jump to Top 10%', prompt: `What concrete project or skill upgrade will move my overall readiness score into the top percentile for ${careerName}?`, icon: Target },
    { title: 'High-ROI Skills', prompt: `Which of my skill gaps has the highest return-on-investment for landing a ${careerName} role?`, icon: Zap },
    { title: 'Review My Projects', prompt: `Critique my listed projects from an engineering manager's perspective. What makes them stand out, and what is missing?`, icon: Briefcase },
    { title: 'Mock Interview', prompt: `Give me a realistic technical interview question based on the technologies listed on my profile, then evaluate my answer.`, icon: HelpCircle },
  ];
}

interface EmptyProps {
  firstName: string;
  careerName: string;
  profile: StudentProfile;
  suggestedQuestions: Question[];
  onSelectPrompt: (p: string) => void;
}

/**
 * Empty conversation placeholder with quick suggestions.
 * @param props EmptyProps
 * @returns JSX Element
 */
function CoachEmptyState({ firstName, careerName, profile, suggestedQuestions, onSelectPrompt }: EmptyProps) {
  return (
    <div style={{ margin: 'auto', maxWidth: 540, textAlign: 'center', padding: '20px 0' }}>
      <div style={{ width: 60, height: 60, borderRadius: 20, background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <Bot size={32} />
      </div>
      <h3 style={{ margin: '0 0 8px', fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>Hello {firstName}! I'm your Career Coach.</h3>
      <p style={{ margin: '0 0 24px', fontSize: '0.88rem', color: '#64748b' }}>
        Loaded with your benchmark profile ({profile.skills.length} skills, {profile.projects.length} projects) and tuned for <strong>{careerName}</strong>.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, textAlign: 'left' }}>
        {suggestedQuestions.map((q, idx) => (
          <button key={idx} type="button" onClick={() => onSelectPrompt(q.prompt)} style={{ padding: '12px 14px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 14, display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', textAlign: 'left' }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <q.icon size={14} />
            </div>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>{q.title}</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>{q.prompt}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

interface BubbleProps {
  msg: CoachMessage;
  index: number;
  copiedIndex: number | null;
  onCopy: (content: string, i: number) => void;
}

/**
 * Individual message chat bubble.
 * @param props BubbleProps
 * @returns JSX Element
 */
function CoachMessageBubble({ msg, index, copiedIndex, onCopy }: BubbleProps) {
  const isBot = msg.role === 'assistant';

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, alignSelf: isBot ? 'flex-start' : 'flex-end', maxWidth: '84%' }}>
      {isBot && (
        <div style={{ width: 34, height: 34, borderRadius: 12, background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Bot size={18} />
        </div>
      )}
      <div style={{ background: isBot ? '#ffffff' : 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)', color: isBot ? '#1e293b' : '#ffffff', padding: '14px 18px', borderRadius: 20, border: isBot ? '1px solid #e2e8f0' : 'none', fontSize: '0.88rem', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
        {msg.content}
        {isBot && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8, paddingTop: 6, borderTop: '1px solid #f1f5f9', fontSize: '0.72rem' }}>
            <button type="button" onClick={() => onCopy(msg.content, index)} style={{ border: 'none', background: 'transparent', color: copiedIndex === index ? '#10b981' : '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              {copiedIndex === index ? <Check size={12} /> : <Copy size={12} />} <span>{copiedIndex === index ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        )}
      </div>
      {!isBot && (
        <div style={{ width: 34, height: 34, borderRadius: 12, background: '#e2e8f0', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <User size={18} />
        </div>
      )}
    </div>
  );
}

interface SidebarProps {
  profile: StudentProfile;
  careerName: string;
  ranking?: RankingData | null;
  suggestedQuestions: Question[];
  onSelectPrompt: (p: string) => void;
}

/**
 * Contextual profile and prompt sidebar.
 * @param props SidebarProps
 * @returns JSX Element
 */
function CoachSidebarContext({ profile, careerName, ranking, suggestedQuestions, onSelectPrompt }: SidebarProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card" style={{ padding: 20, borderRadius: 20, border: '1px solid #e2e8f0', background: '#ffffff' }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 12 }}>Student Snapshot</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.82rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Candidate</span><span style={{ fontWeight: 700 }}>{profile.full_name}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Target Role</span><span style={{ fontWeight: 700, color: '#2563eb' }}>{careerName}</span></div>
          {ranking && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Readiness</span><span style={{ fontWeight: 800, color: '#10b981' }}>{ranking.overall_score.toFixed(1)} / 100</span></div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Verified Skills</span><span style={{ fontWeight: 700 }}>{profile.skills.length}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Projects</span><span style={{ fontWeight: 700 }}>{profile.projects.length}</span></div>
        </div>
      </div>

      <div className="card" style={{ padding: 20, borderRadius: 20, border: '1px solid #e2e8f0', background: '#ffffff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Sparkles size={16} color="#2563eb" /> <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>Quick Prompt Ideas</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {suggestedQuestions.map((q, idx) => (
            <button key={idx} type="button" onClick={() => onSelectPrompt(q.prompt)} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #f1f5f9', background: '#f8fafc', color: '#334155', fontSize: '0.78rem', fontWeight: 600, textAlign: 'left', cursor: 'pointer' }}>
              • {q.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * AI Career Coach page view.
 * @param props Props
 * @returns JSX Element
 */
export default function Coach({ profile, selectedCareerId, ranking, careerMatches }: Props) {
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (!profile) return null;

  const currentCareer = careerMatches?.matches?.find((m) => m.career.id === selectedCareerId)?.career;
  const careerName = currentCareer?.name || 'Software Engineer';
  const firstName = profile.full_name ? profile.full_name.split(' ')[0] : 'there';
  const suggestedQuestions = getSuggestedQuestions(careerName);

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!profile || !textToSend || loading) return;

    setInput('');
    setLoading(true);
    setMessages((prev) => [...prev, { role: 'user', content: textToSend, created_at: new Date().toISOString() }]);

    try {
      const response = await sendCoachMessage(profile.id, textToSend, selectedCareerId);
      if (response && response.history) setMessages(response.history);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: "I'm analyzing your profile against industry benchmarks. Ask about a specific skill, project, or role gap!", created_at: new Date().toISOString() }]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (content: string, i: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(i);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: 30 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title" style={{ margin: 0, fontSize: '1.85rem' }}>AI Career Coach</h1>
          <p className="page-description" style={{ margin: 0 }}>Grounded guidance based on your empirical resume, skills, and target role.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', background: '#ffffff', borderRadius: 9999, border: '1px solid #e2e8f0' }}>
          <Target size={15} color="#2563eb" /> <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Target Role:</span> <span style={{ fontSize: '0.84rem', fontWeight: 700 }}>{careerName}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: 20, alignItems: 'start' }}>
        <div className="card" style={{ padding: 0, borderRadius: 24, border: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 220px)', minHeight: 560, overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20, background: '#fafcff' }}>
            {messages.length === 0 && (
              <CoachEmptyState firstName={firstName} careerName={careerName} profile={profile} suggestedQuestions={suggestedQuestions} onSelectPrompt={handleSend} />
            )}
            {messages.map((msg, i) => (
              <CoachMessageBubble key={i} msg={msg} index={i} copiedIndex={copiedIndex} onCopy={handleCopy} />
            ))}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 18px', background: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', width: 'fit-content' }}>
                <Loader2 size={16} className="animate-spin" color="#2563eb" /> <span style={{ fontSize: '0.84rem', color: '#64748b' }}>AI Coach is consulting your benchmark data...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div style={{ padding: '16px 20px', borderTop: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', gap: 12 }}>
            <input type="text" placeholder={`Ask anything about ${careerName}, closing gaps, or scoring...`} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} disabled={loading} style={{ flex: 1, padding: '12px 18px', borderRadius: 9999, border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }} />
            <button type="button" onClick={() => handleSend()} disabled={loading || !input.trim()} className="btn btn-primary" style={{ borderRadius: 9999, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
              <span>Send</span> <Send size={15} />
            </button>
          </div>
        </div>

        <CoachSidebarContext profile={profile} careerName={careerName} ranking={ranking} suggestedQuestions={suggestedQuestions} onSelectPrompt={handleSend} />
      </div>
    </div>
  );
}
