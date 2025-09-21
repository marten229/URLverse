/**
 * Settings UI Component
 * Erstellt und verwaltet das Einstellungs-Interface
 */

import { SettingsManager } from '../utils/settings-manager';
import { getAllFlavors } from '../lib/prompt-flavors';
import type { UserSettings } from '../types';

export class SettingsUI {
  private settingsManager: SettingsManager;
  private container: HTMLElement | null = null;
  private isOpen = false;

  constructor() {
    this.settingsManager = SettingsManager.getInstance();
    this.settingsManager.addListener(this.onSettingsChange.bind(this));
  }

  /**
   * Erstellt die Settings UI
   */
  create(): HTMLElement {
    this.container = document.createElement('div');
    this.container.className = 'settings-panel';
    this.container.innerHTML = this.getSettingsHTML();
    
    this.attachEventListeners();
    this.updateUI();
    
    return this.container;
  }

  /**
   * HTML-Template für die Einstellungen
   */
  private getSettingsHTML(): string {
    const settings = this.settingsManager.getSettings();
    const flavors = getAllFlavors();
    
    return `
      <div class="settings-panel__header">
        <h3>⚙️ Einstellungen</h3>
        <button class="settings-panel__close" type="button" aria-label="Schließen">×</button>
      </div>
      
      <div class="settings-panel__content">
        <!-- API Key Section -->
        <div class="settings-section">
          <h4>🔑 Gemini API Key</h4>
          <p class="settings-description">
            Setzen Sie Ihren persönlichen Google Gemini API Key für die Content-Generierung.
          </p>
          <div class="settings-field">
            <input 
              type="password" 
              id="apiKeyInput" 
              placeholder="Ihr Gemini API Key..."
              value="${settings.apiKey || ''}"
              class="settings-input"
            />
            <div class="settings-field-actions">
              <button type="button" id="saveApiKey" class="btn btn--primary">Speichern</button>
              <button type="button" id="clearApiKey" class="btn btn--secondary">Löschen</button>
            </div>
          </div>
          <div class="settings-status" id="apiKeyStatus">
            ${settings.apiKey ? '✅ API Key gesetzt' : '⚠️ Kein API Key gesetzt'}
          </div>
          <details class="settings-help">
            <summary>Wie bekomme ich einen API Key?</summary>
            <p>
              1. Gehen Sie zu <a href="https://aistudio.google.com/app/apikey" target="_blank">Google AI Studio</a><br>
              2. Klicken Sie auf "Create API Key"<br>
              3. Kopieren Sie den generierten Key hierher
            </p>
          </details>
        </div>

        <!-- Flavor Section -->
        <div class="settings-section">
          <h4>🎨 Standard-Stil</h4>
          <p class="settings-description">
            Wählen Sie den Standard-Stil für generierte Inhalte.
          </p>
          <select id="flavorSelect" class="settings-select">
            ${flavors.map(flavor => `
              <option value="${flavor.id}" ${settings.defaultFlavor === flavor.id ? 'selected' : ''}>
                ${flavor.name}
              </option>
            `).join('')}
          </select>
        </div>

        <!-- Theme Section -->
        <div class="settings-section">
          <h4>🌙 Design-Modus</h4>
          <div class="settings-radio-group">
            <label class="settings-radio">
              <input type="radio" name="theme" value="light" ${settings.theme === 'light' ? 'checked' : ''}>
              <span>☀️ Hell</span>
            </label>
            <label class="settings-radio">
              <input type="radio" name="theme" value="dark" ${settings.theme === 'dark' ? 'checked' : ''}>
              <span>🌙 Dunkel</span>
            </label>
            <label class="settings-radio">
              <input type="radio" name="theme" value="auto" ${settings.theme === 'auto' ? 'checked' : ''}>
              <span>🔄 Automatisch</span>
            </label>
          </div>
        </div>

        <!-- Language Section -->
        <div class="settings-section">
          <h4>🌍 Sprache</h4>
          <select id="languageSelect" class="settings-select">
            <option value="de" ${settings.language === 'de' ? 'selected' : ''}>🇩🇪 Deutsch</option>
            <option value="en" ${settings.language === 'en' ? 'selected' : ''}>🇺🇸 English</option>
          </select>
        </div>

        <!-- Export/Import Section -->
        <div class="settings-section">
          <h4>💾 Einstellungen verwalten</h4>
          <div class="settings-field-actions">
            <button type="button" id="exportSettings" class="btn btn--secondary">Export</button>
            <button type="button" id="importSettings" class="btn btn--secondary">Import</button>
          </div>
          <input type="file" id="importFile" accept=".json" style="display: none;">
        </div>
      </div>
    `;
  }

