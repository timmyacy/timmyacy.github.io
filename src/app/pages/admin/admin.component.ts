import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { User } from '@supabase/supabase-js';
import { Post, SupabaseService } from '../../core/services/supabase.service';

type Draft = Pick<Post, 'title' | 'slug' | 'content' | 'published' | 'cover_image_url'> & { id?: string };

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const EMPTY_DRAFT: Draft = { title: '', slug: '', content: '', published: false, cover_image_url: null };

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
})
export class AdminComponent implements OnInit {
  user: User | null = null;
  loadingAuth = true;

  posts: Post[] = [];
  loadingPosts = false;
  accessDenied = false;

  draft: Draft | null = null;
  saving = false;
  uploading = false;
  errorMessage = '';

  constructor(private readonly supabase: SupabaseService) {}

  ngOnInit(): void {
    this.supabase.user$.subscribe((user) => {
      this.user = user;
      this.loadingAuth = false;
      if (user) {
        this.loadPosts();
      } else {
        this.posts = [];
      }
    });
  }

  signIn(): void {
    this.supabase.signInWithGitHub().catch((e) => (this.errorMessage = e.message));
  }

  signOut(): void {
    this.supabase.signOut();
  }

  loadPosts(): void {
    this.loadingPosts = true;
    this.accessDenied = false;
    this.supabase.getAllPostsForAdmin().subscribe({
      next: (posts) => {
        this.posts = posts;
        this.loadingPosts = false;
      },
      error: () => {
        // RLS blocked the query: signed in with GitHub, but not the site owner.
        this.accessDenied = true;
        this.loadingPosts = false;
      },
    });
  }

  startNew(): void {
    this.draft = { ...EMPTY_DRAFT };
    this.errorMessage = '';
  }

  startEdit(post: Post): void {
    this.draft = { id: post.id, title: post.title, slug: post.slug, content: post.content, published: post.published, cover_image_url: post.cover_image_url };
    this.errorMessage = '';
  }

  cancelEdit(): void {
    this.draft = null;
  }

  onTitleChange(title: string): void {
    if (!this.draft) return;
    this.draft.title = title;
    if (!this.draft.id) {
      // auto-slug new posts as you type; leave existing posts' slugs alone
      this.draft.slug = slugify(title);
    }
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file || !this.draft) return;
    this.uploading = true;
    this.supabase.uploadImage(file).subscribe({
      next: (url) => {
        this.draft!.cover_image_url = url;
        this.uploading = false;
      },
      error: (e) => {
        this.errorMessage = e.message;
        this.uploading = false;
      },
    });
  }

  save(): void {
    if (!this.draft || !this.draft.title || !this.draft.slug) {
      this.errorMessage = 'Title and slug are required.';
      return;
    }
    this.saving = true;
    this.errorMessage = '';
    const { id, ...fields } = this.draft;
    const request = id ? this.supabase.updatePost(id, fields) : this.supabase.createPost(fields);
    request.subscribe({
      next: () => {
        this.saving = false;
        this.draft = null;
        this.loadPosts();
      },
      error: (e) => {
        this.saving = false;
        this.errorMessage = e.message;
      },
    });
  }

  remove(post: Post): void {
    if (!confirm(`Delete "${post.title}"? This can't be undone.`)) return;
    this.supabase.deletePost(post.id).subscribe({
      next: () => this.loadPosts(),
      error: (e) => (this.errorMessage = e.message),
    });
  }
}
