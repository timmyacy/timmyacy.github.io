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
  menuOpen = false;

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  readonly links = [
    { label: 'About', fragment: 'about' },
    { label: 'Pricing Tools', fragment: 'tools' },
    { label: 'Engine Check', fragment: 'markets' },
    { label: 'Build Log', fragment: 'activity' },
    { label: 'API', fragment: 'api' },
  ];
}
