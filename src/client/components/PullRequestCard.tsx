import React from 'react';
import { GitPullRequest } from 'lucide-react';
import { PullRequestMetrics } from '../types';

interface PullRequestCardProps {
  metrics: PullRequestMetrics;
}

export const PullRequestCard: React.FC<PullRequestCardProps> = ({ metrics }) => {
  let mergeRateColor = 'var(--color-success)';
  if (metrics.mergedPercentage < 30) {
    mergeRateColor = 'var(--color-danger)';
  } else if (metrics.mergedPercentage < 60) {
    mergeRateColor = 'var(--color-warning)';
  }

  return (
    <div className="metric-card">
      <div className="card-header">
        <div className="card-title-group">
          <div className="card-icon-box" style={{ color: 'var(--color-brand)' }}>
            <GitPullRequest size={16} />
          </div>
          <h3 className="card-title">Pull Request Velocity</h3>
        </div>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          Sample: {metrics.totalSampled} recent PRs
        </span>
      </div>

      <div className="stats-subgrid">
        {/* Merged PR Percentage */}
        <div className="stat-item full-width">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span className="stat-label">Merged PR Percentage</span>
            <span className="stat-value" style={{ color: mergeRateColor, fontSize: '1.3rem' }}>
              {metrics.mergedPercentage}%
            </span>
          </div>

          <div className="progress-container">
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width: `${Math.min(100, Math.max(0, metrics.mergedPercentage))}%`,
                  backgroundColor: mergeRateColor,
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              <span>{metrics.mergedCount} merged</span>
              <span>{metrics.closedCount - metrics.mergedCount} closed unmerged</span>
              <span>{metrics.openCount} open</span>
            </div>
          </div>
        </div>

        {/* Average Time to Merge */}
        <div className="stat-item">
          <span className="stat-label">Average Time to Merge</span>
          <span className="stat-value" style={{ fontSize: '1.1rem' }}>
            {metrics.avgTimeToMergeFormatted}
          </span>
          <span className="stat-sublabel">
            {metrics.avgTimeToMergeHours > 0
              ? `~${metrics.avgTimeToMergeHours}h turnaround`
              : 'No merged PRs'}
          </span>
        </div>

        {/* PRs Opened in Last 30 Days */}
        <div className="stat-item">
          <span className="stat-label">PRs Opened (Last 30 Days)</span>
          <span className="stat-value" style={{ fontSize: '1.1rem' }}>
            {metrics.prsOpenedLast30Days} PRs
          </span>
          <span className="stat-sublabel">Recent contributor activity</span>
        </div>
      </div>
    </div>
  );
};
