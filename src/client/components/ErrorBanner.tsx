import React from 'react';
import { AlertCircle, RefreshCw, Key } from 'lucide-react';
import { ApiErrorResponse } from '../types';

interface ErrorBannerProps {
  error: ApiErrorResponse;
  onRetry?: () => void;
  onOpenTokenModal?: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  error,
  onRetry,
  onOpenTokenModal,
}) => {
  let title = 'Analysis Error';
  let hint = 'Please check your repository input and try again.';

  if (error.type === 'INVALID_URL') {
    title = 'Invalid Repository Format';
    hint = 'Please enter a valid format such as "owner/repo" (e.g. facebook/react) or a full URL like "https://github.com/facebook/react".';
  } else if (error.type === 'REPO_NOT_FOUND') {
    title = 'Repository Not Found (404)';
    hint = 'Make sure the repository exists, is publicly accessible, and the owner and repo names are spelled accurately.';
  } else if (error.type === 'RATE_LIMITED') {
    title = 'GitHub API Rate Limit Exceeded';
    hint = 'GitHub public rate limit (60 requests/hr) has been reached. You can add a GitHub Personal Access Token (PAT) to get 5,000 requests/hr.';
  } else if (error.type === 'AUTH_ERROR') {
    title = 'Invalid GitHub Token';
    hint = 'The GitHub Personal Access Token provided was rejected by GitHub. Please check or remove your token.';
  }

  return (
    <div className="error-banner" role="alert">
      <AlertCircle size={22} className="error-icon" />
      <div className="error-content">
        <h4 className="error-title">{title}</h4>
        <p className="error-description">{error.error}</p>
        <p className="error-action-hint">{hint}</p>

        <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.75rem' }}>
          {onRetry && (
            <button
              type="button"
              className="btn-secondary"
              onClick={onRetry}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
            >
              <RefreshCw size={13} />
              <span>Retry</span>
            </button>
          )}

          {error.type === 'RATE_LIMITED' && onOpenTokenModal && (
            <button
              type="button"
              className="btn-primary"
              onClick={onOpenTokenModal}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
            >
              <Key size={13} />
              <span>Add GitHub Token</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
