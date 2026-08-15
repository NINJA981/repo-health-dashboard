import {
  GitHubRepoMetadata,
  PullRequestMetrics,
  IssueMetrics,
  HealthScoreResult,
  ScorePillar,
} from '../types';

/**
 * ============================================================================
 * REPOSITORY HEALTH SCORE FORMULA DOCUMENTATION (0 - 100)
 * ============================================================================
 *
 * The Health Score evaluates the overall health, maintainability, and responsiveness
 * of any public GitHub repository across 4 distinct pillars (25 points each):
 *
 * 1. MAINTENANCE & ACTIVITY (25 points max):
 *    - Push Recency:
 *        * Pushed within 7 days: 12 pts
 *        * Pushed within 30 days: 9 pts
 *        * Pushed within 90 days: 6 pts
 *        * Pushed within 180 days: 3 pts
 *        * Over 180 days: 0 pts
 *    - PR Velocity (PRs opened in last 30 days):
 *        * >= 15 PRs: 8 pts
 *        * 5 - 14 PRs: 6 pts
 *        * 1 - 4 PRs: 4 pts
 *        * 0 PRs: 2 pts
 *    - Active Lifecycle:
 *        * Active (not archived): 5 pts
 *        * Archived: 0 pts
 *
 * 2. PULL REQUEST EFFICIENCY (25 points max):
 *    - Merged PR Rate:
 *        * >= 70%: 13 pts
 *        * 50% - 69%: 10 pts
 *        * 30% - 49%: 7 pts
 *        * 1% - 29%: 4 pts
 *        * 0% (or no PRs): 6 pts (neutral baseline for brand new repos)
 *    - Average Merge Turnaround:
 *        * <= 24 hours: 12 pts
 *        * <= 3 days (72h): 10 pts
 *        * <= 7 days (168h): 7 pts
 *        * <= 21 days (504h): 4 pts
 *        * > 21 days: 2 pts
 *        * No merged PRs: 6 pts (neutral)
 *
 * 3. ISSUE MANAGEMENT & RESOLUTION (25 points max):
 *    - Issue Closure Health (% of sampled issues closed):
 *        * >= 65%: 13 pts
 *        * 45% - 64%: 10 pts
 *        * 25% - 44%: 7 pts
 *        * 1% - 24%: 4 pts
 *        * 0 issues: 10 pts (neutral baseline)
 *    - Average Issue Resolution Time:
 *        * <= 48 hours: 12 pts
 *        * <= 7 days (168h): 10 pts
 *        * <= 30 days (720h): 7 pts
 *        * <= 90 days (2160h): 4 pts
 *        * > 90 days: 2 pts
 *        * No closed issues: 7 pts (neutral)
 *
 * 4. COMMUNITY & GOVERNANCE (25 points max):
 *    - Open Source License:
 *        * Valid SPDX / Standard License: 8 pts
 *        * Missing license: 0 pts
 *    - Project Description & Documentation:
 *        * Non-empty description: 4 pts
 *        * Missing description: 0 pts
 *    - Community Stars:
 *        * >= 1,000 stars: 7 pts
 *        * >= 100 stars: 5 pts
 *        * >= 10 stars: 3 pts
 *        * < 10 stars: 1 pt
 *    - Fork Adoption:
 *        * >= 200 forks: 6 pts
 *        * >= 25 forks: 4 pts
 *        * >= 5 forks: 2 pts
 *        * < 5 forks: 1 pt
 *
 * Final Score = Pillar 1 + Pillar 2 + Pillar 3 + Pillar 4 (Capped at 0-100)
 * Note: If the repository is explicitly archived, the score is capped at 45 (At Risk).
 *
 * Grade Scale:
 *   90 - 100: A+ (Exceptional)
 *   80 - 89:  A  (Healthy & Active)
 *   70 - 79:  B  (Good)
 *   55 - 69:  C  (Moderate)
 *   40 - 54:  D  (Needs Attention)
 *   0  - 39:  F  (At Risk / Inactive)
 * ============================================================================
 */

export const FORMULA_DOCUMENTATION = `
Repository Health Score (0 - 100) = Maintenance (25%) + PR Efficiency (25%) + Issue Resolution (25%) + Community & Governance (25%).
- Maintenance & Activity: Evaluates recent push frequency, 30-day PR creation velocity, and active status.
- PR Efficiency: Evaluates merged PR percentage (higher is healthier) and average turnaround time to merge.
- Issue Resolution: Evaluates issue closure rate and average time required to resolve issues.
- Community & Governance: Evaluates presence of an open source license, repo description, star rating, and forks.
`;

