export interface RepoIdentifier {
  owner: string;
  repo: string;
  originalInput: string;
}

export interface GitHubRepoMetadata {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  htmlUrl: string;
  owner: {
    login: string;
    avatarUrl: string;
    htmlUrl: string;
  };
  stars: number;
  forks: number;
  openIssuesCount: number; // Includes both issues and open PRs per GitHub API
  primaryLanguage: string | null;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
  license: {
    name: string;
    spdxId: string | null;
    url: string | null;
  } | null;
  isArchived: boolean;
  isFork: boolean;
  defaultBranch: string;
}

export interface RawGitHubPullRequest {
  id: number;
  number: number;
  title: string;
  state: 'open' | 'closed';
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  merged_at: string | null;
  html_url: string;
}

export interface RawGitHubIssue {
  id: number;
  number: number;
  title: string;
  state: 'open' | 'closed';
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  pull_request?: {
    url: string;
    html_url: string;
  };
  html_url: string;
}

export interface PullRequestMetrics {
  totalSampled: number;
  openCount: number;
  closedCount: number;
  mergedCount: number;
  mergedPercentage: number; // merged / totalSampled * 100 (0 if 0 sampled)
  mergedOfClosedPercentage: number; // merged / closedCount * 100
  avgTimeToMergeHours: number; // in hours (0 if no merged PRs)
  avgTimeToMergeFormatted: string; // e.g. "1.5 days" or "14 hours"
  prsOpenedLast30Days: number;
}

export interface IssueMetrics {
  totalSampled: number; // Actual issues only (excluding PRs)
  openCount: number;
  closedCount: number;
  openToClosedRatio: number; // open / max(closed, 1)
  openToClosedRatioFormatted: string; // e.g. "0.45" or "1 : 2.2"
  closedPercentage: number; // closed / totalSampled * 100
  avgTimeToCloseHours: number; // in hours (0 if no closed issues)
  avgTimeToCloseFormatted: string; // e.g. "3.2 days" or "N/A"
}

export interface ScorePillar {
  name: string;
  score: number; // 0 - 25
  maxScore: number; // 25
  percentage: number; // 0 - 100%
  description: string;
  status: 'excellent' | 'good' | 'fair' | 'poor';
  details: string[];
}

export interface HealthScoreResult {
  overallScore: number; // 0 - 100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  ratingLabel: 'Exceptional' | 'Healthy & Active' | 'Moderate' | 'Needs Attention' | 'At Risk / Inactive';
  summary: string;
  pillars: {
    maintenance: ScorePillar;
    prVelocity: ScorePillar;
    issueResolution: ScorePillar;
    communityGovernance: ScorePillar;
  };
  strengths: string[];
  warnings: string[];
  recommendations: string[];
  formulaDocumentation: string;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetDate: string;
  isTokenConfigured: boolean;
}

export interface RepositoryHealthReport {
  repository: GitHubRepoMetadata;
  pullRequestMetrics: PullRequestMetrics;
  issueMetrics: IssueMetrics;
  healthScore: HealthScoreResult;
  rateLimit: RateLimitInfo;
  analyzedAt: string;
}

export interface ApiErrorResponse {
  error: string;
  statusCode: number;
  details?: string;
  type: 'INVALID_URL' | 'REPO_NOT_FOUND' | 'RATE_LIMITED' | 'AUTH_ERROR' | 'GITHUB_API_ERROR' | 'SERVER_ERROR';
  rateLimit?: RateLimitInfo;
}
