const express = require('express');
const router = express.Router();
const { getDb, queryAll, queryOne } = require('../database');

// GET /api/observability/metrics
router.get('/metrics', async (req, res) => {
  const db = await getDb();

  const totalAssessments = queryOne(db, 'SELECT COUNT(*) as count FROM assessments').count || 0;
  const totalUsers = queryOne(db, 'SELECT COUNT(*) as count FROM users').count || 0;
  const guardrailTriggered = queryOne(db, 'SELECT COUNT(*) as count FROM observability_logs WHERE guardrail_triggered = 1').count || 0;
  const avgRow = queryOne(db, 'SELECT AVG(response_time_ms) as avg FROM observability_logs WHERE response_time_ms IS NOT NULL');
  const avgResponseTime = avgRow?.avg || 0;
  const trackDistribution = queryAll(db, 'SELECT recommended_track, COUNT(*) as count FROM assessments GROUP BY recommended_track');
  const obsRow = queryOne(db, 'SELECT AVG(observability_score) as avg FROM assessments');
  const harnessRow = queryOne(db, 'SELECT AVG(harness_pipeline_fit) as avg FROM assessments');
  const recentLogs = queryAll(db, 'SELECT * FROM observability_logs ORDER BY created_at DESC LIMIT 20');

  res.json({
    summary: {
      total_assessments: totalAssessments,
      total_users: totalUsers,
      guardrail_triggers: guardrailTriggered,
      avg_response_time_ms: Math.round(avgResponseTime),
      avg_observability_score: Math.round(obsRow?.avg || 0),
      avg_harness_pipeline_fit: Math.round(harnessRow?.avg || 0),
    },
    track_distribution: trackDistribution,
    recent_logs: recentLogs.map(l => ({
      ...l,
      payload: JSON.parse(l.payload || '{}')
    }))
  });
});

// GET /api/observability/guardrail-report
router.get('/guardrail-report', async (req, res) => {
  const db = await getDb();
  const allAssessments = queryAll(db, 'SELECT guardrail_flags, observability_score, harness_pipeline_fit, created_at FROM assessments');

  const ruleCounts = {};
  let warningCount = 0;
  let infoCount = 0;

  for (const a of allAssessments) {
    const flags = JSON.parse(a.guardrail_flags || '[]');
    for (const flag of flags) {
      ruleCounts[flag.rule_name] = (ruleCounts[flag.rule_name] || 0) + 1;
      if (flag.severity === 'warning') warningCount++;
      if (flag.severity === 'info') infoCount++;
    }
  }

  res.json({
    rule_trigger_counts: ruleCounts,
    severity_breakdown: { warning: warningCount, info: infoCount },
    total_assessments: allAssessments.length,
  });
});

module.exports = router;
