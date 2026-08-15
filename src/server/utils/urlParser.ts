import { RepoIdentifier } from '../types';

/**
 * Parses and extracts owner and repo name from various GitHub URL and slug formats.
 * Supported formats:
 * - https://github.com/owner/repo
 * - http://github.com/owner/repo/
 * - https://github.com/owner/repo.git
 * - https://github.com/owner/repo/tree/main/...
 * - git@github.com:owner/repo.git
 * - github.com/owner/repo
 * - owner/repo
 */
export function parseGitHubUrl(rawInput: string): RepoIdentifier {
  if (!rawInput || typeof rawInput !== 'string') {
    throw new Error('Please enter a GitHub repository URL or "owner/repo" slug.');
  }

  const trimmed = rawInput.trim();
  if (!trimmed) {
    throw new Error('Repository input cannot be blank.');
  }

  // Handle SSH format: git@github.com:owner/repo.git
  const sshRegex = /^git@github\.com:([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+?)(?:\.git)?$/;
  const sshMatch = trimmed.match(sshRegex);
  if (sshMatch) {
    return cleanAndValidate(sshMatch[1], sshMatch[2], trimmed);
  }

  // Check if it's a full URL with a protocol
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsedUrl = new URL(trimmed);
      const host = parsedUrl.hostname.toLowerCase().replace(/^www\./, '');
      if (host !== 'github.com') {
        throw new Error('Only GitHub repositories (github.com) are supported.');
      }
      // Extract pathname without leading/trailing slashes
      const pathname = parsedUrl.pathname.replace(/^\/+|\/+$/g, '');
      const segments = pathname.split('/').filter(Boolean);
      if (segments.length < 2) {
        throw new Error(`Invalid format "${trimmed}". Expected "owner/repo" or "https://github.com/owner/repo".`);
      }
      let repo = segments[1];
      if (repo.endsWith('.git')) {
        repo = repo.slice(0, -4);
      }
      return cleanAndValidate(segments[0], repo, trimmed);
    } catch (e: any) {
      if (e.message?.includes('Only GitHub') || e.message?.includes('Invalid format')) {
        throw e;
      }
      throw new Error(`Invalid repository URL: ${e.message}`);
    }
  }

  // Check if domain is specified without protocol (e.g. gitlab.com/owner/repo or github.com/owner/repo)
  let normalized = trimmed.replace(/^www\./, '');
  if (normalized.startsWith('github.com/')) {
    normalized = normalized.slice('github.com/'.length);
  } else if (/^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}\//.test(normalized)) {
    throw new Error('Only GitHub repositories (github.com) are supported.');
  }

  // Strip query params and hash fragments
  normalized = normalized.split('?')[0].split('#')[0];

  // Split path segments
  const segments = normalized.split('/').filter(Boolean);

  if (segments.length < 2) {
    throw new Error(
      `Invalid format "${trimmed}". Expected "owner/repo" or "https://github.com/owner/repo".`
    );
  }

  const owner = segments[0];
  let repo = segments[1];

  // Strip trailing .git if present
  if (repo.endsWith('.git')) {
    repo = repo.slice(0, -4);
  }

  return cleanAndValidate(owner, repo, trimmed);
}

function cleanAndValidate(owner: string, repo: string, originalInput: string): RepoIdentifier {
  // Validate GitHub owner and repo characters
  // GitHub usernames: alphanumeric and hyphens (up to 39 chars)
  // GitHub repos: alphanumeric, hyphens, underscores, dots (up to 100 chars)
  const ownerRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;
  const repoRegex = /^[a-zA-Z0-9_.-]{1,100}$/;

  // Check reserved path names on GitHub
  const reservedWords = new Set(['explore', 'topics', 'trending', 'collections', 'events', 'sponsors', 'settings', 'orgs', 'users']);
  if (reservedWords.has(owner.toLowerCase()) && repo === '') {
    throw new Error(`"${owner}" is a reserved GitHub page, not a valid user or organization.`);
  }

  if (!ownerRegex.test(owner)) {
    throw new Error(`Invalid GitHub username/organization "${owner}". GitHub usernames may only contain alphanumeric characters and hyphens.`);
  }

  if (!repoRegex.test(repo)) {
    throw new Error(`Invalid GitHub repository name "${repo}". Repository names may only contain alphanumeric characters, hyphens, underscores, and dots.`);
  }

  return {
    owner,
    repo,
    originalInput,
  };
}
