import { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  Copy,
  Check,
  Target,
  Zap,
  HelpCircle,
  Briefcase,
  Loader2,
} from 'lucide-react';
import { sendCoachMessage } from '../api/client';
import type { StudentProfile, CoachMessage, RankingData, CareerMatchesResponse } from '../types';

interface Props {
  profile: StudentProfile | null;
  selectedCareerId: string;
  ranking?: RankingData | null;
  careerMatches?: CareerMatchesResponse | null;
}

export default function Coach({ profile, selectedCareerId, ranking, careerMatches }: Props) {
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, loading]);

  if (!profile) return null;

  const currentCareer = careerMatches?.matches?.find((m) => m.career.id === selectedCareerId)?.career;
  const careerName = currentCareer?.name || 'Software Engineer';
  const firstName = profile.full_name ? profile.full_name.split(' ')[0] : 'there';

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!profile || !textToSend || loading) return;

    setInput('');
    setLoading(true);

    const now = new Date().toISOString();
    setMessages((prev) => [...prev, { role: 'user', content: textToSend, created_at: now }]);

    try {
      const response = await sendCoachMessage(profile.id, textToSend, selectedCareerId);
      if (response && response.history) {
        setMessages(response.history);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            "I'm analyzing your profile against industry benchmarks. Could you rephrase your question, or ask about a specific skill, project, or role gap?",
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const suggestedQuestions = [
    {
      title: 'Jump to Top 10%',
      prompt: `What concrete project or skill upgrade will move my overall readiness score into the top percentile for ${careerName}?`,
      icon: Target,
    },
    {
      title: 'High-ROI Skills',
      prompt: `Which of my skill gaps has the highest return-on-investment for landing a ${careerName} role?`,
      icon: Zap,
    },
    {
      title: 'Review My Projects',
      prompt: `Critique my listed projects from an engineering manager's perspective. What makes them stand out, and what is missing?`,
      icon: Briefcase,
    },
    {
      title: 'Mock Technical Question',
      prompt: `Give me a realistic technical interview question based on the technologies listed on my profile, then evaluate my answer.`,
      icon: HelpCircle,
    },
  ];

  return (
    <div className="animate-fade-in" style={{ paddingBottom: 30 }}>
      {/* Coach Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1 className="page-title" style={{ margin: 0, fontSize: '1.85rem' }}>AI Career Coach</h1>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: '#ecfdf5',
                color: '#059669',
                fontWeight: 700,
                fontSize: '0.78rem',
                padding: '3px 10px',
                borderRadius: 9999,
                border: '1px solid #a7f3d0',
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
              Live Benchmark Context Active
            </span>
          </div>
          <p className="page-description" style={{ margin: 0 }}>
            Trained on empirical hiring rubrics. Provides unbiased, grounded guidance based on your real resume, skills, and target role.
          </p>
        </div>

        {/* Target Context Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 16px',
            background: '#ffffff',
            borderRadius: 9999,
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          }}
        >
          <Target size={15} style={{ color: '#2563eb' }} />
          <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Target Role:</span>
          <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a' }}>{careerName}</span>
        </div>
      </div>

      {/* Main Layout: Chat Container + Context Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 300px',
          gap: 20,
          alignItems: 'start',
        }}
      >
        {/* Chat Main Window */}
        <div
          className="card"
          style={{
            padding: 0,
            borderRadius: 24,
            border: '1px solid #e2e8f0',
            background: '#ffffff',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            height: 'calc(100vh - 220px)',
            minHeight: 560,
            overflow: 'hidden',
          }}
        >
          {/* Chat Messages Scrollable Box */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '24px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
              background: '#fafcff',
            }}
          >
            {messages.length === 0 && (
              <div style={{ margin: 'auto', maxWidth: 540, textAlign: 'center', padding: '20px 0' }}>
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 20,
                    background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                    color: '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.15)',
                  }}
                >
                  <Bot size={32} />
                </div>
                <h3 style={{ margin: '0 0 8px', fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
                  Hello {firstName}! I'm your Career Coach.
                </h3>
                <p style={{ margin: '0 0 24px', fontSize: '0.88rem', color: '#64748b', lineHeight: 1.6 }}>
                  I'm loaded with your benchmark profile ({profile.skills.length} skills, {profile.projects.length} projects)
                  and tuned for <strong>{careerName}</strong>. Ask me anything about closing your gaps or improving your readiness.
                </p>

                {/* Suggested Prompts Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, textAlign: 'left' }}>
                  {suggestedQuestions.map((q, idx) => {
                    const Icon = q.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSend(q.prompt)}
                        style={{
                          padding: '12px 14px',
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: 14,
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 10,
                          cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                          transition: 'all 0.15s ease',
                          textAlign: 'left',
                        }}
                        className="btn-suggestion-hover"
                      >
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            background: '#eff6ff',
                            color: '#2563eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Icon size={14} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>
                            {q.title}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {q.prompt}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {messages.map((msg, i) => {
              const isAssistant = msg.role === 'assistant';
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    alignSelf: isAssistant ? 'flex-start' : 'flex-end',
                    maxWidth: '84%',
                  }}
                >
                  {isAssistant && (
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 12,
                        background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: 2,
                        boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
                      }}
                    >
                      <Bot size={18} />
                    </div>
                  )}

                  <div
                    style={{
                      background: isAssistant ? '#ffffff' : 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                      color: isAssistant ? '#1e293b' : '#ffffff',
                      padding: '14px 18px',
                      borderRadius: 20,
                      borderTopLeftRadius: isAssistant ? 4 : 20,
                      borderTopRightRadius: isAssistant ? 20 : 4,
                      border: isAssistant ? '1px solid #e2e8f0' : 'none',
                      boxShadow: isAssistant
                        ? '0 4px 14px rgba(0, 0, 0, 0.03)'
                        : '0 4px 14px rgba(37, 99, 235, 0.2)',
                      fontSize: '0.88rem',
                      lineHeight: 1.65,
                      whiteSpace: 'pre-wrap',
                      position: 'relative',
                    }}
                  >
                    {msg.content}

                    {isAssistant && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: 10,
                          marginTop: 8,
                          paddingTop: 6,
                          borderTop: '1px solid #f1f5f9',
                          fontSize: '0.72rem',
                          color: '#94a3b8',
                        }}
                      >
                        <button
                          onClick={() => copyToClipboard(msg.content, i)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            border: 'none',
                            background: 'transparent',
                            color: copiedIndex === i ? '#10b981' : '#94a3b8',
                            cursor: 'pointer',
                            padding: 2,
                          }}
                        >
                          {copiedIndex === i ? <Check size={12} /> : <Copy size={12} />}
                          <span>{copiedIndex === i ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {!isAssistant && (
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 12,
                        background: '#e2e8f0',
                        color: '#475569',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    >
                      <User size={18} />
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, alignSelf: 'flex-start' }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Bot size={18} />
                </div>
                <div
                  style={{
                    padding: '12px 18px',
                    background: '#ffffff',
                    borderRadius: 18,
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: '0.84rem',
                    color: '#64748b',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  }}
                >
                  <Loader2 size={16} className="animate-spin" style={{ color: '#2563eb' }} />
                  <span>AI Coach is consulting your benchmark data...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <div
            style={{
              padding: '16px 20px',
              borderTop: '1px solid #e2e8f0',
              background: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <input
              ref={inputRef}
              type="text"
              placeholder={`Ask anything about ${careerName}, closing gaps, or scoring formula...`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px 18px',
                borderRadius: 9999,
                border: '1px solid #cbd5e1',
                fontSize: '0.9rem',
                outline: 'none',
                background: '#f8fafc',
                transition: 'border-color 0.2s',
              }}
            />

            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="btn btn-primary"
              style={{
                borderRadius: 9999,
                padding: '12px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontWeight: 600,
                fontSize: '0.88rem',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                opacity: loading || !input.trim() ? 0.6 : 1,
              }}
            >
              <span>Send</span>
              <Send size={15} />
            </button>
          </div>
        </div>

        {/* Context Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Active Context Card */}
          <div
            className="card"
            style={{
              padding: 20,
              borderRadius: 20,
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
            }}
          >
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 12 }}>
              Student Snapshot
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Full Name</span>
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a' }}>{profile.full_name}</span>
              </div>

              {profile.degree && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Degree</span>
                  <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#0f172a' }}>{profile.degree}</span>
                </div>
              )}

              {profile.gpa && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', color: '#64748b' }}>GPA</span>
                  <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#2563eb' }}>
                    {profile.gpa.toFixed(1)} / {profile.gpa_scale || 10}{' '}
                    <span style={{ fontSize: '0.72rem', fontWeight: 500, color: '#64748b' }}>
                      ({((profile.gpa / (profile.gpa_scale || 10)) * 100).toFixed(0)}%)
                    </span>
                  </span>
                </div>
              )}

              {ranking && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Readiness Score</span>
                    <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#2563eb' }}>
                      {ranking.overall_score.toFixed(1)} / 100
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Cohort Rank</span>
                    <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#10b981' }}>
                      #{ranking.cohort_rank} of {ranking.cohort_size}
                    </span>
                  </div>
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Identified Skills</span>
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a' }}>{profile.skills.length} skills</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Projects</span>
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a' }}>{profile.projects.length} verified</span>
              </div>
            </div>
          </div>

          {/* Quick Prompts Panel */}
          <div
            className="card"
            style={{
              padding: 20,
              borderRadius: 20,
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Sparkles size={16} style={{ color: '#2563eb' }} />
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>Quick Prompt Ideas</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q.prompt)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 10,
                    border: '1px solid #f1f5f9',
                    background: '#f8fafc',
                    color: '#334155',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  className="quick-chip-hover"
                >
                  • {q.title}
                </button>
              ))}
            </div>
          </div>

          {/* System Transparency Alert */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 14,
              border: '1px solid #e2e8f0',
              background: '#f8fafc',
              fontSize: '0.74rem',
              color: '#64748b',
              lineHeight: 1.5,
            }}
          >
            <div style={{ fontWeight: 700, color: '#334155', marginBottom: 2 }}>
              Deterministic Benchmark
            </div>
            This AI Coach references your real scores and skill metrics. It gives realistic advice to improve your rubric score.
          </div>
        </div>
      </div>
    </div>
  );
}
