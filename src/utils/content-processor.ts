import type { URLParameters } from '../types';

/**
 * Ersetzt Bild-URLs durch Picsum-Platzhalter
 */
export function replaceBrokenImages(content: string): string {
  return content.replace(
    /src=['"](\.\/|\/)?([^'"]*\.(jpg|jpeg|png|gif|webp|svg))['"]/gi,
    () => {
      const width = Math.floor(Math.random() * 200) + 300;
      const height = Math.floor(Math.random() * 200) + 300;
      const randomSeed = Math.floor(Math.random() * 1000);
      
      return `src="https://picsum.photos/${width}/${height}?random=${randomSeed}"`;
    }
  );
}

/**
 * Fügt URL-Parameter zu internen Links hinzu
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
 * Bereinigt HTML-Content von Markdown-Code-Blöcken
 */
export function cleanHtmlContent(rawContent: string): string {
  return rawContent
    .replace(/^```html\s*/i, '')
    .replace(/^```\s*/m, '')
    .replace(/\s*```$/m, '')
    .trim();
}
