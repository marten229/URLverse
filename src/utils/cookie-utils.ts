/**
 * Centralised API key and user-preference storage.
 *
 * The API key is intentionally stored in `localStorage` rather than a cookie
 * so it is never transmitted to the server in request headers.
 */

export interface CookieOptions {
  maxAge?: number;
  path?: string;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

/**
 * Manages client-side persistence for the API key and user preferences.
 *
 * - The API key lives in `localStorage` (never sent to the server).
 * - User preferences are stored in a cookie so they survive hard reloads
 *   and can potentially be read server-side in the future.
 */
export class CookieManager {
  private static readonly API_KEY_STORAGE = 'urlverse_api_key' as const;
  private static readonly USER_PREFERENCES_COOKIE = 'urlverse_preferences' as const;
  private static readonly DEFAULT_MAX_AGE = 60 * 60 * 24 * 30;   // 30 days
  private static readonly PREFERENCES_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

  /**
   * Guards against SSR environments where `document` is unavailable.
   */
  private static isBrowser(): boolean {
    return typeof document !== 'undefined';
  }

  /**
   * Persists the API key exclusively in `localStorage` so it is never
   * included in HTTP request headers and therefore never reaches the server.
   *
   * @param apiKey - The raw Gemini API key string.
   */
  static setApiKeyClient(apiKey: string): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(this.API_KEY_STORAGE, apiKey);
  }

  /**
   * Retrieves the API key from `localStorage`.
   *
   * @returns The stored API key, or `null` if none has been set.
   */
  static getApiKeyClient(): string | null {
    if (!this.isBrowser()) return null;
    return localStorage.getItem(this.API_KEY_STORAGE);
  }

  /**
   * Removes the API key from `localStorage`, effectively logging the user out
   * of any Gemini-powered features.
   */
  static clearApiKeyClient(): void {
    if (!this.isBrowser()) return;
    localStorage.removeItem(this.API_KEY_STORAGE);
  }

  /**
   * Serialises and stores user preferences as a cookie.
   * The value is URI-encoded to safely handle special characters in JSON.
   *
   * @param preferences - A flat key-value map of user preference settings.
   */
  static setUserPreferences(preferences: Record<string, unknown>): void {
    if (!this.isBrowser()) return;

    try {
      const prefString = JSON.stringify(preferences);
      const cookieString = this.buildCookieString(
        this.USER_PREFERENCES_COOKIE,
        encodeURIComponent(prefString),
        {
          maxAge: this.PREFERENCES_MAX_AGE,
          secure: true,
          sameSite: 'lax'
        }
      );
      document.cookie = cookieString;
    } catch (error) {
      console.error('Failed to persist user preferences:', error);
    }
  }

  /**
   * Reads and deserialises user preferences from the cookie store.
   *
   * @returns The stored preferences object, or an empty object if none exist
   *          or parsing fails.
   */
  static getUserPreferences(): Record<string, unknown> {
    if (!this.isBrowser()) return {};

    const cookies = this.parseCookies(document.cookie);
    const prefString = cookies[this.USER_PREFERENCES_COOKIE];

    if (!prefString) return {};

    try {
      return JSON.parse(decodeURIComponent(prefString));
    } catch (error) {
      console.warn('Failed to parse user preferences cookie — returning defaults:', error);
      return {};
    }
  }

  /**
   * Assembles a `Set-Cookie`-compatible string from the given name, value,
   * and security options.
   *
   * @param name    - Cookie name.
   * @param value   - Already-encoded cookie value.
   * @param options - Security and lifetime options.
   * @returns A formatted cookie string ready to assign to `document.cookie`.
   */
  private static buildCookieString(
    name: string,
    value: string,
    options: CookieOptions & { httpOnly?: boolean } = {}
  ): string {
    const {
      maxAge = this.DEFAULT_MAX_AGE,
      path = '/',
      secure = true,
      sameSite = 'lax',
      httpOnly = false
    } = options;

    let cookieString = `${name}=${value}`;
    cookieString += `; path=${path}`;
    cookieString += `; max-age=${maxAge}`;

    if (secure) cookieString += '; secure';
    if (httpOnly) cookieString += '; httponly';
    if (sameSite) cookieString += `; samesite=${sameSite}`;

    return cookieString;
  }

  /**
   * Parses the raw `document.cookie` string into a key-value map.
   *
   * NOTE: Values that contain `=` are handled correctly by re-joining the
   * split segments — the cookie spec allows `=` inside values.
   *
   * @param cookieString - The raw `document.cookie` string.
   * @returns A map of cookie names to their decoded values.
   */
  private static parseCookies(cookieString: string): Record<string, string> {
    if (!cookieString?.trim()) return {};

    const cookies: Record<string, string> = {};

    cookieString.split(';').forEach(cookie => {
      const [name, ...rest] = cookie.trim().split('=');
      // Re-join to correctly handle values that contain '=' characters.
      const value = rest.join('=');

      if (name && value !== undefined) {
        try {
          cookies[name] = decodeURIComponent(value);
        } catch {
          // HACK: Fall back to the raw value if URI decoding fails (e.g. malformed cookie).
          cookies[name] = value;
        }
      }
    });

    return cookies;
  }

  /**
   * Convenience check for whether an API key is currently stored.
   *
   * @returns `true` if an API key exists in `localStorage`.
   */
  static hasApiKey(): boolean {
    return !!this.getApiKeyClient();
  }

  /**
   * Performs a lightweight structural validation of the API key format.
   *
   * NOTE: Gemini API keys typically start with "AIza" and are ~39 characters
   * long. This check is intentionally permissive to avoid false negatives
   * when Google changes their key format.
   *
   * @param apiKey - The API key string to validate.
   * @returns `true` if the key passes the basic format check.
   */
  static validateApiKeyFormat(apiKey: string): boolean {
    if (typeof apiKey !== 'string') return false;

    return apiKey.length >= 30 &&
      apiKey.length <= 50 &&
      /^[A-Za-z0-9_-]+$/.test(apiKey);
  }

  /**
   * Wipes all URLverse-managed storage entries, effectively resetting the
   * application to its initial state.
   */
  static clearAll(): void {
    if (!this.isBrowser()) return;

    this.clearApiKeyClient();
    document.cookie = `${this.USER_PREFERENCES_COOKIE}=; path=/; max-age=0`;
  }
}