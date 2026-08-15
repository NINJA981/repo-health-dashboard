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
  openIssuesCount: number;
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

export interface PullRequestMetrics {
  totalSampled: number;
  openCount: number;
  closedCount: number;
  mergedCount: number;
  mergedPercentage: number;
  mergedOfClosedPercentage: number;
  avgTimeToMergeHours: number;
  avgTimeToMergeFormatted: string;
  prsOpenedLast30Days: number;
}

export interface IssueMetrics {
  totalSampled: number;
  openCount: number;
  closedCount: number;
  openToClosedRatio: number;
  openToClosedRatioFormatted: string;
  closedPercentage: number;
  avgTimeToCloseHours: number;
  avgTimeToCloseFormatted: string;
}

export interface ScorePillar {
  name: string;
  score: number;
  maxScore: number;
  percentage: number;
  description: string;
  status: 'excellent' | 'good' | 'fair' | 'poor';
  details: string[];
}

export interface HealthScoreResult {
  overallScore: number;
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
