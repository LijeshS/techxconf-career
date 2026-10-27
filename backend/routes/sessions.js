const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb, queryAll, queryOne, runQuery } = require('../database');

// GET /api/sessions
router.get('/', async (req, res) => {
  try {
    await getDb();
    const { track } = req.query;
    let sessions = track
      ? await queryAll('SELECT * FROM sessions WHERE track = ?', [track])
      : await queryAll('SELECT * FROM sessions ORDER BY track, time_ist');
    sessions = sessions.map(s => ({ ...s, career_tags: JSON.parse(s.career_tags || '[]') }));
    res.json({ sessions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sessions/tracks — must come before /:id
router.get('/tracks', async (req, res) => {
  try {
    await getDb();
    const tracks = await queryAll('SELECT DISTINCT track FROM sessions ORDER BY track');
    res.json({ tracks: tracks.map(t => t.track) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sessions/bookmarks/:userId
router.get('/bookmarks/:userId', async (req, res) => {
  try {
    await getDb();
    const bookmarks = await queryAll(
      `SELECT s.*, b.created_at as bookmarked_at
       FROM sessions s
       JOIN bookmarks b ON s.id = b.session_id
       WHERE b.user_id = ?
       ORDER BY s.time_ist`,
      [req.params.userId]
    );
    res.json({ bookmarks: bookmarks.map(s => ({ ...s, career_tags: JSON.parse(s.career_tags || '[]') })) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sessions/bookmarks
router.post('/bookmarks', async (req, res) => {
  const { user_id, session_id } = req.body;
  if (!user_id || !session_id) return res.status(400).json({ error: 'user_id and session_id required' });
  try {
    await getDb();
    await runQuery(
      'INSERT OR IGNORE INTO bookmarks (id, user_id, session_id) VALUES (?, ?, ?)',
      [uuidv4(), user_id, session_id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to bookmark: ' + err.message });
  }
});

// DELETE /api/sessions/bookmarks
router.delete('/bookmarks', async (req, res) => {
  const { user_id, session_id } = req.body;
  await getDb();
  await runQuery('DELETE FROM bookmarks WHERE user_id = ? AND session_id = ?', [user_id, session_id]);
  res.json({ success: true });
});

// GET /api/sessions/:id
router.get('/:id', async (req, res) => {
  try {
    await getDb();
    const session = await queryOne('SELECT * FROM sessions WHERE id = ?', [req.params.id]);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json({ ...session, career_tags: JSON.parse(session.career_tags || '[]') });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
