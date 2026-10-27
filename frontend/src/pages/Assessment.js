import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitAssessment } from '../api';

const ROLES = [
  'Software Engineer','Data Engineer','Data Scientist','ML Engineer',
  'DevOps Engineer','SRE','Platform Engineer','Product Manager',
  'Security Engineer','Business Analyst','Architect','Student/Fresher',
];

const CAREER_GOALS = [
  { value: 'transition-to-ai', label: '🤖 Transition into AI/ML' },
  { value: 'level-up-devops', label: '⚙️ Level up in DevOps/SRE' },
  { value: 'data-career', label: '📊 Build a data career' },
  { value: 'enterprise-leadership', label: '🏢 Move into tech leadership' },
  { value: 'build-ai-products', label: '🚀 Build AI-powered products' },
  { value: 'cloud-cost-optimization', label: '☁️ Master cloud & FinOps' },
  { value: 'platform-engineering', label: '🧱 Platform engineering' },
  { value: 'security-focus', label: '🔐 Specialize in AI security' },
];

const SKILL_SUGGESTIONS = [
  'Python','JavaScript','TypeScript','Java','Go','Kubernetes','Docker',
  'AWS','Azure','GCP','Terraform','CI/CD','GitHub Actions','Harness',
  'React','Node.js','PostgreSQL','MongoDB','Redis','Kafka','Spark',
  'Prometheus','Grafana','Datadog','OpenTelemetry','LangChain','PyTorch',
  'TensorFlow','Scikit-learn','dbt','Airflow','RAG','LLM','MLOps',
];

const INTEREST_OPTIONS = [
  'AI Agents','LLM Applications','Platform Engineering','Data Quality',
  'Cloud Architecture','Security & Compliance','FinOps','MLOps',
  'Observability','Developer Experience','AI Ethics','Quantum Computing',
];

const STEPS = ['Profile', 'Goals', 'Skills', 'Interests'];

