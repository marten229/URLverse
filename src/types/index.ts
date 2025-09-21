/**
 * Core Type Definitions für URLverse
 */

/** URL-Parameter aus der Query-String */
export interface URLParameters {
  readonly [key: string]: string;
}

/** Gemini API Request Structure */
export interface GeminiRequest {
  readonly contents: ReadonlyArray<{
    readonly parts: ReadonlyArray<{ readonly text: string }>;
  }>;
}

/** Gemini API Response Structure */
export interface GeminiResponse {
  readonly candidates?: ReadonlyArray<{
    readonly content?: {
      readonly parts?: ReadonlyArray<{ readonly text?: string }>;
    };
  }>;
}

/** Geparste Slug-Daten aus der URL */
export interface SlugData {
  readonly slugArray: ReadonlyArray<string>;
  readonly query: string;
  readonly params: URLParameters;
}

/** Ergebnis der Seitengenerierung */
export interface PageGenerationResult {
  readonly content: string;
  readonly error?: string;
}

/** Flavor-Konfiguration */
export interface FlavorConfig {
  readonly flavorId?: string;
}

/** Vollständiger Generierungs-Kontext */
export interface GenerationContext extends SlugData, FlavorConfig {}

/** Error-Kontext für Logging */
export interface ErrorContext {
  readonly component?: string;
  readonly action?: string;
  readonly userId?: string;
  readonly apiKey?: string;
  readonly url?: string;
  readonly filename?: string;
  readonly lineno?: number;
  readonly colno?: number;
  readonly additionalData?: Record<string, unknown>;
}
export interface CookieOptions {
  readonly maxAge?: number;
  readonly path?: string;
  readonly secure?: boolean;
  readonly sameSite?: 'strict' | 'lax' | 'none';
  readonly httpOnly?: boolean;
}

/** Benutzereinstellungen */
export interface UserSettings {
  readonly apiKey: string | null;
  readonly defaultFlavor: string;
  readonly theme: 'light' | 'dark' | 'auto';
  readonly language: 'de' | 'en';
}

/** API Key Validierungsergebnis */
export interface ApiKeyValidation {
  readonly isValid: boolean;
  readonly apiKey: string | null;
  readonly error?: string;
}

/** Flavor-Definition */
export interface FlavorDefinition {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly systemPrompt: string;
  readonly contentInstructions: string;
}

/** Event-Handler für URL-Input */
export interface URLInputConfig {
  readonly inputSelector: string;
  readonly autoFocus?: boolean;
  readonly placeholder?: string;
  readonly onNavigate?: (url: string) => void;
  readonly onError?: (error: string) => void;
}

/** Navigation Menu Konfiguration */
export interface NavigationConfig {
  readonly position?: 'top' | 'bottom';
  readonly autoHide?: boolean;
  readonly showOnPaths?: ReadonlyArray<string>;
  readonly excludePaths?: ReadonlyArray<string>;
}

/** Notification-Typen für UI-Feedback */
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface NotificationOptions {
  readonly type: NotificationType;
  readonly duration?: number;
  readonly position?: 'top' | 'bottom';
  readonly dismissible?: boolean;
}
