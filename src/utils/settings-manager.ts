/**
 * Settings Manager für Client-seitige Einstellungen
 */

import { CookieManager } from '../utils/cookie-utils';
import { getAllFlavors } from '../lib/prompt-flavors';
import type { FlavorId } from '../lib/config';
import type { UserSettings } from '../types';

type SettingsChangeListener = (settings: UserSettings) => void;

export class SettingsManager {
  private static instance: SettingsManager;
  private settings: UserSettings;
  private readonly listeners = new Set<SettingsChangeListener>();

  private constructor() {
    this.settings = this.loadSettings();
  }

  static getInstance(): SettingsManager {
    if (!SettingsManager.instance) {
      SettingsManager.instance = new SettingsManager();
    }
    return SettingsManager.instance;
  }

  /**
   * Lädt Einstellungen aus Cookies
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
   * Speichert Einstellungen in Cookies
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
   * Holt aktuelle Einstellungen (immutable copy)
   */
  getSettings(): UserSettings {
    return { ...this.settings };
  }

  /**
   * Setzt API Key mit Validierung
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
   * Entfernt API Key
   */
  clearApiKey(): void {
    this.settings = { ...this.settings, apiKey: null };
    CookieManager.clearApiKeyClient();
    this.notifyListeners();
  }

  /**
   * Setzt Standard-Flavor mit Validierung
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
   * Setzt Theme
   */
  setTheme(theme: UserSettings['theme']): void {
    this.settings = { ...this.settings, theme };
    this.saveSettings();
  }

  /**
   * Setzt Sprache
   */
  setLanguage(language: UserSettings['language']): void {
    this.settings = { ...this.settings, language };
    this.saveSettings();
  }

  /**
   * Prüft ob API Key gesetzt und gültig ist
   */
  hasValidApiKey(): boolean {
    return !!(this.settings.apiKey && CookieManager.validateApiKeyFormat(this.settings.apiKey));
  }

  /**
   * Event Listener für Einstellungsänderungen hinzufügen
   */
  addListener(callback: SettingsChangeListener): void {
    this.listeners.add(callback);
  }

  /**
   * Event Listener entfernen
   */
  removeListener(callback: SettingsChangeListener): void {
    this.listeners.delete(callback);
  }

  /**
   * Alle Listener benachrichtigen
   */
  private notifyListeners(): void {
    const currentSettings = this.getSettings();
    this.listeners.forEach(callback => {
      try {
        callback(currentSettings);
      } catch (error) {
        console.error('Fehler in Settings-Listener:', error);
      }
    });
  }

  /**
   * Exportiert Einstellungen (ohne API Key)
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
   * Importiert Einstellungen (ohne API Key)
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
      console.error('Fehler beim Importieren der Einstellungen:', error);
      return false;
    }
  }

  /**
   * Alle Einstellungen zurücksetzen
   */
  reset(): void {
    CookieManager.clearAll();
    this.settings = this.loadSettings();
    this.notifyListeners();
  }
}