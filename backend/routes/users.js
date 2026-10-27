const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb, queryAll, queryOne, runQuery } = require('../database');

// POST /api/users
router.post('/', async (req, res) => {
  const { name, email, current_role, experience_years } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return res.status(400).json({ error: 'Invalid email address' });

  try {
    const db = await getDb();
    const existing = queryOne(db, 'SELECT * FROM users WHERE email = ?', [email]);
    if (existing) return res.json({ user: existing, isNew: false });

    const id = uuidv4();
    runQuery(db,
      'INSERT INTO users (id, name, email, current_role, experience_years) VALUES (?, ?, ?, ?, ?)',
      [id, name, email, current_role || null, experience_years || 0]
    );
    const user = queryOne(db, 'SELECT * FROM users WHERE id = ?', [id]);
    return res.status(201).json({ user, isNew: true });
  } catch (err) {
    console.error('User creation error:', err);
    return res.status(500).json({ error: 'Failed to create user' });
  }
});

// GET /api/users/:id
router.get('/:id', async (req, res) => {
  const db = await getDb();
  const user = queryOne(db, 'SELECT * FROM users WHERE id = ?', [req.params.id]);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const skills = queryAll(db, 'SELECT * FROM skills WHERE user_id = ?', [req.params.id]);
  const assessments = queryAll(db, 'SELECT * FROM assessments WHERE user_id = ? ORDER BY created_at DESC LIMIT 3', [req.params.id]);

  res.json({ user, skills, assessments });
});

// PUT /api/users/:id
router.put('/:id', async (req, res) => {
  const { name, current_role, experience_years } = req.body;
  const db = await getDb();
  runQuery(db,
    'UPDATE users SET name = ?, current_role = ?, experience_years = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [name, current_role, experience_years, req.params.id]
  );
  const user = queryOne(db, 'SELECT * FROM users WHERE id = ?', [req.params.id]);
  res.json({ user });
});

// POST /api/users/:id/skills
router.post('/:id/skills', async (req, res) => {
  const { skills } = req.body;
  if (!Array.isArray(skills)) return res.status(400).json({ error: 'skills must be an array' });

  const db = await getDb();
  for (const skill of skills) {
    runQuery(db,
      'INSERT OR IGNORE INTO skills (id, user_id, skill_name, proficiency, category) VALUES (?, ?, ?, ?, ?)',
      [uuidv4(), req.params.id, skill.name, skill.proficiency || 3, skill.category || 'General']
    );
  }
  const allSkills = queryAll(db, 'SELECT * FROM skills WHERE user_id = ?', [req.params.id]);
  res.json({ skills: allSkills });
});

module.exports = router;
