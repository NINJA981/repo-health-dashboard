import {
  RawGitHubPullRequest,
  RawGitHubIssue,
  PullRequestMetrics,
  IssueMetrics,
} from '../types';

/**
 * Formats a duration in hours into a human-readable string (minutes, hours, days, months).
 */
export function formatDurationHours(hours: number): string {
  if (hours <= 0 || !Number.isFinite(hours)) {
    return 'N/A';
  }
  if (hours < 1) {
    const mins = Math.max(1, Math.round(hours * 60));
    return `${mins} ${mins === 1 ? 'minute' : 'minutes'}`;
  }
  if (hours < 24) {
    const rounded = Math.round(hours * 10) / 10;
    return `${rounded} ${rounded === 1 ? 'hour' : 'hours'}`;
  }
  const days = Math.round((hours / 24) * 10) / 10;
  if (days < 30) {
    return `${days} ${days === 1 ? 'day' : 'days'}`;
  }
  const months = Math.round((days / 30) * 10) / 10;
  return `${months} ${months === 1 ? 'month' : 'months'}`;
}

/**
 * Calculates metrics from a list of recent pull requests.
 * Handles empty datasets, unmerged PRs, and calculates velocity over the last 30 days.
 */
export function calculatePullRequestMetrics(
  pullRequests: RawGitHubPullRequest[],
  referenceNow: Date = new Date()
): PullRequestMetrics {
  if (!Array.isArray(pullRequests) || pullRequests.length === 0) {
    return {
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
  }

  const totalSampled = pullRequests.length;
  let openCount = 0;
  let closedCount = 0;
  let mergedCount = 0;
  let totalMergeDurationMs = 0;
  let mergedWithValidDurationCount = 0;
  let prsOpenedLast30Days = 0;

  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const nowMs = referenceNow.getTime();
  const thirtyDaysAgoMs = nowMs - thirtyDaysMs;

  for (const pr of pullRequests) {
    // Check 30 days window
    const createdAtMs = new Date(pr.created_at).getTime();
    if (!Number.isNaN(createdAtMs) && createdAtMs >= thirtyDaysAgoMs) {
      prsOpenedLast30Days++;
    }

    if (pr.state === 'open') {
      openCount++;
    } else {
      closedCount++;
    }

    // A PR is merged if merged_at is non-null
    if (pr.merged_at) {
      mergedCount++;
      const mergedAtMs = new Date(pr.merged_at).getTime();
      if (!Number.isNaN(createdAtMs) && !Number.isNaN(mergedAtMs) && mergedAtMs >= createdAtMs) {
        totalMergeDurationMs += (mergedAtMs - createdAtMs);
        mergedWithValidDurationCount++;
      }
    }
  }

  const mergedPercentage = totalSampled > 0
    ? Math.round((mergedCount / totalSampled) * 1000) / 10
    : 0;

  const mergedOfClosedPercentage = closedCount > 0
    ? Math.round((mergedCount / closedCount) * 1000) / 10
    : 0;

  const avgTimeToMergeHours = mergedWithValidDurationCount > 0
    ? Math.round((totalMergeDurationMs / (mergedWithValidDurationCount * 1000 * 60 * 60)) * 10) / 10
    : 0;

  const avgTimeToMergeFormatted = mergedWithValidDurationCount > 0
    ? formatDurationHours(avgTimeToMergeHours)
    : (mergedCount === 0 ? 'N/A (No merged PRs)' : 'N/A');

  return {
    totalSampled,
    openCount,
    closedCount,
    mergedCount,
    mergedPercentage,
    mergedOfClosedPercentage,
    avgTimeToMergeHours,
    avgTimeToMergeFormatted,
    prsOpenedLast30Days,
  };
}

/**
 * Calculates metrics from a list of recent issues.
 * Note: GitHub API `/issues` returns both Issues and PRs; this function filters out PRs.
 */
export function calculateIssueMetrics(
  issues: RawGitHubIssue[]
): IssueMetrics {
  if (!Array.isArray(issues) || issues.length === 0) {
    return {
      totalSampled: 0,
      openCount: 0,
      closedCount: 0,
      openToClosedRatio: 0,
      openToClosedRatioFormatted: '0 (0 issues)',
      closedPercentage: 0,
      avgTimeToCloseHours: 0,
      avgTimeToCloseFormatted: 'N/A (0 issues)',
    };
  }

  // Filter out Pull Requests which GitHub includes in the /issues endpoint
  const pureIssues = issues.filter((item) => !item.pull_request);

  if (pureIssues.length === 0) {
    return {
      totalSampled: 0,
      openCount: 0,
      closedCount: 0,
      openToClosedRatio: 0,
      openToClosedRatioFormatted: '0 (0 issues)',
      closedPercentage: 0,
      avgTimeToCloseHours: 0,
      avgTimeToCloseFormatted: 'N/A (0 issues)',
    };
  }

  const totalSampled = pureIssues.length;
  let openCount = 0;
  let closedCount = 0;
  let totalCloseDurationMs = 0;
  let closedWithValidDurationCount = 0;

  for (const issue of pureIssues) {
    if (issue.state === 'open') {
      openCount++;
    } else {
      closedCount++;
      if (issue.closed_at) {
        const createdAtMs = new Date(issue.created_at).getTime();
        const closedAtMs = new Date(issue.closed_at).getTime();
        if (!Number.isNaN(createdAtMs) && !Number.isNaN(closedAtMs) && closedAtMs >= createdAtMs) {
          totalCloseDurationMs += (closedAtMs - createdAtMs);
          closedWithValidDurationCount++;
        }
      }
    }
  }

  // Ratio calculation: open / closed
  let openToClosedRatio = 0;
  let openToClosedRatioFormatted = '0';

  if (closedCount === 0 && openCount === 0) {
    openToClosedRatio = 0;
    openToClosedRatioFormatted = '0 (No issues)';
  } else if (closedCount === 0) {
    openToClosedRatio = openCount; // All open
    openToClosedRatioFormatted = `${openCount} : 0 (All open)`;
  } else if (openCount === 0) {
    openToClosedRatio = 0;
    openToClosedRatioFormatted = `0 : ${closedCount} (All resolved)`;
  } else {
    openToClosedRatio = Math.round((openCount / closedCount) * 100) / 100;
    openToClosedRatioFormatted = `${openToClosedRatio} (1 : ${(Math.round((closedCount / openCount) * 10) / 10)})`;
  }

  const closedPercentage = totalSampled > 0
    ? Math.round((closedCount / totalSampled) * 1000) / 10
    : 0;

  const avgTimeToCloseHours = closedWithValidDurationCount > 0
    ? Math.round((totalCloseDurationMs / (closedWithValidDurationCount * 1000 * 60 * 60)) * 10) / 10
    : 0;

  const avgTimeToCloseFormatted = closedWithValidDurationCount > 0
    ? formatDurationHours(avgTimeToCloseHours)
    : (closedCount === 0 ? 'N/A (No closed issues)' : 'N/A');

  return {
    totalSampled,
    openCount,
    closedCount,
    openToClosedRatio,
    openToClosedRatioFormatted,
    closedPercentage,
    avgTimeToCloseHours,
    avgTimeToCloseFormatted,
  };
}
