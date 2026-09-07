import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { GITHUB_USERNAME } from '../constants';

export interface GitActivityItem {
  repo: string;
  type: 'push' | 'pr' | 'issue' | 'create' | 'fork' | 'release';
  message: string;
  sha?: string;
  url: string;
  timestamp: string;
}

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
