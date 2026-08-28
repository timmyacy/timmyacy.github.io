import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-project-demo-shell',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './project-demo-shell.component.html',
  styleUrl: './project-demo-shell.component.scss',
})
export class ProjectDemoShellComponent {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) tagline!: string;
  @Input({ required: true }) repoUrl!: string;
  @Input() replayNote?: string;
}
