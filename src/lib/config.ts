import { DEFAULT_FLAVOR_ID } from './prompt-flavors';
import { CookieManager } from '../utils/cookie-utils';

/**
 * Union type of all valid flavor identifiers. Keeping this as a union rather
 * than a plain `string` lets TypeScript catch typos at compile time.
 */
export type FlavorId = 'parallelverse' | 'realistic' | 'cyberpunk' | 'retro' | 'minimalist';

/**
 * Central application configuration.
 *
 * Using `as const` makes every nested value a literal type, which prevents
 * accidental mutation and enables exhaustive type checking in switch statements.
 */
export const config = {
  gemini: {
    model: 'gemini-2.5-flash-lite'
  },
  app: {
    defaultTitle: 'URLverse',
    errorTitle: 'Fehler - URLverse',
    defaultFlavor: DEFAULT_FLAVOR_ID as FlavorId,
  },
  flavors: {
    enabledFlavors: ['parallelverse', 'realistic', 'cyberpunk', 'retro', 'minimalist'] as FlavorId[],
    allowCustomFlavors: false
  }
} as const;

/**
 * Retrieves the Gemini API key from `localStorage` (client-side only).
 *
 * The key is stored exclusively in `localStorage` so it is never transmitted
 * to the server in request headers. This function will always return `null`
 * in an SSR context.
 *
 * @returns The stored API key string, or `null` if none has been set.
 */
export function getApiKey(): string | null {
  return CookieManager.getApiKeyClient();
}

/**
 * Validates that a Gemini API key is present and passes the basic format check.
 *
 * Separating retrieval from validation allows callers to distinguish between
 * "no key set" and "key set but malformed" for more precise error messaging.
 *
 * @returns A result object containing the validation status, the key itself
 *          (if valid), and a human-readable error message (if invalid).
 */
export function validateApiKey(): { isValid: boolean; apiKey: string | null; error?: string } {
  const apiKey = getApiKey();

  if (!apiKey) {
    return {
      isValid: false,
      apiKey: null,
      error: 'Kein API Key gefunden. Bitte setzen Sie Ihren Gemini API Key in den Einstellungen.'
    };
  }

  if (!CookieManager.validateApiKeyFormat(apiKey)) {
    return {
      isValid: false,
      apiKey: null,
      error: 'Ungültiges API Key Format. Bitte überprüfen Sie Ihren Gemini API Key.'
    };
  }

  return {
    isValid: true,
    apiKey
  };
}
