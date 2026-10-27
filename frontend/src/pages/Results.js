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
      .then(data => {
        setResult(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  const handleBookmark = async (sessionId) => {
    try {
      await bookmarkSession(user.id, sessionId);
      setBookmarked(b => new Set([...b, sessionId]));
      setBookmarkMsg('✅ Session saved to your plan!');
      setTimeout(() => setBookmarkMsg(''), 3000);
    } catch (err) {
      setBookmarkMsg('❌ ' + err.message);
    }
  };

  if (loading) return (
    <div className="loading-page" aria-live="polite" aria-busy="true">
      <div className="loading-spinner" role="status" aria-label="Loading results" />
      <p>Crunching your career recommendations…</p>
    </div>
  );

  if (error) return (
    <div className="container-sm" style={{ paddingTop: '40px' }}>
      <div className="alert alert-danger" role="alert">{error}</div>
      <button className="btn btn-secondary" onClick={() => navigate('/assess')}>← Try Again</button>
    </div>
  );

  const { recommended_track, track_scores, recommended_sessions = [], upskill_areas = [], career_roadmap = [], experience_level, guardrail_flags = [], observability_score, harness_pipeline_fit, pipeline_status } = result;

  const guardrails = { guardrail_flags, observability_score, harness_pipeline_fit, pipeline_status };

  return (
    <div className="results-page container" style={{ paddingTop: '40px', paddingBottom: '60px' }}>
      {/* Header */}
      <div className="results-header">
        <div className="chip chip-success" style={{ marginBottom: '12px' }}>Assessment Complete</div>
        <h1 className="section-title">
          {TRACK_ICONS[recommended_track]} Your Track: <span style={{ color: 'var(--primary-light)' }}>{recommended_track}</span>
        </h1>
        <p className="section-subtitle">
          {experience_level} level · Personalized to your profile · Guardrail-verified
        </p>
        {bookmarkMsg && (
          <div className="alert alert-success" role="status" aria-live="polite" style={{ marginTop: '12px', display: 'inline-flex' }}>
            {bookmarkMsg}
          </div>
        )}
      </div>

      <div className="results-grid">
        {/* Left column */}
        <div className="results-main">
          {/* Recommended sessions */}
          <section aria-labelledby="sessions-heading">
            <h2 id="sessions-heading" className="section-title" style={{ fontSize: '1.2rem', marginBottom: '8px' }}>
              📅 Recommended Sessions
            </h2>
            <p className="section-subtitle">Ranked by fit to your profile</p>
            <div className="sessions-list">
              {recommended_sessions.length === 0 ? (
                <div className="alert alert-info">No sessions found. Try re-running the assessment.</div>
              ) : (
                recommended_sessions.map((session, i) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    priority={i === 0}
                    isBookmarked={bookmarked.has(session.id)}
                    onBookmark={handleBookmark}
                  />
                ))
              )}
            </div>
          </section>

          {/* Upskill areas */}
          <section aria-labelledby="upskill-heading" style={{ marginTop: '32px' }}>
            <h2 id="upskill-heading" className="section-title" style={{ fontSize: '1.2rem', marginBottom: '8px' }}>
              ⚡ Skills to Develop
            </h2>
            <p className="section-subtitle">Key areas to upskill for your target track</p>
            <div className="upskill-grid">
              {upskill_areas.map((skill, i) => (
                <div key={i} className="upskill-item card card-sm">
                  <span className="upskill-icon">🎯</span>
                  <span className="upskill-name">{skill}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Career roadmap */}
          <section aria-labelledby="roadmap-heading" style={{ marginTop: '32px' }}>
            <h2 id="roadmap-heading" className="section-title" style={{ fontSize: '1.2rem', marginBottom: '8px' }}>
              🗺️ 12-Month Career Roadmap
            </h2>
            <div className="roadmap-list">
              {career_roadmap.map((step, i) => (
                <div key={i} className="roadmap-step">
                  <div className="roadmap-step-num" aria-hidden="true">{i + 1}</div>
                  <div className="roadmap-step-text">{step}</div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right sidebar */}
        <aside className="results-sidebar">
          {/* Track radar */}
          <TrackRadar trackScores={track_scores} />

          {/* Track scores */}
          <div className="card" style={{ marginTop: '16px' }}>
            <h3 style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '16px' }}>📊 Track Score Breakdown</h3>
            {track_scores && Object.entries(track_scores)
              .sort((a, b) => b[1] - a[1])
              .map(([track, score]) => {
                const maxScore = Math.max(...Object.values(track_scores));
                const pct = Math.round((score / maxScore) * 100);
                return (
                  <div key={track} className="track-score-row">
                    <div className="track-score-label">
                      <span>{TRACK_ICONS[track]}</span>
                      <span>{track.split(' ')[0]}</span>
                    </div>
                    <div className="progress-bar" style={{ flex: 1 }}>
                      <div className="progress-fill" style={{
                        width: `${pct}%`,
                        background: track === recommended_track ? 'var(--primary)' : 'var(--border)'
                      }} />
                    </div>
                    <span className="track-score-val">{score}</span>
                  </div>
                );
              })}
          </div>

          {/* Guardrails */}
          <div style={{ marginTop: '16px' }}>
            <GuardrailPanel guardrails={guardrails} />
          </div>

          {/* Actions */}
          <div className="card" style={{ marginTop: '16px' }}>
            <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '12px' }}>Next Steps</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
                📊 View My Full Plan
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('/sessions')}>
                📅 Browse All Sessions
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('/assess')}>
                🔄 Retake Assessment
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
