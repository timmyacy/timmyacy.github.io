import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';
import { GITHUB_USERNAME } from '../constants';

export interface GitActivityItem {
  repo: string;
  type: 'push' | 'pr' | 'issue' | 'create' | 'fork' | 'release' | 'ci_run';
  message: string;
  sha?: string;
  url: string;
  timestamp: string;
  conclusion?: 'success' | 'failure'; // only set for type: 'ci_run'
}

interface WorkflowRun {
  name: string;
  status: string;
  conclusion: string | null;
  created_at: string;
  html_url: string;
}

interface WorkflowRunsResponse {
  workflow_runs: WorkflowRun[];
}

// Repos to check for CI activity. Kept as an explicit list rather than
// discovering repos dynamically, to keep this to a handful of API calls
// (unauthenticated GitHub API is capped at 60 req/hr per IP).
const CI_REPOS = ['BSM-Pricer', 'Jump_Diffusion_Pricer', 'MC-Pricer', 'Risk-Aggregrator', 'Trading-System', 'Thesis'];

// Shape of the bits we actually read off GitHub's public Events API.
// https://docs.github.com/en/rest/activity/events#list-public-events-for-a-user
interface GithubEvent {
  type: string;
  repo: { name: string };
  created_at: string;
  payload: any;
}

@Injectable({ providedIn: 'root' })
export class GithubService {
  constructor(private readonly http: HttpClient) {}

  /**
   * Pulls this account's recent public GitHub activity and flattens it into
   * a single commit/PR/issue log for the "live build feed" on the landing page.
   * Unauthenticated GitHub API calls are capped at 60 req/hr per IP, so
   * callers should cache/share this rather than re-fetching per component.
   */
  getRecentActivity(username: string = GITHUB_USERNAME, limit = 10): Observable<GitActivityItem[]> {
    return this.http
      .get<GithubEvent[]>(`https://api.github.com/users/${username}/events/public?per_page=30`)
      .pipe(
        map((events) => events.flatMap((e) => this.toActivityItems(e)).slice(0, limit)),
        catchError(() => of([])),
      );
  }

  /** Recent completed GitHub Actions runs across the known project repos, pass or fail. */
  getRecentWorkflowRuns(username: string = GITHUB_USERNAME, limit = 5): Observable<GitActivityItem[]> {
    const requests = CI_REPOS.map((repo) =>
      this.http
        .get<WorkflowRunsResponse>(`https://api.github.com/repos/${username}/${repo}/actions/runs?per_page=5`)
        .pipe(
          map((res) =>
            (res.workflow_runs ?? [])
              .filter((r) => r.status === 'completed' && r.conclusion)
              .map((r): GitActivityItem => ({
                repo: `${username}/${repo}`,
                type: 'ci_run',
                message: r.name,
                url: r.html_url,
                timestamp: r.created_at,
                conclusion: r.conclusion === 'success' ? 'success' : 'failure',
              })),
          ),
          catchError(() => of([] as GitActivityItem[])),
        ),
    );

    return forkJoin(requests).pipe(
      map((results) =>
        results
          .flat()
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, limit),
      ),
      catchError(() => of([])),
    );
  }

  /** Commits/PRs/issues merged with CI run outcomes, sorted into one feed. */
  getBuildLog(username: string = GITHUB_USERNAME, limit = 12): Observable<GitActivityItem[]> {
    return forkJoin([this.getRecentActivity(username, limit), this.getRecentWorkflowRuns(username, limit)]).pipe(
      map(([activity, runs]) =>
        [...activity, ...runs]
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, limit),
      ),
    );
  }

  private toActivityItems(event: GithubEvent): GitActivityItem[] {
    const repo = event.repo.name;
    const timestamp = event.created_at;

    switch (event.type) {
      case 'PushEvent':
        return (event.payload.commits ?? []).slice(0, 3).map((c: any) => ({
          repo,
          type: 'push' as const,
          message: c.message.split('\n')[0],
          sha: c.sha?.slice(0, 7),
          url: `https://github.com/${repo}/commit/${c.sha}`,
          timestamp,
        }));

      case 'PullRequestEvent':
        return [{
          repo,
          type: 'pr',
          message: `${event.payload.action} PR #${event.payload.number}: ${event.payload.pull_request?.title}`,
          url: event.payload.pull_request?.html_url ?? `https://github.com/${repo}`,
          timestamp,
        }];

      case 'IssuesEvent':
        return [{
          repo,
          type: 'issue',
          message: `${event.payload.action} issue #${event.payload.issue?.number}: ${event.payload.issue?.title}`,
          url: event.payload.issue?.html_url ?? `https://github.com/${repo}`,
          timestamp,
        }];

      case 'CreateEvent':
        return [{
          repo,
          type: 'create',
          message: `created ${event.payload.ref_type}${event.payload.ref ? ' ' + event.payload.ref : ''}`,
          url: `https://github.com/${repo}`,
          timestamp,
        }];

      case 'ForkEvent':
        return [{
          repo,
          type: 'fork',
          message: 'forked this repository',
          url: event.payload.forkee?.html_url ?? `https://github.com/${repo}`,
          timestamp,
        }];

      case 'ReleaseEvent':
        return [{
          repo,
          type: 'release',
          message: `published release ${event.payload.release?.tag_name ?? ''}`.trim(),
          url: event.payload.release?.html_url ?? `https://github.com/${repo}`,
          timestamp,
        }];

      default:
        return [];
    }
  }
}
