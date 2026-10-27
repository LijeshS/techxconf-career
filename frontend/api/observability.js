const { initDb } = require('./_db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const db = await initDb();
  const { report } = req.query;

  try {
    if (report === 'guardrails') {
      const rows = await db`SELECT guardrail_flags FROM assessments`;
      const counts = {}; let warn = 0, info = 0;
      for (const r of rows) {
        for (const f of JSON.parse(r.guardrail_flags||'[]')) {
          counts[f.rule_name] = (counts[f.rule_name]||0)+1;
          if (f.severity==='warning') warn++; else info++;
        }
      }
      return res.json({ rule_trigger_counts:counts, severity_breakdown:{warning:warn,info}, total_assessments:rows.length });
    }

    const [totalA] = await db`SELECT COUNT(*)::int AS count FROM assessments`;
    const [totalU] = await db`SELECT COUNT(*)::int AS count FROM users`;
    const [guardrailT] = await db`SELECT COUNT(*)::int AS count FROM observability_logs WHERE guardrail_triggered=1`;
    const [avgRT] = await db`SELECT ROUND(AVG(response_time_ms)::numeric,0)::int AS avg FROM observability_logs WHERE response_time_ms IS NOT NULL`;
    const [obsAvg] = await db`SELECT ROUND(AVG(observability_score)::numeric,0)::int AS avg FROM assessments`;
    const [harnessAvg] = await db`SELECT ROUND(AVG(harness_pipeline_fit)::numeric,0)::int AS avg FROM assessments`;
    const trackDist = await db`SELECT recommended_track, COUNT(*)::int AS count FROM assessments GROUP BY recommended_track`;
    const logs = await db`SELECT * FROM observability_logs ORDER BY created_at DESC LIMIT 20`;

    res.json({
      summary: { total_assessments:totalA.count, total_users:totalU.count, guardrail_triggers:guardrailT.count, avg_response_time_ms:avgRT.avg||0, avg_observability_score:obsAvg.avg||0, avg_harness_pipeline_fit:harnessAvg.avg||0 },
      track_distribution: trackDist,
      recent_logs: logs.map(l => ({ ...l, payload: JSON.parse(l.payload||'{}') })),
    });
  } catch (err) {
    console.error('observability error:', err);
    res.status(500).json({ error: err.message || String(err) });
  }
};
