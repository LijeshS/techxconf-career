/**
 * Observability Guardrail Engine
 * Harness-inspired pipeline conditions for career guidance quality
 */

const GUARDRAIL_RULES = [
  {
    id: 'G001',
    name: 'Minimum Experience Check',
    description: 'Warns when recommending advanced sessions to beginners',
    check: (input) => {
      if (input.experience_years < 2 && input.recommended_level === 'advanced') {
        return {
          triggered: true,
          severity: 'warning',
          reason: 'Advanced sessions recommended for user with less than 2 years experience. Consider foundational tracks first.',
          suggestion: 'Review beginner-friendly sessions in Industry & Innovation track.'
        };
      }
      return { triggered: false };
    }
  },
  {
    id: 'G002',
    name: 'Career Pivot Risk Check',
    description: 'Flags large domain jumps that may require significant upskilling',
    check: (input) => {
      const pivotDistance = computePivotDistance(input.current_domain, input.target_domain);
      if (pivotDistance > 3) {
        return {
          triggered: true,
          severity: 'warning',
          reason: `Career pivot from ${input.current_domain} to ${input.target_domain} requires significant upskilling (distance: ${pivotDistance}).`,
          suggestion: 'Consider intermediate sessions that bridge your current and target domains.'
        };
      }
      return { triggered: false };
    }
  },
  {
    id: 'G003',
    name: 'Session Overload Guard',
    description: 'Prevents recommending too many parallel sessions',
    check: (input) => {
      const parallelSessions = countParallelSessions(input.recommended_sessions);
      if (parallelSessions > 2) {
        return {
          triggered: true,
          severity: 'info',
          reason: `${parallelSessions} overlapping sessions detected. You cannot attend all recommended sessions simultaneously.`,
          suggestion: 'We prioritized the most relevant sessions for your profile. Starred sessions are highest priority.'
        };
      }
      return { triggered: false };
    }
  },
  {
    id: 'G004',
    name: 'Harness Alignment Check',
    description: 'Ensures Harness pipeline and agentic loop sessions are surfaced for DevOps/SRE roles',
    check: (input) => {
      const isDevOpsRole = ['DevOps Engineer','SRE','Platform Engineer','Software Engineer'].includes(input.current_role);
      const hasHarnessSession = input.recommended_sessions.some(s =>
        (s.career_tags || '[]').includes('Harness') || (s.career_tags || '[]').includes('Pipeline Automation')
      );
      if (isDevOpsRole && !hasHarnessSession) {
        return {
          triggered: true,
          severity: 'info',
          reason: 'Your role strongly aligns with Harness automation sessions not yet in your recommendation.',
          suggestion: 'Added "Building Autonomous Agents" (s10) and "AI-Assisted DevOps" (s18) to your plan.'
        };
      }
      return { triggered: false };
    }
  },
  {
    id: 'G005',
    name: 'LLM Safety & Observability Gate',
    description: 'Ensures AI practitioners are aware of safety and observability sessions',
    check: (input) => {
      const isAIRole = input.target_domain === 'AI & Agentic Intelligence' || input.current_role?.toLowerCase().includes('ai') || input.current_role?.toLowerCase().includes('ml');
      const hasSafetySession = input.recommended_sessions.some(s =>
        (s.career_tags || '[]').includes('Observability') ||
        (s.career_tags || '[]').includes('Guardrails') ||
        (s.career_tags || '[]').includes('AI Safety')
      );
      if (isAIRole && !hasSafetySession) {
        return {
          triggered: true,
          severity: 'warning',
          reason: 'AI practitioners should attend observability and safety sessions to build production-ready systems.',
          suggestion: 'Added "Strengthen Guardrails: How LLM Observability" (s26) as a required session.'
        };
      }
      return { triggered: false };
    }
  }
];

function computePivotDistance(from, to) {
  const domains = [
    'Industry & Innovation',
    'Data & Observability',
    'Cloud, DevOps & FinOps',
    'AI & Agentic Intelligence'
  ];
  const fromIdx = domains.indexOf(from);
  const toIdx = domains.indexOf(to);
  if (fromIdx === -1 || toIdx === -1) return 2;
  return Math.abs(fromIdx - toIdx);
}

function countParallelSessions(sessions) {
  if (!sessions || sessions.length < 2) return 0;
  let overlaps = 0;
  for (let i = 0; i < sessions.length; i++) {
    for (let j = i + 1; j < sessions.length; j++) {
      if (sessionsOverlap(sessions[i].time_ist, sessions[j].time_ist)) {
        overlaps++;
      }
    }
  }
  return overlaps;
}

function sessionsOverlap(time1, time2) {
  if (!time1 || !time2) return false;
  const parse = (t) => {
    const parts = t.split('-');
    const toMin = (s) => {
      const [h, m] = s.trim().split(':').map(Number);
      return h * 60 + (m || 0);
    };
    return { start: toMin(parts[0]), end: toMin(parts[1]) };
  };
  const a = parse(time1);
  const b = parse(time2);
  return a.start < b.end && b.start < a.end;
}

function runGuardrails(input) {
  const results = [];
  let observabilityScore = 100;

  for (const rule of GUARDRAIL_RULES) {
    try {
      const result = rule.check(input);
      if (result.triggered) {
        results.push({
          rule_id: rule.id,
          rule_name: rule.name,
          ...result
        });
        // Deduct observability score based on severity
        if (result.severity === 'warning') observabilityScore -= 15;
        if (result.severity === 'info') observabilityScore -= 5;
      }
    } catch (err) {
      console.error(`Guardrail ${rule.id} error:`, err.message);
    }
  }

  // Compute Harness pipeline fit score
  const harnessPipelineFit = computeHarnessFit(input);

  return {
    guardrail_flags: results,
    observability_score: Math.max(0, observabilityScore),
    harness_pipeline_fit: harnessPipelineFit,
    pipeline_status: harnessPipelineFit >= 75 ? 'PASSED' : harnessPipelineFit >= 50 ? 'WARNINGS' : 'NEEDS_REVIEW'
  };
}

function computeHarnessFit(input) {
  let score = 0;
  // Has CI/CD experience
  if (input.skills?.some(s => ['CI/CD','Jenkins','GitHub Actions','GitLab CI','Harness','Spinnaker','ArgoCD'].includes(s))) score += 25;
  // DevOps/Platform role
  if (['DevOps Engineer','SRE','Platform Engineer','Release Manager'].includes(input.current_role)) score += 25;
  // Targets pipeline/automation sessions
  if (input.recommended_sessions?.some(s => (s.career_tags || '[]').includes('Pipeline Automation') || (s.career_tags || '[]').includes('Harness'))) score += 25;
  // Has observability knowledge
  if (input.skills?.some(s => ['Prometheus','Grafana','Datadog','OpenTelemetry','Splunk','New Relic'].includes(s))) score += 25;
  return score;
}

module.exports = { runGuardrails };
