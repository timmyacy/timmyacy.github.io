import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GITHUB_PROFILE_URL, GITHUB_USERNAME, LINKEDIN_URL } from '../../core/constants';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss'
})
export class AboutComponent {
  readonly githubProfileUrl = GITHUB_PROFILE_URL;
  readonly linkedinUrl = LINKEDIN_URL;

  readonly facts = [
    { label: 'MSc',   value: 'Mathematical Finance, York' },
    { label: 'BSc',   value: 'Computer Science, Plymouth' },
    { label: '4 yrs', value: 'SAA Consultants' },
    { label: 'Cert.', value: 'CKAD' },
    { label: 'Repos', value: `github.com/${GITHUB_USERNAME}` },
  ];
}
