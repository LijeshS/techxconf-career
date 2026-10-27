const { v4: uuidv4 } = require('uuid');
const { initDb } = require('./_db');

// ── Guardrail engine ──────────────────────────────────────────────────────────
function runGuardrails(input) {
  const flags = [];
  let score = 100;
  const sessions = input.recommended_sessions || [];

  if (input.experience_years < 2 && input.recommended_level === 'advanced') {
    flags.push({ rule_id:'G001', rule_name:'Minimum Experience Check', severity:'warning',
      reason:'Advanced sessions recommended for user with under 2 years experience.',
      suggestion:'Consider foundational tracks first.' });
    score -= 15;
  }
  const parallelCount = countParallelSessions(sessions);
  if (parallelCount > 2) {
    flags.push({ rule_id:'G003', rule_name:'Session Overload Guard', severity:'info',
      reason:`${parallelCount} overlapping sessions detected.`,
      suggestion:'Starred sessions are highest priority.' });
    score -= 5;
  }
  const isDevOps = ['DevOps Engineer','SRE','Platform Engineer'].includes(input.current_role);
  const hasHarness = sessions.some(s => (s.career_tags||'[]').includes('Harness'));
  if (isDevOps && !hasHarness) {
    flags.push({ rule_id:'G004', rule_name:'Harness Alignment Check', severity:'info',
      reason:'Your role aligns with Harness sessions not yet in your plan.',
      suggestion:'Consider adding the "Building Autonomous Agents" session.' });
    score -= 5;
  }
  const isAI = input.target_domain === 'AI & Agentic Intelligence' || (input.current_role||'').toLowerCase().includes('ai');
  const hasSafety = sessions.some(s => (s.career_tags||'[]').includes('Observability') || (s.career_tags||'[]').includes('Guardrails'));
  if (isAI && !hasSafety) {
    flags.push({ rule_id:'G005', rule_name:'LLM Safety Gate', severity:'warning',
      reason:'AI practitioners should include observability/safety sessions.',
      suggestion:'Add "Strengthen Guardrails: LLM Observability".' });
    score -= 15;
  }
  const harnessFit = computeHarnessFit(input);
  return { guardrail_flags:flags, observability_score:Math.max(0,score), harness_pipeline_fit:harnessFit, pipeline_status: harnessFit>=75?'PASSED':harnessFit>=50?'WARNINGS':'NEEDS_REVIEW' };
}
function countParallelSessions(sessions) {
  let o=0; for (let i=0;i<sessions.length;i++) for (let j=i+1;j<sessions.length;j++) if (timeOverlap(sessions[i].time_ist,sessions[j].time_ist)) o++; return o;
}
function timeOverlap(t1,t2) {
  if (!t1||!t2) return false;
  const p=t=>{const [s,e]=t.split('-');const m=x=>{const[h,mm]=x.trim().split(':').map(Number);return h*60+(mm||0);};return[m(s),m(e)];};
  const[a1,a2]=p(t1),[b1,b2]=p(t2);return a1<b2&&b1<a2;
}
function computeHarnessFit(input) {
  let s=0;
  if ((input.skills||[]).some(sk=>['CI/CD','Harness','Jenkins','GitHub Actions','ArgoCD'].includes(sk))) s+=25;
  if (['DevOps Engineer','SRE','Platform Engineer'].includes(input.current_role)) s+=25;
  if ((input.recommended_sessions||[]).some(ses=>(ses.career_tags||'[]').includes('Harness'))) s+=25;
  if ((input.skills||[]).some(sk=>['Prometheus','Grafana','Datadog','OpenTelemetry'].includes(sk))) s+=25;
  return s;
}

// ── 2026 Market-based upskill & roadmap data ──────────────────────────────────
// Sources: DataCamp State of AI Careers 2026, WEF Future of Jobs 2025,
// Robert Half Tech Demand 2026, Draup AI Skills Report 2026

