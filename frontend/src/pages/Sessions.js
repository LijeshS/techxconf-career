import React, { useEffect, useState } from 'react';
import { getSessions, bookmarkSession, getBookmarks, removeBookmark } from '../api';
import SessionCard from '../components/SessionCard';

const TRACKS = [
  'All',
  'Industry & Innovation',
  'AI & Agentic Intelligence',
  'Cloud, DevOps & FinOps',
  'Data & Observability',
];

const LEVELS = ['All', 'beginner', 'intermediate', 'advanced'];

export default function Sessions({ user }) {
  const [sessions, setSessions] = useState([]);
  const [bookmarked, setBookmarked] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTrack, setSelectedTrack] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    Promise.all([
      getSessions(),
      user ? getBookmarks(user.id) : Promise.resolve({ bookmarks: [] })
    ]).then(([sessionData, bookmarkData]) => {
      setSessions(sessionData.sessions || []);
      setBookmarked(new Set((bookmarkData.bookmarks || []).map(b => b.id)));
      setLoading(false);
    }).catch(err => {
      setError(err.message);
      setLoading(false);
    });
  }, [user]);

  const handleBookmark = async (sessionId) => {
    if (!user) { setMsg('⚠️ Please sign in to save sessions.'); setTimeout(() => setMsg(''), 3000); return; }
    try {
      await bookmarkSession(user.id, sessionId);
      setBookmarked(b => new Set([...b, sessionId]));
      setMsg('✅ Saved to your plan!');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setMsg('❌ ' + err.message);
    }
  };

  const handleRemoveBookmark = async (sessionId) => {
    if (!user) return;
    try {
      await removeBookmark(user.id, sessionId);
      setBookmarked(b => { const n = new Set(b); n.delete(sessionId); return n; });
    } catch (err) {
      setMsg('❌ ' + err.message);
    }
  };

  const filtered = sessions.filter(s => {
    if (selectedTrack !== 'All' && s.track !== selectedTrack) return false;
    if (selectedLevel !== 'All' && s.skill_level !== selectedLevel) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        s.title?.toLowerCase().includes(q) ||
        s.speakers?.toLowerCase().includes(q) ||
        s.role_relevance?.toLowerCase().includes(q) ||
        (s.career_tags || []).join(' ').toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="sessions-page container" style={{ paddingTop: '40px', paddingBottom: '60px' }}>
      <div className="sessions-header">
        <h1 className="section-title">📅 TechXConf Sessions</h1>
        <p className="section-subtitle">
          27 sessions across 4 tracks — filter to find what fits your career goals
        </p>
        {msg && <div className="alert alert-success" role="status" aria-live="polite" style={{ marginBottom: '16px' }}>{msg}</div>}
      </div>

      {/* Filters */}
      <div className="sessions-filters card" aria-label="Session filters">
        <div className="filter-row">
          <input
            type="search"
            placeholder="🔍 Search sessions, speakers, topics…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search sessions"
            style={{ flex: 2 }}
          />
        </div>
        <div className="filter-row" style={{ marginTop: '12px', gap: '8px', flexWrap: 'wrap' }}>
          <div className="filter-group">
            <span className="form-label">Track:</span>
            {TRACKS.map(t => (
              <button
                key={t}
                className={`filter-btn ${selectedTrack === t ? 'active' : ''}`}
                onClick={() => setSelectedTrack(t)}
                aria-pressed={selectedTrack === t}
              >
                {t === 'All' ? 'All Tracks' : t.split(' ')[0]}
              </button>
            ))}
          </div>
          <div className="filter-group">
            <span className="form-label">Level:</span>
            {LEVELS.map(l => (
              <button
                key={l}
                className={`filter-btn ${selectedLevel === l ? 'active' : ''}`}
                onClick={() => setSelectedLevel(l)}
                aria-pressed={selectedLevel === l}
              >
                {l === 'All' ? 'All Levels' : l.charAt(0).toUpperCase() + l.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results count */}
      <p className="sessions-count" role="status" aria-live="polite">
        Showing <strong>{filtered.length}</strong> of <strong>{sessions.length}</strong> sessions
      </p>

      {loading ? (
        <div className="loading-page" aria-busy="true">
          <div className="loading-spinner" role="status" aria-label="Loading sessions" />
          <p>Loading sessions…</p>
        </div>
      ) : error ? (
        <div className="alert alert-danger" role="alert">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="alert alert-info">No sessions match your filters. Try broadening your search.</div>
      ) : (
        <div className="sessions-grid">
          {filtered.map(session => (
            <SessionCard
              key={session.id}
              session={session}
              isBookmarked={bookmarked.has(session.id)}
              onBookmark={handleBookmark}
              onRemoveBookmark={handleRemoveBookmark}
            />
          ))}
        </div>
      )}
    </div>
  );
}