export function calculateHealthScore(
  repo: GitHubRepoMetadata,
  prMetrics: PullRequestMetrics,
  issueMetrics: IssueMetrics,
  referenceNow: Date = new Date()
): HealthScoreResult {
  const nowMs = referenceNow.getTime();
  const lastPushMs = new Date(repo.pushedAt || repo.updatedAt).getTime();
  const daysSinceLastPush = Number.isNaN(lastPushMs)
    ? 999
    : Math.max(0, (nowMs - lastPushMs) / (1000 * 60 * 60 * 24));

  const strengths: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // --------------------------------------------------------------------------
  // Pillar 1: Maintenance & Activity (Max 25 pts)
  // --------------------------------------------------------------------------
  let maintenanceScore = 0;
  const maintenanceDetails: string[] = [];

  if (daysSinceLastPush <= 7) {
    maintenanceScore += 12;
    strengths.push('Highly active: recent commit or push within the past 7 days.');
    maintenanceDetails.push('Recent code activity (< 7 days): +12 pts');
  } else if (daysSinceLastPush <= 30) {
    maintenanceScore += 9;
    maintenanceDetails.push('Code updated in past month (< 30 days): +9 pts');
  } else if (daysSinceLastPush <= 90) {
    maintenanceScore += 6;
    maintenanceDetails.push('Code updated in past quarter (< 90 days): +6 pts');
  } else if (daysSinceLastPush <= 180) {
    maintenanceScore += 3;
    warnings.push('Low activity: last push was over 3 months ago.');
    maintenanceDetails.push('Infrequent updates (> 90 days): +3 pts');
  } else {
    maintenanceScore += 0;
    warnings.push('Stale repository: no push activity in over 6 months.');
    maintenanceDetails.push('No recent push in > 180 days: 0 pts');
  }

  if (prMetrics.prsOpenedLast30Days >= 15) {
    maintenanceScore += 8;
    strengths.push(`High PR velocity with ${prMetrics.prsOpenedLast30Days} PRs opened in last 30 days.`);
    maintenanceDetails.push(`High PR velocity (>=15 PRs/mo): +8 pts`);
  } else if (prMetrics.prsOpenedLast30Days >= 5) {
    maintenanceScore += 6;
    maintenanceDetails.push(`Steady PR velocity (${prMetrics.prsOpenedLast30Days} PRs/mo): +6 pts`);
  } else if (prMetrics.prsOpenedLast30Days >= 1) {
    maintenanceScore += 4;
    maintenanceDetails.push(`Moderate PR velocity (${prMetrics.prsOpenedLast30Days} PRs/mo): +4 pts`);
  } else {
    maintenanceScore += 2;
    maintenanceDetails.push(`Low PR velocity (0 PRs in 30 days): +2 pts`);
  }

  if (!repo.isArchived) {
    maintenanceScore += 5;
    maintenanceDetails.push('Active (not archived): +5 pts');
  } else {
    warnings.push('Repository is ARCHIVED by maintainers (read-only mode).');
    maintenanceDetails.push('Repository is archived: 0 pts');
  }

  maintenanceScore = Math.min(25, Math.max(0, maintenanceScore));
  const maintenancePillar: ScorePillar = {
    name: 'Maintenance & Activity',
    score: maintenanceScore,
    maxScore: 25,
    percentage: Math.round((maintenanceScore / 25) * 100),
    description: 'Commit recency, 30-day PR velocity, and active development lifecycle.',
    status: getPillarStatus(maintenanceScore),
    details: maintenanceDetails,
  };

  // --------------------------------------------------------------------------
  // Pillar 2: Pull Request Efficiency (Max 25 pts)
  // --------------------------------------------------------------------------
  let prScore = 0;
  const prDetails: string[] = [];

  if (prMetrics.totalSampled === 0) {
    prScore += 12; // Neutral baseline for repositories without PRs
    prDetails.push('No PR history available (neutral baseline): +12 pts');
  } else {
    // Merged PR rate (13 pts max)
    if (prMetrics.mergedPercentage >= 70) {
      prScore += 13;
      strengths.push(`Strong PR merge rate of ${prMetrics.mergedPercentage}%.`);
      prDetails.push(`Merged PR rate >= 70% (${prMetrics.mergedPercentage}%): +13 pts`);
    } else if (prMetrics.mergedPercentage >= 50) {
      prScore += 10;
      prDetails.push(`Merged PR rate 50-69% (${prMetrics.mergedPercentage}%): +10 pts`);
    } else if (prMetrics.mergedPercentage >= 30) {
      prScore += 7;
      prDetails.push(`Merged PR rate 30-49% (${prMetrics.mergedPercentage}%): +7 pts`);
    } else if (prMetrics.mergedPercentage > 0) {
      prScore += 4;
      warnings.push(`Low PR merge rate (${prMetrics.mergedPercentage}%). Many PRs might be rejected or lingering.`);
      prDetails.push(`Merged PR rate < 30% (${prMetrics.mergedPercentage}%): +4 pts`);
    } else {
      prScore += 2;
      warnings.push('0% of sampled PRs have been merged.');
      prDetails.push('0% merged PR rate: +2 pts');
    }

    // Average merge turnaround (12 pts max)
    if (prMetrics.mergedCount === 0) {
      prScore += 6;
      prDetails.push('No merged PRs to evaluate turnaround (neutral): +6 pts');
    } else if (prMetrics.avgTimeToMergeHours <= 24) {
      prScore += 12;
      strengths.push(`Rapid PR merge time averaging ${prMetrics.avgTimeToMergeFormatted}.`);
      prDetails.push(`Avg merge turnaround <= 24h (${prMetrics.avgTimeToMergeFormatted}): +12 pts`);
    } else if (prMetrics.avgTimeToMergeHours <= 72) {
      prScore += 10;
      prDetails.push(`Avg merge turnaround <= 3d (${prMetrics.avgTimeToMergeFormatted}): +10 pts`);
    } else if (prMetrics.avgTimeToMergeHours <= 168) {
      prScore += 7;
      prDetails.push(`Avg merge turnaround <= 7d (${prMetrics.avgTimeToMergeFormatted}): +7 pts`);
    } else if (prMetrics.avgTimeToMergeHours <= 504) {
      prScore += 4;
      warnings.push(`Slow PR reviews: average merge takes ${prMetrics.avgTimeToMergeFormatted}.`);
      prDetails.push(`Avg merge turnaround <= 21d (${prMetrics.avgTimeToMergeFormatted}): +4 pts`);
    } else {
      prScore += 2;
      warnings.push(`High PR review latency (> 3 weeks avg: ${prMetrics.avgTimeToMergeFormatted}).`);
      prDetails.push(`Avg merge turnaround > 21d: +2 pts`);
    }
  }

  prScore = Math.min(25, Math.max(0, prScore));
  const prPillar: ScorePillar = {
    name: 'Pull Request Efficiency',
    score: prScore,
    maxScore: 25,
    percentage: Math.round((prScore / 25) * 100),
    description: 'PR merge rate and code review turnaround time.',
    status: getPillarStatus(prScore),
    details: prDetails,
  };

  // --------------------------------------------------------------------------
  // Pillar 3: Issue Management & Resolution (Max 25 pts)
  // --------------------------------------------------------------------------
  let issueScore = 0;
  const issueDetails: string[] = [];

  if (issueMetrics.totalSampled === 0) {
    issueScore += 17; // Neutral baseline when no issues exist
    issueDetails.push('No issue history found (clean backlog): +17 pts');
  } else {
    // Closure rate (13 pts max)
    if (issueMetrics.closedPercentage >= 65) {
      issueScore += 13;
      strengths.push(`Healthy issue resolution: ${issueMetrics.closedPercentage}% of sampled issues closed.`);
      issueDetails.push(`Issue closure rate >= 65% (${issueMetrics.closedPercentage}%): +13 pts`);
    } else if (issueMetrics.closedPercentage >= 45) {
      issueScore += 10;
      issueDetails.push(`Issue closure rate 45-64% (${issueMetrics.closedPercentage}%): +10 pts`);
    } else if (issueMetrics.closedPercentage >= 25) {
      issueScore += 7;
      warnings.push(`Moderate issue backlog: ${issueMetrics.closedPercentage}% closure rate.`);
      issueDetails.push(`Issue closure rate 25-44% (${issueMetrics.closedPercentage}%): +7 pts`);
    } else {
      issueScore += 4;
      warnings.push(`Low issue closure rate (${issueMetrics.closedPercentage}%). Open issues may be accumulating.`);
      issueDetails.push(`Issue closure rate < 25% (${issueMetrics.closedPercentage}%): +4 pts`);
    }

    // Average time to close (12 pts max)
    if (issueMetrics.closedCount === 0) {
      issueScore += 6;
      issueDetails.push('No closed issues to calculate resolution time (neutral): +6 pts');
    } else if (issueMetrics.avgTimeToCloseHours <= 48) {
      issueScore += 12;
      strengths.push(`Fast issue resolution averaging ${issueMetrics.avgTimeToCloseFormatted}.`);
      issueDetails.push(`Avg resolution time <= 48h (${issueMetrics.avgTimeToCloseFormatted}): +12 pts`);
    } else if (issueMetrics.avgTimeToCloseHours <= 168) {
      issueScore += 10;
      issueDetails.push(`Avg resolution time <= 7d (${issueMetrics.avgTimeToCloseFormatted}): +10 pts`);
    } else if (issueMetrics.avgTimeToCloseHours <= 720) {
      issueScore += 7;
      issueDetails.push(`Avg resolution time <= 30d (${issueMetrics.avgTimeToCloseFormatted}): +7 pts`);
    } else if (issueMetrics.avgTimeToCloseHours <= 2160) {
      issueScore += 4;
      warnings.push(`Slow issue resolution averaging ${issueMetrics.avgTimeToCloseFormatted}.`);
      issueDetails.push(`Avg resolution time <= 90d (${issueMetrics.avgTimeToCloseFormatted}): +4 pts`);
    } else {
      issueScore += 2;
      warnings.push(`Long issue turnaround (> 3 months avg: ${issueMetrics.avgTimeToCloseFormatted}).`);
      issueDetails.push(`Avg resolution time > 90d: +2 pts`);
    }
  }

  issueScore = Math.min(25, Math.max(0, issueScore));
  const issuePillar: ScorePillar = {
    name: 'Issue Resolution & Backlog',
    score: issueScore,
    maxScore: 25,
    percentage: Math.round((issueScore / 25) * 100),
    description: 'Issue closure ratio and turnaround time to resolve bug reports.',
    status: getPillarStatus(issueScore),
    details: issueDetails,
  };

  // --------------------------------------------------------------------------
  // Pillar 4: Community, Governance & Hygiene (Max 25 pts)
  // --------------------------------------------------------------------------
  let communityScore = 0;
  const communityDetails: string[] = [];

  // License (8 pts)
  if (repo.license && repo.license.name) {
    communityScore += 8;
    strengths.push(`Open source license specified: ${repo.license.name}.`);
    communityDetails.push(`Standard open source license (${repo.license.spdxId || repo.license.name}): +8 pts`);
  } else {
    warnings.push('No open-source license detected. Usage rights may be ambiguous.');
    communityDetails.push('Missing license: 0 pts');
    recommendations.push('Add an OSI-approved license (e.g. MIT, Apache 2.0, BSD) to clarify open-source rights.');
  }

  // Description (4 pts)
  if (repo.description && repo.description.trim().length > 5) {
    communityScore += 4;
    communityDetails.push('Clear repository description: +4 pts');
  } else {
    communityDetails.push('Missing or sparse description: 0 pts');
    recommendations.push('Add a concise repository description and topics/tags to aid discoverability.');
  }

  // Stars (7 pts)
  if (repo.stars >= 1000) {
    communityScore += 7;
    strengths.push(`Strong community backing with ${repo.stars.toLocaleString()} stars.`);
    communityDetails.push(`Community stars >= 1,000 (${repo.stars.toLocaleString()}): +7 pts`);
  } else if (repo.stars >= 100) {
    communityScore += 5;
    communityDetails.push(`Community stars >= 100 (${repo.stars.toLocaleString()}): +5 pts`);
  } else if (repo.stars >= 10) {
    communityScore += 3;
    communityDetails.push(`Community stars >= 10 (${repo.stars.toLocaleString()}): +3 pts`);
  } else {
    communityScore += 1;
    communityDetails.push(`Community stars < 10 (${repo.stars}): +1 pt`);
  }

  // Forks (6 pts)
  if (repo.forks >= 200) {
    communityScore += 6;
    communityDetails.push(`Forks >= 200 (${repo.forks.toLocaleString()}): +6 pts`);
  } else if (repo.forks >= 25) {
    communityScore += 4;
    communityDetails.push(`Forks >= 25 (${repo.forks.toLocaleString()}): +4 pts`);
  } else if (repo.forks >= 5) {
    communityScore += 2;
    communityDetails.push(`Forks >= 5 (${repo.forks.toLocaleString()}): +2 pts`);
  } else {
    communityScore += 1;
    communityDetails.push(`Forks < 5 (${repo.forks}): +1 pt`);
  }

  communityScore = Math.min(25, Math.max(0, communityScore));
  const communityPillar: ScorePillar = {
    name: 'Community & Governance',
    score: communityScore,
    maxScore: 25,
    percentage: Math.round((communityScore / 25) * 100),
    description: 'Licensing, documentation hygiene, stars, and fork adoption.',
    status: getPillarStatus(communityScore),
    details: communityDetails,
  };

  // --------------------------------------------------------------------------
  // Overall Score Calculation & Grading
  // --------------------------------------------------------------------------
  let overallScore = maintenanceScore + prScore + issueScore + communityScore;

  if (repo.isArchived) {
    overallScore = Math.min(overallScore, 45); // Archived repositories cannot score above 45
    recommendations.push('Repository is archived. Consider unarchiving or forking if active maintenance is required.');
  }

  // Add contextual recommendations
  if (prMetrics.avgTimeToMergeHours > 168) {
    recommendations.push('Streamline the code review workflow to reduce average pull request merge time.');
  }
  if (issueMetrics.closedPercentage < 40 && issueMetrics.totalSampled > 5) {
    recommendations.push('Establish weekly issue triage days to close stale or resolved issues.');
  }
  if (daysSinceLastPush > 60 && !repo.isArchived) {
    recommendations.push('Publish updates or release notes to signal ongoing maintenance to users.');
  }
  if (recommendations.length === 0) {
    recommendations.push('Maintain current rapid response times and consistent merge cadence.');
  }

  const { grade, ratingLabel, summary } = getGradeAndLabel(overallScore, repo.isArchived);

  return {
    overallScore,
    grade,
    ratingLabel,
    summary,
    pillars: {
      maintenance: maintenancePillar,
      prVelocity: prPillar,
      issueResolution: issuePillar,
      communityGovernance: communityPillar,
    },
    strengths,
    warnings,
    recommendations,
    formulaDocumentation: FORMULA_DOCUMENTATION.trim(),
  };
}

