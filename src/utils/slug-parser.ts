import type { URLParameters } from '../types';

/**
 * Extracts the path segments and query parameters from Astro's routing context.
 *
 * Astro's catch-all route (`[...slug]`) delivers the path as either a string
 * or an array of strings depending on the number of segments. This function
 * normalises both cases into a single joined query string.
 *
 * @param params - The `Astro.params` object from the catch-all route.
 * @param url    - The full `Astro.url` object for query-string extraction.
 * @returns An object containing the slug array, the joined query string, and
 *          any URL search parameters.
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
 * Builds a natural-language context block from URL query parameters to be
 * appended to the AI prompt.
 *
 * When a user navigates to a URL with query parameters (e.g. `?lang=en`),
 * those parameters carry intent that the AI should reflect in the generated
 * page. This function formats them into a readable instruction block.
 *
 * @param params - The URL parameters to include in the prompt context.
 * @returns A formatted string to append to the base prompt, or an empty
 *          string if no parameters are present.
 */
export function createParameterContext(params: URLParameters): string {
  if (Object.keys(params).length === 0) {
    return '';
  }

  return `\n\nZusätzliche Parameter für die Seite:\n${Object.entries(params).map(([key, value]) => `- ${key}: ${value}`).join('\n')}\nBerücksichtige diese Parameter bei der Erstellung der Seite.\n\nWICHTIG: Erstelle realistische interne Links (z.B. zu anderen Seiten, Kategorien, Artikeln). \nDie Parameter werden automatisch an alle internen Links weitergegeben.`;
}
