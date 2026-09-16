// Single place to swap in the real identity for this site. Every "View
// repo" link, the About section, the footer, and the live commit feed
// all read from here.
export const GITHUB_USERNAME = 'timmyacy';

export const GITHUB_PROFILE_URL = `https://github.com/${GITHUB_USERNAME}`;
export const LINKEDIN_URL = 'https://www.linkedin.com/in/oluwatimilehin-timmy-ajibode/';

export function githubRepoUrl(repoSlug: string): string {
  return `${GITHUB_PROFILE_URL}/${repoSlug}`;
}
