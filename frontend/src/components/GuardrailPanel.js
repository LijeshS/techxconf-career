import React, { useState } from 'react';

const SEVERITY_STYLE = {
  warning: { icon: '⚠️', cls: 'alert-warning', label: 'Warning' },
  info: { icon: 'ℹ️', cls: 'alert-info', label: 'Info' },
  error: { icon: '🚨', cls: 'alert-danger', label: 'Critical' },
};

export default function GuardrailPanel({ guardrails }) {
  const [expanded, setExpanded] = useState(true);

  if (!guardrails) return null;

  const { guardrail_flags = [], observability_score = 0, harness_pipeline_fit = 0, pipeline_status = 'NEEDS_REVIEW' } = guardrails;
  const hasFlags = guardrail_flags.length > 0;

  const pipelineColor = pipeline_status === 'PASSED' ? 'var(--harness-green)' : pipeline_status === 'WARNINGS' ? '#fbbf24' : '#f87171';

  return (
    <div className="guardrail-panel card" aria-label="Observability Guardrail Report">
      <div className="gp-header" onClick={() => setExpanded(e => !e)} role="button" tabIndex={0} aria-expanded={expanded}
        onKeyDown={e => e.key === 'Enter' && setExpanded(v => !v)}>
        <div className="gp-title-row">
          <span className="gp-icon">🛡️</span>
          <h3 className="gp-title">Harness Observability Guardrails</h3>
          <span className="gp-toggle">{expanded ? '▲' : '▼'}</span>
        </div>
        <div className="gp-scores">
          <div className="gp-score-item">
            <span className="gp-score-label">Observability Score</span>
            <span className="gp-score-value" style={{ color: observability_score >= 80 ? 'var(--harness-green)' : observability_score >= 60 ? '#fbbf24' : '#f87171' }}>
              {observability_score}/100
            </span>
          </div>
          <div className="gp-score-item">
            <span className="gp-score-label">Harness Pipeline Fit</span>
            <span className="gp-score-value" style={{ color: harness_pipeline_fit >= 75 ? 'var(--harness-green)' : '#fbbf24' }}>
              {harness_pipeline_fit}%
            </span>
          </div>
          <div className="gp-score-item">
            <span className="gp-score-label">Pipeline Status</span>
            <span className="gp-score-value" style={{ color: pipelineColor }}>
              {pipeline_status === 'PASSED' ? '✓ ' : pipeline_status === 'WARNINGS' ? '⚠ ' : '✗ '}
              {pipeline_status}
            </span>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="gp-body">
          <div className="gp-progress">
            <div className="progress-bar" role="progressbar" aria-valuenow={observability_score} aria-valuemin={0} aria-valuemax={100}>
              <div className="progress-fill" style={{
                width: `${observability_score}%`,
                background: `linear-gradient(90deg, var(--primary), ${observability_score >= 80 ? 'var(--harness-green)' : '#fbbf24'})`
              }} />
            </div>
          </div>

          {!hasFlags ? (
            <div className="alert alert-success" role="status">
              ✅ All guardrail checks passed. Your career plan looks well-matched to your profile.
            </div>
          ) : (
            <div className="gp-flags" role="list" aria-label="Guardrail flags">
              {guardrail_flags.map((flag, i) => {
                const style = SEVERITY_STYLE[flag.severity] || SEVERITY_STYLE.info;
                return (
                  <div key={i} className={`alert ${style.cls} gp-flag`} role="listitem">
                    <span className="gp-flag-icon" aria-hidden="true">{style.icon}</span>
                    <div>
                      <div className="gp-flag-name">{flag.rule_name}</div>
                      <div className="gp-flag-reason">{flag.reason}</div>
                      {flag.suggestion && (
                        <div className="gp-flag-suggestion">💡 {flag.suggestion}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
