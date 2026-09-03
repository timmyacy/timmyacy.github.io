import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GITHUB_PROFILE_URL, GITHUB_USERNAME } from '../../core/constants';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss'
})
export class AboutComponent {
  readonly githubProfileUrl = GITHUB_PROFILE_URL;

  readonly facts = [
    { label: 'MSc',   value: 'Mathematical Finance, York' },
    { label: '4 yrs',   value: 'SAA Consultants' },
    { label: 'Cert.', value: 'CKAD' },
    { label: 'Based',  value: 'London, UK' },
    { label: 'Repos', value: `github.com/${GITHUB_USERNAME}` },
  ];
}