  /**
   * Event Listeners anhängen
   */
  private attachEventListeners(): void {
    if (!this.container) return;

    // Close button
    const closeBtn = this.container.querySelector('.settings-panel__close');
    closeBtn?.addEventListener('click', () => this.close());

    // API Key
    const saveApiKeyBtn = this.container.querySelector('#saveApiKey');
    const clearApiKeyBtn = this.container.querySelector('#clearApiKey');
    const apiKeyInput = this.container.querySelector('#apiKeyInput') as HTMLInputElement;

    saveApiKeyBtn?.addEventListener('click', () => {
      const apiKey = apiKeyInput.value.trim();
      if (apiKey) {
        const success = this.settingsManager.setApiKey(apiKey);
        this.showApiKeyStatus(success ? 'success' : 'error');
      }
    });

    clearApiKeyBtn?.addEventListener('click', () => {
      this.settingsManager.clearApiKey();
      if (apiKeyInput) apiKeyInput.value = '';
      this.showApiKeyStatus('cleared');
    });

    // Enter key for API Key
    apiKeyInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const saveBtn = saveApiKeyBtn as HTMLButtonElement;
        saveBtn?.click();
      }
    });

    // Flavor selection
    const flavorSelect = this.container.querySelector('#flavorSelect') as HTMLSelectElement;
    flavorSelect?.addEventListener('change', () => {
      this.settingsManager.setDefaultFlavor(flavorSelect.value as any);
    });

    // Theme selection
    const themeRadios = this.container.querySelectorAll('input[name="theme"]');
    themeRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        if (target.checked) {
          this.settingsManager.setTheme(target.value as any);
        }
      });
    });

    // Language selection
    const languageSelect = this.container.querySelector('#languageSelect') as HTMLSelectElement;
    languageSelect?.addEventListener('change', () => {
      this.settingsManager.setLanguage(languageSelect.value as any);
    });

    // Export/Import
    const exportBtn = this.container.querySelector('#exportSettings');
    const importBtn = this.container.querySelector('#importSettings');
    const importFile = this.container.querySelector('#importFile') as HTMLInputElement;

    exportBtn?.addEventListener('click', () => this.exportSettings());
    importBtn?.addEventListener('click', () => importFile?.click());
    importFile?.addEventListener('change', () => this.importSettings(importFile));
  }

  /**
   * API Key Status anzeigen
   */
  private showApiKeyStatus(type: 'success' | 'error' | 'cleared'): void {
    const status = this.container?.querySelector('#apiKeyStatus');
    if (!status) return;

    switch (type) {
      case 'success':
        status.textContent = '✅ API Key gespeichert';
        status.className = 'settings-status settings-status--success';
        break;
      case 'error':
        status.textContent = '❌ Ungültiger API Key';
        status.className = 'settings-status settings-status--error';
        break;
      case 'cleared':
        status.textContent = '⚠️ API Key gelöscht';
        status.className = 'settings-status settings-status--warning';
        break;
    }

    // Auto-hide nach 3 Sekunden
    setTimeout(() => {
      if (status) {
        status.className = 'settings-status';
      }
    }, 3000);
  }

  /**
   * Einstellungen exportieren
   */
  private exportSettings(): void {
    const settings = this.settingsManager.exportSettings();
    const blob = new Blob([settings], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `urlverse-settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Einstellungen importieren
   */
  private importSettings(fileInput: HTMLInputElement): void {
    const file = fileInput.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const success = this.settingsManager.importSettings(content);
        
        if (success) {
          this.updateUI();
          alert('Einstellungen erfolgreich importiert!');
        } else {
          alert('Fehler beim Importieren der Einstellungen.');
        }
      } catch {
        alert('Ungültige Datei format.');
      }
    };
    reader.readAsText(file);
    
    // Input zurücksetzen
    fileInput.value = '';
  }

  /**
   * UI bei Einstellungsänderungen aktualisieren
   */
  private onSettingsChange(_settings: UserSettings): void {
    this.updateUI();
  }

  /**
   * UI-Elemente mit aktuellen Einstellungen aktualisieren
   */
  private updateUI(): void {
    if (!this.container) return;
    
    const settings = this.settingsManager.getSettings();
    
    // API Key Status
    const apiKeyStatus = this.container.querySelector('#apiKeyStatus');
    if (apiKeyStatus) {
      apiKeyStatus.textContent = settings.apiKey ? '✅ API Key gesetzt' : '⚠️ Kein API Key gesetzt';
    }
  }

  /**
   * Panel öffnen
   */
  open(): void {
    if (this.container) {
      this.container.classList.add('settings-panel--open');
      this.isOpen = true;
    }
  }

  /**
   * Panel schließen
   */
  close(): void {
    if (this.container) {
      this.container.classList.remove('settings-panel--open');
      this.isOpen = false;
    }
  }

  /**
   * Toggle Panel
   */
  toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Zerstören und cleanup
   */
  destroy(): void {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
  }
}