function getPillarStatus(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
  if (score >= 21) return 'excellent';
  if (score >= 16) return 'good';
  if (score >= 11) return 'fair';
  return 'poor';
}

function getGradeAndLabel(
  score: number,
  isArchived: boolean
): {
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  ratingLabel: 'Exceptional' | 'Healthy & Active' | 'Moderate' | 'Needs Attention' | 'At Risk / Inactive';
  summary: string;
} {
  if (isArchived) {
    return {
      grade: 'D',
      ratingLabel: 'At Risk / Inactive',
      summary: 'Repository is archived and no longer receiving updates or accepting contributions.',
    };
  }

  if (score >= 90) {
    return {
      grade: 'A+',
      ratingLabel: 'Exceptional',
      summary: 'Exceptional repository health with frequent updates, swift PR turnarounds, and excellent community governance.',
    };
  }
  if (score >= 80) {
    return {
      grade: 'A',
      ratingLabel: 'Healthy & Active',
      summary: 'Healthy repository with active maintenance, strong contributor responsiveness, and proper licensing.',
    };
  }
  if (score >= 70) {
    return {
      grade: 'B',
      ratingLabel: 'Moderate',
      summary: 'Good repository health with steady activity, though there is minor room for improving issue resolution or PR turnaround.',
    };
  }
  if (score >= 55) {
    return {
      grade: 'C',
      ratingLabel: 'Moderate',
      summary: 'Moderate health. Shows occasional inactivity, accumulating backlog, or slower review cycles.',
    };
  }
  if (score >= 40) {
    return {
      grade: 'D',
      ratingLabel: 'Needs Attention',
      summary: 'Needs attention. Significant delays in merging PRs, low issue closure rate, or stale commits.',
    };
  }
  return {
    grade: 'F',
    ratingLabel: 'At Risk / Inactive',
    summary: 'At risk. Little to no recent activity, unmaintained issue backlog, or missing essential repository hygiene.',
  };
}
