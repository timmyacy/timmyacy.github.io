import { Component } from '@angular/core';
import { GITHUB_PROFILE_URL } from '../../core/constants';

@Component({
  selector: 'app-footer',
  standalone: true,
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {
  readonly githubProfileUrl = GITHUB_PROFILE_URL;
}
