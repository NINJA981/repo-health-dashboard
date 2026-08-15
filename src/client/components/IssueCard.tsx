import React from 'react';
import { CircleDot } from 'lucide-react';
import { IssueMetrics } from '../types';

interface IssueCardProps {
  metrics: IssueMetrics;
}

export const IssueCard: React.FC<IssueCardProps> = ({ metrics }) => {
  let closureColor = 'var(--color-success)';
  if (metrics.closedPercentage < 25) {
    closureColor = 'var(--color-danger)';
  } else if (metrics.closedPercentage < 50) {
    closureColor = 'var(--color-warning)';
  }

  return (
    <div className="metric-card">
      <div className="card-header">
        <div className="card-title-group">
          <div className="card-icon-box" style={{ color: 'var(--color-info)' }}>
            <CircleDot size={16} />
          </div>
          <h3 className="card-title">Issue Management & Triage</h3>
        </div>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          Sample: {metrics.totalSampled} pure issues
        </span>
      </div>

      <div className="stats-subgrid">
        {/* Closed Issue Percentage */}
        <div className="stat-item full-width">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span className="stat-label">Issue Closure Rate</span>
            <span className="stat-value" style={{ color: closureColor, fontSize: '1.3rem' }}>
              {metrics.closedPercentage}%
            </span>
          </div>

          <div className="progress-container">
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width: `${Math.min(100, Math.max(0, metrics.closedPercentage))}%`,
                  backgroundColor: closureColor,
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              <span>{metrics.closedCount} resolved / closed</span>
              <span>{metrics.openCount} currently open</span>
            </div>
          </div>
        </div>

        {/* Open / Closed Ratio */}
        <div className="stat-item">
          <span className="stat-label">Open / Closed Ratio</span>
          <span className="stat-value" style={{ fontSize: '1.1rem' }}>
            {metrics.openToClosedRatioFormatted}
          </span>
          <span className="stat-sublabel">
            {metrics.openToClosedRatio > 2
              ? 'High open backlog'
              : metrics.openToClosedRatio < 0.5
              ? 'Healthy resolution rate'
              : 'Balanced backlog'}
          </span>
        </div>

        {/* Average Time to Close */}
        <div className="stat-item">
          <span className="stat-label">Average Time to Close</span>
          <span className="stat-value" style={{ fontSize: '1.1rem' }}>
            {metrics.avgTimeToCloseFormatted}
          </span>
          <span className="stat-sublabel">
            {metrics.avgTimeToCloseHours > 0
              ? `~${metrics.avgTimeToCloseHours}h resolution`
              : 'No closed issues in sample'}
          </span>
        </div>
      </div>
    </div>
  );
};
