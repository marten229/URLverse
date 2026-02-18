/**
 * Settings Panel Web Component.
 *
 * Implemented as a Custom Element with Shadow DOM for the same reason as
 * `NavigationMenu`: AI-generated page styles must not bleed into the settings
 * UI. The panel is a modal overlay that manages the API key, default flavor,
 * theme, and language preferences.
 */

import { SettingsManager } from '../utils/settings-manager';
import { getAllFlavors } from '../lib/prompt-flavors';
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
  }

  /**
   * Renders the full settings panel into the Shadow DOM. Called once on
   * connection; subsequent state changes are handled by targeted DOM mutations.
   */
  private render(): void {
    const settings = this.settingsManager.getSettings();
    const flavors = getAllFlavors();

    this.shadow.innerHTML = `
      <style>${settingsStyles}</style>
      <div class="settings-overlay"></div>
      <div class="settings-panel">
        <div class="settings-header">
          <h2 class="settings-title">⚙️ Einstellungen</h2>
          <button class="settings-close" type="button" aria-label="Einstellungen schließen">×</button>
        </div>
        
        <div class="settings-content">
          <!-- API Key -->
          <div class="settings-section">
            <h3 class="settings-section-title">🔑 Gemini API Key</h3>
            <div class="settings-field">
              <label class="settings-label" for="apiKeyInput">API Key</label>
              <div class="settings-input-group">
                <input 
                  type="password" 
                  id="apiKeyInput" 
                  class="settings-input" 
                  placeholder="AIza..."
                  value="${settings.apiKey ? '••••••••••••••••' : ''}"
                  autocomplete="off"
                />
                <button class="settings-btn settings-btn--secondary" id="toggleApiKeyVisibility" type="button">
                  👁️
                </button>
              </div>
              <div class="settings-hint">
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">
                  API Key bei Google AI Studio erstellen →
                </a>
              </div>
              <div class="settings-api-key-status" id="apiKeyStatus"></div>
            </div>
            <div class="settings-actions">
              <button class="settings-btn settings-btn--primary" id="saveApiKey" type="button">
                Speichern
              </button>
              <button class="settings-btn settings-btn--danger" id="clearApiKey" type="button">
                Löschen
              </button>
            </div>
          </div>
          
          <!-- Default Flavor -->
          <div class="settings-section">
            <h3 class="settings-section-title">🎨 Standard-Stil</h3>
            <div class="settings-field">
              <label class="settings-label" for="defaultFlavor">Bevorzugter Stil</label>
              <select id="defaultFlavor" class="settings-select">
                ${flavors.map(flavor => `
                  <option value="${flavor.id}" ${settings.defaultFlavor === flavor.id ? 'selected' : ''}>
                    ${flavor.name} - ${flavor.description}
                  </option>
                `).join('')}
              </select>
            </div>
          </div>
          
          <!-- Theme -->
          <div class="settings-section">
            <h3 class="settings-section-title">🌙 Design</h3>
            <div class="settings-field">
              <label class="settings-label" for="themeSelect">Farbschema</label>
              <select id="themeSelect" class="settings-select">
                <option value="auto" ${settings.theme === 'auto' ? 'selected' : ''}>Automatisch (System)</option>
                <option value="light" ${settings.theme === 'light' ? 'selected' : ''}>Hell</option>
                <option value="dark" ${settings.theme === 'dark' ? 'selected' : ''}>Dunkel</option>
              </select>
            </div>
          </div>
          
          <!-- Language -->
          <div class="settings-section">
            <h3 class="settings-section-title">🌍 Sprache</h3>
            <div class="settings-field">
              <label class="settings-label" for="languageSelect">Inhaltssprache</label>
              <select id="languageSelect" class="settings-select">
                <option value="de" ${settings.language === 'de' ? 'selected' : ''}>Deutsch</option>
                <option value="en" ${settings.language === 'en' ? 'selected' : ''}>English</option>
              </select>
            </div>
          </div>
        </div>
        
        <div class="settings-footer">
          <button class="settings-btn settings-btn--secondary" id="exportSettings" type="button">
            📤 Exportieren
          </button>
          <button class="settings-btn settings-btn--primary" id="saveAllSettings" type="button">
            ✓ Alle Einstellungen speichern
          </button>
        </div>
      </div>
    `;
  }

  private attachEventListeners(): void {
    const closeBtn = this.shadow.querySelector('.settings-close');
    const overlay = this.shadow.querySelector('.settings-overlay');
    closeBtn?.addEventListener('click', () => this.close());
    overlay?.addEventListener('click', () => this.close());

    // The Escape key listener must be on `document` because keyboard events
    // do not bubble out of Shadow DOM in all browsers.
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) this.close();
    });

    const apiKeyInput = this.shadow.querySelector('#apiKeyInput') as HTMLInputElement;
    const saveApiKeyBtn = this.shadow.querySelector('#saveApiKey');
    const clearApiKeyBtn = this.shadow.querySelector('#clearApiKey');
    const toggleVisibilityBtn = this.shadow.querySelector('#toggleApiKeyVisibility');

    // Clear the masked placeholder on first focus so the user can type a new
    // key without having to manually delete the bullet characters.
    apiKeyInput?.addEventListener('focus', () => {
      if (apiKeyInput.type === 'password' && apiKeyInput.value === '••••••••••••••••') {
        apiKeyInput.value = '';
      }
    });

    toggleVisibilityBtn?.addEventListener('click', () => {
      if (apiKeyInput) {
        apiKeyInput.type = apiKeyInput.type === 'password' ? 'text' : 'password';
      }
    });

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

    const defaultFlavorSelect = this.shadow.querySelector('#defaultFlavor') as HTMLSelectElement;
    defaultFlavorSelect?.addEventListener('change', () => {
      this.settingsManager.setDefaultFlavor(defaultFlavorSelect.value as any);
    });

    const themeSelect = this.shadow.querySelector('#themeSelect') as HTMLSelectElement;
    themeSelect?.addEventListener('change', () => {
      this.settingsManager.setTheme(themeSelect.value as any);
    });

    const languageSelect = this.shadow.querySelector('#languageSelect') as HTMLSelectElement;
    languageSelect?.addEventListener('change', () => {
      this.settingsManager.setLanguage(languageSelect.value as any);
    });

    const saveAllBtn = this.shadow.querySelector('#saveAllSettings');
    saveAllBtn?.addEventListener('click', () => {
      this.close();
    });

    const exportBtn = this.shadow.querySelector('#exportSettings');
    exportBtn?.addEventListener('click', () => {
      this.exportSettings();
    });
  }

  // --- Public API ---

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

  // --- Private helpers ---

  /**
   * Updates the API key status message element to reflect the outcome of a
   * save or clear operation.
   *
   * @param status - The outcome to display: `'success'`, `'error'`, or `'cleared'`.
   */
  private showApiKeyStatus(status: 'success' | 'error' | 'cleared'): void {
    const statusEl = this.shadow.querySelector('#apiKeyStatus');
    if (!statusEl) return;

    const messages = {
      success: { text: '✓ API Key erfolgreich gespeichert', className: 'settings-api-key-status--success' },
      error: { text: '✗ Ungültiges API Key Format', className: 'settings-api-key-status--error' },
      cleared: { text: 'API Key wurde gelöscht', className: 'settings-api-key-status--info' }
    };

    const { text, className } = messages[status];
    statusEl.textContent = text;
    statusEl.className = `settings-api-key-status ${className}`;

    // Auto-clear the status message after 3 seconds to avoid stale feedback.
    setTimeout(() => {
      statusEl.textContent = '';
      statusEl.className = 'settings-api-key-status';
    }, 3000);
  }

  /**
   * Triggers a browser download of the current settings as a JSON file.
   * The API key is replaced with `[HIDDEN]` by `SettingsManager.exportSettings`
   * before the file is generated.
   */
  private exportSettings(): void {
    const settingsJson = this.settingsManager.exportSettings();
    const blob = new Blob([settingsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'urlverse-settings.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Ensures the custom element is registered and a single instance exists in
   * the DOM, creating one if necessary.
   *
   * @returns The existing or newly created `SettingsUI` element.
   */
  static initialize(): SettingsUI {
    if (!customElements.get('urlverse-settings')) {
      customElements.define('urlverse-settings', SettingsUI);
    }

    let settings = document.querySelector('urlverse-settings') as SettingsUI;
    if (!settings) {
      settings = document.createElement('urlverse-settings') as SettingsUI;
      document.body.appendChild(settings);
    }
    return settings;
  }
}