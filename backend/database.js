const { neon } = require('@neondatabase/serverless');

let sql = null;

function getSql() {
  if (sql) return sql;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL environment variable is not set');
  sql = neon(url);
  return sql;
}

// Cache so schema+seed only runs once per process
let initialized = false;

async function getDb() {
  if (initialized) return getSql();
  const db = getSql();
  await initializeSchema(db);
  initialized = true;
  return db;
}

async function initializeSchema(db) {
  // All tables — idempotent
  await db`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      current_role TEXT,
      experience_years INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await db`
    CREATE TABLE IF NOT EXISTS assessments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      answers TEXT NOT NULL,
      track_scores TEXT NOT NULL,
      recommended_track TEXT NOT NULL,
      recommended_sessions TEXT NOT NULL,
      guardrail_flags TEXT DEFAULT '[]',
      observability_score REAL DEFAULT 0,
      harness_pipeline_fit REAL DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await db`
    CREATE TABLE IF NOT EXISTS skills (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      skill_name TEXT NOT NULL,
      proficiency INTEGER DEFAULT 1,
      category TEXT,
      added_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await db`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      track TEXT NOT NULL,
      time_ist TEXT,
      title TEXT NOT NULL,
      speakers TEXT,
      role_relevance TEXT,
      career_tags TEXT,
      skill_level TEXT DEFAULT 'intermediate'
    )
  `;
  await db`
    CREATE TABLE IF NOT EXISTS bookmarks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, session_id)
    )
  `;
  await db`
    CREATE TABLE IF NOT EXISTS observability_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      event_type TEXT NOT NULL,
      payload TEXT,
      guardrail_triggered INTEGER DEFAULT 0,
      guardrail_reason TEXT,
      response_time_ms INTEGER,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await seedSessions(db);
}

let seeded = false;

