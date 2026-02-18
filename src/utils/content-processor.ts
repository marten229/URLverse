import type { URLParameters } from '../types';

/**
 * Replaces local image `src` paths in AI-generated HTML with random
 * Picsum placeholder images.
 *
 * The AI frequently outputs relative or server-internal image paths (e.g.
 * `/assets/images/hero.jpg`) that do not exist in this environment. Swapping
 * them for Picsum URLs ensures the rendered page always looks visually complete.
 *
 * @param content - Raw HTML string from the AI response.
 * @returns The HTML string with all local image sources replaced.
 */
export function replaceBrokenImages(content: string): string {
  return content.replace(
    /src=['"](\.\.\/|\/)?([^'"]*\.(jpg|jpeg|png|gif|webp|svg))['"]/gi,
    () => {
      const width = Math.floor(Math.random() * 200) + 300;
      const height = Math.floor(Math.random() * 200) + 300;
      const randomSeed = Math.floor(Math.random() * 1000);

      return `src="https://picsum.photos/${width}/${height}?random=${randomSeed}"`;
    }
  );
}

/**
 * Appends the current URL query parameters to all internal links in the
 * generated HTML so that flavor and other context parameters propagate
 * across page navigations.
 *
 * External links (containing `://`) and anchor-only links (`#...`) are left
 * untouched to avoid breaking third-party URLs.
 *
 * @param content - Raw HTML string from the AI response.
 * @param params  - The URL parameters to forward to internal links.
 * @returns The HTML string with parameters appended to qualifying `href` values.
 */
export function addParametersToLinks(content: string, params: URLParameters): string {
  if (Object.keys(params).length === 0) {
    return content;
  }

  const paramString = new URLSearchParams(params).toString();

  return content.replace(
    /href=['"](\/[^'"#?]*|[^'"#?\/][^'"#?]*)['"]/gi,
    (match, url) => {
      if (url.startsWith('/') || (!url.includes('://') && !url.startsWith('#'))) {
        const separator = url.includes('?') ? '&' : '?';
        return `href="${url}${separator}${paramString}"`;
      }
      return match;
    }
  );
}

/**
 * Strips Markdown code-fence wrappers that the AI sometimes wraps its HTML
 * output in (e.g. ` ```html ... ``` `).
 *
 * The Gemini model occasionally ignores the "return raw HTML only" instruction
 * and wraps the output in a fenced code block. This function normalises the
 * response before it is injected into the DOM.
 *
 * @param rawContent - The raw text content from the Gemini API response.
 * @returns Clean HTML ready for DOM injection.
 */
export function cleanHtmlContent(rawContent: string): string {
  return rawContent
    .replace(/^```html\s*/i, '')
    .replace(/^```\s*/m, '')
    .replace(/\s*```$/m, '')
    .trim();
}
