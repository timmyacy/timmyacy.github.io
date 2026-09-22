import { marked } from 'marked';

marked.setOptions({ breaks: true });

// Angular's [innerHTML] binding auto-sanitizes via DomSanitizer, so this
// output is safe to bind directly without bypassSecurityTrustHtml.
export function renderMarkdown(source: string): string {
  return marked.parse(source ?? '', { async: false }) as string;
}
