import type { SlugData, PageGenerationResult } from '../types';
import { GeminiService } from './gemini';
import { createPromptForUrl } from '../lib/prompt-generator';
import { createParameterContext } from '../utils/slug-parser';
import { cleanHtmlContent, replaceBrokenImages, addParametersToLinks } from '../utils/content-processor';

export class PageGeneratorService {
  private geminiService: GeminiService;

  constructor(apiKey: string) {
    this.geminiService = new GeminiService(apiKey);
  }

  /**
   * Generiert eine HTML-Seite basierend auf den Slug-Daten
   */
  async generatePage(slugData: SlugData): Promise<PageGenerationResult> {
    const { query, params } = slugData;
    
    const parameterContext = createParameterContext(params);
    
    const prompt = createPromptForUrl(query, parameterContext);
    
    const result = await this.geminiService.generateContent(prompt);
    
    if (result.error) {
      return {
        content: this.getErrorContent(result.error),
        error: result.error
      };
    }

    let processedContent = cleanHtmlContent(result.content);
    processedContent = replaceBrokenImages(processedContent);
    processedContent = addParametersToLinks(processedContent, params);

    return {
      content: processedContent
    };
  }

  /**
   * Erstellt eine Fehlerseite
   */
  private getErrorContent(error: string): string {
    return `
      <div style="padding: 2rem; font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #e74c3c;">Fehler beim Laden der Seite</h1>
        <p style="color: #666;">Es ist ein Fehler aufgetreten:</p>
        <code style="background: #f8f9fa; padding: 1rem; display: block; border-radius: 4px; color: #e74c3c;">
          ${error}
        </code>
        <p style="margin-top: 2rem;">
          <a href="/" style="color: #3498db; text-decoration: none;">← Zurück zur Startseite</a>
        </p>
      </div>
    `;
  }
}
