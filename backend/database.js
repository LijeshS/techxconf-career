const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');

const DB_PATH = path.join(__dirname, 'techxconf.db');

let db = null;
let SQL = null;

// Persist the in-memory database to disk
function persist() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

async function getDb() {
  if (db) return db;

  SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  initializeSchema();
  persist(); // save initial schema
  return db;
}

// Wrap sql.js API to match better-sqlite3-style synchronous usage
// sql.js uses run/exec differently, so we add helpers
function execDb(database, sql) {
  database.run(sql);
}

function initializeSchema() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      current_role TEXT,
      experience_years INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS skills (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      skill_name TEXT NOT NULL,
      proficiency INTEGER DEFAULT 1,
      category TEXT,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
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
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS bookmarks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, session_id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS observability_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      event_type TEXT NOT NULL,
      payload TEXT,
      guardrail_triggered INTEGER DEFAULT 0,
      guardrail_reason TEXT,
      response_time_ms INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  seedSessions();
}

function seedSessions() {
  const result = db.exec('SELECT COUNT(*) as c FROM sessions');
  const count = result[0]?.values[0][0] || 0;
  if (count > 0) return;

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
    ['s23','Data & Observability','12:10-12:55','Harnessing the Power of Open Source Tool in Automating Data Quality Controls','Rohith Ram Prabhakaran','Data-quality automation; overlaps with AI workflow sessions.','["Data Quality","Open Source","Automation","Harness"]','intermediate'],
    ['s24','Data & Observability','13:30-15:10','The Hidden Cost of "Just Ship It": What Happens After Production?','Srinidhi Loganathan; Sahithya B A','Production operations, reliability and the cost of post-release issues.','["Production","Reliability","SRE","Cost","Post-Release"]','intermediate'],
    ['s25','Data & Observability','15:15-15:55','Activation Sorcery Transduction - A New Approach to AI Model Safety','Vinoj Sharma','AI model safety; overlaps with the Cloud-platform-engineering session.','["AI Safety","Model Safety","MLOps","Guardrails"]','advanced'],
    ['s26','Data & Observability','16:00-16:20','Strengthen Guardrails: How LLM Observability','Dayadevi Karunanidhi','LLM monitoring, behavior visibility and safety guardrails.','["Observability","LLM","Guardrails","Monitoring","Harness"]','advanced'],
    ['s27','Data & Observability','16:25-16:45','Microsoft Fabric: From Data to Intelligence — Shaping the Modern Data Platform','Aravindh Kumar V; Aswathi','Modern data-platform architecture and analytics foundations.','["Microsoft Fabric","Data Platform","Analytics","BI"]','intermediate'],
  ];

  for (const s of sessions) {
    db.run(
      `INSERT OR IGNORE INTO sessions (id, track, time_ist, title, speakers, role_relevance, career_tags, skill_level)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      s
    );
  }
}

// Helper: run a SELECT and return array of row objects
function queryAll(database, sql, params = []) {
  const stmt = database.prepare(sql);
  const rows = [];
  stmt.bind(params);
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

// Helper: run a SELECT and return single row object or null
function queryOne(database, sql, params = []) {
  const rows = queryAll(database, sql, params);
  return rows.length > 0 ? rows[0] : null;
}

// Helper: run INSERT/UPDATE/DELETE
function runQuery(database, sql, params = []) {
  database.run(sql, params);
  persist();
}

module.exports = { getDb, queryAll, queryOne, runQuery, persist };
