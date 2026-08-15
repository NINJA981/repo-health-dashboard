import {
  GitHubRepoMetadata,
  RawGitHubPullRequest,
  RawGitHubIssue,
  RateLimitInfo,
  ApiErrorResponse,
} from '../types';

export class GitHubApiError extends Error {
  statusCode: number;
  errorType: ApiErrorResponse['type'];
  rateLimit?: RateLimitInfo;

  constructor(
    message: string,
    statusCode: number,
    errorType: ApiErrorResponse['type'],
    rateLimit?: RateLimitInfo
  ) {
    super(message);
    this.name = 'GitHubApiError';
    this.statusCode = statusCode;
    this.errorType = errorType;
    this.rateLimit = rateLimit;
  }
}

export interface FetchRepoDataResult {
  metadata: GitHubRepoMetadata;
  pullRequests: RawGitHubPullRequest[];
  issues: RawGitHubIssue[];
  rateLimit: RateLimitInfo;
}

export class GitHubClient {
  private defaultToken?: string;

  constructor(defaultToken?: string) {
    this.defaultToken = defaultToken || process.env.GITHUB_TOKEN;
  }

  private getHeaders(customToken?: string): Record<string, string> {
    const token = customToken || this.defaultToken;
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'GitHub-Repo-Health-Dashboard/1.0',
    };
    if (token && token.trim()) {
      headers.Authorization = `Bearer ${token.trim()}`;
    }
    return headers;
  }

  private extractRateLimit(headers: Headers, hasToken: boolean): RateLimitInfo {
    const limit = parseInt(headers.get('x-ratelimit-limit') || '60', 10);
    const remaining = parseInt(headers.get('x-ratelimit-remaining') || '0', 10);
    const resetTimestamp = parseInt(headers.get('x-ratelimit-reset') || '0', 10);

    const resetDate = resetTimestamp
      ? new Date(resetTimestamp * 1000).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZoneName: 'short',
        })
      : 'Shortly';

    return {
      limit,
      remaining,
      resetDate,
      isTokenConfigured: hasToken,
    };
  }

  public async getRateLimit(customToken?: string): Promise<RateLimitInfo> {
    const token = customToken || this.defaultToken;
    const res = await fetch('https://api.github.com/rate_limit', {
      headers: this.getHeaders(token),
    });
    const info = this.extractRateLimit(res.headers, Boolean(token));
    return info;
  }

  public async fetchRepositoryAll(
    owner: string,
    repo: string,
    customToken?: string
  ): Promise<FetchRepoDataResult> {
    const token = customToken || this.defaultToken;
    const headers = this.getHeaders(token);

    // Fetch repository metadata first
    const repoUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
    let repoRes: Response;

    try {
      repoRes = await fetch(repoUrl, { headers });
    } catch (err: any) {
      throw new GitHubApiError(
        `Failed to reach GitHub API: ${err?.message || 'Network connection failed'}`,
        503,
        'GITHUB_API_ERROR'
      );
    }

    const rateLimit = this.extractRateLimit(repoRes.headers, Boolean(token));

    if (!repoRes.ok) {
      if (repoRes.status === 404) {
        throw new GitHubApiError(
          `Repository "${owner}/${repo}" was not found. Please verify that the repository is public and spelled correctly.`,
          404,
          'REPO_NOT_FOUND',
          rateLimit
        );
      }
      if (repoRes.status === 403 || repoRes.status === 429) {
        const resetMsg = rateLimit.resetDate ? ` Resets at ${rateLimit.resetDate}.` : '';
        throw new GitHubApiError(
          `GitHub API rate limit exceeded.${resetMsg} Consider providing a personal access token (PAT) in settings.`,
          429,
          'RATE_LIMITED',
          rateLimit
        );
      }
      if (repoRes.status === 401) {
        throw new GitHubApiError(
          'GitHub rejected the authorization token. Please check your GitHub Personal Access Token.',
          401,
          'AUTH_ERROR',
          rateLimit
        );
      }

      const errorBody = await repoRes.text().catch(() => '');
      throw new GitHubApiError(
        `GitHub API returned error ${repoRes.status}: ${errorBody || repoRes.statusText}`,
        repoRes.status,
        'GITHUB_API_ERROR',
        rateLimit
      );
    }

    const repoJson: any = await repoRes.json();

    // Fetch PRs and Issues in parallel
    const pullsUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls?state=all&per_page=100&sort=updated&direction=desc`;
    const issuesUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues?state=all&per_page=100&sort=updated&direction=desc`;

    const [pullsRes, issuesRes] = await Promise.all([
      fetch(pullsUrl, { headers }).catch(() => null),
      fetch(issuesUrl, { headers }).catch(() => null),
    ]);

    let pullRequests: RawGitHubPullRequest[] = [];
    if (pullsRes && pullsRes.ok) {
      try {
        pullRequests = (await pullsRes.json()) as RawGitHubPullRequest[];
      } catch {
        pullRequests = [];
      }
    }

    let issues: RawGitHubIssue[] = [];
    if (issuesRes && issuesRes.ok) {
      try {
        issues = (await issuesRes.json()) as RawGitHubIssue[];
      } catch {
        issues = [];
      }
    }

    // Update latest rate limit info from subsequent calls if available
    const latestHeaders = issuesRes?.headers || pullsRes?.headers || repoRes.headers;
    const finalRateLimit = this.extractRateLimit(latestHeaders, Boolean(token));

    const metadata: GitHubRepoMetadata = {
      id: repoJson.id,
      name: repoJson.name,
      fullName: repoJson.full_name,
      description: repoJson.description || null,
      htmlUrl: repoJson.html_url,
      owner: {
        login: repoJson.owner?.login || owner,
        avatarUrl: repoJson.owner?.avatar_url || '',
        htmlUrl: repoJson.owner?.html_url || `https://github.com/${owner}`,
      },
      stars: repoJson.stargazers_count ?? 0,
      forks: repoJson.forks_count ?? 0,
      openIssuesCount: repoJson.open_issues_count ?? 0,
      primaryLanguage: repoJson.language || null,
      createdAt: repoJson.created_at || '',
      updatedAt: repoJson.updated_at || '',
      pushedAt: repoJson.pushed_at || repoJson.updated_at || '',
      license: repoJson.license
        ? {
            name: repoJson.license.name || repoJson.license.key,
            spdxId: repoJson.license.spdx_id || null,
            url: repoJson.license.url || null,
          }
        : null,
      isArchived: Boolean(repoJson.archived),
      isFork: Boolean(repoJson.fork),
      defaultBranch: repoJson.default_branch || 'main',
    };

    return {
      metadata,
      pullRequests: Array.isArray(pullRequests) ? pullRequests : [],
      issues: Array.isArray(issues) ? issues : [],
      rateLimit: finalRateLimit,
    };
  }
}
