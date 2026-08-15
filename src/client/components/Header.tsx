import React from 'react';
import { Activity, Key, CheckCircle2 } from 'lucide-react';
import { RateLimitInfo } from '../types';

interface HeaderProps {
  rateLimit: RateLimitInfo | null;
  onOpenTokenModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ rateLimit, onOpenTokenModal }) => {
  const isLimitLow = rateLimit ? rateLimit.remaining <= 5 : false;
  const isLimitEmpty = rateLimit ? rateLimit.remaining === 0 : false;

  let dotClass = '';
  if (isLimitEmpty) {
    dotClass = 'danger';
  } else if (isLimitLow) {
    dotClass = 'warning';
  }

  return (
    <header className="app-header">
      <div className="header-container">
        <a href="/" className="brand-logo">
          <div className="brand-icon-wrapper">
            <Activity size={18} />
          </div>
          <span>RepoHealth</span>
        </a>

        <div className="header-actions">
          {rateLimit && (
            <div
              className="rate-limit-pill"
              title={`GitHub API Rate Limit: ${rateLimit.remaining} of ${rateLimit.limit} remaining. Resets at ${rateLimit.resetDate}`}
            >
              <span className={`rate-limit-dot ${dotClass}`} />
              <span>
                API Limit: {rateLimit.remaining}/{rateLimit.limit}
              </span>
            </div>
          )}

          <button
            type="button"
            className="token-config-btn"
            onClick={onOpenTokenModal}
            title="Configure optional GitHub Personal Access Token"
          >
            {rateLimit?.isTokenConfigured ? (
              <>
                <CheckCircle2 size={14} style={{ color: 'var(--color-success)' }} />
                <span>PAT Configured</span>
              </>
            ) : (
              <>
                <Key size={14} />
                <span>Add GitHub Token</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
