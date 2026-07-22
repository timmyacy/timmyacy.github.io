import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  readonly links = [
    { label: 'About', fragment: 'about' },
    { label: 'Live Markets', fragment: 'markets' },
    { label: 'Pricing Tools', fragment: 'tools' },
    { label: 'Build Log', fragment: 'activity' },
    { label: 'Datasets', fragment: 'data' },
    { label: 'API', fragment: 'api' },
  ];
}
