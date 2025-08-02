/**
 * Konfiguration und Umgebungsvariablen
 */
export const config = {
  gemini: {
    apiKey: import.meta.env.GEMINI_KEY,
    model: 'gemini-2.5-flash-lite'
  },
  app: {
    defaultTitle: 'URLverse',
    errorTitle: 'Fehler - URLverse'
  }
} as const;

/**
 * Validiert die erforderlichen Umgebungsvariablen
 */
export function validateConfig(): void {
  if (!config.gemini.apiKey) {
    throw new Error('GEMINI_KEY Umgebungsvariable ist nicht gesetzt');
  }
}