export default function Assessment({ user }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [skillInput, setSkillInput] = useState('');

  const [answers, setAnswers] = useState({
    current_role: '',
    experience_years: 0,
    current_domain: '',
    career_goal: '',
    skills: [],
    interests: [],
    learning_style: '',
    available_hours: '',
  });

  const update = (field, value) => setAnswers(a => ({ ...a, [field]: value }));

  const toggleSkill = (skill) => {
    setAnswers(a => ({
      ...a,
      skills: a.skills.includes(skill) ? a.skills.filter(s => s !== skill) : [...a.skills, skill]
    }));
  };

  const addCustomSkill = () => {
    const s = skillInput.trim();
    if (s && !answers.skills.includes(s)) {
      setAnswers(a => ({ ...a, skills: [...a.skills, s] }));
    }
    setSkillInput('');
  };

  const toggleInterest = (interest) => {
    setAnswers(a => ({
      ...a,
      interests: a.interests.includes(interest) ? a.interests.filter(i => i !== interest) : [...a.interests, interest]
    }));
  };

  const canProceed = () => {
    if (step === 0) return answers.current_role && answers.experience_years >= 0;
    if (step === 1) return !!answers.career_goal;
    if (step === 2) return answers.skills.length >= 1;
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await submitAssessment({ user_id: user.id, answers });
      navigate(`/results/${result.assessment_id}`);
    } catch (err) {
      setError(err.message || 'Assessment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const progressPct = ((step) / STEPS.length) * 100;

  return (
    <div className="assessment-page container-sm" style={{ paddingTop: '40px', paddingBottom: '60px' }}>
      {/* Header */}
      <div className="assess-header">
        <h1 className="section-title">Career Assessment</h1>
        <p className="section-subtitle">Help us map you to the perfect TechXConf sessions</p>

        {/* Step indicators */}
        <div className="step-indicators" role="list" aria-label="Assessment steps">
          {STEPS.map((label, i) => (
            <div key={label} className={`step-indicator ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`} role="listitem" aria-current={i === step ? 'step' : undefined}>
              <div className="step-dot">{i < step ? '✓' : i + 1}</div>
              <span className="step-label">{label}</span>
            </div>
          ))}
        </div>
        <div className="progress-bar" role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100} style={{ marginTop: '12px' }}>
          <div className="progress-fill" style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg, var(--primary), var(--secondary))' }} />
        </div>
      </div>

      {error && <div className="alert alert-danger" role="alert" style={{ marginBottom: '16px' }}>{error}</div>}

      <div className="assess-card card" style={{ marginTop: '24px' }}>
        {/* Step 0: Profile */}
        {step === 0 && (
          <div className="assess-step" aria-labelledby="step0-title">
            <h2 id="step0-title" className="step-title">👤 Your Current Profile</h2>
            <p className="step-desc">Tell us where you are today</p>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label" htmlFor="role">Current Role</label>
              <select id="role" value={answers.current_role} onChange={e => update('current_role', e.target.value)} required>
                <option value="">Select your role…</option>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label" htmlFor="exp">Years of Experience</label>
              <input
                id="exp"
                type="range"
                min="0" max="20" step="1"
                value={answers.experience_years}
                onChange={e => update('experience_years', parseInt(e.target.value))}
                style={{ padding: 0, background: 'transparent', border: 'none' }}
              />
              <div className="exp-display">
                <span className="exp-value">{answers.experience_years} year{answers.experience_years !== 1 ? 's' : ''}</span>
                <span className="exp-level chip chip-primary">
                  {answers.experience_years < 2 ? 'Beginner' : answers.experience_years < 5 ? 'Mid-level' : answers.experience_years < 10 ? 'Senior' : 'Principal/Lead'}
                </span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="domain">Primary Domain</label>
              <select id="domain" value={answers.current_domain} onChange={e => update('current_domain', e.target.value)}>
                <option value="">Select your domain…</option>
                <option value="Industry & Innovation">Industry & Innovation</option>
                <option value="AI & Agentic Intelligence">AI & Agentic Intelligence</option>
                <option value="Cloud, DevOps & FinOps">Cloud, DevOps & FinOps</option>
                <option value="Data & Observability">Data & Observability</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 1: Goals */}
        {step === 1 && (
          <div className="assess-step" aria-labelledby="step1-title">
            <h2 id="step1-title" className="step-title">🎯 Your Career Goal</h2>
            <p className="step-desc">Where do you want to be in 12 months?</p>
            <div className="goal-grid">
              {CAREER_GOALS.map(g => (
                <button
                  key={g.value}
                  className={`goal-option ${answers.career_goal === g.value ? 'selected' : ''}`}
                  onClick={() => update('career_goal', g.value)}
                  type="button"
                  aria-pressed={answers.career_goal === g.value}
                >
                  {g.label}
                </button>
              ))}
            </div>

            <div className="form-group" style={{ marginTop: '24px' }}>
              <label className="form-label" htmlFor="learn-style">Preferred Learning Style</label>
              <select id="learn-style" value={answers.learning_style} onChange={e => update('learning_style', e.target.value)}>
                <option value="">Select…</option>
                <option value="hands-on">Hands-on / workshops</option>
                <option value="talks">Talks & keynotes</option>
                <option value="case-studies">Case studies</option>
                <option value="mixed">Mixed — all of the above</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 2: Skills */}
        {step === 2 && (
          <div className="assess-step" aria-labelledby="step2-title">
            <h2 id="step2-title" className="step-title">⚡ Your Tech Skills</h2>
            <p className="step-desc">Select all that apply — be honest, this improves recommendations</p>
            <div className="skill-chips" role="group" aria-label="Select your skills">
              {SKILL_SUGGESTIONS.map(skill => (
                <button
                  key={skill}
                  className={`skill-chip ${answers.skills.includes(skill) ? 'selected' : ''}`}
                  onClick={() => toggleSkill(skill)}
                  type="button"
                  aria-pressed={answers.skills.includes(skill)}
                >
                  {skill}
                </button>
              ))}
            </div>
            <div className="custom-skill-row" style={{ marginTop: '16px' }}>
              <input
                type="text"
                placeholder="Add a custom skill…"
                value={skillInput}
                onChange={e => setSkillInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomSkill())}
                aria-label="Add custom skill"
              />
              <button className="btn btn-secondary btn-sm" onClick={addCustomSkill} type="button">Add</button>
            </div>
            {answers.skills.length > 0 && (
              <div className="selected-skills" style={{ marginTop: '12px' }}>
                <span className="form-label">Selected ({answers.skills.length}): </span>
                {answers.skills.map(s => (
                  <span key={s} className="chip chip-primary" style={{ margin: '2px' }}>
                    {s} <button onClick={() => toggleSkill(s)} aria-label={`Remove ${s}`} style={{ background: 'none', border: 'none', color: 'inherit', padding: '0 0 0 4px', cursor: 'pointer' }}>×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Interests */}
        {step === 3 && (
          <div className="assess-step" aria-labelledby="step3-title">
            <h2 id="step3-title" className="step-title">💡 Areas of Interest</h2>
            <p className="step-desc">What topics excite you most at TechXConf?</p>
            <div className="interest-chips" role="group" aria-label="Select interest areas">
              {INTEREST_OPTIONS.map(interest => (
                <button
                  key={interest}
                  className={`skill-chip ${answers.interests.includes(interest) ? 'selected' : ''}`}
                  onClick={() => toggleInterest(interest)}
                  type="button"
                  aria-pressed={answers.interests.includes(interest)}
                >
                  {interest}
                </button>
              ))}
            </div>

            <div className="form-group" style={{ marginTop: '24px' }}>
              <label className="form-label" htmlFor="avail-hours">Hours available for upskilling per week</label>
              <select id="avail-hours" value={answers.available_hours} onChange={e => update('available_hours', e.target.value)}>
                <option value="">Select…</option>
                <option value="1-2">1–2 hours/week</option>
                <option value="3-5">3–5 hours/week</option>
                <option value="6-10">6–10 hours/week</option>
                <option value="10+">10+ hours/week</option>
              </select>
            </div>

            <div className="assess-summary card" style={{ marginTop: '20px', background: 'var(--bg-card2)' }}>
              <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '12px' }}>📋 Your Assessment Summary</h3>
              <div className="summary-row"><span>Role</span><strong>{answers.current_role || '—'}</strong></div>
              <div className="summary-row"><span>Experience</span><strong>{answers.experience_years} yrs</strong></div>
              <div className="summary-row"><span>Goal</span><strong>{CAREER_GOALS.find(g => g.value === answers.career_goal)?.label || '—'}</strong></div>
              <div className="summary-row"><span>Skills</span><strong>{answers.skills.length} selected</strong></div>
              <div className="summary-row"><span>Interests</span><strong>{answers.interests.length} selected</strong></div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="assess-nav">
          {step > 0 && (
            <button className="btn btn-secondary" onClick={() => setStep(s => s - 1)} type="button">
              ← Back
            </button>
          )}
          <div style={{ flex: 1 }} />
          {step < STEPS.length - 1 ? (
            <button
              className="btn btn-primary"
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed()}
              type="button"
            >
              Next →
            </button>
          ) : (
            <button
              className="btn btn-primary btn-lg"
              onClick={handleSubmit}
              disabled={loading}
              type="button"
            >
              {loading ? '⏳ Analyzing…' : '🚀 Get My Career Plan →'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
