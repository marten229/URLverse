/**
 * Settings UI Component
 * Web Component implementation with Shadow DOM for style isolation
 */

import { SettingsManager } from '../utils/settings-manager';
import { getAllFlavors } from '../lib/prompt-flavors';
import type { UserSettings } from '../types';

import settingsStyles from '../styles/components/settings.css?inline';

export class SettingsUI extends HTMLElement {
  private shadow: ShadowRoot;
  private settingsManager: SettingsManager;
  private isOpen = false;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.settingsManager = SettingsManager.getInstance();
  }

  connectedCallback() {
    this.render();
    this.attachEventListeners();

    this.settingsManager.addListener(this.onSettingsChange.bind(this));
    this.updateUI();
  }

  disconnectedCallback() {
    // Cleanup
  }

  private render(): void {
    const settings = this.settingsManager.getSettings();
    const flavors = getAllFlavors();

    this.shadow.innerHTML = `
      <style>${settingsStyles}</style>
      <div class="settings-overlay"></div>
      <div class="settings-panel">
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
      </div>
    `;
  }

  private attachEventListeners(): void {
    const closeBtn = this.shadow.querySelector('.settings-panel__close');
    const overlay = this.shadow.querySelector('.settings-overlay');

    closeBtn?.addEventListener('click', () => this.close());
    overlay?.addEventListener('click', () => this.close());

    // API Key
    const saveApiKeyBtn = this.shadow.querySelector('#saveApiKey');
    const clearApiKeyBtn = this.shadow.querySelector('#clearApiKey');
    const apiKeyInput = this.shadow.querySelector('#apiKeyInput') as HTMLInputElement;

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

    apiKeyInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        (saveApiKeyBtn as HTMLButtonElement)?.click();
      }
    });

    // Flavor selection
    const flavorSelect = this.shadow.querySelector('#flavorSelect') as HTMLSelectElement;
    flavorSelect?.addEventListener('change', () => {
      this.settingsManager.setDefaultFlavor(flavorSelect.value as any);
    });

    // Theme selection
    const themeRadios = this.shadow.querySelectorAll('input[name="theme"]');
    themeRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        if (target.checked) {
          this.settingsManager.setTheme(target.value as any);
        }
      });
    });

    // Language selection
    const languageSelect = this.shadow.querySelector('#languageSelect') as HTMLSelectElement;
    languageSelect?.addEventListener('change', () => {
      this.settingsManager.setLanguage(languageSelect.value as any);
    });

    // Export/Import
    const exportBtn = this.shadow.querySelector('#exportSettings');
    const importBtn = this.shadow.querySelector('#importSettings');
    const importFile = this.shadow.querySelector('#importFile') as HTMLInputElement;

    exportBtn?.addEventListener('click', () => this.exportSettings());
    importBtn?.addEventListener('click', () => importFile?.click());
    importFile?.addEventListener('change', () => this.importSettings(importFile));
  }

  private showApiKeyStatus(type: 'success' | 'error' | 'cleared'): void {
    const status = this.shadow.querySelector('#apiKeyStatus');
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

    setTimeout(() => {
      if (status) status.className = 'settings-status';
    }, 3000);
  }

  private exportSettings(): void {
    const settings = this.settingsManager.exportSettings();
    const blob = new Blob([settings], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `urlverse-settings-${new Date().toISOString().split('T')[0]}.json`;
    this.shadow.appendChild(a); // Append to shadow to key it somewhat contained
    a.click();
    this.shadow.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private importSettings(fileInput: HTMLInputElement): void {
    const file = fileInput.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const success = this.settingsManager.importSettings(content);
        if (success) {
          alert('Einstellungen erfolgreich importiert!');
        } else {
          alert('Fehler beim Importieren der Einstellungen.');
        }
      } catch {
        alert('Ungültige Datei format.');
      }
    };
    reader.readAsText(file);
    fileInput.value = '';
  }

  private onSettingsChange(_settings: UserSettings): void {
    this.updateUI();
  }

  private updateUI(): void {
    const settings = this.settingsManager.getSettings();
    const apiKeyStatus = this.shadow.querySelector('#apiKeyStatus');
    if (apiKeyStatus) {
      apiKeyStatus.textContent = settings.apiKey ? '✅ API Key gesetzt' : '⚠️ Kein API Key gesetzt';
    }

    // Update other inputs if needed to reflect external changes
    const apiKeyInput = this.shadow.querySelector('#apiKeyInput') as HTMLInputElement;
    if (apiKeyInput && document.activeElement !== apiKeyInput) {
      apiKeyInput.value = settings.apiKey || '';
    }
  }

  open(): void {
    const panel = this.shadow.querySelector('.settings-panel');
    const overlay = this.shadow.querySelector('.settings-overlay');
    if (panel && overlay) {
      panel.classList.add('settings-panel--open');
      overlay.classList.add('settings-overlay--open');
      this.isOpen = true;
    }
  }

  close(): void {
    const panel = this.shadow.querySelector('.settings-panel');
    const overlay = this.shadow.querySelector('.settings-overlay');
    if (panel && overlay) {
      panel.classList.remove('settings-panel--open');
      overlay.classList.remove('settings-overlay--open');
      this.isOpen = false;
    }
  }

  toggle(): void {
    this.isOpen ? this.close() : this.open();
  }

  static initialize(): SettingsUI {
    let settings = document.querySelector('urlverse-settings') as SettingsUI;
    if (!settings) {
      settings = document.createElement('urlverse-settings') as SettingsUI;
      document.body.appendChild(settings);
    }
    return settings;
  }

  // Backwards compatibility method
  create(): SettingsUI {
    return SettingsUI.initialize();
  }

  destroy(): void {
    this.remove();
  }
}

// Register Custom Element
if (!customElements.get('urlverse-settings')) {
  customElements.define('urlverse-settings', SettingsUI);
}