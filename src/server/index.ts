import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { parseGitHubUrl } from './utils/urlParser';
import { GitHubClient, GitHubApiError } from './services/githubClient';
import {
  calculatePullRequestMetrics,
  calculateIssueMetrics,
} from './services/metricsCalculator';
import { calculateHealthScore } from './services/healthScoreCalculator';
import {
  RepositoryHealthReport,
  ApiErrorResponse,
} from './types';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

const githubClient = new GitHubClient();

// API Health Check
app.get('/api/health-check', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GitHub Rate Limit Status Endpoint
app.get('/api/rate-limit', async (req: Request, res: Response) => {
  try {
    const customToken = req.headers['x-github-token'] as string | undefined;
    const rateLimit = await githubClient.getRateLimit(customToken);
    res.json(rateLimit);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch GitHub rate limit status' });
  }
});

// Repository Analysis Endpoint
app.get('/api/analyze', async (req: Request, res: Response) => {
  const repoInput = (req.query.repo as string) || '';
  const customToken = req.headers['x-github-token'] as string | undefined;

  if (!repoInput) {
    const errorResponse: ApiErrorResponse = {
      error: 'Repository parameter is required (e.g. /api/analyze?repo=facebook/react).',
      statusCode: 400,
      type: 'INVALID_URL',
    };
    return res.status(400).json(errorResponse);
  }

  // 1. Validate and parse repository identifier
  let parsed: { owner: string; repo: string; originalInput: string };
  try {
    parsed = parseGitHubUrl(repoInput);
  } catch (err: any) {
    const errorResponse: ApiErrorResponse = {
      error: err.message || 'Invalid GitHub repository URL format.',
      statusCode: 400,
      type: 'INVALID_URL',
    };
    return res.status(400).json(errorResponse);
  }

  // 2. Fetch data from GitHub
  try {
    const { metadata, pullRequests, issues, rateLimit } =
      await githubClient.fetchRepositoryAll(parsed.owner, parsed.repo, customToken);

    // 3. Compute Metrics
    const pullRequestMetrics = calculatePullRequestMetrics(pullRequests);
    const issueMetrics = calculateIssueMetrics(issues);

    // 4. Compute Health Score
    const healthScore = calculateHealthScore(metadata, pullRequestMetrics, issueMetrics);

    const report: RepositoryHealthReport = {
      repository: metadata,
      pullRequestMetrics,
      issueMetrics,
      healthScore,
      rateLimit,
      analyzedAt: new Date().toISOString(),
    };

    return res.json(report);
  } catch (err: any) {
    if (err instanceof GitHubApiError) {
      const errorResponse: ApiErrorResponse = {
        error: err.message,
        statusCode: err.statusCode,
        type: err.errorType,
        rateLimit: err.rateLimit,
      };
      return res.status(err.statusCode).json(errorResponse);
    }

    const errorResponse: ApiErrorResponse = {
      error: `Internal server error: ${err?.message || 'Unknown error'}`,
      statusCode: 500,
      type: 'SERVER_ERROR',
    };
    return res.status(500).json(errorResponse);
  }
});

// Serve frontend static build in production
const clientDistPath = path.join(__dirname, '../../dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: 'An unexpected internal server error occurred.',
    statusCode: 500,
    type: 'SERVER_ERROR',
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`GitHub Health Dashboard Server running on http://localhost:${PORT}`);
  });
}

export default app;
