import React from 'react';
import { Layers, Check, ShieldCheck, Flame, GitPullRequest, LifeBuoy } from 'lucide-react';
import { HealthScoreResult, ScorePillar } from '../types';

interface PillarsBreakdownProps {
  healthScore: HealthScoreResult;
}

export const PillarsBreakdown: React.FC<PillarsBreakdownProps> = ({ healthScore }) => {
  const { maintenance, prVelocity, issueResolution, communityGovernance } = healthScore.pillars;

  const pillarsList: { pillar: ScorePillar; icon: React.ReactNode }[] = [
    { pillar: maintenance, icon: <Flame size={16} /> },
    { pillar: prVelocity, icon: <GitPullRequest size={16} /> },
    { pillar: issueResolution, icon: <LifeBuoy size={16} /> },
    { pillar: communityGovernance, icon: <ShieldCheck size={16} /> },
  ];

  const getPillarColor = (score: number) => {
    if (score >= 21) return 'var(--color-success)';
    if (score >= 16) return 'var(--color-info)';
    if (score >= 11) return 'var(--color-warning)';
    return 'var(--color-danger)';
  };

  return (
    <div className="pillars-card">
      <div className="card-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
        <div className="card-title-group">
          <div className="card-icon-box">
            <Layers size={16} />
          </div>
          <div>
            <h3 className="card-title">Health Score Breakdown (4 Pillars)</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Each pillar contributes up to 25 points toward the 0-100 overall score.
            </p>
          </div>
        </div>
      </div>

      <div className="pillars-grid">
        {pillarsList.map(({ pillar, icon }) => {
          const color = getPillarColor(pillar.score);
          return (
            <div key={pillar.name} className="pillar-item">
              <div className="pillar-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ color }}>{icon}</span>
                  <span className="pillar-name">{pillar.name}</span>
                </div>
                <span className="pillar-score-badge" style={{ color }}>
                  {pillar.score} / {pillar.maxScore}
                </span>
              </div>

              {/* Progress bar */}
              <div className="progress-track" style={{ height: 5 }}>
                <div
                  className="progress-fill"
                  style={{
                    width: `${pillar.percentage}%`,
                    backgroundColor: color,
                  }}
                />
              </div>

              <p className="pillar-desc">{pillar.description}</p>

              <ul className="pillar-details-list">
                {pillar.details.map((detail, idx) => (
                  <li key={idx}>
                    <Check size={12} style={{ color, flexShrink: 0 }} />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
};
