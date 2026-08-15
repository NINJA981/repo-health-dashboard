import { describe, it, expect } from 'vitest';
import { calculateHealthScore, FORMULA_DOCUMENTATION } from '../src/server/services/healthScoreCalculator';
import { GitHubRepoMetadata, PullRequestMetrics, IssueMetrics } from '../src/server/types';

describe('Health Score Calculator', () => {
  const referenceNow = new Date('2026-08-14T12:00:00Z');

  it('exports formula documentation as required', () => {
    expect(FORMULA_DOCUMENTATION).toBeDefined();
    expect(FORMULA_DOCUMENTATION).toContain('Maintenance');
    expect(FORMULA_DOCUMENTATION).toContain('PR Efficiency');
    expect(FORMULA_DOCUMENTATION).toContain('Issue Resolution');
    expect(FORMULA_DOCUMENTATION).toContain('Community & Governance');
  });

  it('calculates high health score for an active, highly responsive repository', () => {
    const mockRepo: GitHubRepoMetadata = {
      id: 123,
      name: 'react',
      fullName: 'facebook/react',
      description: 'The library for web and native user interfaces.',
      htmlUrl: 'https://github.com/facebook/react',
      owner: {
        login: 'facebook',
        avatarUrl: 'https://avatars.githubusercontent.com/u/69631',
        htmlUrl: 'https://github.com/facebook',
      },
      stars: 220000,
      forks: 45000,
      openIssuesCount: 600,
      primaryLanguage: 'JavaScript',
      createdAt: '2013-05-24T16:15:54Z',
      updatedAt: '2026-08-14T10:00:00Z',
      pushedAt: '2026-08-14T10:00:00Z', // Pushed today
      license: {
        name: 'MIT License',
        spdxId: 'MIT',
        url: 'https://api.github.com/licenses/mit',
      },
      isArchived: false,
      isFork: false,
      defaultBranch: 'main',
    };

    const mockPRs: PullRequestMetrics = {
      totalSampled: 50,
      openCount: 5,
      closedCount: 45,
      mergedCount: 40,
      mergedPercentage: 80,
      mergedOfClosedPercentage: 88.9,
      avgTimeToMergeHours: 18,
      avgTimeToMergeFormatted: '18 hours',
      prsOpenedLast30Days: 25,
    };

    const mockIssues: IssueMetrics = {
      totalSampled: 80,
      openCount: 20,
      closedCount: 60,
      openToClosedRatio: 0.33,
      openToClosedRatioFormatted: '0.33',
      closedPercentage: 75,
      avgTimeToCloseHours: 36,
      avgTimeToCloseFormatted: '1.5 days',
    };

    const result = calculateHealthScore(mockRepo, mockPRs, mockIssues, referenceNow);

    expect(result.overallScore).toBeGreaterThanOrEqual(90);
    expect(result.grade).toBe('A+');
    expect(result.ratingLabel).toBe('Exceptional');
    expect(result.pillars.maintenance.score).toBe(25);
    expect(result.pillars.prVelocity.score).toBe(25);
    expect(result.pillars.issueResolution.score).toBe(25);
    expect(result.pillars.communityGovernance.score).toBe(25);
    expect(result.strengths.length).toBeGreaterThan(3);
  });

  it('caps archived repository score at 45 maximum with warning', () => {
    const mockArchivedRepo: GitHubRepoMetadata = {
      id: 456,
      name: 'deprecated-project',
      fullName: 'acme/deprecated-project',
      description: 'No longer maintained',
      htmlUrl: 'https://github.com/acme/deprecated-project',
      owner: {
        login: 'acme',
        avatarUrl: '',
        htmlUrl: 'https://github.com/acme',
      },
      stars: 5000,
      forks: 300,
      openIssuesCount: 10,
      primaryLanguage: 'TypeScript',
      createdAt: '2018-01-01T00:00:00Z',
      updatedAt: '2022-01-01T00:00:00Z',
      pushedAt: '2022-01-01T00:00:00Z',
      license: { name: 'Apache 2.0', spdxId: 'Apache-2.0', url: null },
      isArchived: true, // Archived
      isFork: false,
      defaultBranch: 'main',
    };

    const mockPRs: PullRequestMetrics = {
      totalSampled: 10,
      openCount: 0,
      closedCount: 10,
      mergedCount: 8,
      mergedPercentage: 80,
      mergedOfClosedPercentage: 80,
      avgTimeToMergeHours: 20,
      avgTimeToMergeFormatted: '20 hours',
      prsOpenedLast30Days: 0,
    };

    const mockIssues: IssueMetrics = {
      totalSampled: 10,
      openCount: 0,
      closedCount: 10,
      openToClosedRatio: 0,
      openToClosedRatioFormatted: '0',
      closedPercentage: 100,
      avgTimeToCloseHours: 24,
      avgTimeToCloseFormatted: '1 day',
    };

    const result = calculateHealthScore(mockArchivedRepo, mockPRs, mockIssues, referenceNow);

    expect(result.overallScore).toBeLessThanOrEqual(45);
    expect(result.grade).toBe('D');
    expect(result.warnings.some((w) => w.includes('ARCHIVED'))).toBe(true);
  });

  it('handles brand new repository with 0 PRs and 0 issues with neutral baselines', () => {
    const mockNewRepo: GitHubRepoMetadata = {
      id: 789,
      name: 'brand-new-kit',
      fullName: 'alice/brand-new-kit',
      description: 'Brand new project created today',
      htmlUrl: 'https://github.com/alice/brand-new-kit',
      owner: {
        login: 'alice',
        avatarUrl: '',
        htmlUrl: 'https://github.com/alice',
      },
      stars: 1,
      forks: 0,
      openIssuesCount: 0,
      primaryLanguage: 'Rust',
      createdAt: '2026-08-14T08:00:00Z',
      updatedAt: '2026-08-14T08:00:00Z',
      pushedAt: '2026-08-14T08:00:00Z',
      license: { name: 'MIT', spdxId: 'MIT', url: null },
      isArchived: false,
      isFork: false,
      defaultBranch: 'main',
    };

    const mockPRs: PullRequestMetrics = {
      totalSampled: 0,
      openCount: 0,
      closedCount: 0,
      mergedCount: 0,
      mergedPercentage: 0,
      mergedOfClosedPercentage: 0,
      avgTimeToMergeHours: 0,
      avgTimeToMergeFormatted: 'N/A (0 PRs)',
      prsOpenedLast30Days: 0,
    };

    const mockIssues: IssueMetrics = {
      totalSampled: 0,
      openCount: 0,
      closedCount: 0,
      openToClosedRatio: 0,
      openToClosedRatioFormatted: '0 (0 issues)',
      closedPercentage: 0,
      avgTimeToCloseHours: 0,
      avgTimeToCloseFormatted: 'N/A (0 issues)',
    };

    const result = calculateHealthScore(mockNewRepo, mockPRs, mockIssues, referenceNow);

    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.pillars.prVelocity.score).toBeGreaterThan(0);
    expect(result.pillars.issueResolution.score).toBeGreaterThan(0);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });
});
