import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Post, SupabaseService } from '../../core/services/supabase.service';

@Component({
  selector: 'app-blog-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './blog-list.component.html',
  styleUrl: './blog-list.component.scss',
})
export class BlogListComponent implements OnInit {
  posts: Post[] = [];
  loading = true;
  error = false;

  constructor(private readonly supabase: SupabaseService) {}

  ngOnInit(): void {
    this.supabase.getPublishedPosts().subscribe({
      next: (posts) => {
        this.posts = posts;
        this.loading = false;
      },
      error: () => {
        this.error = true;
        this.loading = false;
      },
    });
  }

  excerpt(content: string): string {
    const flat = content.replace(/\s+/g, ' ').trim();
    return flat.length > 220 ? flat.slice(0, 220) + '...' : flat;
  }
}
