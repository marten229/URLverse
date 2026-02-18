import type { SlugData, PageGenerationResult, GenerationContext } from '../types';
import { GeminiService } from './gemini';
import { createPromptForUrl } from '../lib/prompt-generator';
import { createParameterContext } from '../utils/slug-parser';
import { cleanHtmlContent, replaceBrokenImages, addParametersToLinks } from '../utils/content-processor';
import { config, validateApiKey } from '../lib/config';

/**
 * Orchestrates the full page-generation pipeline: prompt construction,
 * Gemini API invocation, and post-processing of the raw HTML response.
 *
 * The `GeminiService` is initialised lazily on the first generation request
 * to avoid throwing at construction time when no API key is yet available.
 */
export class PageGeneratorService {
  private geminiService: GeminiService | null = null;
  private readonly apiKey: string | null;

  constructor(apiKey?: string | null) {
    this.apiKey = this.resolveApiKey(apiKey);
  }

  /**
   * Resolves the API key from the constructor argument or falls back to the
   * value stored in `localStorage`. This allows callers to inject a key
   * explicitly (e.g. in tests) while still supporting the default flow where
   * the key is read from user settings.
   *
   * @param apiKey - An explicit API key, or `null`/`undefined` to use storage.
   * @returns The resolved API key, or `null` if none is available.
   */
  private resolveApiKey(apiKey?: string | null): string | null {
    if (apiKey) return apiKey;

    const validation = validateApiKey();
    return validation.isValid ? validation.apiKey : null;
  }

  /**
   * Initialises the `GeminiService` on first use (lazy initialisation).
   * Deferring construction until the first request avoids surfacing API key
   * errors at page load time when the key may not yet be needed.
   *
   * @throws {Error} If no API key is available at the time of the first call.
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
   * Generates an HTML page for the given URL slug data.
   *
   * @param slugData - The parsed URL path and query parameters.
   * @param flavorId - Optional flavor override; falls back to the app default.
   * @returns A result object containing the processed HTML, or an error string.
   */
  async generatePage(slugData: SlugData, flavorId?: string): Promise<PageGenerationResult> {
    return this.generatePageInternal(slugData, flavorId);
  }

  /**
   * Generates an HTML page using a fully populated `GenerationContext`, which
   * bundles slug data and flavor configuration into a single object.
   *
   * @param context - The complete generation context including slug and flavor.
   * @returns A result object containing the processed HTML, or an error string.
   */
  async generatePageWithContext(context: GenerationContext): Promise<PageGenerationResult> {
    return this.generatePageInternal(context, context.flavorId);
  }

  /**
   * Shared implementation for both public generation methods (DRY principle).
   * Builds the prompt, calls the API, and post-processes the response.
   *
   * @param slugData - The parsed URL path and query parameters.
   * @param flavorId - Optional flavor override.
   * @returns A result object containing the processed HTML, or an error string.
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
   * Applies a chain of post-processing transformations to the raw AI output:
   * 1. Strips Markdown code fences that the model sometimes adds.
   * 2. Replaces broken local image paths with Picsum placeholders.
   * 3. Appends URL parameters to internal links for context propagation.
   *
   * @param content - The raw HTML string from the Gemini API.
   * @param params  - The URL parameters to forward to internal links.
   * @returns The fully processed HTML string ready for DOM injection.
   */
  private processContent(content: string, params: SlugData['params']): string {
    let processedContent = cleanHtmlContent(content);
    processedContent = replaceBrokenImages(processedContent);
    processedContent = addParametersToLinks(processedContent, params);
    return processedContent;
  }
}
