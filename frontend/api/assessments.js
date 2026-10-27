const { v4: uuidv4 } = require('uuid');
const { initDb } = require('./_db');

// ── Guardrail engine ──────────────────────────────────────────────────────────
function runGuardrails(input) {
  const flags = [];
  let score = 100;
  const sessions = input.recommended_sessions || [];

  if (input.experience_years < 2 && input.recommended_level === 'advanced') {
    flags.push({ rule_id:'G001', rule_name:'Minimum Experience Check', severity:'warning', reason:'Advanced sessions recommended for user with under 2 years experience.', suggestion:'Consider foundational tracks first.' });
    score -= 15;
  }
  const parallelCount = countParallelSessions(sessions);
  if (parallelCount > 2) {
    flags.push({ rule_id:'G003', rule_name:'Session Overload Guard', severity:'info', reason:`${parallelCount} overlapping sessions detected.`, suggestion:'Starred sessions are highest priority.' });
    score -= 5;
  }
  const isDevOps = ['DevOps Engineer','SRE','Platform Engineer'].includes(input.current_role);
  const hasHarness = sessions.some(s => (s.career_tags||'[]').includes('Harness'));
  if (isDevOps && !hasHarness) {
    flags.push({ rule_id:'G004', rule_name:'Harness Alignment Check', severity:'info', reason:'Your role aligns with Harness sessions not yet in your plan.', suggestion:'Consider adding the "Building Autonomous Agents" session.' });
    score -= 5;
  }
  const isAI = input.target_domain === 'AI & Agentic Intelligence' || (input.current_role||'').toLowerCase().includes('ai');
  const hasSafety = sessions.some(s => (s.career_tags||'[]').includes('Observability') || (s.career_tags||'[]').includes('Guardrails'));
  if (isAI && !hasSafety) {
    flags.push({ rule_id:'G005', rule_name:'LLM Safety Gate', severity:'warning', reason:'AI practitioners should include observability/safety sessions.', suggestion:'Add "Strengthen Guardrails: LLM Observability".' });
    score -= 15;
  }

  const harnessFit = computeHarnessFit(input);
  return { guardrail_flags: flags, observability_score: Math.max(0, score), harness_pipeline_fit: harnessFit, pipeline_status: harnessFit >= 75 ? 'PASSED' : harnessFit >= 50 ? 'WARNINGS' : 'NEEDS_REVIEW' };
}

function countParallelSessions(sessions) {
  let overlaps = 0;
  for (let i = 0; i < sessions.length; i++) for (let j = i+1; j < sessions.length; j++) if (timeOverlap(sessions[i].time_ist, sessions[j].time_ist)) overlaps++;
  return overlaps;
}
function timeOverlap(t1, t2) {
  if (!t1||!t2) return false;
  const p = t => { const [s,e] = t.split('-'); const m = x => { const [h,mm] = x.trim().split(':').map(Number); return h*60+(mm||0); }; return [m(s),m(e)]; };
  const [a1,a2]=p(t1), [b1,b2]=p(t2); return a1<b2 && b1<a2;
}
function computeHarnessFit(input) {
  let s = 0;
  if ((input.skills||[]).some(sk => ['CI/CD','Harness','Jenkins','GitHub Actions','ArgoCD'].includes(sk))) s += 25;
  if (['DevOps Engineer','SRE','Platform Engineer'].includes(input.current_role)) s += 25;
  if ((input.recommended_sessions||[]).some(ses => (ses.career_tags||'[]').includes('Harness'))) s += 25;
  if ((input.skills||[]).some(sk => ['Prometheus','Grafana','Datadog','OpenTelemetry'].includes(sk))) s += 25;
  return s;
}

