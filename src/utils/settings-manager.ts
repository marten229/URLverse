/**
 * Singleton manager for all client-side user settings.
 *
 * Settings are split across two storage mechanisms:
 * - The API key lives in `localStorage` (never sent to the server).
 * - All other preferences are stored in a cookie so they can potentially
 *   be read server-side for SSR personalisation in the future.
 *
 * Consumers can subscribe to changes via `addListener` to keep their UI
 * in sync without polling.
 */

import { CookieManager } from '../utils/cookie-utils';
import { getAllFlavors } from '../lib/prompt-flavors';
import type { FlavorId } from '../lib/config';
import type { UserSettings } from '../types';

type SettingsChangeListener = (settings: UserSettings) => void;

/**
 * Provides a unified, reactive interface for reading and writing user settings.
 * All mutations are immediately persisted and broadcast to registered listeners.
 */
export class SettingsManager {
  private static instance: SettingsManager;
  private settings: UserSettings;
  private readonly listeners = new Set<SettingsChangeListener>();

  private constructor() {
    this.settings = this.loadSettings();
  }

  /**
   * Returns the singleton `SettingsManager` instance, creating it on first access.
   */
  static getInstance(): SettingsManager {
    if (!SettingsManager.instance) {
      SettingsManager.instance = new SettingsManager();
    }
    return SettingsManager.instance;
  }

  /**
   * Hydrates the in-memory settings object from the underlying storage layers
   * (`localStorage` for the API key, cookie for preferences).
   *
   * @returns A fully populated `UserSettings` object with defaults applied.
   */
  private loadSettings(): UserSettings {
    const preferences = CookieManager.getUserPreferences();
    const apiKey = CookieManager.getApiKeyClient();

    return {
      apiKey,
      defaultFlavor: (preferences.defaultFlavor as FlavorId) || 'parallelverse',
      theme: (preferences.theme as UserSettings['theme']) || 'auto',
      language: (preferences.language as UserSettings['language']) || 'de'
    };
  }

  /**
   * Persists the current in-memory settings to their respective storage layers
   * and notifies all registered listeners of the change.
   *
   * The API key is stored separately in `localStorage` to keep it off the
   * cookie header and therefore off the server.
   */
  private saveSettings(): void {
    const { apiKey, ...preferences } = this.settings;

    if (apiKey) {
      CookieManager.setApiKeyClient(apiKey);
    }

    CookieManager.setUserPreferences(preferences);
    this.notifyListeners();
  }

  /**
   * Returns an immutable snapshot of the current settings.
   *
   * @returns A shallow copy of the current `UserSettings` object.
   */
  getSettings(): UserSettings {
    return { ...this.settings };
  }

  /**
   * Validates and stores a new API key. Returns `false` without persisting if
   * the key fails the format check, preventing obviously invalid keys from
   * being saved.
   *
   * @param apiKey - The API key string to validate and store.
   * @returns `true` if the key was valid and saved, `false` otherwise.
   */
  setApiKey(apiKey: string): boolean {
    if (!CookieManager.validateApiKeyFormat(apiKey)) {
      return false;
    }

    this.settings = { ...this.settings, apiKey };
    this.saveSettings();
    return true;
  }

  /**
   * Removes the stored API key from both memory and `localStorage`, effectively
   * disabling all Gemini-powered features until a new key is provided.
   */
  clearApiKey(): void {
    this.settings = { ...this.settings, apiKey: null };
    CookieManager.clearApiKeyClient();
    this.notifyListeners();
  }

  /**
   * Sets the default generation flavor after validating it against the list of
   * enabled flavors. Returns `false` if the flavor ID is not recognised.
   *
   * @param flavorId - The flavor identifier to set as default.
   * @returns `true` if the flavor was valid and saved, `false` otherwise.
   */
  setDefaultFlavor(flavorId: FlavorId): boolean {
    const flavors = getAllFlavors();
    if (!flavors.find(f => f.id === flavorId)) {
      return false;
    }

    this.settings = { ...this.settings, defaultFlavor: flavorId };
    this.saveSettings();
    return true;
  }

  /**
   * Updates the UI theme preference.
   *
   * @param theme - The desired theme: `'light'`, `'dark'`, or `'auto'`.
   */
  setTheme(theme: UserSettings['theme']): void {
    this.settings = { ...this.settings, theme };
    this.saveSettings();
  }

  /**
   * Updates the content generation language preference.
   *
   * @param language - The desired language code (e.g. `'de'`, `'en'`).
   */
  setLanguage(language: UserSettings['language']): void {
    this.settings = { ...this.settings, language };
    this.saveSettings();
  }

  /**
   * Checks whether a structurally valid API key is currently stored.
   *
   * @returns `true` if an API key exists and passes the format check.
   */
  hasValidApiKey(): boolean {
    return !!(this.settings.apiKey && CookieManager.validateApiKeyFormat(this.settings.apiKey));
  }

  /**
   * Registers a callback to be invoked whenever settings change.
   * Use this to keep UI components in sync without polling.
   *
   * @param callback - Function called with the updated settings on every change.
   */
  addListener(callback: SettingsChangeListener): void {
    this.listeners.add(callback);
  }

  /**
   * Removes a previously registered settings-change listener.
   *
   * @param callback - The exact function reference that was passed to `addListener`.
   */
  removeListener(callback: SettingsChangeListener): void {
    this.listeners.delete(callback);
  }

  /**
   * Dispatches the current settings to all registered listeners.
   * Errors thrown by individual listeners are caught and logged to prevent
   * one bad listener from blocking the others.
   */
  private notifyListeners(): void {
    const currentSettings = this.getSettings();
    this.listeners.forEach(callback => {
      try {
        callback(currentSettings);
      } catch (error) {
        console.error('Settings listener threw an error:', error);
      }
    });
  }

  /**
   * Serialises the current settings to a JSON string for export.
   * The API key is replaced with a `[HIDDEN]` placeholder to prevent
   * accidental credential exposure in exported files.
   *
   * @returns A pretty-printed JSON string safe for sharing.
   */
  exportSettings(): string {
    const exportData = {
      ...this.settings,
      apiKey: this.settings.apiKey ? '[HIDDEN]' : null,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Imports settings from a previously exported JSON string.
   * The API key is intentionally excluded from imports to prevent credential
   * injection via shared settings files.
   *
   * @param settingsJson - A JSON string produced by `exportSettings`.
   * @returns `true` if at least one valid setting was applied, `false` otherwise.
   */
  importSettings(settingsJson: string): boolean {
    try {
      const imported = JSON.parse(settingsJson);

      let hasChanges = false;

      if (imported.defaultFlavor && this.setDefaultFlavor(imported.defaultFlavor)) {
        hasChanges = true;
      }

      if (imported.theme && ['light', 'dark', 'auto'].includes(imported.theme)) {
        this.setTheme(imported.theme);
        hasChanges = true;
      }

      if (imported.language && ['de', 'en'].includes(imported.language)) {
        this.setLanguage(imported.language);
        hasChanges = true;
      }

      return hasChanges;
    } catch (error) {
      console.error('Failed to import settings:', error);
      return false;
    }
  }

  /**
   * Clears all stored settings and reloads defaults, effectively returning
   * the application to its initial state.
   */
  reset(): void {
    CookieManager.clearAll();
    this.settings = this.loadSettings();
    this.notifyListeners();
  }
}