const UPSKILL_MAP = {
  'AI & Agentic Intelligence': {
    beginner: [
      { skill:'Python for AI', why:'#1 required skill in 87% of AI job posts (2026)', resource:'fast.ai or Kaggle Learn', demand:'🔥 Critical' },
      { skill:'Prompt Engineering', why:'Foundational for working with any LLM — now in 60% of AI job descriptions', resource:'DeepLearning.AI short courses', demand:'🔥 Critical' },
      { skill:'LangChain / LlamaIndex', why:'Top frameworks for building LLM applications — 7x growth in job posts since 2023', resource:'Official docs + GitHub', demand:'📈 High' },
      { skill:'Retrieval-Augmented Generation (RAG)', why:'Most common production AI pattern — required in 45% of AI Engineer roles', resource:'LangChain RAG tutorials', demand:'📈 High' },
      { skill:'OpenAI / Gemini API basics', why:'Fastest path to building AI products', resource:'OpenAI Cookbook', demand:'📈 High' },
    ],
    intermediate: [
      { skill:'LangGraph / Agentic Loops', why:'Autonomous agents are the #1 growth area — 12x YoY increase in job posts', resource:'LangGraph documentation', demand:'🔥 Critical' },
      { skill:'Vector Databases (Pinecone, Weaviate)', why:'Core infrastructure for RAG and semantic search at scale', resource:'Pinecone learn.pinecone.io', demand:'📈 High' },
      { skill:'LLM Evaluation & Testing', why:'Production AI requires measurable quality — now a dedicated role at large companies', resource:'RAGAS, TruLens frameworks', demand:'📈 High' },
      { skill:'AI Observability (Langfuse, Helicone)', why:'56% wage premium for engineers who can monitor LLM systems in production', resource:'Langfuse docs', demand:'🔥 Critical' },
      { skill:'MCP (Model Context Protocol)', why:'Emerging standard for agentic AI tool use — appeared at TechXConf 2026', resource:'Anthropic MCP docs', demand:'🌱 Emerging' },
    ],
    advanced: [
      { skill:'Fine-tuning & RLHF', why:'Custom model adaptation — rare skill commanding 40% salary premium', resource:'Hugging Face PEFT library', demand:'💰 Premium' },
      { skill:'Multi-agent Systems Design', why:'Enterprise-scale AI requires orchestrating multiple specialized agents', resource:'AutoGen, CrewAI frameworks', demand:'🔥 Critical' },
      { skill:'AI Safety & Red-teaming', why:'Regulatory requirements (EU AI Act) making this mandatory in enterprise AI', resource:'OWASP Top 10 for LLM', demand:'📈 High' },
      { skill:'MLOps / AI Infrastructure', why:'Gap between AI prototypes and production is the #1 challenge companies face', resource:'MLflow, Weights & Biases', demand:'📈 High' },
    ],
  },
  'Cloud, DevOps & FinOps': {
    beginner: [
      { skill:'Docker & Kubernetes', why:'Container orchestration in 78% of DevOps job descriptions (2026)', resource:'KodeKloud, A Cloud Guru', demand:'🔥 Critical' },
      { skill:'Terraform / Infrastructure as Code', why:'IaC required in 65% of Platform/DevOps roles', resource:'HashiCorp learn.terraform.io', demand:'🔥 Critical' },
      { skill:'GitHub Actions / CI/CD', why:'Foundational skill — every engineering team uses automated pipelines', resource:'GitHub Actions docs', demand:'🔥 Critical' },
      { skill:'AWS/Azure/GCP fundamentals', why:'Cloud certifications increase salary by 25-40% on average', resource:'AWS free tier + Cloud Practitioner cert', demand:'📈 High' },
      { skill:'Linux & Bash scripting', why:'Still the foundation of all DevOps work', resource:'Linux Foundation courses', demand:'📈 High' },
    ],
    intermediate: [
      { skill:'Harness CI/CD Platform', why:'Fastest-growing enterprise deployment tool — featured at TechXConf 2026', resource:'developer.harness.io', demand:'📈 High' },
      { skill:'OpenTelemetry (Observability)', why:'Unified observability is #1 ask from engineering leaders in 2026', resource:'opentelemetry.io', demand:'🔥 Critical' },
      { skill:'Kubernetes Advanced (Helm, ArgoCD)', why:'GitOps pattern now standard in 70% of enterprise Kubernetes deployments', resource:'ArgoCD docs + CNCF training', demand:'🔥 Critical' },
      { skill:'Platform Engineering / IDP', why:'Fastest-growing DevOps specialization — 3x headcount growth YoY', resource:'platformengineering.org', demand:'📈 High' },
      { skill:'FinOps (Cloud Cost Optimization)', why:'Companies overspend cloud by 35% on average — FinOps engineers are in high demand', resource:'finops.org certification', demand:'💰 Premium' },
    ],
    advanced: [
      { skill:'Service Mesh (Istio, Linkerd)', why:'Required for zero-trust security in microservices at scale', resource:'Istio docs, CNCF courses', demand:'📈 High' },
      { skill:'Chaos Engineering', why:'Reliability engineering now a board-level priority post-pandemic', resource:'Chaos Monkey, Litmus Chaos', demand:'🌱 Emerging' },
      { skill:'AI-assisted DevOps (GitHub Copilot for Ops)', why:'AI tooling reducing ops toil by 40% — early adopters have competitive edge', resource:'GitHub Copilot, Warp terminal', demand:'🔥 Critical' },
    ],
  },
  'Data & Observability': {
    beginner: [
      { skill:'SQL + dbt (Data Build Tool)', why:'SQL still #2 most required skill in data roles (2026); dbt now standard in 60% of data teams', resource:'dbt Learn, Mode Analytics', demand:'🔥 Critical' },
      { skill:'Python for Data Engineering', why:'Python + SQL combination in 80% of data engineer job posts', resource:'DataCamp, Codecademy', demand:'🔥 Critical' },
      { skill:'Apache Spark', why:'Still the dominant big data processing engine — required in 55% of data engineer roles', resource:'Databricks Community Edition', demand:'📈 High' },
      { skill:'Data Warehouse (Snowflake/BigQuery)', why:'Cloud warehouses replaced on-prem in 75% of organizations by 2026', resource:'Snowflake Uni, Google free tier', demand:'📈 High' },
      { skill:'Grafana + Prometheus', why:'De facto standard for metrics dashboards — in 65% of observability job posts', resource:'Grafana Labs Play environment', demand:'📈 High' },
    ],
    intermediate: [
      { skill:'Apache Kafka (Streaming)', why:'Real-time data now expected — Kafka usage up 40% YoY', resource:'Confluent developer training', demand:'📈 High' },
      { skill:'Data Quality (Great Expectations / Soda)', why:'Data contracts and quality gates now mandatory at data-mature companies', resource:'greatexpectations.io', demand:'🌱 Emerging' },
      { skill:'OpenTelemetry for Data Pipelines', why:'Observability extending to data — unified telemetry is 2026 priority', resource:'OTel docs + Jaeger', demand:'🔥 Critical' },
      { skill:'LLM Observability (Langfuse, Arize)', why:'AI systems need monitoring like any other service — new but fast-growing specialty', resource:'arize.com/phoenix', demand:'🔥 Critical' },
      { skill:'Medallion Architecture (Bronze/Silver/Gold)', why:'Industry-standard lakehouse pattern used by 65% of Databricks customers', resource:'Databricks Delta Lake docs', demand:'📈 High' },
    ],
    advanced: [
      { skill:'Data Mesh Architecture', why:'Decentralized data ownership model adopted by large enterprises', resource:'datamesh-architecture.com', demand:'💰 Premium' },
      { skill:'Real-time ML Feature Stores', why:'Bridging data and AI — critical for low-latency AI applications', resource:'Feast, Tecton docs', demand:'🌱 Emerging' },
      { skill:'Microsoft Fabric / Unity Catalog', why:'New platform consolidating analytics and AI — major enterprise investment in 2026', resource:'Microsoft Learn Fabric paths', demand:'📈 High' },
    ],
  },
  'Industry & Innovation': {
    beginner: [
      { skill:'AI Literacy & Prompt Engineering', why:'Expected baseline for all knowledge workers by 2026 — 42% of job posts mention AI skills', resource:'Google AI Essentials, Coursera', demand:'🔥 Critical' },
      { skill:'Product Thinking for AI', why:'Building AI products requires understanding limitations and user trust', resource:'Reforge, Lenny\'s Newsletter', demand:'📈 High' },
      { skill:'Data-driven Decision Making', why:'Leaders who understand data have 3x better outcomes (McKinsey 2025)', resource:'Google Data Analytics cert', demand:'📈 High' },
      { skill:'Stakeholder Communication of AI', why:'Gap between technical AI teams and business — huge career accelerator', resource:'HBR AI articles + storytelling courses', demand:'📈 High' },
    ],
    intermediate: [
      { skill:'AI Strategy & Governance', why:'EU AI Act (effective 2025) requires designated AI governance roles in enterprises', resource:'MIT Sloan AI Strategy course', demand:'🔥 Critical' },
      { skill:'Change Management for AI adoption', why:'70% of AI projects fail due to people issues, not technical ones (Gartner)', resource:'Prosci change management certification', demand:'📈 High' },
      { skill:'ROI & Business Case for AI', why:'CFOs now require measurable ROI before AI investment — this skill is scarce', resource:'McKinsey AI Academy', demand:'💰 Premium' },
      { skill:'Build vs Buy AI decisions', why:'Strategic skill as AI tool landscape explodes', resource:'Andreessen Horowitz AI canon', demand:'📈 High' },
    ],
    advanced: [
      { skill:'AI Ethics & Responsible AI', why:'Regulatory requirements growing — dedicated roles emerging at every large company', resource:'Partnership on AI, deepmind.com/ethics', demand:'🌱 Emerging' },
      { skill:'Enterprise AI Architecture', why:'Integrating AI across existing systems — rare and highly paid skill', resource:'AWS/Azure AI solution architect tracks', demand:'💰 Premium' },
    ],
  },
};