// ── Recommendation engine ─────────────────────────────────────────────────────
const TRACK_KEYWORDS = {
  'Industry & Innovation': ['strategy','product','leadership','enterprise','adoption','business','innovation'],
  'AI & Agentic Intelligence': ['ai','ml','machine learning','llm','chatbot','nlp','agent','genai','generative','rag'],
  'Cloud, DevOps & FinOps': ['devops','cloud','aws','azure','gcp','kubernetes','docker','ci/cd','pipeline','platform','terraform','sre','finops'],
  'Data & Observability': ['data','analytics','sql','database','etl','spark','kafka','observability','monitoring','logging'],
};
const ROLE_TRACK_MAP = {
  'Software Engineer':   { 'Industry & Innovation':2,'AI & Agentic Intelligence':3,'Cloud, DevOps & FinOps':3,'Data & Observability':2 },
  'Data Engineer':       { 'Industry & Innovation':1,'AI & Agentic Intelligence':2,'Cloud, DevOps & FinOps':2,'Data & Observability':5 },
  'Data Scientist':      { 'Industry & Innovation':2,'AI & Agentic Intelligence':5,'Cloud, DevOps & FinOps':1,'Data & Observability':4 },
  'ML Engineer':         { 'Industry & Innovation':1,'AI & Agentic Intelligence':5,'Cloud, DevOps & FinOps':3,'Data & Observability':3 },
  'DevOps Engineer':     { 'Industry & Innovation':2,'AI & Agentic Intelligence':2,'Cloud, DevOps & FinOps':5,'Data & Observability':3 },
  'SRE':                 { 'Industry & Innovation':1,'AI & Agentic Intelligence':2,'Cloud, DevOps & FinOps':5,'Data & Observability':4 },
  'Platform Engineer':   { 'Industry & Innovation':2,'AI & Agentic Intelligence':2,'Cloud, DevOps & FinOps':5,'Data & Observability':2 },
  'Product Manager':     { 'Industry & Innovation':5,'AI & Agentic Intelligence':3,'Cloud, DevOps & FinOps':2,'Data & Observability':2 },
  'Security Engineer':   { 'Industry & Innovation':2,'AI & Agentic Intelligence':3,'Cloud, DevOps & FinOps':3,'Data & Observability':2 },
  'Business Analyst':    { 'Industry & Innovation':4,'AI & Agentic Intelligence':3,'Cloud, DevOps & FinOps':1,'Data & Observability':3 },
  'Architect':           { 'Industry & Innovation':3,'AI & Agentic Intelligence':3,'Cloud, DevOps & FinOps':3,'Data & Observability':4 },
  'Student/Fresher':     { 'Industry & Innovation':3,'AI & Agentic Intelligence':4,'Cloud, DevOps & FinOps':3,'Data & Observability':3 },
};
const GOAL_TRACK_MAP = {
  'transition-to-ai':       { 'AI & Agentic Intelligence':5,'Data & Observability':3 },
  'level-up-devops':        { 'Cloud, DevOps & FinOps':5,'Data & Observability':3 },
  'data-career':            { 'Data & Observability':5,'AI & Agentic Intelligence':2 },
  'enterprise-leadership':  { 'Industry & Innovation':5 },
  'build-ai-products':      { 'AI & Agentic Intelligence':5,'Industry & Innovation':3 },
  'cloud-cost-optimization':{ 'Cloud, DevOps & FinOps':5 },
  'platform-engineering':   { 'Cloud, DevOps & FinOps':5 },
  'security-focus':         { 'AI & Agentic Intelligence':3,'Cloud, DevOps & FinOps':3 },
};

function buildCareerPlan(answers, allSessions) {
  const scores = { 'Industry & Innovation':0,'AI & Agentic Intelligence':0,'Cloud, DevOps & FinOps':0,'Data & Observability':0 };
  const roleScores = ROLE_TRACK_MAP[answers.current_role] || ROLE_TRACK_MAP['Software Engineer'];
  for (const [t,v] of Object.entries(roleScores)) scores[t] += v;
  const goalScores = GOAL_TRACK_MAP[answers.career_goal] || {};
  for (const [t,v] of Object.entries(goalScores)) scores[t] = (scores[t]||0)+v;

  for (const skill of (answers.skills||[])) {
    const sl = skill.toLowerCase();
    for (const [track, kws] of Object.entries(TRACK_KEYWORDS)) {
      if (kws.some(kw => sl.includes(kw) || kw.includes(sl))) scores[track] += 1;
    }
  }

  const sorted = Object.entries(scores).sort((a,b)=>b[1]-a[1]);
  const topTrack = sorted[0][0];
  const secondTrack = sorted[1][0];
  const expLevel = answers.experience_years < 2 ? 'beginner' : answers.experience_years < 5 ? 'intermediate' : 'advanced';

  const candidates = allSessions.filter(s => s.track === topTrack || s.track === secondTrack);
  const scored = candidates.map(s => {
    let sc = s.track === topTrack ? 10 : 5;
    const tags = JSON.parse(s.career_tags||'[]');
    for (const t of tags) if ((answers.skills||[]).some(sk => sk.toLowerCase().includes(t.toLowerCase()))) sc += 3;
    if (s.skill_level === expLevel) sc += 2;
    if (s.skill_level === 'advanced' && expLevel === 'beginner') sc -= 4;
    return { ...s, score: sc };
  }).sort((a,b) => b.score - a.score);

  const selected = []; const slots = new Set();
  for (const s of scored) {
    if (selected.length >= 6) break;
    if (!slots.has(s.time_ist)) { selected.push(s); slots.add(s.time_ist); }
    else if (selected.length < 4) selected.push(s);
  }

  const upskillMap = {
    'Industry & Innovation': ['Strategic Thinking','AI Adoption Frameworks','Stakeholder Management','Business Case Development'],
    'AI & Agentic Intelligence': ['Prompt Engineering','LangChain / LangGraph','RAG Architecture','LLM Evaluation','AI Safety'],
    'Cloud, DevOps & FinOps': ['Kubernetes','Terraform','Harness CD','OpenTelemetry','FinOps Certification'],
    'Data & Observability': ['Apache Spark','dbt','OpenTelemetry','Grafana','Data Contracts'],
  };
  const roadmapMap = {
    'Industry & Innovation': ['Strengthen AI literacy (3 months)','Lead a cross-functional AI pilot (6 months)','Publish case study (12 months)'],
    'AI & Agentic Intelligence': ['Complete LLM fundamentals (1 month)','Build a RAG prototype (2-3 months)','Deploy an agentic workflow (6 months)','Contribute to open-source LLM tooling (12 months)'],
    'Cloud, DevOps & FinOps': ['Earn a cloud certification (2 months)','Set up Harness CI/CD pipeline (3 months)','Implement full observability stack (6 months)','Architect a platform IDP (12 months)'],
    'Data & Observability': ['Master SQL + dbt (1 month)','Build a streaming pipeline (3 months)','Implement data quality gates (5 months)','Design a medallion data lakehouse (12 months)'],
  };

  return { recommended_track:topTrack, track_scores:scores, recommended_sessions:selected, upskill_areas:upskillMap[topTrack]||[], career_roadmap:roadmapMap[topTrack]||[], experience_level: expLevel === 'beginner' ? 'Beginner' : expLevel === 'intermediate' ? 'Mid-level' : 'Senior', recommended_level: expLevel, target_domain: topTrack };
}

