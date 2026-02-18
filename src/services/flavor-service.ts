import type { FlavorConfig } from '../types';
import { getFlavorById } from '../lib/prompt-flavors';
import { config, type FlavorId } from '../lib/config';

/**
 * Stateless service for resolving and validating the active generation flavor.
 *
 * The current flavor is held in a static field so it persists across calls
 * within the same page session. For cross-session persistence, callers should
 * use `SettingsManager` which writes to a cookie.
 *
 * TODO: Extend with cookie/session persistence once server-side rendering
 *       needs per-user flavor preferences.
 */
export class FlavorService {
  private static currentFlavorId: FlavorId = config.app.defaultFlavor;

  /**
   * Updates the active flavor after validating that the given ID is enabled
   * in the application configuration.
   *
   * @param flavorId - The flavor identifier to activate.
   * @returns `true` if the flavor was valid and set, `false` otherwise.
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
   * Returns the ID of the currently active flavor.
   *
   * @returns The active `FlavorId`.
   */
  static getCurrentFlavorId(): FlavorId {
    return this.currentFlavorId;
  }

  /**
   * Returns the full `PromptFlavor` object for the currently active flavor.
   *
   * @returns The resolved `PromptFlavor` for the active flavor ID.
   */
  static getCurrentFlavor() {
    return getFlavorById(this.currentFlavorId);
  }

  /**
   * Builds a `FlavorConfig` object for passing to generation services.
   * An optional override allows callers to request a specific flavor for a
   * single generation without changing the global active flavor.
   *
   * @param overrideFlavorId - A one-time flavor override, or `undefined` to
   *                           use the currently active flavor.
   * @returns A `FlavorConfig` object ready to pass to the page generator.
   */
  static createFlavorConfig(overrideFlavorId?: string): FlavorConfig {
    return {
      flavorId: overrideFlavorId || this.currentFlavorId
    };
  }

  /**
   * Extracts and validates a flavor ID from URL search parameters.
   * Used to honour the `?flavor=` query parameter on generated pages.
   *
   * @param params - The `URLSearchParams` object from the current request.
   * @returns The validated `FlavorId`, or `undefined` if none is present or valid.
   */
  static extractFlavorFromParams(params: URLSearchParams): FlavorId | undefined {
    const flavorParam = params.get('flavor');
    if (flavorParam && this.isValidFlavor(flavorParam)) {
      return flavorParam as FlavorId;
    }
    return undefined;
  }

  /**
   * Type guard that checks whether a string is a recognised, enabled flavor ID.
   *
   * @param flavorId - The string to test.
   * @returns `true` if `flavorId` is a valid `FlavorId`.
   */
  static isValidFlavor(flavorId: string): flavorId is FlavorId {
    return config.flavors.enabledFlavors.includes(flavorId as FlavorId);
  }

  /**
   * Returns the full `PromptFlavor` objects for all flavors that are currently
   * enabled in the application configuration.
   *
   * @returns An array of enabled `PromptFlavor` objects.
   */
  static getEnabledFlavors() {
    return config.flavors.enabledFlavors.map(id => getFlavorById(id));
  }

  /**
   * Constructs a `Set-Cookie`-compatible string for persisting the selected
   * flavor across requests. The cookie is set with a 1-year max-age and
   * `SameSite=Lax` to balance security and cross-site navigation support.
   *
   * NOTE: This method only builds the cookie string; the caller is responsible
   * for setting it on the response.
   *
   * @param flavorId - The flavor ID to persist.
   * @returns A formatted cookie string ready to assign to `Set-Cookie`.
   */
  static saveFlavorToCookie(flavorId: string): string {
    const cookieValue = `flavor=${flavorId}; Path=/; Max-Age=31536000; SameSite=Lax`;
    return cookieValue;
  }

  /**
   * Parses a `Cookie` request header to extract the stored flavor preference.
   *
   * @param cookieHeader - The raw `Cookie` header string, or `undefined` if absent.
   * @returns The stored `FlavorId`, or `null` if no valid flavor cookie is found.
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
   * Resolves the active flavor for an incoming server request by checking the
   * `Cookie` header, falling back to the application default if none is set.
   *
   * @param request - The incoming `Request` object.
   * @returns The resolved `FlavorId` for this request.
   */
  static getCurrentFlavorFromRequest(request: Request): FlavorId {
    const cookieHeader = request.headers.get('cookie');
    const flavorFromCookie = this.loadFlavorFromCookie(cookieHeader || '');
    const finalFlavor = flavorFromCookie || config.app.defaultFlavor;

    return finalFlavor;
  }
}