const ROADMAP_MAP = {
  'AI & Agentic Intelligence': {
    beginner: [
      { month:'Month 1–2', title:'Build Your Foundation', tasks:['Complete Python for Data Science (fast.ai or Kaggle)', 'Learn prompt engineering fundamentals', 'Build 2 small projects with OpenAI API', 'Attend TechXConf sessions: s06, s08, s12'], outcome:'Can use LLMs to automate simple tasks' },
      { month:'Month 3–4', title:'First RAG Application', tasks:['Learn LangChain basics + vector databases', 'Build a document Q&A app with RAG', 'Study LLM security (OWASP Top 10 for LLM)', 'Follow TechXConf "Exploring the AI Agent" learnings'], outcome:'Portfolio: working RAG app on GitHub' },
      { month:'Month 5–6', title:'Agentic AI Foundations', tasks:['Build a simple autonomous agent with LangGraph', 'Learn about Harness loops from TechXConf s10', 'Study evaluation frameworks (RAGAS)', 'Get hands-on with 1 agentic use case in your domain'], outcome:'Can describe and build basic agentic workflows' },
      { month:'Month 7–9', title:'Production Readiness', tasks:['Add observability to your AI app (Langfuse)', 'Learn about MCP (Model Context Protocol)', 'Deploy your app to production (Vercel/Railway)', 'Start contributing to an open-source AI project'], outcome:'First production AI application deployed' },
      { month:'Month 10–12', title:'Land Your AI Role', tasks:['Build portfolio of 3 AI projects', 'Write 2 technical articles about what you learned', 'Apply for AI Engineer / ML Engineer roles', 'Target companies: startups with AI-first products'], outcome:'Transition to AI role or promotion secured' },
    ],
    intermediate: [
      { month:'Month 1–2', title:'Deepen Agentic Skills', tasks:['Master LangGraph multi-agent patterns', 'Build a production RAG system with evaluation', 'Study Harness autonomous agent framework (TechXConf s10)', 'Implement AI observability with Langfuse/Helicone'], outcome:'Can build and monitor production agentic systems' },
      { month:'Month 3–4', title:'Specialize in a Vertical', tasks:['Pick a domain: FinTech AI / HealthTech AI / Enterprise AI', 'Build a domain-specific agent (e.g. code review agent)', 'Learn about AI governance and responsible AI', 'Start contributing to LangChain or similar OSS'], outcome:'Domain expertise in AI application development' },
      { month:'Month 5–7', title:'Scale & Reliability', tasks:['Learn MLOps patterns (MLflow, Weights & Biases)', 'Implement A/B testing for LLM outputs', 'Study fine-tuning with LoRA/PEFT', 'Present a tech talk internally about your AI work'], outcome:'Can ship AI features at production scale' },
      { month:'Month 8–12', title:'Thought Leadership', tasks:['Write about agentic AI patterns (Medium/Substack)', 'Speak at a local meetup or conference', 'Lead an AI initiative at your company', 'Build MCP servers and share with community'], outcome:'Recognized AI engineer / senior promotion' },
    ],
    advanced: [
      { month:'Month 1–3', title:'Principal-level AI Systems', tasks:['Design multi-agent orchestration architecture', 'Lead evaluation framework for your org\'s AI systems', 'Study EU AI Act compliance requirements', 'Contribute to open-source AI safety tooling'], outcome:'Org-wide AI architecture ownership' },
      { month:'Month 4–6', title:'Research + Industry Bridge', tasks:['Read and implement 2 recent AI papers', 'Present AI roadmap to executive stakeholders', 'Develop AI governance policies for your company', 'Mentor 2 junior AI engineers'], outcome:'Strategic AI leadership established' },
      { month:'Month 7–12', title:'External Impact', tasks:['Publish technical blog / paper on agentic systems', 'Speak at conference (target TechXConf next year)', 'Build or advise an AI startup', 'Define industry best practices in your niche'], outcome:'Recognised industry voice in AI' },
    ],
  },
  'Cloud, DevOps & FinOps': {
    beginner: [
      { month:'Month 1–2', title:'Core DevOps Tools', tasks:['Get AWS Cloud Practitioner certified', 'Learn Docker and run your first containerized app', 'Set up a basic GitHub Actions CI/CD pipeline', 'Study Linux fundamentals (bash, networking)'], outcome:'Can containerize and deploy a basic app' },
      { month:'Month 3–4', title:'Kubernetes & IaC', tasks:['Complete Kubernetes crash course (KodeKloud)', 'Deploy an app to k8s cluster (use free Play with K8s)', 'Write your first Terraform module', 'Attend TechXConf sessions: s18, s19'], outcome:'First Kubernetes deployment running' },
      { month:'Month 5–6', title:'Platform Thinking', tasks:['Learn about Internal Developer Platforms (IDPs)', 'Set up Harness CD pipeline end-to-end', 'Study FinOps basics + AWS Cost Explorer', 'Build a monitoring dashboard with Grafana'], outcome:'Can manage a complete deployment pipeline' },
      { month:'Month 7–9', title:'AWS/Azure Associate Cert', tasks:['Pass AWS Solutions Architect Associate or Azure 104', 'Implement OpenTelemetry in a sample app', 'Build an auto-scaling deployment', 'Set up alerting with PagerDuty or OpsGenie'], outcome:'Cloud certified + hands-on observability experience' },
      { month:'Month 10–12', title:'Apply & Level Up', tasks:['Apply for Junior DevOps / Cloud Engineer roles', 'Contribute to a CNCF open-source project', 'Build a personal DevOps portfolio project', 'Get a second cert (Kubernetes CKA or Terraform Associate)'], outcome:'DevOps / Cloud Engineer role secured' },
    ],
    intermediate: [
      { month:'Month 1–2', title:'Advanced Kubernetes', tasks:['Complete CKA (Certified Kubernetes Administrator)', 'Implement GitOps with ArgoCD in a real project', 'Study Helm chart design patterns', 'Learn service mesh basics (Istio)'], outcome:'CKA certified + GitOps pipeline operational' },
      { month:'Month 3–4', title:'Observability Stack', tasks:['Implement full OTel: traces, metrics, logs', 'Set up Grafana dashboards + alerting rules', 'Learn distributed tracing with Jaeger', 'Study TechXConf s18: AI-Assisted DevOps patterns'], outcome:'Production-grade observability in place' },
      { month:'Month 5–6', title:'Platform Engineering', tasks:['Design and build a developer portal (Backstage)', 'Automate self-service environments with Terraform', 'Implement Harness CD with feature flags', 'Present platform ROI to engineering leadership'], outcome:'IDP MVP built and adopted by 1+ team' },
      { month:'Month 7–9', title:'FinOps + Security', tasks:['Get FinOps Practitioner certification (finops.org)', 'Reduce cloud spend by 20% using cost allocation tags', 'Implement zero-trust networking basics', 'Automate compliance checks in CI/CD pipeline'], outcome:'Measurable cost savings + compliance framework' },
      { month:'Month 10–12', title:'Lead & Scale', tasks:['Lead a cloud migration or platform initiative', 'Mentor junior engineers', 'Present at internal or external DevOps meetup', 'Target Staff Engineer or Platform Lead title'], outcome:'Senior/Staff DevOps/Platform Engineer promotion' },
    ],
    advanced: [
      { month:'Month 1–3', title:'Architect-level Design', tasks:['Design org-wide platform strategy', 'Implement multi-cloud or hybrid cloud architecture', 'Build AI-assisted incident response system', 'Define SLOs/SLAs across all production services'], outcome:'Platform strategy document + stakeholder buy-in' },
      { month:'Month 4–8', title:'Scale & Influence', tasks:['Drive FinOps practice across $1M+ cloud spend', 'Implement chaos engineering program', 'Build internal AI Ops tooling', 'Contribute to CNCF project at maintainer level'], outcome:'Organization-wide platform ownership' },
      { month:'Month 9–12', title:'Industry Impact', tasks:['Speak at KubeCon or re:Invent', 'Publish architecture case study', 'Advise or join an infrastructure startup', 'Define internal platform as a product (PaaP) strategy'], outcome:'Recognised platform engineering leader' },
    ],
  },
  'Data & Observability': {
    beginner: [
      { month:'Month 1–2', title:'SQL & Python Foundation', tasks:['Complete SQL for Data Science (Mode Analytics free course)', 'Learn Python pandas + NumPy basics', 'Set up a local dbt project with sample data', 'Attend TechXConf sessions: s22, s23'], outcome:'Can query, transform and visualize data independently' },
      { month:'Month 3–4', title:'Modern Data Stack', tasks:['Build an end-to-end pipeline: ingest → dbt → dashboard', 'Learn Snowflake or BigQuery (free tiers available)', 'Build a Grafana dashboard from scratch', 'Study data modeling basics (dimensional modeling)'], outcome:'First complete data pipeline in portfolio' },
      { month:'Month 5–6', title:'Data Quality & Contracts', tasks:['Implement Great Expectations tests on a dataset', 'Learn about data observability (Monte Carlo, Soda)', 'Build a dbt model with tests and documentation', 'Study Apache Spark basics (Databricks Community)'], outcome:'Data quality framework implemented' },
      { month:'Month 7–9', title:'Streaming Basics', tasks:['Complete Kafka fundamentals (Confluent free training)', 'Build a simple streaming pipeline', 'Learn Delta Lake / Iceberg table formats', 'Study medallion architecture pattern'], outcome:'Real-time data pipeline built and documented' },
      { month:'Month 10–12', title:'Land Your Data Role', tasks:['Polish 3 data portfolio projects', 'Get dbt Analytics Engineer certification', 'Apply for Data Engineer / Analytics Engineer roles', 'Network at data meetups (dbt Community, local events)'], outcome:'Data Engineer role secured' },
    ],
    intermediate: [
      { month:'Month 1–2', title:'Advanced Data Engineering', tasks:['Implement medallion architecture at scale', 'Build streaming pipeline with Kafka + Spark Structured Streaming', 'Learn Unity Catalog / Delta Sharing', 'Study TechXConf s21: Data Provenance for AI'], outcome:'Production-grade lakehouse architecture' },
      { month:'Month 3–4', title:'LLM Observability', tasks:['Implement OpenTelemetry across data pipelines', 'Set up Langfuse or Arize for LLM monitoring', 'Build data quality SLOs with alerting', 'Study TechXConf s26: Strengthen Guardrails'], outcome:'End-to-end observability across data + AI systems' },
      { month:'Month 5–7', title:'AI-Native Data Platform', tasks:['Integrate an LLM-powered data quality assistant', 'Implement semantic layer with dbt Semantic Layer', 'Learn Microsoft Fabric or Databricks AI Functions', 'Build automated data documentation with AI'], outcome:'AI-augmented data platform deployed' },
      { month:'Month 8–12', title:'Lead Data Practice', tasks:['Define data mesh principles for your org', 'Lead a data quality initiative company-wide', 'Present data ROI to business stakeholders', 'Mentor junior data engineers'], outcome:'Senior Data Engineer / Lead title' },
    ],
    advanced: [
      { month:'Month 1–3', title:'Data Platform Architecture', tasks:['Design enterprise data mesh architecture', 'Build real-time feature store for ML', 'Implement data contracts across all pipelines', 'Evaluate and present Microsoft Fabric migration path'], outcome:'Data platform strategy and roadmap' },
      { month:'Month 4–8', title:'AI Integration at Scale', tasks:['Build unified observability for data + AI systems', 'Design data governance framework (cataloging, lineage)', 'Lead adoption of new data platform (Fabric/Databricks)', 'Contribute to Apache Spark or dbt open source'], outcome:'Enterprise data + AI infrastructure ownership' },
      { month:'Month 9–12', title:'Industry Voice', tasks:['Speak at Data Council, dbt Coalesce, or similar', 'Publish data architecture case study', 'Advise a data startup or consultancy', 'Define data engineering best practices for your industry'], outcome:'Principal Data Engineer / Data Architect' },
    ],
  },
  'Industry & Innovation': {
    beginner: [
      { month:'Month 1–2', title:'AI Literacy', tasks:['Complete Google AI Essentials (free, 5 hours)', 'Learn prompt engineering for productivity', 'Identify 3 AI use cases in your current role', 'Attend TechXConf sessions: s02, s05'], outcome:'Can use AI tools to 2x personal productivity' },
      { month:'Month 3–4', title:'Data-Driven Thinking', tasks:['Complete Google Data Analytics certificate', 'Build a simple dashboard in Looker Studio (free)', 'Learn to write a business case for an AI project', 'Read "Competing in the Age of AI" (Iansiti & Lakhani)'], outcome:'Can make data-backed business decisions' },
      { month:'Month 5–8', title:'AI Product Understanding', tasks:['Shadow a product team building an AI feature', 'Take a product management course (Reforge or PM school)', 'Map an AI use case end-to-end from problem to ROI', 'Join an AI community (e.g. MAANG AI, local AI meetups)'], outcome:'First AI initiative proposed or supported' },
      { month:'Month 9–12', title:'Lead an AI Pilot', tasks:['Own one AI project end-to-end', 'Present results to senior leadership', 'Document lessons learned as a case study', 'Apply for Product Manager / AI Strategy roles'], outcome:'AI pilot delivered with measurable outcome' },
    ],
    intermediate: [
      { month:'Month 1–2', title:'AI Strategy Depth', tasks:['Complete MIT Sloan AI Strategy online course', 'Map your company\'s AI maturity using Gartner framework', 'Identify 3 high-ROI AI automation opportunities', 'Study TechXConf s01: AI-Native Software Delivery'], outcome:'AI strategy document drafted' },
      { month:'Month 3–5', title:'Governance & Risk', tasks:['Study EU AI Act requirements (2025 effective)', 'Design an AI governance policy for your org', 'Learn about AI risk frameworks (NIST AI RMF)', 'Attend TechXConf s06: Who Governs the AI Agent?'], outcome:'AI governance framework proposed to leadership' },
      { month:'Month 6–9', title:'Drive Adoption', tasks:['Run an AI adoption workshop for your team', 'Measure and report AI productivity gains', 'Build coalition of AI champions in your org', 'Benchmark against industry AI adoption leaders'], outcome:'Measurable AI adoption increase in your team' },
      { month:'Month 10–12', title:'Strategic Leadership', tasks:['Present 3-year AI roadmap to C-suite', 'Establish AI Center of Excellence', 'Speak at an industry event about your AI journey', 'Target Director of AI / Chief AI Officer track'], outcome:'Promoted to AI leadership role' },
    ],
    advanced: [
      { month:'Month 1–4', title:'C-Suite AI Leadership', tasks:['Define enterprise AI strategy and investment plan', 'Establish AI governance board', 'Present AI risk + opportunity to board of directors', 'Build business case for AI Center of Excellence'], outcome:'Board-approved AI investment roadmap' },
      { month:'Month 5–8', title:'Organization Transformation', tasks:['Lead AI upskilling program for 100+ employees', 'Implement responsible AI policies', 'Build strategic vendor partnerships (hyperscalers, AI labs)', 'Measure AI ROI across business units'], outcome:'AI-transformed organization with documented results' },
      { month:'Month 9–12', title:'Industry Influence', tasks:['Publish Harvard Business Review / Forbes AI article', 'Speak at World Economic Forum, Davos, or equivalent', 'Advise AI startups or join AI ethics board', 'Build personal brand as AI transformation leader'], outcome:'Recognized industry AI leadership voice' },
    ],
  },
};

