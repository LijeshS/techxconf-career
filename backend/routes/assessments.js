const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb, queryAll, queryOne, runQuery } = require('../database');
const { buildCareerPlan } = require('../recommender');
const { runGuardrails } = require('../guardrails');

// POST /api/assessments
router.post('/', async (req, res) => {
  const { user_id, answers } = req.body;
  if (!user_id || !answers) return res.status(400).json({ error: 'user_id and answers are required' });

  const start = Date.now();
  try {
    const db = await getDb();
    const allSessions = queryAll(db, 'SELECT * FROM sessions');
    const user = queryOne(db, 'SELECT * FROM users WHERE id = ?', [user_id]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const dbSkills = queryAll(db, 'SELECT skill_name FROM skills WHERE user_id = ?', [user_id]);
    const skillNames = [...(answers.skills || []), ...dbSkills.map(s => s.skill_name)];

    const enrichedAnswers = {
      ...answers,
      skills: skillNames,
      current_role: answers.current_role || user.current_role || 'Software Engineer',
      experience_years: answers.experience_years ?? user.experience_years ?? 0,
    };

    const plan = buildCareerPlan(enrichedAnswers, allSessions);

    const guardrailInput = {
      ...enrichedAnswers,
      recommended_sessions: plan.recommended_sessions,
      recommended_level: plan.recommended_level,
      target_domain: plan.recommended_track,
      current_domain: answers.current_domain || plan.recommended_track,
    };
    const guardrailResult = runGuardrails(guardrailInput);

    const id = uuidv4();
    runQuery(db,
      `INSERT INTO assessments
        (id, user_id, answers, track_scores, recommended_track, recommended_sessions, guardrail_flags, observability_score, harness_pipeline_fit)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, user_id,
        JSON.stringify(enrichedAnswers),
        JSON.stringify(plan.track_scores),
        plan.recommended_track,
        JSON.stringify(plan.recommended_sessions.map(s => s.id)),
        JSON.stringify(guardrailResult.guardrail_flags),
        guardrailResult.observability_score,
        guardrailResult.harness_pipeline_fit,
      ]
    );

    const responseTime = Date.now() - start;
    runQuery(db,
      `INSERT INTO observability_logs (id, user_id, event_type, payload, guardrail_triggered, guardrail_reason, response_time_ms)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        uuidv4(), user_id, 'assessment_completed',
        JSON.stringify({ track: plan.recommended_track, session_count: plan.recommended_sessions.length }),
        guardrailResult.guardrail_flags.length > 0 ? 1 : 0,
        guardrailResult.guardrail_flags.map(f => f.rule_name).join(', ') || null,
        responseTime,
      ]
    );

    res.status(201).json({
      assessment_id: id,
      recommended_track: plan.recommended_track,
      track_scores: plan.track_scores,
      recommended_sessions: plan.recommended_sessions,
      upskill_areas: plan.upskill_areas,
      career_roadmap: plan.career_roadmap,
      experience_level: plan.experience_level,
      guardrails: guardrailResult,
    });
  } catch (err) {
    console.error('Assessment error:', err);
    res.status(500).json({ error: 'Assessment processing failed: ' + err.message });
  }
});

// GET /api/assessments/:id
router.get('/:id', async (req, res) => {
  const db = await getDb();
  const assessment = queryOne(db, 'SELECT * FROM assessments WHERE id = ?', [req.params.id]);
  if (!assessment) return res.status(404).json({ error: 'Assessment not found' });

  const sessionIds = JSON.parse(assessment.recommended_sessions || '[]');
  let sessions = [];
  if (sessionIds.length > 0) {
    const placeholders = sessionIds.map(() => '?').join(',');
    sessions = queryAll(db, `SELECT * FROM sessions WHERE id IN (${placeholders})`, sessionIds);
  }

  res.json({
    ...assessment,
    answers: JSON.parse(assessment.answers),
    track_scores: JSON.parse(assessment.track_scores),
    recommended_sessions: sessions,
    guardrail_flags: JSON.parse(assessment.guardrail_flags || '[]'),
  });
});

module.exports = router;
