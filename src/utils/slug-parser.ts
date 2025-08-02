import type { URLParameters } from '../types';

/**
 * Extrahiert und verarbeitet URL-Parameter aus Astro.params und Astro.url
 */
export function parseSlugData(params: any, url: URL) {
  const slug = params.slug || [];
  const slugArray = Array.isArray(slug) ? slug : [slug].filter(Boolean);
  const query = slugArray.join('/');
  const urlParams = url.searchParams;
  const parameters = Object.fromEntries(urlParams.entries());

  return {
    slugArray,
    query,
    params: parameters
  };
}

/**
 * Erstellt Parameter-Kontext für den AI-Prompt
 */
export function createParameterContext(params: URLParameters): string {
  if (Object.keys(params).length === 0) {
    return '';
  }

  return `\n\nZusätzliche Parameter für die Seite:
${Object.entries(params).map(([key, value]) => `- ${key}: ${value}`).join('\n')}
Berücksichtige diese Parameter bei der Erstellung der Seite.

WICHTIG: Erstelle realistische interne Links (z.B. zu anderen Seiten, Kategorien, Artikeln). 
Die Parameter werden automatisch an alle internen Links weitergegeben.`;
}
