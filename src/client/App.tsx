import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { RepoSearchBar } from './components/RepoSearchBar';
import { LoadingState } from './components/LoadingState';
import { ErrorBanner } from './components/ErrorBanner';
import { HealthScoreGauge } from './components/HealthScoreGauge';
import { MetadataCard } from './components/MetadataCard';
import { PullRequestCard } from './components/PullRequestCard';
import { IssueCard } from './components/IssueCard';
import { PillarsBreakdown } from './components/PillarsBreakdown';
import { RecommendationsCard } from './components/RecommendationsCard';
import { RawDataDrawer } from './components/RawDataDrawer';
import { TokenModal } from './components/TokenModal';
import { RepositoryHealthReport, RateLimitInfo, ApiErrorResponse } from './types';
import { Archive, GitFork } from 'lucide-react';

export const App: React.FC = () => {
  const [token, setToken] = useState<string>(() => {
    return localStorage.getItem('repo_health_pat') || '';
  });
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [rateLimit, setRateLimit] = useState<RateLimitInfo | null>(null);

  const [currentRepoQuery, setCurrentRepoQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiErrorResponse | null>(null);
  const [report, setReport] = useState<RepositoryHealthReport | null>(null);

  // Fetch rate limit status
  const fetchRateLimit = useCallback(async (customToken?: string) => {
    try {
      const activeToken = customToken !== undefined ? customToken : token;
      const headers: Record<string, string> = {};
      if (activeToken) {
        headers['x-github-token'] = activeToken;
      }
      const res = await fetch('/api/rate-limit', { headers });
      if (res.ok) {
        const data = (await res.json()) as RateLimitInfo;
        setRateLimit(data);
      }
    } catch {
      // Ignore background rate limit fetch errors
    }
  }, [token]);

  useEffect(() => {
    fetchRateLimit();
  }, [fetchRateLimit]);

  const handleSaveToken = (newToken: string) => {
    setToken(newToken);
    if (newToken) {
      localStorage.setItem('repo_health_pat', newToken);
    } else {
      localStorage.removeItem('repo_health_pat');
    }
    fetchRateLimit(newToken);
  };

  const handleAnalyze = async (repoInput: string) => {
    if (!repoInput.trim()) return;

    setCurrentRepoQuery(repoInput.trim());
    setIsLoading(true);
    setError(null);
    setReport(null);

    // Update browser URL query param without full page reload
    const url = new URL(window.location.href);
    url.searchParams.set('repo', repoInput.trim());
    window.history.pushState({}, '', url.toString());

    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['x-github-token'] = token;
      }

      const res = await fetch(`/api/analyze?repo=${encodeURIComponent(repoInput.trim())}`, {
        headers,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data as ApiErrorResponse);
        if (data.rateLimit) {
          setRateLimit(data.rateLimit);
        }
      } else {
        const healthReport = data as RepositoryHealthReport;
        setReport(healthReport);
        if (healthReport.rateLimit) {
          setRateLimit(healthReport.rateLimit);
        }
      }
    } catch (err: any) {
      setError({
        error: `Network error: Could not communicate with analysis server (${err?.message || 'Server offline'}).`,
        statusCode: 503,
        type: 'SERVER_ERROR',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Check URL params on initial load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const repoParam = params.get('repo');
    if (repoParam) {
      setCurrentRepoQuery(repoParam);
      handleAnalyze(repoParam);
    }
  }, []);

  return (
    <>
      <Header
        rateLimit={rateLimit}
        onOpenTokenModal={() => setIsTokenModalOpen(true)}
      />

      <main className="main-content">
        <section className="hero-section">
          <h1 className="hero-title">GitHub Repository Health Dashboard</h1>
          <p className="hero-subtitle">
            Inspect repository velocity, PR review turnaround, issue resolution rates, and overall maintainability scores in seconds.
          </p>
        </section>

        {/* Search Bar Component */}
        <RepoSearchBar
          initialValue={currentRepoQuery}
          isLoading={isLoading}
          onSearch={handleAnalyze}
        />

        {/* Loading State */}
        {isLoading && <LoadingState />}

        {/* Error State */}
        {!isLoading && error && (
          <ErrorBanner
            error={error}
            onRetry={() => handleAnalyze(currentRepoQuery)}
            onOpenTokenModal={() => setIsTokenModalOpen(true)}
          />
        )}

        {/* Dashboard Report View */}
        {!isLoading && report && (
          <div className="dashboard-view">
            {/* Repository Info Header Banner */}
            <div className="repo-header-banner">
              <div className="repo-header-info">
                {report.repository.owner.avatarUrl && (
                  <img
                    src={report.repository.owner.avatarUrl}
                    alt={report.repository.owner.login}
                    className="repo-avatar"
                  />
                )}
                <div className="repo-title-wrapper">
                  <h1>
                    <span>{report.repository.fullName}</span>
                  </h1>
                  {report.repository.description && (
                    <p className="repo-desc">{report.repository.description}</p>
                  )}
                </div>
              </div>

              <div className="repo-meta-tags">
                {report.repository.primaryLanguage && (
                  <span className="badge language">
                    {report.repository.primaryLanguage}
                  </span>
                )}
                {report.repository.isArchived && (
                  <span className="badge archived">
                    <Archive size={12} />
                    <span>Archived</span>
                  </span>
                )}
                {report.repository.isFork && (
                  <span className="badge">
                    <GitFork size={12} />
                    <span>Fork</span>
                  </span>
                )}
                <span className="badge">
                  Branch: {report.repository.defaultBranch}
                </span>
              </div>
            </div>

            {/* Health Score Gauge Hero */}
            <HealthScoreGauge healthScore={report.healthScore} />

            {/* 3 Core Metric Cards */}
            <div className="metrics-grid">
              <MetadataCard metadata={report.repository} />
              <PullRequestCard metrics={report.pullRequestMetrics} />
              <IssueCard metrics={report.issueMetrics} />
            </div>

            {/* 4 Pillars Breakdown */}
            <PillarsBreakdown healthScore={report.healthScore} />

            {/* Actionable Maintainer Recommendations */}
            <RecommendationsCard
              recommendations={report.healthScore.recommendations}
            />

            {/* Export & Raw JSON Data Drawer */}
            <RawDataDrawer report={report} />
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>
          GitHub Repository Health Dashboard &bull; Stateless Real-time GitHub REST API Analysis
        </p>
      </footer>

      {/* PAT Token Configuration Modal */}
      <TokenModal
        isOpen={isTokenModalOpen}
        currentToken={token}
        onSaveToken={handleSaveToken}
        onClose={() => setIsTokenModalOpen(false)}
      />
    </>
  );
};