// ── Track scoring ─────────────────────────────────────────────────────────────
const TRACK_KEYWORDS = {
  'Industry & Innovation': ['strategy','product','leadership','enterprise','adoption','business','innovation'],
  'AI & Agentic Intelligence': ['ai','ml','machine learning','llm','chatbot','nlp','agent','genai','generative','rag'],
  'Cloud, DevOps & FinOps': ['devops','cloud','aws','azure','gcp','kubernetes','docker','ci/cd','pipeline','platform','terraform','sre','finops'],
  'Data & Observability': ['data','analytics','sql','database','etl','spark','kafka','observability','monitoring','logging'],
};
const ROLE_TRACK_MAP = {
  'Software Engineer':{'Industry & Innovation':2,'AI & Agentic Intelligence':3,'Cloud, DevOps & FinOps':3,'Data & Observability':2},
  'Data Engineer':{'Industry & Innovation':1,'AI & Agentic Intelligence':2,'Cloud, DevOps & FinOps':2,'Data & Observability':5},
  'Data Scientist':{'Industry & Innovation':2,'AI & Agentic Intelligence':5,'Cloud, DevOps & FinOps':1,'Data & Observability':4},
  'ML Engineer':{'Industry & Innovation':1,'AI & Agentic Intelligence':5,'Cloud, DevOps & FinOps':3,'Data & Observability':3},
  'DevOps Engineer':{'Industry & Innovation':2,'AI & Agentic Intelligence':2,'Cloud, DevOps & FinOps':5,'Data & Observability':3},
  'SRE':{'Industry & Innovation':1,'AI & Agentic Intelligence':2,'Cloud, DevOps & FinOps':5,'Data & Observability':4},
  'Platform Engineer':{'Industry & Innovation':2,'AI & Agentic Intelligence':2,'Cloud, DevOps & FinOps':5,'Data & Observability':2},
  'Product Manager':{'Industry & Innovation':5,'AI & Agentic Intelligence':3,'Cloud, DevOps & FinOps':2,'Data & Observability':2},
  'Security Engineer':{'Industry & Innovation':2,'AI & Agentic Intelligence':3,'Cloud, DevOps & FinOps':3,'Data & Observability':2},
  'Business Analyst':{'Industry & Innovation':4,'AI & Agentic Intelligence':3,'Cloud, DevOps & FinOps':1,'Data & Observability':3},
  'Architect':{'Industry & Innovation':3,'AI & Agentic Intelligence':3,'Cloud, DevOps & FinOps':3,'Data & Observability':4},
  'Student/Fresher':{'Industry & Innovation':3,'AI & Agentic Intelligence':4,'Cloud, DevOps & FinOps':3,'Data & Observability':3},
};
const GOAL_TRACK_MAP = {
  'transition-to-ai':{'AI & Agentic Intelligence':5,'Data & Observability':3},
  'level-up-devops':{'Cloud, DevOps & FinOps':5,'Data & Observability':3},
  'data-career':{'Data & Observability':5,'AI & Agentic Intelligence':2},
  'enterprise-leadership':{'Industry & Innovation':5},
  'build-ai-products':{'AI & Agentic Intelligence':5,'Industry & Innovation':3},
  'cloud-cost-optimization':{'Cloud, DevOps & FinOps':5},
  'platform-engineering':{'Cloud, DevOps & FinOps':5},
  'security-focus':{'AI & Agentic Intelligence':3,'Cloud, DevOps & FinOps':3},
};

