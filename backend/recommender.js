/**
 * Career Recommendation Engine
 * Scores career tracks and sessions based on user profile answers
 */

const TRACK_KEYWORDS = {
  'Industry & Innovation': ['strategy','product','leadership','enterprise','adoption','digital transformation','business','innovation','management'],
  'AI & Agentic Intelligence': ['ai','ml','machine learning','llm','chatbot','nlp','deep learning','neural network','agent','genai','generative','rag','langchain'],
  'Cloud, DevOps & FinOps': ['devops','cloud','aws','azure','gcp','kubernetes','docker','ci/cd','pipeline','platform','iac','terraform','sre','finops','infrastructure'],
  'Data & Observability': ['data','analytics','sql','database','etl','data engineering','spark','kafka','observability','monitoring','logging','metrics','tracing','data platform']
};

const ROLE_TRACK_MAP = {
  'Software Engineer':        { 'Industry & Innovation': 2, 'AI & Agentic Intelligence': 3, 'Cloud, DevOps & FinOps': 3, 'Data & Observability': 2 },
  'Data Engineer':            { 'Industry & Innovation': 1, 'AI & Agentic Intelligence': 2, 'Cloud, DevOps & FinOps': 2, 'Data & Observability': 5 },
  'Data Scientist':           { 'Industry & Innovation': 2, 'AI & Agentic Intelligence': 5, 'Cloud, DevOps & FinOps': 1, 'Data & Observability': 4 },
  'ML Engineer':              { 'Industry & Innovation': 1, 'AI & Agentic Intelligence': 5, 'Cloud, DevOps & FinOps': 3, 'Data & Observability': 3 },
  'DevOps Engineer':          { 'Industry & Innovation': 2, 'AI & Agentic Intelligence': 2, 'Cloud, DevOps & FinOps': 5, 'Data & Observability': 3 },
  'SRE':                      { 'Industry & Innovation': 1, 'AI & Agentic Intelligence': 2, 'Cloud, DevOps & FinOps': 5, 'Data & Observability': 4 },
  'Platform Engineer':        { 'Industry & Innovation': 2, 'AI & Agentic Intelligence': 2, 'Cloud, DevOps & FinOps': 5, 'Data & Observability': 2 },
  'Product Manager':          { 'Industry & Innovation': 5, 'AI & Agentic Intelligence': 3, 'Cloud, DevOps & FinOps': 2, 'Data & Observability': 2 },
  'Security Engineer':        { 'Industry & Innovation': 2, 'AI & Agentic Intelligence': 3, 'Cloud, DevOps & FinOps': 3, 'Data & Observability': 2 },
  'Business Analyst':         { 'Industry & Innovation': 4, 'AI & Agentic Intelligence': 3, 'Cloud, DevOps & FinOps': 1, 'Data & Observability': 3 },
  'Architect':                { 'Industry & Innovation': 3, 'AI & Agentic Intelligence': 3, 'Cloud, DevOps & FinOps': 3, 'Data & Observability': 4 },
  'Student/Fresher':          { 'Industry & Innovation': 3, 'AI & Agentic Intelligence': 4, 'Cloud, DevOps & FinOps': 3, 'Data & Observability': 3 },
};

const GOAL_TRACK_MAP = {
  'transition-to-ai':         { 'AI & Agentic Intelligence': 5, 'Data & Observability': 3 },
  'level-up-devops':          { 'Cloud, DevOps & FinOps': 5, 'Data & Observability': 3 },
  'data-career':              { 'Data & Observability': 5, 'AI & Agentic Intelligence': 2 },
  'enterprise-leadership':    { 'Industry & Innovation': 5, 'Cloud, DevOps & FinOps': 2 },
  'build-ai-products':        { 'AI & Agentic Intelligence': 5, 'Industry & Innovation': 3 },
  'cloud-cost-optimization':  { 'Cloud, DevOps & FinOps': 5, 'Data & Observability': 2 },
  'platform-engineering':     { 'Cloud, DevOps & FinOps': 5, 'AI & Agentic Intelligence': 2 },
  'security-focus':           { 'AI & Agentic Intelligence': 3, 'Cloud, DevOps & FinOps': 3 },
};

function scoreSkillsAgainstTracks(skills) {
  const scores = { 'Industry & Innovation': 0, 'AI & Agentic Intelligence': 0, 'Cloud, DevOps & FinOps': 0, 'Data & Observability': 0 };
  if (!skills || skills.length === 0) return scores;

  for (const skill of skills) {
    const skillLower = skill.toLowerCase();
    for (const [track, keywords] of Object.entries(TRACK_KEYWORDS)) {
      if (keywords.some(kw => skillLower.includes(kw) || kw.includes(skillLower))) {
        scores[track] += 1;
      }
    }
  }
  return scores;
}

function computeTrackScores(answers) {
  const scores = { 'Industry & Innovation': 0, 'AI & Agentic Intelligence': 0, 'Cloud, DevOps & FinOps': 0, 'Data & Observability': 0 };

  // Role-based scoring
  const roleScores = ROLE_TRACK_MAP[answers.current_role] || ROLE_TRACK_MAP['Software Engineer'];
  for (const [track, val] of Object.entries(roleScores)) scores[track] += val;

  // Goal-based scoring
  const goalScores = GOAL_TRACK_MAP[answers.career_goal] || {};
  for (const [track, val] of Object.entries(goalScores)) scores[track] = (scores[track] || 0) + val;

  // Skill-based scoring
  const skillScores = scoreSkillsAgainstTracks(answers.skills);
  for (const [track, val] of Object.entries(skillScores)) scores[track] += val;

  // Experience boost (senior folks get more targeted recommendations)
  const expBoost = Math.min(answers.experience_years / 10, 1.5);
  for (const track of Object.keys(scores)) scores[track] = Math.round(scores[track] * (1 + expBoost * 0.1));

  // Interest areas boost
  if (answers.interests) {
    for (const interest of answers.interests) {
      const interestLower = interest.toLowerCase();
      for (const [track, keywords] of Object.entries(TRACK_KEYWORDS)) {
        if (keywords.some(kw => interestLower.includes(kw))) scores[track] += 2;
      }
    }
  }

  return scores;
}

