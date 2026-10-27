import React, { useEffect, useState } from 'react';
import { getMetrics, getGuardrailReport } from '../api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#6366f1', '#06b6d4', '#f59e0b', '#10b981', '#f43f5e', '#8b5cf6'];

export default function Observability() {
  const [metrics, setMetrics] = useState(null);
  const [guardrailReport, setGuardrailReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getMetrics(), getGuardrailReport()])
      .then(([m, g]) => {
        setMetrics(m);
        setGuardrailReport(g);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div className="loading-page">
      <div className="loading-spinner" />
      <p>Loading observability metrics…</p>
    </div>
  );

  if (error) return (
    <div className="container-sm" style={{ paddingTop: '40px' }}>
      <div className="alert alert-danger" role="alert">{error}</div>
      <p style={{ color: 'var(--text-muted)', marginTop: '8px', fontSize: '0.9rem' }}>
        Make sure the backend server is running on port 4000.
      </p>
    </div>
  );

  const trackData = (metrics?.track_distribution || []).map(t => ({
    name: t.recommended_track?.split(' ')[0] || 'Unknown',
    count: t.count,
  }));

  const severityData = guardrailReport ? [
    { name: 'Warnings', value: guardrailReport.severity_breakdown?.warning || 0, color: '#f59e0b' },
    { name: 'Info', value: guardrailReport.severity_breakdown?.info || 0, color: '#3b82f6' },
  ] : [];

  const ruleData = Object.entries(guardrailReport?.rule_trigger_counts || {}).map(([name, count]) => ({
    name: name.replace(' Check', '').replace(' Guard', ''),
    count,
  }));

  const { summary = {} } = metrics || {};

  return (
    <div className="obs-page container" style={{ paddingTop: '40px', paddingBottom: '60px' }}>
      <div className="obs-header">
        <div className="chip chip-green" style={{ marginBottom: '12px' }}>🔭 Live Telemetry</div>
        <h1 className="section-title">Harness Observability Dashboard</h1>
        <p className="section-subtitle">
          Real-time guardrail metrics, pipeline health, and career guidance quality signals
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid-4 obs-stats" style={{ marginTop: '28px' }}>
        {[
          { icon: '👥', label: 'Total Users', value: summary.total_users ?? 0, color: 'var(--primary-light)' },
          { icon: '📝', label: 'Assessments', value: summary.total_assessments ?? 0, color: 'var(--secondary)' },
          { icon: '🛡️', label: 'Guardrail Triggers', value: summary.guardrail_triggers ?? 0, color: '#fbbf24' },
          { icon: '⚡', label: 'Avg Response (ms)', value: summary.avg_response_time_ms ?? 0, color: 'var(--harness-green)' },
        ].map(s => (
          <div key={s.label} className="obs-stat-card card">
            <div className="obs-stat-icon" aria-hidden="true">{s.icon}</div>
            <div className="obs-stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="obs-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Health bars */}
      <div className="grid-2 obs-health" style={{ marginTop: '20px' }}>
        <div className="card">
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
            📡 Avg Observability Score
          </h3>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: (summary.avg_observability_score ?? 0) >= 80 ? 'var(--harness-green)' : '#fbbf24' }}>
            {Math.round(summary.avg_observability_score ?? 0)}<span style={{ fontSize: '1rem', color: 'var(--text-faint)' }}>/100</span>
          </div>
          <div className="progress-bar" style={{ marginTop: '12px' }}>
            <div className="progress-fill" style={{
              width: `${summary.avg_observability_score ?? 0}%`,
              background: 'linear-gradient(90deg, var(--primary), var(--harness-green))'
            }} />
          </div>
        </div>
        <div className="card">
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
            ⚙️ Avg Harness Pipeline Fit
          </h3>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--harness-blue)' }}>
            {Math.round(summary.avg_harness_pipeline_fit ?? 0)}<span style={{ fontSize: '1rem', color: 'var(--text-faint)' }}>%</span>
          </div>
          <div className="progress-bar" style={{ marginTop: '12px' }}>
            <div className="progress-fill" style={{
              width: `${summary.avg_harness_pipeline_fit ?? 0}%`,
              background: 'linear-gradient(90deg, var(--harness-blue), var(--secondary))'
            }} />
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid-2 obs-charts" style={{ marginTop: '20px' }}>
        {/* Track distribution */}
        <div className="card" aria-label="Track distribution chart">
          <h3 style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
            📊 Track Distribution
          </h3>
          {trackData.length === 0 ? (
            <p style={{ color: 'var(--text-faint)', fontSize: '0.88rem' }}>No data yet — complete assessments to populate.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={trackData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d2d4e" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #2d2d4e', borderRadius: 8, color: '#e2e8f0' }} />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Guardrail severity */}
        <div className="card" aria-label="Guardrail severity chart">
          <h3 style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
            🛡️ Guardrail Severity Breakdown
          </h3>
          {severityData.every(d => d.value === 0) ? (
            <p style={{ color: 'var(--text-faint)', fontSize: '0.88rem' }}>No guardrail triggers recorded yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={severityData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {severityData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #2d2d4e', borderRadius: 8, color: '#e2e8f0' }} />
                <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Rule trigger counts */}
      {ruleData.length > 0 && (
        <div className="card obs-rules" style={{ marginTop: '20px' }} aria-label="Guardrail rule trigger counts">
          <h3 style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
            🔍 Most-Triggered Rules
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ruleData} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d2d4e" />
              <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} width={130} />
              <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #2d2d4e', borderRadius: 8, color: '#e2e8f0' }} />
              <Bar dataKey="count" fill="#06b6d4" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent logs */}
      <div className="card obs-logs" style={{ marginTop: '20px' }}>
        <h3 style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
          📋 Recent Observability Events
        </h3>
        {(metrics?.recent_logs || []).length === 0 ? (
          <p style={{ color: 'var(--text-faint)', fontSize: '0.88rem' }}>No events logged yet.</p>
        ) : (
          <div className="logs-table" role="table" aria-label="Recent observability logs">
            <div className="log-header" role="row">
              <span>Event</span>
              <span>User</span>
              <span>Guardrail</span>
              <span>Time (ms)</span>
              <span>Timestamp</span>
            </div>
            {(metrics.recent_logs || []).slice(0, 10).map(log => (
              <div key={log.id} className={`log-row ${log.guardrail_triggered ? 'log-flagged' : ''}`} role="row">
                <span className="log-event">{log.event_type}</span>
                <span className="log-user" style={{ fontFamily: 'var(--mono)', fontSize: '0.75rem' }}>
                  {log.user_id?.slice(0, 8)}…
                </span>
                <span>
                  {log.guardrail_triggered
                    ? <span className="chip chip-warning">⚠ triggered</span>
                    : <span className="chip chip-success">✓ clean</span>
                  }
                </span>
                <span className="log-time">{log.response_time_ms ?? '—'}ms</span>
                <span className="log-ts" style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>
                  {new Date(log.created_at).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
