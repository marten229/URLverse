import type { GeminiRequest, GeminiResponse, PageGenerationResult } from '../types';

/**
 * Thin wrapper around the Gemini REST API that handles request construction,
 * error classification, and response extraction.
 *
 * The API key is passed via the `x-goog-api-key` header rather than as a URL
 * query parameter to keep it out of server access logs.
 */
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
   * Factory method that validates the API key before constructing an instance.
   * Prefer this over the constructor to get a clear error when no key is available.
   *
   * @param apiKey - The Gemini API key, or `null` if none has been configured.
   * @returns A ready-to-use `GeminiService` instance.
   * @throws {Error} If `apiKey` is `null` or an empty string.
   */
  static create(apiKey: string | null): GeminiService {
    if (!apiKey) {
      throw new Error('Kein gültiger API Key verfügbar. Bitte setzen Sie Ihren Gemini API Key in den Einstellungen.');
    }
    return new GeminiService(apiKey);
  }

  /**
   * Sends a prompt to the Gemini API and returns the raw generated text.
   *
   * Error handling distinguishes between API key errors (which should surface
   * to the user as a settings prompt) and other errors (which are logged and
   * returned as generic failure messages).
   *
   * @param prompt - The complete prompt string to send to the model.
   * @returns A result object containing the generated content, or an error
   *          string if the request failed.
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

            // Classify the error as an API key problem based on the structured
            // `reason` field, which is more reliable than matching error messages.
            const details: Array<{ reason?: string }> = errorBody.error.details || [];
            const reason = details.find(d => d.reason)?.reason ?? '';

            if (reason === 'API_KEY_INVALID' || reason === 'API_KEY_SERVICE_BLOCKED') {
              isApiKeyError = true;
            }
          }
        } catch (e) {
          // Body could not be parsed as JSON — fall back to the HTTP status message.
        }

        // 401/403 are definitive API key rejections regardless of the response body.
        if (response.status === 401 || response.status === 403) {
          isApiKeyError = true;
          errorMessage = 'Ungültiger oder abgelaufener API Key.';
        } else if (response.status === 429) {
          errorMessage = 'API Rate Limit erreicht. Bitte versuchen Sie es später erneut.';
        }

        // Use a sentinel string so callers can distinguish key errors from
        // other failures without parsing localised error messages.
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

      // Known/expected errors (e.g. INVALID_API_KEY) are handled by the caller
      // and should not pollute the error log.
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
