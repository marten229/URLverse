/**
 * Navigation Menu Component
 * Erstellt ein aufklappbares Hamburger-Menü für generierte Seiten
 */

import { SettingsUI } from './SettingsUI';
import { SettingsManager } from '../utils/settings-manager';
import { getAllFlavors } from '../lib/prompt-flavors';
import { navigationStyles } from './NavigationMenu.styles';
import type { NavigationConfig } from '../types';

export class NavigationMenu {
  private container: HTMLElement | null = null;
  private host: HTMLElement | null = null;
  private shadow: ShadowRoot | null = null;
  private readonly settingsUI: SettingsUI;
  private readonly settingsManager: SettingsManager;
  private isOpen = false;

  constructor(_config: NavigationConfig = {}) {
    this.settingsUI = new SettingsUI();
    this.settingsManager = SettingsManager.getInstance();
  }

  /**
   * Erstellt das Navigationsmenü und fügt es zur Seite hinzu
   * Uses Shadow DOM for style isolation
   */
  create(): HTMLElement {
    // 1. Create Host Element
    this.host = document.createElement('div');
    this.host.id = 'urlverse-nav-host';
    this.host.style.position = 'fixed';
    this.host.style.zIndex = '1000'; // Ensure host is on top

    // 2. Attach Shadow Root
    this.shadow = this.host.attachShadow({ mode: 'open' });

    // 3. Inject Styles
    const styleSheet = document.createElement('style');
    styleSheet.textContent = navigationStyles;
    this.shadow.appendChild(styleSheet);

    // 4. Create Container (Internal)
    this.container = document.createElement('div');
    this.container.className = 'nav-menu';
    this.container.innerHTML = this.getMenuHTML();

    // 5. Append Container to Shadow Root
    this.shadow.appendChild(this.container);

    this.attachEventListeners();
    return this.host;
  }

  /**
   * HTML-Template für das Navigationsmenü
   */
  private getMenuHTML(): string {
    const flavors = getAllFlavors();
    const currentPath = window.location.pathname;
    const settings = this.settingsManager.getSettings();

    return `
      ${this.getTouchAreaHTML()}
      ${this.getToggleButtonHTML()}
      ${this.getOverlayHTML()}
      ${this.getPanelHTML(flavors, currentPath, settings)}
    `;
  }

  private getTouchAreaHTML(): string {
    return '<div class="nav-menu__touch-area"></div>';
  }

  private getToggleButtonHTML(): string {
    return `
      <button class="nav-menu__toggle" type="button" aria-label="Menü öffnen" aria-expanded="false">
        <span class="nav-menu__hamburger">
          <span></span>
          <span></span>
          <span></span>
        </span>
      </button>
    `;
  }

  private getOverlayHTML(): string {
    return '<div class="nav-menu__overlay"></div>';
  }

  private getPanelHTML(flavors: any[], currentPath: string, settings: any): string {
    return `
      <div class="nav-menu__panel">
        ${this.getHeaderHTML()}
        ${this.getContentHTML(flavors, currentPath, settings)}
      </div>
    `;
  }

  private getHeaderHTML(): string {
    return `
      <div class="nav-menu__header">
        <div class="nav-menu__logo">
          <span class="nav-menu__logo-icon">🌐</span>
          <span class="nav-menu__logo-text">URLverse</span>
        </div>
        <button class="nav-menu__close" type="button" aria-label="Menü schließen">×</button>
      </div>
    `;
  }

  private getContentHTML(flavors: any[], currentPath: string, settings: any): string {
    return `
      <div class="nav-menu__content">
        ${this.getStatusHTML(settings)}
        ${this.getNavigationHTML(currentPath)}
        ${this.getFlavorSectionHTML(flavors, settings)}
        ${this.getSettingsHTML()}
        ${this.getQuickActionsHTML()}
        ${this.getFooterHTML(currentPath)}
      </div>
    `;
  }

  private getStatusHTML(settings: any): string {
    const hasApiKey = settings.apiKey;
    return `
      <div class="nav-menu__status">
        ${hasApiKey
        ? '<span class="nav-menu__status-indicator nav-menu__status-indicator--success">🟢</span> API Key aktiv'
        : '<span class="nav-menu__status-indicator nav-menu__status-indicator--error">🔴</span> Kein API Key'
      }
      </div>
    `;
  }

  private getNavigationHTML(currentPath: string): string {
    return `
      <nav class="nav-menu__nav">
        <a href="/" class="nav-menu__link ${currentPath === '/' ? 'nav-menu__link--active' : ''}">
          <span class="nav-menu__link-icon">🏠</span>
          <span class="nav-menu__link-text">Startseite</span>
        </a>
        <a href="/flavor" class="nav-menu__link ${currentPath === '/flavor' || currentPath === '/admin' ? 'nav-menu__link--active' : ''}">
          <span class="nav-menu__link-icon">🎨</span>
          <span class="nav-menu__link-text">Stil auswählen</span>
        </a>
      </nav>
    `;
  }

