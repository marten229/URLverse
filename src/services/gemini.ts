import type { GeminiRequest, GeminiResponse, PageGenerationResult } from '../types';

export class GeminiService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('API Key ist erforderlich für GeminiService');
    }
    this.apiKey = apiKey;
  }

  /**
   * Statische Methode zum Erstellen einer GeminiService-Instanz mit API Key Validation
   */
  static create(apiKey: string | null): GeminiService {
    if (!apiKey) {
      throw new Error('Kein gültiger API Key verfügbar. Bitte setzen Sie Ihren Gemini API Key in den Einstellungen.');
    }
    return new GeminiService(apiKey);
  }

  /**
   * Sendet einen Prompt an die Gemini API
   */
  async generateContent(prompt: string): Promise<PageGenerationResult> {
    try {
      const body: GeminiRequest = {
        contents: [{
          parts: [{ text: prompt }]
        }]
      };

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        let isApiKeyError = false;

        try {
          const errorBody = await response.json();

          if (errorBody.error) {
            errorMessage = errorBody.error.message || errorMessage;

            // Prüfe auf spezifische API-Key Fehler anhand des reason-Felds
            const details: Array<{ reason?: string }> = errorBody.error.details || [];
            const reason = details.find(d => d.reason)?.reason ?? '';

            if (reason === 'API_KEY_INVALID' || reason === 'API_KEY_SERVICE_BLOCKED') {
              isApiKeyError = true;
            }
          }
        } catch (e) {
          // Fallback wenn Body nicht geparst werden kann
        }

        // Spezifische HTTP Status Codes
        if (response.status === 401 || response.status === 403) {
          isApiKeyError = true;
          errorMessage = 'Ungültiger oder abgelaufener API Key.';
        } else if (response.status === 429) {
          errorMessage = 'API Rate Limit erreicht. Bitte versuchen Sie es später erneut.';
        }

        if (isApiKeyError) {
          throw new Error('INVALID_API_KEY');
        }

        throw new Error(errorMessage);
      }

      const json: GeminiResponse = await response.json();
      const rawContent = json.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawContent) {
        throw new Error('Keine Antwort von der API erhalten');
      }

      return {
        content: rawContent
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';

      // Bekannte/erwartete Fehler nicht als Error loggen
      const knownErrors = ['INVALID_API_KEY'];
      if (!knownErrors.includes(errorMessage)) {
        console.error('Fehler beim Generieren des Inhalts:', error);
      }

      return {
        content: '',
        error: errorMessage
      };
    }
  }
}
