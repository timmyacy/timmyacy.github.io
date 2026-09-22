import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GitActivityItem, GithubService } from '../../core/services/github.service';
import { GITHUB_PROFILE_URL, GITHUB_USERNAME } from '../../core/constants';

const TYPE_LABEL: Record<GitActivityItem['type'], string> = {
  push: 'commit',
  pr: 'pull request',
  issue: 'issue',
  create: 'created',
  fork: 'fork',
  release: 'release',
  ci_run: 'ci',
};

// Shown if the GitHub API is unreachable or the unauthenticated rate
// limit (60 req/hr/IP) is hit, so the section never renders empty.
const FALLBACK_ACTIVITY: GitActivityItem[] = [
  { repo: `${GITHUB_USERNAME}/MC-Pricer`, type: 'push', message: 'Add antithetic variance reduction flag to CLI', sha: 'a1c9e42', url: '#', timestamp: new Date().toISOString() },
  { repo: `${GITHUB_USERNAME}/Risk-Aggregrator`, type: 'ci_run', message: 'FX Options Portfolio Risk Aggregator', url: '#', timestamp: new Date().toISOString(), conclusion: 'success' },
  { repo: `${GITHUB_USERNAME}/BSM-Pricer`, type: 'push', message: 'Add put-call parity self-check to CLI output', sha: '7f0b21d', url: '#', timestamp: new Date().toISOString() },
  { repo: `${GITHUB_USERNAME}/Risk-Aggregrator`, type: 'push', message: 'Fix cross-currency Greek aggregation bug', sha: 'e3d8a90', url: '#', timestamp: new Date().toISOString() },
];

@Component({
  selector: 'app-git-activity',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './git-activity.component.html',
  styleUrl: './git-activity.component.scss',
})
export class GitActivityComponent implements OnInit {
  readonly githubUsername = GITHUB_USERNAME;
  readonly githubProfileUrl = GITHUB_PROFILE_URL;
  readonly typeLabel = TYPE_LABEL;

  items: GitActivityItem[] = [];
  loading = true;
  isFallback = false;

  constructor(private readonly github: GithubService) {}

  ngOnInit(): void {
    this.github.getBuildLog().subscribe((items) => {
      this.loading = false;
      if (items.length === 0) {
        this.items = FALLBACK_ACTIVITY;
        this.isFallback = true;
      } else {
        this.items = items;
      }
    });
  }
}
