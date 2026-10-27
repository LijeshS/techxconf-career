import React from 'react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';

const TRACK_ABBR = {
  'Industry & Innovation': 'Industry',
  'AI & Agentic Intelligence': 'AI/Agents',
  'Cloud, DevOps & FinOps': 'Cloud/DevOps',
  'Data & Observability': 'Data/Obs',
};

export default function TrackRadar({ trackScores }) {
  if (!trackScores) return null;

  const data = Object.entries(trackScores).map(([track, score]) => ({
    track: TRACK_ABBR[track] || track,
    score,
  }));

  const maxScore = Math.max(...data.map(d => d.score), 1);
  const normalized = data.map(d => ({ ...d, value: Math.round((d.score / maxScore) * 100) }));

  return (
    <div className="track-radar card" aria-label="Career track score radar chart">
      <h3 className="section-title" style={{ fontSize: '1rem', marginBottom: '16px' }}>📡 Career Track Alignment</h3>
      <ResponsiveContainer width="100%" height={260}>
        <RadarChart data={normalized} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
          <PolarGrid stroke="#2d2d4e" />
          <PolarAngleAxis dataKey="track" tick={{ fill: '#94a3b8', fontSize: 12 }} />
          <Radar
            name="Alignment"
            dataKey="value"
            stroke="#6366f1"
            fill="#6366f1"
            fillOpacity={0.25}
            strokeWidth={2}
          />
          <Tooltip
            contentStyle={{ background: '#1a1a2e', border: '1px solid #2d2d4e', borderRadius: 8, color: '#e2e8f0' }}
            formatter={(v) => [`${v}%`, 'Alignment']}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