  private getFlavorSectionHTML(flavors: any[], settings: any): string {
    return `
      <div class="nav-menu__section">
        <h4 class="nav-menu__section-title">🎨 Schneller Stilwechsel</h4>
        <div class="nav-menu__flavor-grid">
          ${flavors.map(flavor => `
            <button 
              class="nav-menu__flavor-btn ${settings.defaultFlavor === flavor.id ? 'nav-menu__flavor-btn--active' : ''}"
              data-flavor="${flavor.id}"
              title="${flavor.description}"
            >
              <span class="nav-menu__flavor-name">${flavor.name}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  private getSettingsHTML(): string {
    return `
      <div class="nav-menu__section">
        <button class="nav-menu__action-btn" id="openSettings">
          <span class="nav-menu__action-icon">⚙️</span>
          <span class="nav-menu__action-text">Einstellungen</span>
        </button>
      </div>
    `;
  }

  private getQuickActionsHTML(): string {
    return `
      <div class="nav-menu__section">
        <h4 class="nav-menu__section-title">⚡ Schnellaktionen</h4>
        <div class="nav-menu__actions">
          <button class="nav-menu__action-btn" id="randomPage">
            <span class="nav-menu__action-icon">🎲</span>
            <span class="nav-menu__action-text">Zufällige Seite</span>
          </button>
          <button class="nav-menu__action-btn" id="shareUrl">
            <span class="nav-menu__action-icon">📤</span>
            <span class="nav-menu__action-text">URL teilen</span>
          </button>
          <button class="nav-menu__action-btn" id="reloadWithFlavor">
            <span class="nav-menu__action-icon">🔄</span>
            <span class="nav-menu__action-text">Neu generieren</span>
          </button>
        </div>
      </div>
    `;
  }

  private getFooterHTML(currentPath: string): string {
    return `
      <div class="nav-menu__footer">
        <div class="nav-menu__version">URLverse v1.0</div>
        <div class="nav-menu__current-url" title="Aktuelle URL">${currentPath}</div>
      </div>
    `;
  }

  /**
   * Event Listeners anhängen
   */
  private attachEventListeners(): void {
    if (!this.container) return;

    // Toggle Button und Touch Area
    const toggleBtn = this.container.querySelector('.nav-menu__toggle');
    const touchArea = this.container.querySelector('.nav-menu__touch-area');
    const closeBtn = this.container.querySelector('.nav-menu__close');
    const overlay = this.container.querySelector('.nav-menu__overlay');

    toggleBtn?.addEventListener('click', () => this.toggle());
    touchArea?.addEventListener('click', () => this.toggle());
    closeBtn?.addEventListener('click', () => this.close());
    overlay?.addEventListener('click', () => this.close());

    // Settings Button
    const settingsBtn = this.container.querySelector('#openSettings');
    settingsBtn?.addEventListener('click', () => {
      this.openSettings();
    });

    // Flavor Buttons
    const flavorButtons = this.container.querySelectorAll('.nav-menu__flavor-btn');
    flavorButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const flavorId = btn.getAttribute('data-flavor');
        if (flavorId) {
          this.changeFlavor(flavorId);
        }
      });
    });

    // Quick Actions
    const randomPageBtn = this.container.querySelector('#randomPage');
    const shareUrlBtn = this.container.querySelector('#shareUrl');
    const reloadBtn = this.container.querySelector('#reloadWithFlavor');

    randomPageBtn?.addEventListener('click', () => this.generateRandomPage());
    shareUrlBtn?.addEventListener('click', () => this.shareCurrentUrl());
    reloadBtn?.addEventListener('click', () => this.reloadWithCurrentFlavor());

    // Keyboard Navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    // Settings Manager Updates
    this.settingsManager.addListener(() => {
      this.updateStatusIndicator();
    });
  }

  /**
   * Menü öffnen
   */
  open(): void {
    if (this.container) {
      this.container.classList.add('nav-menu--open');
      this.isOpen = true;

      const toggleBtn = this.container.querySelector('.nav-menu__toggle');
      toggleBtn?.setAttribute('aria-expanded', 'true');

      // Focus management
      const closeBtn = this.container.querySelector('.nav-menu__close') as HTMLElement;
      closeBtn?.focus();
    }
  }

  /**
   * Menü schließen
   */
  close(): void {
    if (this.container) {
      this.container.classList.remove('nav-menu--open');
      this.isOpen = false;

      const toggleBtn = this.container.querySelector('.nav-menu__toggle');
      toggleBtn?.setAttribute('aria-expanded', 'false');
    }
  }

  /**
   * Menü togglen
   */
  toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Einstellungen öffnen
   */
  public openSettings(): void {
    // Settings Panel zur Seite hinzufügen falls noch nicht vorhanden
    let settingsPanel = document.querySelector('.settings-panel');
    if (!settingsPanel) {
      settingsPanel = this.settingsUI.create();
      document.body.appendChild(settingsPanel);
    }

    this.settingsUI.open();
    this.close(); // Navigation menü schließen
  }

  /**
   * Flavor wechseln und Seite neu laden
   */
  private changeFlavor(flavorId: string): void {
    this.settingsManager.setDefaultFlavor(flavorId as any);

    // URL mit neuem Flavor-Parameter neu laden
    const url = new URL(window.location.href);
    url.searchParams.set('flavor', flavorId);
    window.location.href = url.toString();
  }

  /**
   * Zufällige Seite generieren
   */
  private generateRandomPage(): void {
    const randomPaths = [
      '/blog/ki-revolution-2025',
      '/shop/zeitreise-gadgets',
      '/unternehmen/quantum-solutions',
      '/medizin/nano-chirurgie',
      '/forum/diskussion/virtual-reality',
      '/dating/für-mikroben',
      '/reisen/mars-kolonien',
      '/essen/molekulare-gastronomie',
      '/sport/anti-schwerkraft-olympiade',
      '/musik/frequenz-meditation',
      '/gaming/bewusstsein-simulation',
      '/wissenschaft/parallel-universum-forschung'
    ];

    const randomPath = randomPaths[Math.floor(Math.random() * randomPaths.length)];
    window.location.href = randomPath;
  }

  /**
   * Aktuelle URL teilen
   */
  private async shareCurrentUrl(): Promise<void> {
    const url = window.location.href;
    const title = document.title || 'URLverse - Generierte Seite';

    try {
      if (navigator.share && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        await navigator.share({ title, url });
        this.showNotification('URL geteilt!', 'success');
      } else {
        await this.copyUrlToClipboard(url);
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Fehler beim Teilen:', error);
        await this.copyUrlToClipboard(url);
      }
    }
  }

  /**
   * URL in Zwischenablage kopieren
   */
  private async copyUrlToClipboard(url: string): Promise<void> {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
        this.showNotification('URL in Zwischenablage kopiert!', 'success');
      } else {
        // Fallback für ältere Browser oder unsichere Kontexte
        this.fallbackCopyToClipboard(url);
      }
    } catch (error) {
      console.error('Fehler beim Kopieren:', error);
      this.showNotification('Fehler beim Kopieren der URL', 'error');
    }
  }

  /**
   * Fallback für Copy-to-Clipboard
   */
  private fallbackCopyToClipboard(url: string): void {
    const textArea = document.createElement('textarea');
    textArea.value = url;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    textArea.style.pointerEvents = 'none';

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      if (successful) {
        this.showNotification('URL in Zwischenablage kopiert!', 'success');
      } else {
        throw new Error('Copy command failed');
      }
    } catch (error) {
      console.error('Fallback copy failed:', error);
      this.showNotification('Kopieren fehlgeschlagen', 'error');
    } finally {
      document.body.removeChild(textArea);
    }
  }

  /**
   * Seite mit aktuellem Flavor neu laden
   */
  private reloadWithCurrentFlavor(): void {
    const settings = this.settingsManager.getSettings();
    const url = new URL(window.location.href);
    url.searchParams.set('flavor', settings.defaultFlavor);
    url.searchParams.set('refresh', Date.now().toString());
    window.location.href = url.toString();
  }

  /**
   * Status-Indikator aktualisieren
   */
  private updateStatusIndicator(): void {
    if (!this.container) return;

    const settings = this.settingsManager.getSettings();
    const statusElement = this.container.querySelector('.nav-menu__status');

    if (statusElement) {
      statusElement.innerHTML = settings.apiKey
        ? '<span class="nav-menu__status-indicator nav-menu__status-indicator--success">🟢</span> API Key aktiv'
        : '<span class="nav-menu__status-indicator nav-menu__status-indicator--error">🔴</span> Kein API Key';
    }
  }

  /**
   * Notification anzeigen mit erweiterten Optionen
   */
  private showNotification(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
    const notification = document.createElement('div');
    notification.className = `nav-menu__notification nav-menu__notification--${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Animation und Auto-remove
    requestAnimationFrame(() => {
      notification.classList.add('nav-menu__notification--show');
    });

    const timeout = setTimeout(() => {
      this.removeNotification(notification);
    }, this.getNotificationDuration(type));

    // Click to dismiss
    notification.addEventListener('click', () => {
      clearTimeout(timeout);
      this.removeNotification(notification);
    });
  }

  /**
   * Notification entfernen
   */
  private removeNotification(notification: HTMLElement): void {
    notification.classList.remove('nav-menu__notification--show');
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 300);
  }

  /**
   * Ermittelt die Anzeigedauer basierend auf dem Typ
   */
  private getNotificationDuration(type: string): number {
    switch (type) {
      case 'error': return 5000;
      case 'warning': return 4000;
      case 'success': return 3000;
      default: return 2000;
    }
  }

  /**
   * Menü initialisieren und zur Seite hinzufügen
   */
  static initialize(): NavigationMenu {
    const navMenu = new NavigationMenu();
    const menuElement = navMenu.create();
    document.body.appendChild(menuElement);
    return navMenu;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.host && this.host.parentNode) {
      this.host.parentNode.removeChild(this.host);
    }
    this.settingsUI.destroy();
  }
}