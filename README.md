# GitHub Repository Health Dashboard

A full-stack application that analyzes public GitHub repositories in real time and generates an in-depth repository health report with PR velocity, issue triage turnaround, and a documented **0–100 Repository Health Score**.

---

## Features

- **Flexible Repository Input**: Accepts full URLs (`https://github.com/facebook/react`), git clone links, deep links, or `owner/repo` short slugs.
- **Repository Metadata**: Stars, forks, open issues/PR backlog, primary language, last push/update recency, license, default branch, and archival status.
- **Pull Request Velocity Metrics**:
  - Merged PR percentage (with visual gauge)
  - Average turnaround time to merge (in hours/days)
  - Pull requests opened within the last 30 days
- **Issue Management & Resolution**:
  - Open vs closed issue ratio
  - Average turnaround time to close issues
  - Pure issue filtering (automatically excludes pull requests returned by GitHub's `/issues` endpoint)
- **Documented 0–100 Repository Health Score**:
  - Multi-pillar scoring system across Maintenance (25%), PR Efficiency (25%), Issue Resolution (25%), and Community & Governance (25%).
  - Grade assignments ($A^+$, $A$, $B$, $C$, $D$, $F$) with strengths, warnings, and actionable maintainer recommendations.
  - Formula documentation collapsible modal & copyable JSON export.
- **Robust Error & Rate Limit Handling**:
  - Handles invalid URLs (400), nonexistent repositories (404), rate limit exhaustion (429), and network errors.
  - GitHub rate limit tracker in header with remaining requests and reset times.
  - Optional Personal Access Token (PAT) configuration in UI or `.env` to scale to 5,000 req/hr.
  - Handles empty repositories or repos with 0 PRs/issues with neutral baseline scoring.
- **Zero Database Required**: Pure stateless architecture.

---

## Health Scoring Formula (0 - 100)

The total score is computed from 4 weighted pillars (25 points each):

1. **Maintenance & Activity (0–25 pts)**:
   - Recency of last push: $\le 7$ days (+12 pts), $\le 30$ days (+9 pts), $\le 90$ days (+6 pts), $\le 180$ days (+3 pts), $> 180$ days (0 pts).
   - 30-day PR creation velocity: $\ge 15$ PRs (+8 pts), $5-14$ PRs (+6 pts), $1-4$ PRs (+4 pts), $0$ PRs (+2 pts).
   - Active status: Not archived (+5 pts), Archived (0 pts).
2. **Pull Request Efficiency (0–25 pts)**:
   - Merged PR rate: $\ge 70\%$ (+13 pts), $50-69\%$ (+10 pts), $30-49\%$ (+7 pts), $< 30\%$ (+4 pts), 0% (+2 pts), 0 PRs (+12 pts neutral baseline).
   - Average merge turnaround: $\le 24$h (+12 pts), $\le 3$d (+10 pts), $\le 7$d (+7 pts), $\le 21$d (+4 pts), $> 21$d (+2 pts), No merged PRs (+6 pts neutral).
3. **Issue Management & Resolution (0–25 pts)**:
   - Closed issue rate: $\ge 65\%$ (+13 pts), $45-64\%$ (+10 pts), $25-44\%$ (+7 pts), $< 25\%$ (+4 pts), 0 issues (+17 pts neutral baseline).
   - Average resolution time: $\le 48$h (+12 pts), $\le 7$d (+10 pts), $\le 30$d (+7 pts), $\le 90$d (+4 pts), $> 90$d (+2 pts), No closed issues (+7 pts neutral).
4. **Community & Governance (0–25 pts)**:
   - Open-source License: Standard license present (+8 pts), Missing (0 pts).
   - Repository description: Non-empty description (+4 pts), Missing (0 pts).
   - Star backing: $\ge 1,000$ stars (+7 pts), $\ge 100$ stars (+5 pts), $\ge 10$ stars (+3 pts), $< 10$ stars (+1 pt).
   - Fork adoption: $\ge 200$ forks (+6 pts), $\ge 25$ forks (+4 pts), $\ge 5$ forks (+2 pts), $< 5$ forks (+1 pt).

*Note: If a repository is explicitly archived, the score is capped at 45 (Grade D/F).*

---

## Getting Started

### Prerequisites
- Node.js 18+ (tested on Node v24)
- npm 9+

### Installation
```bash
npm install
```

### Running Tests
Execute the Vitest test suite covering URL parsing, PR metrics, Issue calculations, GitHub client errors, and Health score calculations:
```bash
npm run test
```

### Development Mode
1. Start backend server (port 3001):
```bash
npm run dev:server
```
2. In a second terminal, start Vite frontend dev server (port 5173 with proxy):
```bash
npm run dev
```

### Production Build & Run
```bash
npm run build
npm start
```
The full-stack application will be available at `http://localhost:3001`.
