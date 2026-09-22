import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { BehaviorSubject, Observable, from, map } from 'rxjs';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '../constants';

export interface Post {
  id: string;
  slug: string;
  title: string;
  content: string;
  cover_image_url: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
}

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  // PKCE flow returns the login token via a ?code= query param instead of
  // a #access_token= URL fragment. The implicit flow (the SDK's default)
  // would collide with this app's hash-based routing, since both would be
  // fighting over the URL hash.
  private readonly client: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { flowType: 'pkce' },
  });

  private readonly userSubject = new BehaviorSubject<User | null>(null);
  readonly user$: Observable<User | null> = this.userSubject.asObservable();

  constructor() {
    this.client.auth.getSession().then(({ data }) => {
      this.userSubject.next(data.session?.user ?? null);
    });
    this.client.auth.onAuthStateChange((_event, session) => {
      this.userSubject.next(session?.user ?? null);
    });
  }

  get currentUser(): User | null {
    return this.userSubject.value;
  }

  async signInWithGitHub(): Promise<void> {
    const { error } = await this.client.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: window.location.origin + window.location.pathname },
    });
    if (error) throw error;
  }

  async signOut(): Promise<void> {
    const { error } = await this.client.auth.signOut();
    if (error) throw error;
  }

  getPublishedPosts(): Observable<Post[]> {
    return from(this.client.from('posts').select('*').eq('published', true).order('created_at', { ascending: false })).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []) as Post[];
      }),
    );
  }

  getPostBySlug(slug: string): Observable<Post | null> {
    return from(this.client.from('posts').select('*').eq('slug', slug).eq('published', true).maybeSingle()).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as Post | null;
      }),
    );
  }

  // Includes drafts. RLS restricts this to the signed-in owner only.
  getAllPostsForAdmin(): Observable<Post[]> {
    return from(this.client.from('posts').select('*').order('created_at', { ascending: false })).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []) as Post[];
      }),
    );
  }

  createPost(post: Partial<Post>): Observable<Post> {
    return from(this.client.from('posts').insert(post).select().single()).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as Post;
      }),
    );
  }

  updatePost(id: string, updates: Partial<Post>): Observable<Post> {
    return from(this.client.from('posts').update(updates).eq('id', id).select().single()).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as Post;
      }),
    );
  }

  deletePost(id: string): Observable<void> {
    return from(this.client.from('posts').delete().eq('id', id)).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
    );
  }

  uploadImage(file: File): Observable<string> {
    const path = `${Date.now()}-${file.name}`;
    return from(this.client.storage.from('blog-media').upload(path, file)).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.client.storage.from('blog-media').getPublicUrl(data.path).data.publicUrl;
      }),
    );
  }
}
