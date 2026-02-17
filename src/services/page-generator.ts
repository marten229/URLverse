import type { SlugData, PageGenerationResult, GenerationContext } from '../types';
import { GeminiService } from './gemini';
import { createPromptForUrl } from '../lib/prompt-generator';
import { createParameterContext } from '../utils/slug-parser';
import { cleanHtmlContent, replaceBrokenImages, addParametersToLinks } from '../utils/content-processor';
import { config, validateApiKey } from '../lib/config';

export class PageGeneratorService {
  private geminiService: GeminiService | null = null;
  private readonly apiKey: string | null;

  constructor(apiKey?: string | null, request?: Request) {
    this.apiKey = this.resolveApiKey(apiKey, request);
  }

  /**
   * Löst den API Key aus verschiedenen Quellen auf
   */
  private resolveApiKey(apiKey?: string | null, request?: Request): string | null {
    if (apiKey) return apiKey;

    const validation = validateApiKey(request);
    return validation.isValid ? validation.apiKey : null;
  }

  /**
   * Initialisiert den Gemini Service lazy
   */
  private initializeGeminiService(): void {
    if (!this.apiKey) {
      throw new Error('Kein API Key verfügbar. Bitte setzen Sie Ihren Gemini API Key in den Einstellungen.');
    }

    if (!this.geminiService) {
      this.geminiService = GeminiService.create(this.apiKey);
    }
  }

  /**
   * Generiert eine HTML-Seite basierend auf den Slug-Daten
   */
  async generatePage(slugData: SlugData, flavorId?: string): Promise<PageGenerationResult> {
    return this.generatePageInternal(slugData, flavorId);
  }

  /**
   * Generiert eine HTML-Seite mit vollständigem Generierungs-Kontext
   */
  async generatePageWithContext(context: GenerationContext): Promise<PageGenerationResult> {
    return this.generatePageInternal(context, context.flavorId);
  }

  /**
   * Interne Methode für Seitengenerierung (DRY-Prinzip)
   */
  private async generatePageInternal(
    slugData: SlugData,
    flavorId?: string
  ): Promise<PageGenerationResult> {
    try {
      this.initializeGeminiService();

      const { query, params } = slugData;
      const selectedFlavorId = flavorId || config.app.defaultFlavor;

      const parameterContext = createParameterContext(params);
      const prompt = createPromptForUrl(query, parameterContext, selectedFlavorId);

      const result = await this.geminiService!.generateContent(prompt);

      if (result.error) {
        return {
          content: '',
          error: result.error
        };
      }

      return {
        content: this.processContent(result.content, params)
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      return {
        content: '',
        error: errorMessage
      };
    }
  }

  /**
   * Verarbeitet den generierten Content
   */
  private processContent(content: string, params: SlugData['params']): string {
    let processedContent = cleanHtmlContent(content);
    processedContent = replaceBrokenImages(processedContent);
    processedContent = addParametersToLinks(processedContent, params);
    return processedContent;
  }
}
