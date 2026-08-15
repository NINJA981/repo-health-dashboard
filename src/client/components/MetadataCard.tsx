import React from 'react';
import { Star, ExternalLink } from 'lucide-react';
import { GitHubRepoMetadata } from '../types';

interface MetadataCardProps {
  metadata: GitHubRepoMetadata;
}

export const MetadataCard: React.FC<MetadataCardProps> = ({ metadata }) => {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getRelativeTime = (dateStr: string) => {
    if (!dateStr) return '';
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 30) return `${diffDays} days ago`;
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths} mo ago`;
    return `${Math.floor(diffMonths / 12)} yr ago`;
  };

  return (
    <div className="metric-card">
      <div className="card-header">
        <div className="card-title-group">
          <div className="card-icon-box">
            <Star size={16} />
          </div>
          <h3 className="card-title">Repository Overview</h3>
        </div>
        <a
          href={metadata.htmlUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
        >
          <span>View on GitHub</span>
          <ExternalLink size={13} />
        </a>
      </div>

      <div className="stats-subgrid">
        {/* Stars */}
        <div className="stat-item">
          <span className="stat-label">Stars</span>
          <span className="stat-value">{metadata.stars.toLocaleString()}</span>
          <span className="stat-sublabel">Community popularity</span>
        </div>

        {/* Forks */}
        <div className="stat-item">
          <span className="stat-label">Forks</span>
          <span className="stat-value">{metadata.forks.toLocaleString()}</span>
          <span className="stat-sublabel">Ecosystem extensions</span>
        </div>

        {/* Open Issues */}
        <div className="stat-item">
          <span className="stat-label">Open Issues</span>
          <span className="stat-value">{metadata.openIssuesCount.toLocaleString()}</span>
          <span className="stat-sublabel">Backlog count (issues + PRs)</span>
        </div>

        {/* Primary Language */}
        <div className="stat-item">
          <span className="stat-label">Primary Language</span>
          <span className="stat-value" style={{ fontSize: '1.05rem' }}>
            {metadata.primaryLanguage || 'None / Multi'}
          </span>
          <span className="stat-sublabel">Main codebase tech</span>
        </div>

        {/* License */}
        <div className="stat-item">
          <span className="stat-label">License</span>
          <span
            className="stat-value"
            style={{
              fontSize: '0.95rem',
              color: metadata.license ? 'var(--text-primary)' : 'var(--color-warning)',
            }}
          >
            {metadata.license ? (metadata.license.spdxId || metadata.license.name) : 'No License'}
          </span>
          <span className="stat-sublabel">
            {metadata.license ? 'Open source legal status' : 'Ambiguous rights'}
          </span>
        </div>

        {/* Last Updated */}
        <div className="stat-item">
          <span className="stat-label">Last Push / Update</span>
          <span className="stat-value" style={{ fontSize: '0.95rem' }}>
            {formatDate(metadata.pushedAt || metadata.updatedAt)}
          </span>
          <span className="stat-sublabel">
            {getRelativeTime(metadata.pushedAt || metadata.updatedAt)}
          </span>
        </div>
      </div>
    </div>
  );
};
