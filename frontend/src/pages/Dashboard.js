import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser, getBookmarks, removeBookmark } from '../api';
import SessionCard from '../components/SessionCard';

export default function Dashboard({ user }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getUser(user.id),
      getBookmarks(user.id),
    ]).then(([userData, bookmarkData]) => {
      setProfile(userData.user);
      setAssessments(userData.assessments || []);
      setBookmarks(bookmarkData.bookmarks || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user.id]);

  const handleRemoveBookmark = async (sessionId) => {
    await removeBookmark(user.id, sessionId);
    setBookmarks(b => b.filter(s => s.id !== sessionId));
  };

  const latestAssessment = assessments[0];

  if (loading) return (
    <div className="loading-page">
      <div className="loading-spinner" />
      <p>Loading your dashboard…</p>
    </div>
  );

  return (
    <div className="dashboard-page container" style={{ paddingTop: '40px', paddingBottom: '60px' }}>
      {/* Header */}
      <div className="dash-header">
        <div className="dash-welcome">
          <div className="dash-avatar">{user.name?.charAt(0).toUpperCase()}</div>
          <div>
            <h1 className="section-title">Welcome back, {user.name?.split(' ')[0]}!</h1>
            <p className="section-subtitle">{profile?.current_role || 'Professional'} · {profile?.experience_years || 0} years experience</p>
          </div>
        </div>
        <div className="dash-quick-actions">
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/assess')}>
            🧭 Retake Assessment
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/sessions')}>
            📅 Browse Sessions
          </button>
        </div>
      </div>

      {/* Stats */}
      {latestAssessment && (
        <div className="dash-stats grid-4" style={{ marginTop: '28px' }}>
          {[
            { icon: '🎯', label: 'Recommended Track', value: latestAssessment.recommended_track?.split(' ')[0] || '—' },
            { icon: '🛡️', label: 'Observability Score', value: `${Math.round(latestAssessment.observability_score || 0)}/100` },
            { icon: '⚙️', label: 'Harness Pipeline Fit', value: `${Math.round(latestAssessment.harness_pipeline_fit || 0)}%` },
            { icon: '📌', label: 'Saved Sessions', value: bookmarks.length },
          ].map(stat => (
            <div key={stat.label} className="stat-card card">
              <div className="stat-icon" aria-hidden="true">{stat.icon}</div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Main content */}
      <div className="dash-grid" style={{ marginTop: '32px' }}>
        {/* Saved sessions */}
        <section aria-labelledby="saved-heading">
          <h2 id="saved-heading" className="section-title" style={{ fontSize: '1.2rem', marginBottom: '8px' }}>
            📌 My Session Plan
          </h2>
          <p className="section-subtitle">Sessions you've saved</p>

          {bookmarks.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📋</div>
              <p>No sessions saved yet.</p>
              <button className="btn btn-primary btn-sm" style={{ marginTop: '16px' }} onClick={() => navigate('/sessions')}>
                Browse Sessions
              </button>
            </div>
          ) : (
            <div className="sessions-list">
              {bookmarks.map(session => (
                <SessionCard
                  key={session.id}
                  session={session}
                  isBookmarked={true}
                  onRemoveBookmark={handleRemoveBookmark}
                />
              ))}
            </div>
          )}
        </section>

        {/* Assessment history */}
        <aside className="dash-sidebar">
          <div className="card">
            <h3 style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '16px' }}>🕐 Assessment History</h3>
            {assessments.length === 0 ? (
              <p style={{ color: 'var(--text-faint)', fontSize: '0.88rem' }}>No assessments yet.</p>
            ) : (
              assessments.map(a => (
                <div key={a.id} className="assessment-history-item">
                  <div className="ahi-track">{a.recommended_track}</div>
                  <div className="ahi-meta">
                    <span>Obs: {Math.round(a.observability_score)}/100</span>
                    <span>·</span>
                    <span>{new Date(a.created_at).toLocaleDateString()}</span>
                  </div>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => navigate(`/results/${a.id}`)}
                    style={{ marginTop: '8px', width: '100%' }}
                  >
                    View Results
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Profile summary */}
          <div className="card" style={{ marginTop: '16px' }}>
            <h3 style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '16px' }}>👤 My Profile</h3>
            <div className="profile-rows">
              <div className="profile-row"><span>Name</span><strong>{profile?.name}</strong></div>
              <div className="profile-row"><span>Email</span><strong style={{ wordBreak: 'break-all' }}>{profile?.email}</strong></div>
              <div className="profile-row"><span>Role</span><strong>{profile?.current_role || '—'}</strong></div>
              <div className="profile-row"><span>Experience</span><strong>{profile?.experience_years || 0} yrs</strong></div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