function buildCareerPlan(answers, allSessions) {
  const scores = {'Industry & Innovation':0,'AI & Agentic Intelligence':0,'Cloud, DevOps & FinOps':0,'Data & Observability':0};
  const roleScores = ROLE_TRACK_MAP[answers.current_role] || ROLE_TRACK_MAP['Software Engineer'];
  for (const [t,v] of Object.entries(roleScores)) scores[t]+=v;
  const goalScores = GOAL_TRACK_MAP[answers.career_goal]||{};
  for (const [t,v] of Object.entries(goalScores)) scores[t]=(scores[t]||0)+v;
  for (const skill of (answers.skills||[])) {
    const sl=skill.toLowerCase();
    for (const [track,kws] of Object.entries(TRACK_KEYWORDS)) if (kws.some(kw=>sl.includes(kw)||kw.includes(sl))) scores[track]+=1;
  }
  const sorted=Object.entries(scores).sort((a,b)=>b[1]-a[1]);
  const topTrack=sorted[0][0], secondTrack=sorted[1][0];
  const expLevel = answers.experience_years<2?'beginner':answers.experience_years<5?'intermediate':'advanced';

  const candidates=allSessions.filter(s=>s.track===topTrack||s.track===secondTrack);
  const scored=candidates.map(s=>{
    let sc=s.track===topTrack?10:5;
    const tags=JSON.parse(s.career_tags||'[]');
    for (const t of tags) if ((answers.skills||[]).some(sk=>sk.toLowerCase().includes(t.toLowerCase()))) sc+=3;
    if (s.skill_level===expLevel) sc+=2;
    if (s.skill_level==='advanced'&&expLevel==='beginner') sc-=4;
    return {...s,score:sc};
  }).sort((a,b)=>b.score-a.score);

  const selected=[];const slots=new Set();
  for (const s of scored){
    if (selected.length>=6) break;
    if (!slots.has(s.time_ist)){selected.push(s);slots.add(s.time_ist);}
    else if (selected.length<4) selected.push(s);
  }

  const upskills = UPSKILL_MAP[topTrack]?.[expLevel] || UPSKILL_MAP[topTrack]?.intermediate || [];
  const roadmap  = ROADMAP_MAP[topTrack]?.[expLevel]  || ROADMAP_MAP[topTrack]?.intermediate  || [];

  return {
    recommended_track:topTrack, track_scores:scores,
    recommended_sessions:selected,
    upskill_areas:upskills,
    career_roadmap:roadmap,
    experience_level:expLevel==='beginner'?'Beginner':expLevel==='intermediate'?'Mid-level':'Senior',
    recommended_level:expLevel, target_domain:topTrack,
  };
}

