import { marked } from 'marked';
import hljs from 'highlight.js/lib/core';
import python from 'highlight.js/lib/languages/python';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import cpp from 'highlight.js/lib/languages/cpp';
import bash from 'highlight.js/lib/languages/bash';
import json from 'highlight.js/lib/languages/json';
import sql from 'highlight.js/lib/languages/sql';

hljs.registerLanguage('python', python);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('cpp', cpp);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('json', json);
hljs.registerLanguage('sql', sql);

marked.setOptions({ breaks: true });

// Notebook-style rendering: a fenced code block renders as a syntax
// highlighted "cell", and a fenced block tagged ```output renders as a
// plain output box directly underneath it, same visual pattern as a
// rendered (not live) Jupyter notebook export. Nothing executes, the
// "output" is just whatever text you paste into that block yourself.
//
// marked.use() expects plain override functions here, not a Renderer
// instance, an instance silently fails to hook in and falls back to the
// default (unstyled) code rendering.
marked.use({
  renderer: {
    code({ text, lang }) {
      if (lang === 'output') {
        return `<div class="nb-output">${escapeHtml(text)}</div>`;
      }
      const language = lang && hljs.getLanguage(lang) ? lang : undefined;
      const highlighted = language ? hljs.highlight(text, { language }).value : hljs.highlightAuto(text).value;
      return `<div class="nb-cell"><pre><code class="hljs">${highlighted}</code></pre></div>`;
    },
  },
});

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Angular's [innerHTML] binding auto-sanitizes via DomSanitizer, so this
// output is safe to bind directly without bypassSecurityTrustHtml.
export function renderMarkdown(source: string): string {
  return marked.parse(source ?? '', { async: false }) as string;
}
