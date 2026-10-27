import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUser } from '../api';

export default function Landing({ user, setUser }) {
  const [form, setForm] = useState({ name: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  if (user) {
    return (
      <div className="landing-hero">
        <div className="hero-content container-sm">
          <div className="hero-badge">🎉 Welcome back, {user.name?.split(' ')[0]}!</div>
          <h1 className="hero-title">Your Career Compass<br />is Ready</h1>
          <p className="hero-subtitle">
            Pick up where you left off — explore sessions, check your plan, or retake the career assessment.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/assess')}>
              🧭 Retake Assessment
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => navigate('/dashboard')}>
              📊 View My Plan
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      setError('Please fill in both fields.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { user: newUser } = await createUser({ name: form.name.trim(), email: form.email.trim() });
      setUser(newUser);
      navigate('/assess');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing-page">
      {/* Hero */}
      <section className="landing-hero">
        <div className="hero-content container-sm">
          <div className="hero-badge">🚀 TechXConf 2026 — Live Career Guidance</div>
          <h1 className="hero-title">
            Find Your Ideal<br />
            <span className="hero-gradient">Tech Career Path</span>
          </h1>
          <p className="hero-subtitle">
            Answer a few questions about your experience and goals. Our AI-powered engine — backed by
            Harness observability guardrails — maps you to the right conference sessions and builds a
            personalized upskilling roadmap.
          </p>

          {/* Quick signup */}
          <form className="hero-form card" onSubmit={handleSubmit} aria-label="Get started form" noValidate>
            <h2 style={{ fontSize: '1.1rem', marginBottom: '16px', color: 'var(--text)' }}>Start your career assessment</h2>
            {error && <div className="alert alert-danger" role="alert">{error}</div>}
            <div className="grid-2" style={{ gap: '12px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="name">Full Name</label>
                <input
                  id="name"
                  type="text"
                  placeholder="e.g. Priya Sharma"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                  aria-required="true"
                  autoComplete="name"
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="email">Work Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required
                  aria-required="true"
                  autoComplete="email"
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ marginTop: '16px', width: '100%' }}>
              {loading ? '⏳ Setting up...' : '🎯 Start Career Assessment →'}
            </button>
          </form>
        </div>
      </section>

      {/* Features */}
      <section className="features-section container">
        <h2 className="section-title" style={{ textAlign: 'center' }}>How it works</h2>
        <p className="section-subtitle" style={{ textAlign: 'center' }}>
          Three steps to your personalized TechXConf career plan
        </p>
        <div className="grid-3 features-grid">
          {[
            { icon: '📋', title: 'Tell us about you', desc: 'Share your current role, years of experience, tech skills, and where you want to go.' },
            { icon: '🧠', title: 'AI recommendation engine', desc: 'Our scorer maps your profile across 4 conference tracks and 27 sessions to surface the best fit.' },
            { icon: '🛡️', title: 'Guardrail-verified plan', desc: 'Harness-style guardrail checks validate your plan for experience fit, session conflicts, and safety coverage.' },
          ].map(f => (
            <div key={f.title} className="feature-card card">
              <div className="feature-icon" aria-hidden="true">{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tracks */}
      <section className="tracks-section container">
        <h2 className="section-title" style={{ textAlign: 'center' }}>4 Career Tracks at TechXConf</h2>
        <div className="grid-2 tracks-grid">
          {[
            { icon: '🏭', name: 'Industry & Innovation', desc: 'AI adoption, enterprise strategy, production readiness', color: '#fbbf24' },
            { icon: '🤖', name: 'AI & Agentic Intelligence', desc: 'LLMs, autonomous agents, Harness loops, AI safety', color: '#a5b4fc' },
            { icon: '☁️', name: 'Cloud, DevOps & FinOps', desc: 'Platform engineering, CI/CD pipelines, cloud optimization', color: '#22d3ee' },
            { icon: '📊', name: 'Data & Observability', desc: 'Data platforms, LLM observability, guardrails, analytics', color: '#34d399' },
          ].map(t => (
            <div key={t.name} className="track-card card" style={{ borderLeft: `3px solid ${t.color}` }}>
              <span className="track-icon" aria-hidden="true">{t.icon}</span>
              <div>
                <div className="track-name" style={{ color: t.color }}>{t.name}</div>
                <div className="track-desc">{t.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