// ── Handler ───────────────────────────────────────────────────────────────────
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const db = await initDb();
  const { id } = req.query;

  try {
    // GET /api/assessments?id=xxx
    if (req.method === 'GET' && id) {
      const rows = await db`SELECT * FROM assessments WHERE id = ${id}`;
      if (!rows[0]) return res.status(404).json({ error: 'Assessment not found' });
      const a = rows[0];
      const sessionIds = JSON.parse(a.recommended_sessions||'[]');
      let sessions = [];
      if (sessionIds.length) {
        sessions = await db`SELECT * FROM sessions WHERE id = ANY(${sessionIds}::text[])`;
      }
      return res.json({ ...a, answers:JSON.parse(a.answers), track_scores:JSON.parse(a.track_scores), recommended_sessions:sessions, guardrail_flags:JSON.parse(a.guardrail_flags||'[]') });
    }

    // POST /api/assessments
    if (req.method === 'POST') {
      const { user_id, answers } = req.body;
      if (!user_id || !answers) return res.status(400).json({ error: 'user_id and answers required' });
      const start = Date.now();

      const users = await db`SELECT * FROM users WHERE id = ${user_id}`;
      if (!users[0]) return res.status(404).json({ error: 'User not found' });

      const dbSkills = await db`SELECT skill_name FROM skills WHERE user_id = ${user_id}`;
      const enriched = { ...answers, skills:[...(answers.skills||[]), ...dbSkills.map(s=>s.skill_name)], current_role: answers.current_role||users[0].current_role||'Software Engineer', experience_years: answers.experience_years??users[0].experience_years??0 };

      const allSessions = await db`SELECT * FROM sessions`;
      const plan = buildCareerPlan(enriched, allSessions);
      const guardrailInput = { ...enriched, recommended_sessions:plan.recommended_sessions, recommended_level:plan.recommended_level, target_domain:plan.recommended_track, current_domain:answers.current_domain||plan.recommended_track };
      const guardrailResult = runGuardrails(guardrailInput);

      const aid = uuidv4();
      await db`INSERT INTO assessments (id,user_id,answers,track_scores,recommended_track,recommended_sessions,guardrail_flags,observability_score,harness_pipeline_fit) VALUES (${aid},${user_id},${JSON.stringify(enriched)},${JSON.stringify(plan.track_scores)},${plan.recommended_track},${JSON.stringify(plan.recommended_sessions.map(s=>s.id))},${JSON.stringify(guardrailResult.guardrail_flags)},${guardrailResult.observability_score},${guardrailResult.harness_pipeline_fit})`;
      await db`INSERT INTO observability_logs (id,user_id,event_type,payload,guardrail_triggered,guardrail_reason,response_time_ms) VALUES (${uuidv4()},${user_id},'assessment_completed',${JSON.stringify({track:plan.recommended_track})},${guardrailResult.guardrail_flags.length>0?1:0},${guardrailResult.guardrail_flags.map(f=>f.rule_name).join(',')||null},${Date.now()-start})`;

      return res.status(201).json({ assessment_id:aid, recommended_track:plan.recommended_track, track_scores:plan.track_scores, recommended_sessions:plan.recommended_sessions, upskill_areas:plan.upskill_areas, career_roadmap:plan.career_roadmap, experience_level:plan.experience_level, guardrails:guardrailResult });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
