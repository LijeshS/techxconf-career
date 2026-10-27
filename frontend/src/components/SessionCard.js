import React from 'react';

const TRACK_COLORS = {
  'Industry & Innovation': { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', text: '#fbbf24', icon: '🏭' },
  'AI & Agentic Intelligence': { bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.3)', text: '#a5b4fc', icon: '🤖' },
  'Cloud, DevOps & FinOps': { bg: 'rgba(6,182,212,0.1)', border: 'rgba(6,182,212,0.3)', text: '#22d3ee', icon: '☁️' },
  'Data & Observability': { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', text: '#34d399', icon: '📊' },
};

const LEVEL_CHIP = {
  beginner: { label: 'Beginner', cls: 'chip-success' },
  intermediate: { label: 'Intermediate', cls: 'chip-info' },
  advanced: { label: 'Advanced', cls: 'chip-warning' },
};

export default function SessionCard({ session, isBookmarked, onBookmark, onRemoveBookmark, priority }) {
  const trackStyle = TRACK_COLORS[session.track] || TRACK_COLORS['Industry & Innovation'];
  const levelInfo = LEVEL_CHIP[session.skill_level] || LEVEL_CHIP['intermediate'];
  const tags = Array.isArray(session.career_tags) ? session.career_tags : JSON.parse(session.career_tags || '[]');

  return (
    <article
      className="session-card"
      style={{ '--track-border': trackStyle.border, '--track-bg': trackStyle.bg }}
      aria-label={`Session: ${session.title}`}
    >
      <div className="sc-header">
        <div className="sc-track" style={{ color: trackStyle.text, background: trackStyle.bg, border: `1px solid ${trackStyle.border}` }}>
          <span>{trackStyle.icon}</span> {session.track}
        </div>
        {priority && <span className="sc-priority">⭐ Top Pick</span>}
      </div>

      <h3 className="sc-title">{session.title}</h3>

      {session.speakers && (
        <p className="sc-speakers">👤 {session.speakers}</p>
      )}

      <p className="sc-relevance">{session.role_relevance}</p>

      <div className="sc-meta">
        {session.time_ist && (
          <span className="sc-time">🕐 {session.time_ist} IST</span>
        )}
        <span className={`chip ${levelInfo.cls}`}>{levelInfo.label}</span>
      </div>

      <div className="sc-tags">
        {tags.slice(0, 4).map(tag => (
          <span key={tag} className="chip chip-primary sc-tag">{tag}</span>
        ))}
      </div>

      <div className="sc-actions">
        {onBookmark && (
          isBookmarked ? (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onRemoveBookmark?.(session.id)}
              aria-label="Remove from my plan"
            >
              ✓ Saved
            </button>
          ) : (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => onBookmark(session.id)}
              aria-label="Save to my plan"
            >
              + Add to Plan
            </button>
          )
        )}
      </div>
    </article>
  );
}
