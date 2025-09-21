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

      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        // Spezifische Fehlermeldungen für häufige API-Probleme
        if (response.status === 401) {
          errorMessage = 'Ungültiger API Key. Bitte überprüfen Sie Ihren Gemini API Key in den Einstellungen.';
        } else if (response.status === 403) {
          errorMessage = 'API Key hat keine Berechtigung. Stellen Sie sicher, dass Ihr Gemini API Key aktiv ist.';
        } else if (response.status === 429) {
          errorMessage = 'API Rate Limit erreicht. Bitte versuchen Sie es später erneut.';
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
      console.error('Fehler beim Generieren des Inhalts:', error);
      return {
        content: '',
        error: error instanceof Error ? error.message : 'Unbekannter Fehler'
      };
    }
  }
}
