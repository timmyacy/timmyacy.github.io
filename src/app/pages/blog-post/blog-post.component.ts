import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { Post, SupabaseService } from '../../core/services/supabase.service';

@Component({
  selector: 'app-blog-post',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './blog-post.component.html',
  styleUrl: './blog-post.component.scss',
})
export class BlogPostComponent implements OnInit {
  post: Post | null = null;
  loading = true;
  notFound = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly supabase: SupabaseService,
  ) {}

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug') ?? '';
    this.supabase.getPostBySlug(slug).subscribe({
      next: (post) => {
        this.post = post;
        this.notFound = !post;
        this.loading = false;
      },
      error: () => {
        this.notFound = true;
        this.loading = false;
      },
    });
  }
}
