// Single place to swap in the real identity for this site. Every "View
// repo" link, the About section, the footer, and the live commit feed
// all read from here.
export const GITHUB_USERNAME = 'timmyacy';

export const GITHUB_PROFILE_URL = `https://github.com/${GITHUB_USERNAME}`;
export const LINKEDIN_URL = 'https://www.linkedin.com/in/oluwatimilehin-timmy-ajibode/';

export function githubRepoUrl(repoSlug: string): string {
  return `${GITHUB_PROFILE_URL}/${repoSlug}`;
}

// Supabase's "publishable" key is designed to be public client-side code,
// same as a Firebase config object. It has no write access on its own,
// access control is entirely enforced by row-level-security policies on
// the database, not by keeping this key secret. Never put the "secret"
// key (prefixed sb_secret_) here or anywhere in this app.
export const SUPABASE_URL = 'https://fttewjvpqguhfypwmzlw.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_PMPXgi0we1C6-afInH2ShA_2QCt9VXU';
