const { v4: uuidv4 } = require('uuid');
const { initDb } = require('./_db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const db = await initDb();
  const { id } = req.query;

  try {
    // GET /api/users?id=xxx
    if (req.method === 'GET' && id) {
      const users = await db`SELECT * FROM users WHERE id = ${id}`;
      if (!users[0]) return res.status(404).json({ error: 'User not found' });
      const skills = await db`SELECT * FROM skills WHERE user_id = ${id}`;
      const assessments = await db`SELECT * FROM assessments WHERE user_id = ${id} ORDER BY created_at DESC LIMIT 3`;
      return res.json({ user: users[0], skills, assessments });
    }

    // POST /api/users
    if (req.method === 'POST') {
      const { name, email, current_role, experience_years } = req.body;
      if (!name || !email) return res.status(400).json({ error: 'Name and email required' });
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) return res.status(400).json({ error: 'Invalid email' });

      const existing = await db`SELECT * FROM users WHERE email = ${email}`;
      if (existing[0]) return res.json({ user: existing[0], isNew: false });

      const uid = uuidv4();
      await db`INSERT INTO users (id,name,email,current_role,experience_years) VALUES (${uid},${name},${email},${current_role||null},${experience_years||0})`;
      const user = (await db`SELECT * FROM users WHERE id = ${uid}`)[0];
      return res.status(201).json({ user, isNew: true });
    }

    // PUT /api/users?id=xxx
    if (req.method === 'PUT' && id) {
      const { name, current_role, experience_years } = req.body;
      await db`UPDATE users SET name=${name}, current_role=${current_role}, experience_years=${experience_years}, updated_at=NOW() WHERE id=${id}`;
      const user = (await db`SELECT * FROM users WHERE id = ${id}`)[0];
      return res.json({ user });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
