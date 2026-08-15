import { describe, it, expect } from 'vitest';
import {
  calculatePullRequestMetrics,
  calculateIssueMetrics,
  formatDurationHours,
} from '../src/server/services/metricsCalculator';
import { RawGitHubPullRequest, RawGitHubIssue } from '../src/server/types';

describe('Metrics Calculator', () => {
  describe('formatDurationHours', () => {
    it('formats 0 or negative hours as N/A', () => {
      expect(formatDurationHours(0)).toBe('N/A');
      expect(formatDurationHours(-5)).toBe('N/A');
    });

    it('formats minutes for sub-hour durations', () => {
      expect(formatDurationHours(0.5)).toBe('30 minutes');
      expect(formatDurationHours(0.01)).toBe('1 minute');
    });

    it('formats hours for durations under 24h', () => {
      expect(formatDurationHours(1)).toBe('1 hour');
      expect(formatDurationHours(14.5)).toBe('14.5 hours');
    });

    it('formats days for durations under 30d', () => {
      expect(formatDurationHours(48)).toBe('2 days');
      expect(formatDurationHours(72)).toBe('3 days');
      expect(formatDurationHours(36)).toBe('1.5 days');
    });

    it('formats months for durations >= 30d', () => {
      expect(formatDurationHours(720)).toBe('1 month');
      expect(formatDurationHours(1440)).toBe('2 months');
    });
  });

  describe('calculatePullRequestMetrics', () => {
    const fixedNow = new Date('2026-08-14T12:00:00Z');

    it('handles empty PR list gracefully', () => {
      const result = calculatePullRequestMetrics([], fixedNow);
      expect(result.totalSampled).toBe(0);
      expect(result.openCount).toBe(0);
      expect(result.closedCount).toBe(0);
      expect(result.mergedCount).toBe(0);
      expect(result.mergedPercentage).toBe(0);
      expect(result.mergedOfClosedPercentage).toBe(0);
      expect(result.avgTimeToMergeHours).toBe(0);
      expect(result.avgTimeToMergeFormatted).toBe('N/A (0 PRs)');
      expect(result.prsOpenedLast30Days).toBe(0);
    });

    it('calculates merged percentage and average merge time accurately', () => {
      const mockPRs: RawGitHubPullRequest[] = [
        {
          id: 1,
          number: 101,
          title: 'Add feature A',
          state: 'closed',
          created_at: '2026-08-10T10:00:00Z',
          updated_at: '2026-08-11T10:00:00Z',
          closed_at: '2026-08-11T10:00:00Z',
          merged_at: '2026-08-11T10:00:00Z', // 24 hours to merge
          html_url: 'https://github.com/test/repo/pull/101',
        },
        {
          id: 2,
          number: 102,
          title: 'Fix bug B',
          state: 'closed',
          created_at: '2026-08-01T12:00:00Z',
          updated_at: '2026-08-03T12:00:00Z',
          closed_at: '2026-08-03T12:00:00Z',
          merged_at: '2026-08-03T12:00:00Z', // 48 hours to merge
          html_url: 'https://github.com/test/repo/pull/102',
        },
        {
          id: 3,
          number: 103,
          title: 'Closed without merge',
          state: 'closed',
          created_at: '2026-07-20T12:00:00Z',
          updated_at: '2026-07-25T12:00:00Z',
          closed_at: '2026-07-25T12:00:00Z',
          merged_at: null,
          html_url: 'https://github.com/test/repo/pull/103',
        },
        {
          id: 4,
          number: 104,
          title: 'Currently open PR',
          state: 'open',
          created_at: '2026-08-13T12:00:00Z', // within 30 days
          updated_at: '2026-08-13T12:00:00Z',
          closed_at: null,
          merged_at: null,
          html_url: 'https://github.com/test/repo/pull/104',
        },
        {
          id: 5,
          number: 105,
          title: 'Old PR opened 60 days ago',
          state: 'closed',
          created_at: '2026-06-01T12:00:00Z', // > 30 days ago
          updated_at: '2026-06-02T12:00:00Z',
          closed_at: '2026-06-02T12:00:00Z',
          merged_at: null,
          html_url: 'https://github.com/test/repo/pull/105',
        },
      ];

      const metrics = calculatePullRequestMetrics(mockPRs, fixedNow);

      expect(metrics.totalSampled).toBe(5);
      expect(metrics.openCount).toBe(1);
      expect(metrics.closedCount).toBe(4);
      expect(metrics.mergedCount).toBe(2);
      // Merged % of total = 2 / 5 = 40%
      expect(metrics.mergedPercentage).toBe(40);
      // Merged % of closed = 2 / 4 = 50%
      expect(metrics.mergedOfClosedPercentage).toBe(50);
      // Avg merge time = (24h + 48h) / 2 = 36h (1.5 days)
      expect(metrics.avgTimeToMergeHours).toBe(36);
      expect(metrics.avgTimeToMergeFormatted).toBe('1.5 days');
      // PRs opened in last 30 days: #101 (Aug 10), #102 (Aug 1), #103 (Jul 20 - 25 days ago), #104 (Aug 13) -> 4 PRs
      expect(metrics.prsOpenedLast30Days).toBe(4);
    });
  });

  describe('calculateIssueMetrics', () => {
    it('handles empty issues list', () => {
      const result = calculateIssueMetrics([]);
      expect(result.totalSampled).toBe(0);
      expect(result.openCount).toBe(0);
      expect(result.closedCount).toBe(0);
      expect(result.openToClosedRatio).toBe(0);
      expect(result.closedPercentage).toBe(0);
      expect(result.avgTimeToCloseHours).toBe(0);
    });

    it('filters out Pull Requests embedded in /issues endpoint', () => {
      const mockItems: RawGitHubIssue[] = [
        {
          id: 1,
          number: 1,
          title: 'Genuine bug report',
          state: 'open',
          created_at: '2026-08-01T00:00:00Z',
          updated_at: '2026-08-01T00:00:00Z',
          closed_at: null,
          html_url: 'https://github.com/test/repo/issues/1',
        },
        {
          id: 2,
          number: 2,
          title: 'This is actually a pull request returned by issues endpoint',
          state: 'closed',
          created_at: '2026-08-01T00:00:00Z',
          updated_at: '2026-08-02T00:00:00Z',
          closed_at: '2026-08-02T00:00:00Z',
          pull_request: {
            url: 'https://api.github.com/repos/test/repo/pulls/2',
            html_url: 'https://github.com/test/repo/pull/2',
          },
          html_url: 'https://github.com/test/repo/issues/2',
        },
        {
          id: 3,
          number: 3,
          title: 'Resolved bug report',
          state: 'closed',
          created_at: '2026-08-01T00:00:00Z',
          updated_at: '2026-08-03T12:00:00Z',
          closed_at: '2026-08-03T12:00:00Z', // 60 hours
          html_url: 'https://github.com/test/repo/issues/3',
        },
      ];

      const metrics = calculateIssueMetrics(mockItems);

      // Should filter out the PR (#2), leaving 2 genuine issues
      expect(metrics.totalSampled).toBe(2);
      expect(metrics.openCount).toBe(1);
      expect(metrics.closedCount).toBe(1);
      expect(metrics.openToClosedRatio).toBe(1);
      expect(metrics.closedPercentage).toBe(50);
      expect(metrics.avgTimeToCloseHours).toBe(60);
      expect(metrics.avgTimeToCloseFormatted).toBe('2.5 days');
    });

    it('handles all open issues (0 closed)', () => {
      const mockIssues: RawGitHubIssue[] = [
        {
          id: 1,
          number: 1,
          title: 'Issue 1',
          state: 'open',
          created_at: '2026-08-01T00:00:00Z',
          updated_at: '2026-08-01T00:00:00Z',
          closed_at: null,
          html_url: 'https://github.com/test/repo/issues/1',
        },
        {
          id: 2,
          number: 2,
          title: 'Issue 2',
          state: 'open',
          created_at: '2026-08-02T00:00:00Z',
          updated_at: '2026-08-02T00:00:00Z',
          closed_at: null,
          html_url: 'https://github.com/test/repo/issues/2',
        },
      ];

      const metrics = calculateIssueMetrics(mockIssues);
      expect(metrics.totalSampled).toBe(2);
      expect(metrics.openCount).toBe(2);
      expect(metrics.closedCount).toBe(0);
      expect(metrics.closedPercentage).toBe(0);
      expect(metrics.avgTimeToCloseFormatted).toBe('N/A (No closed issues)');
    });
  });
});
