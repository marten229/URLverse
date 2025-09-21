import { DEFAULT_FLAVOR_ID } from './prompt-flavors';
import { CookieManager } from '../utils/cookie-utils';

/**
 * Verfügbare Flavor-IDs als Union Type
 */
export type FlavorId = 'parallelverse' | 'realistic' | 'cyberpunk' | 'retro' | 'minimalist';

/**
 * Konfiguration und Umgebungsvariablen
 */
export const config = {
  gemini: {
    fallbackApiKey: import.meta.env.GEMINI_KEY, // Fallback für Development
    model: 'gemini-2.5-flash-lite'
  },
  app: {
    defaultTitle: 'URLverse',
    errorTitle: 'Fehler - URLverse',
    defaultFlavor: DEFAULT_FLAVOR_ID as FlavorId,
    requireApiKey: true // Benutzer müssen ihren eigenen API Key setzen
  },
  flavors: {
    // Hier können später weitere Flavor-spezifische Konfigurationen hinzugefügt werden
    enabledFlavors: ['parallelverse', 'realistic', 'cyberpunk', 'retro', 'minimalist'] as FlavorId[],
    allowCustomFlavors: false
  }
} as const;

/**
 * Holt den API Key aus verschiedenen Quellen
 */
export function getApiKey(request?: Request): string | null {
  // 1. Versuche Cookie zu lesen (bevorzugt)
  if (request) {
    const cookieApiKey = CookieManager.getApiKeyFromRequest(request);
    if (cookieApiKey) return cookieApiKey;
  }
  
  // 2. Client-seitig aus Cookies
  if (typeof document !== 'undefined') {
    const clientApiKey = CookieManager.getApiKeyClient();
    if (clientApiKey) return clientApiKey;
  }
  
  // 3. Fallback auf ENV (nur in Development)
  return config.gemini.fallbackApiKey || null;
}

/**
 * Validiert ob ein API Key verfügbar ist
 */
export function validateApiKey(request?: Request): { isValid: boolean; apiKey: string | null; error?: string } {
  const apiKey = getApiKey(request);
  
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