async function seedSessions(db) {
  if (seeded) return;
  const [{ cnt }] = await db`SELECT COUNT(*)::int AS cnt FROM sessions`;
  if (cnt > 0) { seeded = true; return; }

  const sessions = [
    ['s01','Industry & Innovation','10:40-11:20','7 Missing Links of AI-Native Software Delivery','Karthikeyan VK','AI-native software delivery and engineering practices.','["AI","DevOps","Software Engineering","Platform"]','intermediate'],
    ['s02','Industry & Innovation','11:25-12:05','Riding the AI Elephant','Anandan Kumaran','Broad AI adoption and practical implications for enterprise teams.','["AI","Enterprise","Leadership"]','beginner'],
    ['s03','Industry & Innovation','12:10-12:55','Algorithms Behind the Models','Sathish Nadarajan','Model fundamentals and context for evaluating AI capabilities.','["AI","ML","Data Science"]','intermediate'],
    ['s04','Industry & Innovation','13:30-15:10','Meet Chitru — Automating Data Lineage on Azure','Sarveshwaran Rajagopal','Azure automation, lineage and cloud-cost awareness.','["Azure","Cloud","Data Engineering","Automation"]','advanced'],
    ['s05','Industry & Innovation','15:15-15:55','Superintelligence Is Near','Sathish Narayanan; Sukumar Rajagopal; Karthikeyan VK','Production readiness and practical limits of AI deployment.','["AI","Production","Strategy"]','intermediate'],
    ['s06','AI & Agentic Intelligence','10:40-11:20','Who Governs the AI Agent? A Practical Framework','Snidev P P; Manoj Kumar S','Enterprise agent governance, risk and responsible deployment.','["AI Governance","Risk","Compliance","Agentic AI"]','intermediate'],
    ['s07','AI & Agentic Intelligence','11:25-12:05','Exploring the AI Agent: LLM Vulnerabilities in Action','Bipul Kumar','Threats and security testing for LLM-powered agents.','["AI Security","LLM","Red Teaming","Security"]','advanced'],
    ['s08','AI & Agentic Intelligence','12:10-12:30','Engineering AI Workflows: Context, Agents, Skills and Human Verification','Aarthiy Ramesh','Agent workflows, human verification and translating requirements into AI processes.','["Agentic AI","Workflow","Human-in-the-loop"]','intermediate'],
    ['s09','AI & Agentic Intelligence','12:35-12:55','Beyond GPUs: A Workload-First Framework for AI','Cloud and TRI','AI workload planning and compute/data-centre architecture.','["AI Infrastructure","GPU","Cloud","Data Center"]','advanced'],
    ['s10','AI & Agentic Intelligence','13:50-15:10','Building Autonomous Agents: A Framework for Loops and Harnesses','Balaji Janarthanan; Adwini Purushothaman','TOP PRIORITY: agent loops, harness engineering, verification and reliable autonomous execution.','["Harness","Autonomous Agents","LLM Loops","Reliability","Observability"]','advanced'],
    ['s11','AI & Agentic Intelligence','15:15-15:55','UCP Agentic Commerce: From AI Recommendations to AI-Driven Transactions','Navavarshan Gopal; Sharma G','Agentic workflows that progress from recommendations to actions/transactions.','["Agentic AI","E-commerce","Workflow Automation"]','intermediate'],
    ['s12','AI & Agentic Intelligence','16:00-16:20','OWASP Top 10 for LLM','Arun Kumar K','LLM application security risks and mitigations.','["Security","LLM","OWASP","AI Safety"]','intermediate'],
    ['s13','AI & Agentic Intelligence','16:25-16:45','Evaluating AI Applications: Testing Chatbots, AI Agents, RAG & MCP Servers','Vijayaraghavan Vasudevan','Evaluation and testing for production GenAI, RAG and MCP integrations.','["Testing","RAG","GenAI","Evaluation","MCP"]','advanced'],
    ['s14','Cloud, DevOps & FinOps','10:40-11:20','AIoT That Acts: When Connected Devices Stop Reporting and Start Deciding','','Autonomous decisions at the edge and connected-device systems.','["IoT","Edge Computing","AI","DevOps"]','intermediate'],
    ['s15','Cloud, DevOps & FinOps','11:25-11:45','From Alert to Evidence: Building AI-Powered Security Agents','Lavanya Kanagaraj','AI-assisted security operations and evidence-driven response.','["Security","AI","Cloud","SecOps"]','intermediate'],
    ['s16','Cloud, DevOps & FinOps','11:50-12:10','Cloud FinOps Advisor: Building AIPs on OCI with Generative AI Platform','Muthukunmar Sivagnanam','FinOps advisory, cloud optimization and GenAI-enabled operations.','["FinOps","Cloud","Cost Optimization","OCI"]','intermediate'],
    ['s17','Cloud, DevOps & FinOps','12:15-12:55','Quantum Computing Help?','Ashwini Mahendiran','Optimization challenges and emerging compute approaches.','["Quantum Computing","Optimization","Research"]','advanced'],
    ['s18','Cloud, DevOps & FinOps','14:30-15:10','AI-Assisted DevOps: Pipeline Recovery and Operational Automation','Chayan Deekar','AI-assisted DevOps, pipeline recovery and operational automation.','["DevOps","CI/CD","Harness","Pipeline Automation","Observability"]','intermediate'],
    ['s19','Cloud, DevOps & FinOps','15:15-15:55','Platform Engineering in the AI Era: Why Developers Need a Platform More Than Ever','Paramitharan Kalaiselvan','Platform strategy, developer self-service and cloud delivery.','["Platform Engineering","Developer Experience","Cloud","IDP"]','intermediate'],
    ['s20','Cloud, DevOps & FinOps','16:00-16:45','The Machine-Readable Enterprise: Engineering the Context Layer','Vennila Shanmugam; Charan Panthagi','Enterprise context and structured information for AI-enabled systems.','["Enterprise AI","Data Architecture","Machine Learning"]','advanced'],
    ['s21','Data & Observability','10:40-11:20','Trust, But Verify: Building a Provenance Layer for AI Banking','Bhanga Amary','Data provenance, traceability, trust and governance for enterprise AI.','["Data Governance","AI Trust","Provenance","Banking"]','advanced'],
    ['s22','Data & Observability','11:25-12:05','Architecting Enterprise Data Platforms for Reliable AI Systems','Harun Razeed Basheer','Reliable data foundations and architecture for AI-enabled systems.','["Data Platform","Data Engineering","AI","Architecture"]','advanced'],
    ['s23','Data & Observability','12:10-12:55','Harnessing the Power of Open Source Tool in Automating Data Quality Controls','Rohith Ram Prabhakaran','Data-quality automation.','["Data Quality","Open Source","Automation","Harness"]','intermediate'],
    ['s24','Data & Observability','13:30-15:10','The Hidden Cost of "Just Ship It": What Happens After Production?','Srinidhi Loganathan; Sahithya B A','Production operations, reliability and the cost of post-release issues.','["Production","Reliability","SRE","Cost","Post-Release"]','intermediate'],
    ['s25','Data & Observability','15:15-15:55','Activation Sorcery Transduction - A New Approach to AI Model Safety','Vinoj Sharma','AI model safety.','["AI Safety","Model Safety","MLOps","Guardrails"]','advanced'],
    ['s26','Data & Observability','16:00-16:20','Strengthen Guardrails: How LLM Observability','Dayadevi Karunanidhi','LLM monitoring, behavior visibility and safety guardrails.','["Observability","LLM","Guardrails","Monitoring","Harness"]','advanced'],
    ['s27','Data & Observability','16:25-16:45','Microsoft Fabric: From Data to Intelligence — Shaping the Modern Data Platform','Aravindh Kumar V; Aswathi','Modern data-platform architecture and analytics foundations.','["Microsoft Fabric","Data Platform","Analytics","BI"]','intermediate'],
  ];

  for (const [id,track,time_ist,title,speakers,role_relevance,career_tags,skill_level] of sessions) {
    await db`
      INSERT INTO sessions (id, track, time_ist, title, speakers, role_relevance, career_tags, skill_level)
      VALUES (${id}, ${track}, ${time_ist}, ${title}, ${speakers}, ${role_relevance}, ${career_tags}, ${skill_level})
      ON CONFLICT (id) DO NOTHING
    `;
  }
  seeded = true;
  console.log('✓ 27 conference sessions seeded');
}

// ─── Query helpers ─────────────────────────────────────────────────────────────
// Neon's tagged template literal is the query interface — helpers wrap it for
// param-array style used throughout the routes.

async function queryAll(sqlStr, params = []) {
  const db = getSql();
  // Build a tagged-template-style call from a plain string + params array
  return await db(sqlStr, params);
}

async function queryOne(sqlStr, params = []) {
  const rows = await queryAll(sqlStr, params);
  return rows[0] ?? null;
}

async function runQuery(sqlStr, params = []) {
  const db = getSql();
  return await db(sqlStr, params);
}

module.exports = { getDb, queryAll, queryOne, runQuery };
