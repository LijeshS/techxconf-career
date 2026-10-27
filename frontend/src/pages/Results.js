import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAssessment, bookmarkSession } from '../api';
import SessionCard from '../components/SessionCard';
import GuardrailPanel from '../components/GuardrailPanel';
import TrackRadar from '../components/TrackRadar';

const TRACK_ICONS = {
  'Industry & Innovation': '🏭',
  'AI & Agentic Intelligence': '🤖',
  'Cloud, DevOps & FinOps': '☁️',
  'Data & Observability': '📊',
};

const DEMAND_COLORS = {
  '🔥 Critical': '#ef4444',
  '📈 High': '#f59e0b',
  '💰 Premium': '#10b981',
  '🌱 Emerging': '#6366f1',
};

export default function Results({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookmarked, setBookmarked] = useState(new Set());
  const [bookmarkMsg, setBookmarkMsg] = useState('');

  useEffect(() => {
    getAssessment(id)
      .then(data => { setResult(data); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [id]);

  const handleBookmark = async (sessionId) => {
    try {
      await bookmarkSession(user.id, sessionId);
      setBookmarked(b => new Set([...b, sessionId]));
      setBookmarkMsg('✅ Session saved to your plan!');
      setTimeout(() => setBookmarkMsg(''), 3000);
    } catch (err) { setBookmarkMsg('❌ ' + err.message); }
  };

  if (loading) return (
    <div className="loading-page"><div className="loading-spinner" /><p>Building your career plan…</p></div>
  );
  if (error) return (
    <div className="container-sm" style={{ paddingTop: '40px' }}>
      <div className="alert alert-danger">{error}</div>
      <button className="btn btn-secondary" onClick={() => navigate('/assess')}>← Try Again</button>
    </div>
  );

  const {
    recommended_track, track_scores,
    recommended_sessions = [],
    upskill_areas = [],
    career_roadmap = [],
    experience_level,
    guardrail_flags = [],
    observability_score, harness_pipeline_fit, pipeline_status,
  } = result;

  const guardrails = { guardrail_flags, observability_score, harness_pipeline_fit, pipeline_status };

  return (
    <div className="results-page container" style={{ paddingTop: '40px', paddingBottom: '60px' }}>

      {/* Header */}
      <div className="results-header">
        <div className="chip chip-success" style={{ marginBottom: '12px' }}>✓ Assessment Complete</div>
        <h1 className="section-title">
          {TRACK_ICONS[recommended_track]} Your Track: <span style={{ color: 'var(--primary-light)' }}>{recommended_track}</span>
        </h1>
        <p className="section-subtitle">{experience_level} level · Personalised to your profile · Guardrail-verified</p>
        {bookmarkMsg && <div className="alert alert-success" style={{ marginTop: '12px', display: 'inline-flex' }}>{bookmarkMsg}</div>}
      </div>

      <div className="results-grid">
        {/* ── LEFT MAIN COLUMN ── */}
        <div className="results-main">

          {/* Sessions */}
          <section aria-labelledby="sessions-heading">
            <h2 id="sessions-heading" className="section-title" style={{ fontSize: '1.2rem', marginBottom: '4px' }}>📅 Recommended Sessions</h2>
            <p className="section-subtitle">Ranked by fit to your profile</p>
            <div className="sessions-list">
              {recommended_sessions.length === 0
                ? <div className="alert alert-info">No sessions found. Try re-running the assessment.</div>
                : recommended_sessions.map((session, i) => (
                  <SessionCard key={session.id} session={session} priority={i === 0}
                    isBookmarked={bookmarked.has(session.id)} onBookmark={handleBookmark} />
                ))}
            </div>
          </section>

          {/* Skills to Develop */}
          <section aria-labelledby="upskill-heading" style={{ marginTop: '36px' }}>
            <h2 id="upskill-heading" className="section-title" style={{ fontSize: '1.2rem', marginBottom: '4px' }}>⚡ Skills to Develop</h2>
            <p className="section-subtitle">Based on 2026 job market data — ranked by demand in your target track</p>

            {upskill_areas.length === 0 ? (
              <div className="alert alert-info">Complete the assessment to see personalised skill recommendations.</div>
            ) : (
              <div className="skills-list">
                {upskill_areas.map((item, i) => {
                  // Support both old string format and new object format
                  const skill   = typeof item === 'string' ? item : item.skill;
                  const why     = typeof item === 'object' ? item.why : null;
                  const res_    = typeof item === 'object' ? item.resource : null;
                  const demand  = typeof item === 'object' ? item.demand : null;
                  const color   = demand ? (DEMAND_COLORS[demand] || 'var(--primary)') : 'var(--primary)';
                  return (
                    <div key={i} className="skill-card card">
                      <div className="skill-card-header">
                        <div className="skill-card-left">
                          <div className="skill-num">{i + 1}</div>
                          <div>
                            <div className="skill-name">{skill}</div>
                            {why && <div className="skill-why">{why}</div>}
                          </div>
                        </div>
                        {demand && (
                          <span className="skill-demand" style={{ color, borderColor: color }}>
                            {demand}
                          </span>
                        )}
                      </div>
                      {res_ && (
                        <div className="skill-resource">
                          📚 <strong>Start here:</strong> {res_}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* 12-Month Roadmap */}
          <section aria-labelledby="roadmap-heading" style={{ marginTop: '36px' }}>
            <h2 id="roadmap-heading" className="section-title" style={{ fontSize: '1.2rem', marginBottom: '4px' }}>🗺️ 12-Month Career Roadmap</h2>
            <p className="section-subtitle">Tailored to your experience level — concrete milestones, not vague advice</p>

            {career_roadmap.length === 0 ? (
              <div className="alert alert-info">Complete the assessment to see your personalised roadmap.</div>
            ) : (
              <div className="roadmap-phases">
                {career_roadmap.map((phase, i) => {
                  // Support both old string format and new object format
                  const isObj = typeof phase === 'object';
                  const month   = isObj ? phase.month   : `Step ${i + 1}`;
                  const title   = isObj ? phase.title   : null;
                  const tasks   = isObj ? phase.tasks   : null;
                  const outcome = isObj ? phase.outcome : null;
                  const text    = !isObj ? phase : null;

                  return (
                    <div key={i} className="roadmap-phase card">
                      <div className="roadmap-phase-header">
                        <div className="roadmap-phase-num">{i + 1}</div>
                        <div className="roadmap-phase-meta">
                          <span className="roadmap-month">{month}</span>
                          {title && <span className="roadmap-title">{title}</span>}
                        </div>
                      </div>

                      {text && <p className="roadmap-text">{text}</p>}

                      {tasks && (
                        <ul className="roadmap-tasks">
                          {tasks.map((task, j) => (
                            <li key={j} className="roadmap-task">
                              <span className="roadmap-task-icon">→</span>
                              {task}
                            </li>
                          ))}
                        </ul>
                      )}

                      {outcome && (
                        <div className="roadmap-outcome">
                          <span className="roadmap-outcome-icon">🎯</span>
                          <span><strong>Milestone:</strong> {outcome}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <aside className="results-sidebar">
          <TrackRadar trackScores={track_scores} />

          <div className="card" style={{ marginTop: '16px' }}>
            <h3 style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '16px' }}>📊 Track Score Breakdown</h3>
            {track_scores && Object.entries(track_scores).sort((a,b)=>b[1]-a[1]).map(([track, score]) => {
              const maxScore = Math.max(...Object.values(track_scores));
              const pct = Math.round((score / maxScore) * 100);
              return (
                <div key={track} className="track-score-row">
                  <div className="track-score-label">
                    <span>{TRACK_ICONS[track]}</span>
                    <span>{track.split(' ')[0]}</span>
                  </div>
                  <div className="progress-bar" style={{ flex: 1 }}>
                    <div className="progress-fill" style={{ width:`${pct}%`, background: track===recommended_track?'var(--primary)':'var(--border)' }} />
                  </div>
                  <span className="track-score-val">{score}</span>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '16px' }}><GuardrailPanel guardrails={guardrails} /></div>

          <div className="card" style={{ marginTop: '16px' }}>
            <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '12px' }}>Next Steps</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>📊 View My Full Plan</button>
              <button className="btn btn-secondary" onClick={() => navigate('/sessions')}>📅 Browse All Sessions</button>
              <button className="btn btn-secondary" onClick={() => navigate('/assess')}>🔄 Retake Assessment</button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
