const { v4: uuidv4 } = require('uuid');
const { initDb } = require('./_db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const db = await initDb();
  const { track, id, bookmarks, userId } = req.query;

  try {
    // GET /api/sessions?bookmarks=1&userId=xxx
    if (req.method === 'GET' && bookmarks && userId) {
      const rows = await db`
        SELECT s.*, b.created_at as bookmarked_at FROM sessions s
        JOIN bookmarks b ON s.id = b.session_id WHERE b.user_id = ${userId} ORDER BY s.time_ist`;
      return res.json({ bookmarks: rows.map(s => ({ ...s, career_tags: JSON.parse(s.career_tags || '[]') })) });
    }

    // GET /api/sessions?id=xxx
    if (req.method === 'GET' && id) {
      const rows = await db`SELECT * FROM sessions WHERE id = ${id}`;
      if (!rows[0]) return res.status(404).json({ error: 'Session not found' });
      return res.json({ ...rows[0], career_tags: JSON.parse(rows[0].career_tags || '[]') });
    }

    // GET /api/sessions or GET /api/sessions?track=xxx
    if (req.method === 'GET') {
      const rows = track
        ? await db`SELECT * FROM sessions WHERE track = ${track} ORDER BY time_ist`
        : await db`SELECT * FROM sessions ORDER BY track, time_ist`;
      return res.json({ sessions: rows.map(s => ({ ...s, career_tags: JSON.parse(s.career_tags || '[]') })) });
    }

    // POST /api/sessions (bookmark)
    if (req.method === 'POST') {
      const { user_id, session_id } = req.body;
      if (!user_id || !session_id) return res.status(400).json({ error: 'user_id and session_id required' });
      await db`INSERT INTO bookmarks (id,user_id,session_id) VALUES (${uuidv4()},${user_id},${session_id}) ON CONFLICT DO NOTHING`;
      return res.json({ success: true });
    }

    // DELETE /api/sessions (unbookmark)
    if (req.method === 'DELETE') {
      const { user_id, session_id } = req.body;
      await db`DELETE FROM bookmarks WHERE user_id=${user_id} AND session_id=${session_id}`;
      return res.json({ success: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
