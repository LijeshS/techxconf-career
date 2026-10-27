const express = require('express');
const router = express.Router();
const { getDb, queryAll, queryOne } = require('../database');

// GET /api/observability/metrics
router.get('/metrics', async (req, res) => {
  try {
    await getDb();
    const [totalA, totalU, guardrailT, avgRT, trackDist, obsAvg, harnessAvg, recentLogs] = await Promise.all([
      queryOne('SELECT COUNT(*) AS count FROM assessments'),
      queryOne('SELECT COUNT(*) AS count FROM users'),
      queryOne('SELECT COUNT(*) AS count FROM observability_logs WHERE guardrail_triggered = 1'),
      queryOne('SELECT AVG(response_time_ms) AS avg FROM observability_logs WHERE response_time_ms IS NOT NULL'),
      queryAll('SELECT recommended_track, COUNT(*) AS count FROM assessments GROUP BY recommended_track'),
      queryOne('SELECT AVG(observability_score) AS avg FROM assessments'),
      queryOne('SELECT AVG(harness_pipeline_fit) AS avg FROM assessments'),
      queryAll('SELECT * FROM observability_logs ORDER BY created_at DESC LIMIT 20'),
    ]);

    res.json({
      summary: {
        total_assessments: Number(totalA?.count || 0),
        total_users: Number(totalU?.count || 0),
        guardrail_triggers: Number(guardrailT?.count || 0),
        avg_response_time_ms: Math.round(Number(avgRT?.avg || 0)),
        avg_observability_score: Math.round(Number(obsAvg?.avg || 0)),
        avg_harness_pipeline_fit: Math.round(Number(harnessAvg?.avg || 0)),
      },
      track_distribution: trackDist,
      recent_logs: recentLogs.map(l => ({ ...l, payload: JSON.parse(l.payload || '{}') })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/observability/guardrail-report
router.get('/guardrail-report', async (req, res) => {
  try {
    await getDb();
    const allAssessments = await queryAll(
      'SELECT guardrail_flags, observability_score, harness_pipeline_fit, created_at FROM assessments'
    );
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
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
