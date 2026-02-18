/**
 * Shared TypeScript type definitions for the URLverse application.
 *
 * Centralising all interfaces here ensures a single source of truth for the
 * data shapes that flow between the Astro server, client scripts, and Web
 * Components. Import from this module rather than defining local types.
 */

// ── Gemini API ───────────────────────────────────────────────────────────────

/**
 * Request body sent to the Gemini `generateContent` REST endpoint.
 * Only the minimal required fields are typed here; the full schema is
 * documented at https://ai.google.dev/api/generate-content.
 */
export interface GeminiRequest {
  contents: Array<{
    parts: Array<{
      text: string;
    }>;
  }>;
}

/**
 * Subset of the Gemini API response that the application consumes.
 * Additional fields (e.g. `usageMetadata`, `modelVersion`) are intentionally
 * omitted to keep the interface minimal.
 */
export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
    finishReason?: string;
    safetyRatings?: Array<{
      category: string;
      probability: string;
    }>;
  }>;
}

// ── Page generation ──────────────────────────────────────────────────────────

/**
 * Result returned by `GeminiService.generateContent` and `PageGeneratorService`.
 * Either `content` contains the generated HTML, or `error` contains a
 * human-readable failure message (never both).
 */
export interface PageGenerationResult {
  content: string;
  error?: string;
}

/**
 * Parsed representation of the Astro catch-all route slug and its associated
 * query parameters.
 */
export interface SlugData {
  slugArray: string[];
  query: string;
  params: URLParameters;
}

/**
 * Bundles all information needed to generate a page in a single object,
 * allowing the generation context to be passed around without multiple
 * positional arguments.
 */
export interface GenerationContext extends SlugData {
  flavorId: string;
}

/** Flat map of URL query parameter key-value pairs. */
export type URLParameters = Record<string, string>;

// ── Flavors ──────────────────────────────────────────────────────────────────

/**
 * Lightweight flavor reference used when only the ID is needed, avoiding the
 * cost of loading the full `PromptFlavor` object with its large prompt strings.
 */
export interface FlavorConfig {
  flavorId: string;
}

// ── User settings ────────────────────────────────────────────────────────────

/**
 * All user-configurable settings managed by `SettingsManager`.
 * The `apiKey` field is stored in `localStorage` separately from the other
 * fields, which live in a cookie.
 */
export interface UserSettings {
  apiKey: string | null;
  defaultFlavor: string;
  theme: 'light' | 'dark' | 'auto';
  language: 'de' | 'en';
}

// ── Error handling ───────────────────────────────────────────────────────────

/**
 * Structured context attached to error log entries. All fields are optional
 * to allow partial context when not all information is available at the
 * point of error.
 *
 * WARNING: The `apiKey` field is automatically redacted by `Logger` before
 * the entry is stored or forwarded to external services.
 */
export interface ErrorContext {
  component?: string;
  action?: string;
  url?: string;
  apiKey?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  [key: string]: unknown;
}

// ── Components ───────────────────────────────────────────────────────────────

/**
 * Configuration options for the `NavigationMenu` Web Component.
 * All fields are optional; the component provides sensible defaults.
 */
export interface NavigationConfig {
  position?: 'left' | 'right';
  theme?: 'light' | 'dark' | 'auto';
}

// ── API responses ────────────────────────────────────────────────────────────

/**
 * Standard envelope for Astro API route responses.
 * On success, `data` contains the payload; on failure, `error` contains a
 * human-readable message and `details` may carry additional diagnostic info.
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
}

// ── Performance ──────────────────────────────────────────────────────────────

/**
 * Aggregated performance statistics for a named operation, produced by
 * `PerformanceMonitor.generateReport`.
 */
export interface PerformanceStats {
  operation: string;
  count: number;
  averageDuration: number;
  maxDuration: number;
  minDuration: number;
}
