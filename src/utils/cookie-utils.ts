/**
 * Cookie-Utilities für API Key Management
 */

export interface CookieOptions {
  maxAge?: number;
  path?: string;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

/**
 * Zentraler Cookie Manager für die Anwendung
 */
export class CookieManager {
  private static readonly API_KEY_COOKIE = 'urlverse_api_key' as const;
  private static readonly USER_PREFERENCES_COOKIE = 'urlverse_preferences' as const;
  private static readonly DEFAULT_MAX_AGE = 60 * 60 * 24 * 30; // 30 Tage
  private static readonly PREFERENCES_MAX_AGE = 60 * 60 * 24 * 365; // 1 Jahr

  /**
   * Prüft ob wir im Browser-Kontext sind
   */
  private static isBrowser(): boolean {
    return typeof document !== 'undefined';
  }

  /**
   * Setzt den API Key als HttpOnly Cookie (serverseitig)
   */
  static setApiKeyCookie(response: Response, apiKey: string): void {
    const cookieValue = this.buildCookieString(this.API_KEY_COOKIE, apiKey, {
      maxAge: this.DEFAULT_MAX_AGE,
      httpOnly: true,
      secure: true,
      sameSite: 'lax'
    });
    response.headers.set('Set-Cookie', cookieValue);
  }

  /**
   * Liest den API Key aus den Request-Cookies (serverseitig)
   */
  static getApiKeyFromRequest(request: Request): string | null {
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) return null;

    const cookies = this.parseCookies(cookieHeader);
    return cookies[this.API_KEY_COOKIE] || null;
  }

  /**
   * Client-seitige API Key Verwaltung
   */
  static setApiKeyClient(apiKey: string): void {
    if (!this.isBrowser()) return;
    
    const cookieString = this.buildCookieString(this.API_KEY_COOKIE, apiKey, {
      maxAge: this.DEFAULT_MAX_AGE,
      secure: true,
      sameSite: 'lax'
    });
    document.cookie = cookieString;
  }

  /**
   * Client-seitig API Key auslesen
   */
  static getApiKeyClient(): string | null {
    if (!this.isBrowser()) return null;
    
    const cookies = this.parseCookies(document.cookie);
    return cookies[this.API_KEY_COOKIE] || null;
  }

  /**
   * API Key löschen
   */
  static clearApiKeyClient(): void {
    if (!this.isBrowser()) return;
    
    document.cookie = `${this.API_KEY_COOKIE}=; path=/; max-age=0`;
  }

  /**
   * Benutzereinstellungen setzen
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
      console.error('Fehler beim Setzen der Benutzereinstellungen:', error);
    }
  }

  /**
   * Benutzereinstellungen lesen
   */
  static getUserPreferences(): Record<string, unknown> {
    if (!this.isBrowser()) return {};
    
    const cookies = this.parseCookies(document.cookie);
    const prefString = cookies[this.USER_PREFERENCES_COOKIE];
    
    if (!prefString) return {};
    
    try {
      return JSON.parse(decodeURIComponent(prefString));
    } catch (error) {
      console.warn('Fehler beim Parsen der Benutzereinstellungen:', error);
      return {};
    }
  }

  /**
   * Cookie-String erstellen
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
   * Cookie-String in Objekt umwandeln
   */
  private static parseCookies(cookieString: string): Record<string, string> {
    if (!cookieString?.trim()) return {};

    const cookies: Record<string, string> = {};
    
    cookieString.split(';').forEach(cookie => {
      const [name, ...rest] = cookie.trim().split('=');
      const value = rest.join('='); // Für den Fall, dass Value ein '=' enthält
      
      if (name && value !== undefined) {
        try {
          cookies[name] = decodeURIComponent(value);
        } catch {
          cookies[name] = value; // Fallback wenn decoding fehlschlägt
        }
      }
    });
    
    return cookies;
  }

  /**
   * Prüft ob ein API Key gesetzt ist
   */
  static hasApiKey(): boolean {
    return !!this.getApiKeyClient();
  }

  /**
   * Validiert ein API Key Format (grundlegende Überprüfung)
   */
  static validateApiKeyFormat(apiKey: string): boolean {
    if (typeof apiKey !== 'string') return false;
    
    // Gemini API Keys beginnen normalerweise mit "AIza" und sind etwa 39 Zeichen lang
    return apiKey.length >= 30 && 
           apiKey.length <= 50 && 
           /^[A-Za-z0-9_-]+$/.test(apiKey);
  }

  /**
   * Alle URLverse-Cookies löschen
   */
  static clearAll(): void {
    if (!this.isBrowser()) return;
    
    this.clearApiKeyClient();
    document.cookie = `${this.USER_PREFERENCES_COOKIE}=; path=/; max-age=0`;
  }
}