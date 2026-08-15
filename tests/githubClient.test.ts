import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GitHubClient, GitHubApiError } from '../src/server/services/githubClient';

describe('GitHubClient', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('correctly maps 404 response to REPO_NOT_FOUND error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      headers: new Headers({
        'x-ratelimit-limit': '60',
        'x-ratelimit-remaining': '55',
        'x-ratelimit-reset': '1700000000',
      }),
      text: async () => JSON.stringify({ message: 'Not Found' }),
    });

    const client = new GitHubClient();
    await expect(client.fetchRepositoryAll('nonexistent', 'repo')).rejects.toThrow(
      'Repository "nonexistent/repo" was not found'
    );
  });

  it('correctly maps 403 / 429 response to RATE_LIMITED error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      headers: new Headers({
        'x-ratelimit-limit': '60',
        'x-ratelimit-remaining': '0',
        'x-ratelimit-reset': '1700000000',
      }),
      text: async () => JSON.stringify({ message: 'API rate limit exceeded' }),
    });

    const client = new GitHubClient();
    try {
      await client.fetchRepositoryAll('facebook', 'react');
      expect.fail('Should have thrown GitHubApiError');
    } catch (err: any) {
      expect(err).toBeInstanceOf(GitHubApiError);
      expect(err.errorType).toBe('RATE_LIMITED');
      expect(err.statusCode).toBe(429);
      expect(err.rateLimit?.remaining).toBe(0);
    }
  });

  it('fetches metadata, PRs, and issues successfully when GitHub returns valid JSON', async () => {
    const mockRepoMetadata = {
      id: 12345,
      name: 'react',
      full_name: 'facebook/react',
      description: 'The library for web and native user interfaces',
      html_url: 'https://github.com/facebook/react',
      owner: {
        login: 'facebook',
        avatar_url: 'https://avatars.githubusercontent.com/u/69631',
        html_url: 'https://github.com/facebook',
      },
      stargazers_count: 220000,
      forks_count: 45000,
      open_issues_count: 500,
      language: 'JavaScript',
      created_at: '2013-05-24T16:15:54Z',
      updated_at: '2026-08-14T10:00:00Z',
      pushed_at: '2026-08-14T10:00:00Z',
      license: { name: 'MIT License', spdx_id: 'MIT', url: null },
      archived: false,
      fork: false,
      default_branch: 'main',
    };

    const mockPRs = [
      {
        id: 1,
        number: 101,
        title: 'Fix issue',
        state: 'closed',
        created_at: '2026-08-10T10:00:00Z',
        updated_at: '2026-08-11T10:00:00Z',
        closed_at: '2026-08-11T10:00:00Z',
        merged_at: '2026-08-11T10:00:00Z',
        html_url: 'https://github.com/facebook/react/pull/101',
      },
    ];

    const mockIssues = [
      {
        id: 2,
        number: 202,
        title: 'Bug report',
        state: 'open',
        created_at: '2026-08-12T10:00:00Z',
        updated_at: '2026-08-12T10:00:00Z',
        closed_at: null,
        html_url: 'https://github.com/facebook/react/issues/202',
      },
    ];

    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      const headers = new Headers({
        'x-ratelimit-limit': '60',
        'x-ratelimit-remaining': '45',
        'x-ratelimit-reset': '1700000000',
      });

      if (url.includes('/pulls')) {
        return {
          ok: true,
          status: 200,
          headers,
          json: async () => mockPRs,
        };
      }
      if (url.includes('/issues')) {
        return {
          ok: true,
          status: 200,
          headers,
          json: async () => mockIssues,
        };
      }
      return {
        ok: true,
        status: 200,
        headers,
        json: async () => mockRepoMetadata,
      };
    });

    const client = new GitHubClient();
    const result = await client.fetchRepositoryAll('facebook', 'react');

    expect(result.metadata.name).toBe('react');
    expect(result.metadata.stars).toBe(220000);
    expect(result.pullRequests.length).toBe(1);
    expect(result.issues.length).toBe(1);
    expect(result.rateLimit.remaining).toBe(45);
  });
});
