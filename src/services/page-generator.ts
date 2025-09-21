import type { SlugData, PageGenerationResult, GenerationContext } from '../types';
import { GeminiService } from './gemini';
import { createPromptForUrl } from '../lib/prompt-generator';
import { getFlavorById } from '../lib/prompt-flavors';
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
          content: this.getErrorContent(result.error, selectedFlavorId),
          error: result.error
        };
      }

      return {
        content: this.processContent(result.content, params)
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      return {
        content: this.getErrorContent(errorMessage),
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

  /**
   * Erstellt eine Fehlerseite im Stil des gewählten Flavors
   */
  private getErrorContent(error: string, flavorId?: string): string {
    const flavor = flavorId ? getFlavorById(flavorId) : null;
    
    const baseErrorStyle = `
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

    if (flavor) {
      switch (flavor.id) {
        case 'cyberpunk':
          return `
            <div style="background: #0a0a0a; color: #00ff41; font-family: 'Courier New', monospace; padding: 2rem; min-height: 100vh;">
              <div style="max-width: 600px; margin: 0 auto; border: 1px solid #00ff41; padding: 2rem;">
                <h1 style="color: #ff0080; text-shadow: 0 0 10px #ff0080;">SYSTEM ERROR</h1>
                <p style="color: #00ff41;">NEURAL LINK DISCONNECTED:</p>
                <code style="background: #1a1a1a; padding: 1rem; display: block; border: 1px solid #00ff41; color: #ff0080;">
                  ${error}
                </code>
                <p style="margin-top: 2rem;">
                  <a href="/" style="color: #00ff41; text-decoration: none; text-shadow: 0 0 5px #00ff41;">← RETURN TO MAINFRAME</a>
                </p>
              </div>
            </div>
          `;
        case 'retro':
          return `
            <body bgcolor="#ffffff" text="#000000">
              <center>
                <table border="1" cellpadding="10" cellspacing="0" width="80%">
                  <tr bgcolor="#ff0000">
                    <td align="center">
                      <font size="4" color="#ffffff"><b>ERROR 404 - SITE NOT FOUND!</b></font>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <font size="2">
                        <b>Oops! Something went wrong:</b><br><br>
                        <code>${error}</code><br><br>
                        <a href="/">Back to Homepage</a>
                      </font>
                    </td>
                  </tr>
                </table>
              </center>
            </body>
          `;
        default:
          return baseErrorStyle;
      }
    }

    return baseErrorStyle;
  }
}
