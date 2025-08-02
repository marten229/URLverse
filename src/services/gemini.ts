import type { GeminiRequest, GeminiResponse, PageGenerationResult } from '../types';

export class GeminiService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
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
        throw new Error(`HTTP error! status: ${response.status}`);
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
