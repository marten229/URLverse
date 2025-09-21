import type { FlavorConfig } from '../types';
import { getFlavorById } from '../lib/prompt-flavors';
import { config, type FlavorId } from '../lib/config';

/**
 * Service zur Verwaltung von Flavor-Einstellungen
 * Kann später erweitert werden um Cookies, Sessions oder Database-Persistierung
 */
export class FlavorService {
  private static currentFlavorId: FlavorId = config.app.defaultFlavor;

  /**
   * Setzt den aktuellen Flavor
   */
  static setCurrentFlavor(flavorId: string): boolean {
    try {
      const flavor = getFlavorById(flavorId);
      if (flavor && this.isValidFlavor(flavorId)) {
        this.currentFlavorId = flavorId as FlavorId;
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Holt den aktuellen Flavor
   */
  static getCurrentFlavorId(): FlavorId {
    return this.currentFlavorId;
  }

  /**
   * Holt den aktuellen Flavor als Objekt
   */
  static getCurrentFlavor() {
    return getFlavorById(this.currentFlavorId);
  }

  /**
   * Erstellt FlavorConfig für eine Anfrage
   */
  static createFlavorConfig(overrideFlavorId?: string): FlavorConfig {
    return {
      flavorId: overrideFlavorId || this.currentFlavorId
    };
  }

  /**
   * Extrahiert Flavor aus URL-Parametern (für spätere API-Nutzung)
   */
  static extractFlavorFromParams(params: URLSearchParams): FlavorId | undefined {
    const flavorParam = params.get('flavor');
    if (flavorParam && this.isValidFlavor(flavorParam)) {
      return flavorParam as FlavorId;
    }
    return undefined;
  }

  /**
   * Validiert einen Flavor-ID
   */
  static isValidFlavor(flavorId: string): flavorId is FlavorId {
    return config.flavors.enabledFlavors.includes(flavorId as FlavorId);
  }

  /**
   * Holt alle verfügbaren Flavors basierend auf Konfiguration
   */
  static getEnabledFlavors() {
    return config.flavors.enabledFlavors.map(id => getFlavorById(id));
  }

  // TODO: Später erweitern für Cookie/Session-Support
  /**
   * Speichert Flavor in Cookie
   */
  static saveFlavorToCookie(flavorId: string): string {
    const cookieValue = `flavor=${flavorId}; Path=/; Max-Age=31536000; SameSite=Lax`;
    return cookieValue;
  }

  /**
   * Lädt Flavor aus Cookie
   */
  static loadFlavorFromCookie(cookieHeader?: string): FlavorId | null {
    if (!cookieHeader) return null;
    
    const cookies = cookieHeader.split(';').map(cookie => cookie.trim());
    const flavorCookie = cookies.find(cookie => cookie.startsWith('flavor='));
    
    if (flavorCookie) {
      const flavorId = flavorCookie.split('=')[1];
      return this.isValidFlavor(flavorId) ? flavorId as FlavorId : null;
    }
    
    return null;
  }

  /**
   * Holt den aktuellen Flavor aus Request (Cookie oder Default)
   */
  static getCurrentFlavorFromRequest(request: Request): FlavorId {
    const cookieHeader = request.headers.get('cookie');
    const flavorFromCookie = this.loadFlavorFromCookie(cookieHeader || '');
    const finalFlavor = flavorFromCookie || config.app.defaultFlavor;
    
    return finalFlavor;
  }
}