function selectSessions(trackScores, allSessions, answers) {
  const topTrack = Object.entries(trackScores).sort((a, b) => b[1] - a[1])[0][0];
  const secondTrack = Object.entries(trackScores).sort((a, b) => b[1] - a[1])[1][0];

  // Filter sessions from top 2 tracks
  const candidates = allSessions.filter(s =>
    s.track === topTrack || s.track === secondTrack
  );

  // Score each session
  const scored = candidates.map(session => {
    let sessionScore = session.track === topTrack ? 10 : 5;
    const tags = JSON.parse(session.career_tags || '[]');
    const skills = (answers.skills || []).map(s => s.toLowerCase());

    // Boost for skill matches
    for (const tag of tags) {
      if (skills.some(sk => sk.includes(tag.toLowerCase()) || tag.toLowerCase().includes(sk))) {
        sessionScore += 3;
      }
    }

    // Skill level matching
    const expLevel = answers.experience_years < 2 ? 'beginner' : answers.experience_years < 5 ? 'intermediate' : 'advanced';
    if (session.skill_level === expLevel) sessionScore += 2;
    if (session.skill_level === 'advanced' && expLevel === 'beginner') sessionScore -= 4;

    // Goal alignment
    const goalKeywords = {
      'transition-to-ai': ['AI','LLM','Agentic','GenAI','ML'],
      'level-up-devops': ['DevOps','Pipeline','Harness','CI/CD','SRE'],
      'data-career': ['Data','Analytics','ETL','Platform'],
      'build-ai-products': ['Agentic','LLM','RAG','GenAI','Harness'],
      'platform-engineering': ['Platform','Developer Experience','IDP'],
      'security-focus': ['Security','OWASP','AI Safety','Guardrails'],
      'cloud-cost-optimization': ['FinOps','Cloud','Cost'],
    };
    const goalKws = goalKeywords[answers.career_goal] || [];
    for (const gkw of goalKws) {
      if (tags.includes(gkw)) sessionScore += 2;
    }

    return { ...session, score: sessionScore };
  });

  // Sort and deduplicate by time slot (pick best per slot)
  scored.sort((a, b) => b.score - a.score);

  // Return top sessions avoiding time conflicts where possible
  const selected = [];
  const usedSlots = new Set();

  for (const session of scored) {
    if (selected.length >= 6) break;
    // Allow some overlap but prefer non-conflicting
    if (!usedSlots.has(session.time_ist)) {
      selected.push(session);
      usedSlots.add(session.time_ist);
    } else if (selected.length < 4) {
      selected.push(session); // Allow overlap for top picks
    }
  }

  return selected;
}

function buildCareerPlan(answers, sessions) {
  const trackScores = computeTrackScores(answers);
  const topTrack = Object.entries(trackScores).sort((a, b) => b[1] - a[1])[0][0];
  const recommendedSessions = selectSessions(trackScores, sessions, answers);

  const upskillMap = {
    'Industry & Innovation': ['Strategic Thinking', 'AI Adoption Frameworks', 'Stakeholder Management', 'Business Case Development'],
    'AI & Agentic Intelligence': ['Prompt Engineering', 'LangChain / LangGraph', 'RAG Architecture', 'LLM Evaluation', 'AI Safety'],
    'Cloud, DevOps & FinOps': ['Kubernetes', 'Terraform', 'Harness CD', 'OpenTelemetry', 'FinOps Certification'],
    'Data & Observability': ['Apache Spark', 'dbt', 'OpenTelemetry', 'Grafana', 'Data Contracts']
  };

  const roadmapMap = {
    'Industry & Innovation': ['Strengthen AI literacy (3 months)', 'Lead a cross-functional AI pilot (6 months)', 'Publish case study or speak at internal event (12 months)'],
    'AI & Agentic Intelligence': ['Complete LLM fundamentals course (1 month)', 'Build a RAG prototype (2-3 months)', 'Deploy an agentic workflow to production (6 months)', 'Contribute to open-source LLM tooling (12 months)'],
    'Cloud, DevOps & FinOps': ['Earn a cloud certification (AWS/GCP/Azure) (2 months)', 'Set up a Harness CI/CD pipeline (3 months)', 'Implement full observability stack (6 months)', 'Architect a platform IDP (12 months)'],
    'Data & Observability': ['Master SQL + dbt (1 month)', 'Build a streaming pipeline with Kafka (3 months)', 'Implement data quality gates (5 months)', 'Design a medallion data lakehouse (12 months)'],
  };

  return {
    recommended_track: topTrack,
    track_scores: trackScores,
    recommended_sessions: recommendedSessions,
    upskill_areas: upskillMap[topTrack] || [],
    career_roadmap: roadmapMap[topTrack] || [],
    experience_level: answers.experience_years < 2 ? 'Beginner' : answers.experience_years < 5 ? 'Mid-level' : 'Senior',
    recommended_level: answers.experience_years < 2 ? 'beginner' : answers.experience_years < 5 ? 'intermediate' : 'advanced',
    target_domain: topTrack
  };
}

module.exports = { buildCareerPlan, computeTrackScores };