// ── Handler ───────────────────────────────────────────────────────────────────
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if (req.method==='OPTIONS') return res.status(200).end();

  const db = await initDb();
  const { id } = req.query;

  try {
    // GET — retrieve stored assessment and recompute upskills/roadmap from answers
    if (req.method==='GET' && id) {
      const rows = await db`SELECT * FROM assessments WHERE id=${id}`;
      if (!rows[0]) return res.status(404).json({error:'Assessment not found'});
      const a = rows[0];
      const sessionIds = JSON.parse(a.recommended_sessions||'[]');
      let sessions = [];
      if (sessionIds.length) sessions = await db`SELECT * FROM sessions WHERE id=ANY(${sessionIds}::text[])`;
      // Recompute upskills + roadmap from stored answers (not stored in DB columns)
      const storedAnswers = JSON.parse(a.answers);
      const expLevel = storedAnswers.experience_years<2?'beginner':storedAnswers.experience_years<5?'intermediate':'advanced';
      const upskill_areas = UPSKILL_MAP[a.recommended_track]?.[expLevel] || UPSKILL_MAP[a.recommended_track]?.intermediate || [];
      const career_roadmap = ROADMAP_MAP[a.recommended_track]?.[expLevel]  || ROADMAP_MAP[a.recommended_track]?.intermediate  || [];
      return res.json({
        ...a,
        answers:storedAnswers,
        track_scores:JSON.parse(a.track_scores),
        recommended_sessions:sessions,
        guardrail_flags:JSON.parse(a.guardrail_flags||'[]'),
        upskill_areas,
        career_roadmap,
        experience_level:expLevel==='beginner'?'Beginner':expLevel==='intermediate'?'Mid-level':'Senior',
      });
    }

    // POST — run full assessment
    if (req.method==='POST') {
      const {user_id,answers} = req.body;
      if (!user_id||!answers) return res.status(400).json({error:'user_id and answers required'});
      const start = Date.now();
      const users = await db`SELECT * FROM users WHERE id=${user_id}`;
      if (!users[0]) return res.status(404).json({error:'User not found'});
      const dbSkills = await db`SELECT skill_name FROM skills WHERE user_id=${user_id}`;
      const enriched = {...answers, skills:[...(answers.skills||[]),...dbSkills.map(s=>s.skill_name)], current_role:answers.current_role||users[0].user_role||'Software Engineer', experience_years:answers.experience_years??users[0].experience_years??0};
      const allSessions = await db`SELECT * FROM sessions`;
      const plan = buildCareerPlan(enriched, allSessions);
      const guardrailInput = {...enriched, recommended_sessions:plan.recommended_sessions, recommended_level:plan.recommended_level, target_domain:plan.recommended_track, current_domain:answers.current_domain||plan.recommended_track};
      const guardrailResult = runGuardrails(guardrailInput);
      const aid = uuidv4();
      await db`INSERT INTO assessments (id,user_id,answers,track_scores,recommended_track,recommended_sessions,guardrail_flags,observability_score,harness_pipeline_fit) VALUES (${aid},${user_id},${JSON.stringify(enriched)},${JSON.stringify(plan.track_scores)},${plan.recommended_track},${JSON.stringify(plan.recommended_sessions.map(s=>s.id))},${JSON.stringify(guardrailResult.guardrail_flags)},${guardrailResult.observability_score},${guardrailResult.harness_pipeline_fit})`;
      await db`INSERT INTO observability_logs (id,user_id,event_type,payload,guardrail_triggered,guardrail_reason,response_time_ms) VALUES (${uuidv4()},${user_id},'assessment_completed',${JSON.stringify({track:plan.recommended_track})},${guardrailResult.guardrail_flags.length>0?1:0},${guardrailResult.guardrail_flags.map(f=>f.rule_name).join(',')||null},${Date.now()-start})`;
      return res.status(201).json({assessment_id:aid, recommended_track:plan.recommended_track, track_scores:plan.track_scores, recommended_sessions:plan.recommended_sessions, upskill_areas:plan.upskill_areas, career_roadmap:plan.career_roadmap, experience_level:plan.experience_level, guardrails:guardrailResult});
    }

    res.status(405).json({error:'Method not allowed'});
  } catch(err) {
    console.error('assessments error:',err);
    res.status(500).json({error:err.message||String(err)});
  }
};
