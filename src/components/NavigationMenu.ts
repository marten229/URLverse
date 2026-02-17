/**
 * Navigation Menu Component
 * Web Component implementation with Shadow DOM for style isolation
 */

import { SettingsUI } from './SettingsUI';
import { SettingsManager } from '../utils/settings-manager';
import { getAllFlavors } from '../lib/prompt-flavors';
import navigationStyles from '../styles/components/navigation.css?inline';
import type { NavigationConfig } from '../types';

export class NavigationMenu extends HTMLElement {
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

    // Listen for settings changes to update UI
    this.settingsManager.addListener(() => {
      this.updateStatusIndicator();
    });
  }

  disconnectedCallback() {
    // Cleanup if needed
  }

  /**
   * Initializes and renders the component
   */
  private render(): void {
    const flavors = getAllFlavors();
    const currentPath = window.location.pathname;
    const settings = this.settingsManager.getSettings();

    // Injects styles and HTML structure
    this.shadow.innerHTML = `
      <style>${navigationStyles}</style>
      <div class="nav-menu">
        ${this.getTouchAreaHTML()}
        ${this.getToggleButtonHTML()}
        ${this.getOverlayHTML()}
        ${this.getPanelHTML(flavors, currentPath, settings)}
      </div>
    `;
  }

  // --- HTML Templates ---

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

  // --- Event Handling ---

  private attachEventListeners(): void {
    // Note: We search within this.shadow, not the document
    const container = this.shadow.querySelector('.nav-menu');
    if (!container) return;

    const toggleBtn = this.shadow.querySelector('.nav-menu__toggle');
    const touchArea = this.shadow.querySelector('.nav-menu__touch-area');
    const closeBtn = this.shadow.querySelector('.nav-menu__close');
    const overlay = this.shadow.querySelector('.nav-menu__overlay');

    toggleBtn?.addEventListener('click', () => this.toggle());
    touchArea?.addEventListener('click', () => this.toggle());
    closeBtn?.addEventListener('click', () => this.close());
    overlay?.addEventListener('click', () => this.close());

    this.shadow.querySelector('#openSettings')?.addEventListener('click', () => {
      this.openSettings();
    });

    // Flavor Buttons - using delegation or direct attachment
    const flavorButtons = this.shadow.querySelectorAll('.nav-menu__flavor-btn');
    flavorButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const flavorId = btn.getAttribute('data-flavor');
        if (flavorId) this.changeFlavor(flavorId);
      });
    });

    // Quick Actions
    this.shadow.querySelector('#randomPage')?.addEventListener('click', () => this.generateRandomPage());
    this.shadow.querySelector('#shareUrl')?.addEventListener('click', () => this.shareCurrentUrl());
    this.shadow.querySelector('#reloadWithFlavor')?.addEventListener('click', () => this.reloadWithCurrentFlavor());

    // Keyboard Navigation (Global listener is needed for Escape key)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }

  // --- Public Methods ---

  open(): void {
    const container = this.shadow.querySelector('.nav-menu');
    if (container) {
      container.classList.add('nav-menu--open');
      this.isOpen = true;
      this.shadow.querySelector('.nav-menu__toggle')?.setAttribute('aria-expanded', 'true');
      (this.shadow.querySelector('.nav-menu__close') as HTMLElement)?.focus();
    }
  }

  close(): void {
    const container = this.shadow.querySelector('.nav-menu');
    if (container) {
      container.classList.remove('nav-menu--open');
      this.isOpen = false;
      this.shadow.querySelector('.nav-menu__toggle')?.setAttribute('aria-expanded', 'false');
    }
  }

  toggle(): void {
    this.isOpen ? this.close() : this.open();
  }

  openSettings(): void {
    const settings = SettingsUI.initialize();
    settings.open();
    this.close();
  }

  // --- Logic Methods (Preserved) ---

  private changeFlavor(flavorId: string): void {
    this.settingsManager.setDefaultFlavor(flavorId as any);
    const url = new URL(window.location.href);
    url.searchParams.set('flavor', flavorId);
    window.location.href = url.toString();
  }

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
      // Ignore abort errors
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Share error:', error);
        await this.copyUrlToClipboard(url);
      }
    }
  }

  private async copyUrlToClipboard(url: string): Promise<void> {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
        this.showNotification('URL in Zwischenablage kopiert!', 'success');
      } else {
        this.fallbackCopyToClipboard(url);
      }
    } catch (error) {
      console.error('Copy error:', error);
      this.showNotification('Fehler beim Kopieren', 'error');
    }
  }

  private fallbackCopyToClipboard(url: string): void {
    const textArea = document.createElement('textarea');
    textArea.value = url;
    textArea.style.position = 'fixed'; // Avoid scrolling to bottom
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      const successful = document.execCommand('copy');
      if (successful) this.showNotification('URL in Zwischenablage kopiert!', 'success');
      else this.showNotification('Kopieren fehlgeschlagen', 'error');
    } catch (err) {
      this.showNotification('Kopieren fehlgeschlagen', 'error');
    }
    document.body.removeChild(textArea);
  }

  private reloadWithCurrentFlavor(): void {
    const settings = this.settingsManager.getSettings();
    const url = new URL(window.location.href);
    url.searchParams.set('flavor', settings.defaultFlavor);
    url.searchParams.set('refresh', Date.now().toString());
    window.location.href = url.toString();
  }

  private updateStatusIndicator(): void {
    const container = this.shadow.querySelector('.nav-menu');
    if (!container) return;
    const settings = this.settingsManager.getSettings();
    const statusElement = this.shadow.querySelector('.nav-menu__status');
    if (statusElement) {
      statusElement.innerHTML = settings.apiKey
        ? '<span class="nav-menu__status-indicator nav-menu__status-indicator--success">🟢</span> API Key aktiv'
        : '<span class="nav-menu__status-indicator nav-menu__status-indicator--error">🔴</span> Kein API Key';
    }
  }

  private showNotification(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
    const notification = document.createElement('div');
    notification.className = `nav-menu__notification nav-menu__notification--${type}`;
    notification.textContent = message;

    // Notifications are appended to Shadow DOM to benefit from isolated styles
    this.shadow.appendChild(notification);

    requestAnimationFrame(() => {
      notification.classList.add('nav-menu__notification--show');
    });

    const timeout = setTimeout(() => {
      this.removeNotification(notification);
    }, 3000);

    notification.addEventListener('click', () => {
      clearTimeout(timeout);
      this.removeNotification(notification);
    });
  }

  private removeNotification(notification: HTMLElement): void {
    notification.classList.remove('nav-menu__notification--show');
    setTimeout(() => {
      if (notification.parentNode) notification.parentNode.removeChild(notification);
    }, 300);
  }

  /**
   * Static Factory Method for compatibility
   */
  static initialize(_config: NavigationConfig = {}): NavigationMenu {
    // Check if already defined
    if (!customElements.get('urlverse-nav')) {
      customElements.define('urlverse-nav', NavigationMenu);
    }

    // Check if already exists in DOM
    let menu = document.querySelector('urlverse-nav') as NavigationMenu;
    if (!menu) {
      menu = document.createElement('urlverse-nav') as NavigationMenu;
      document.body.appendChild(menu);
    }
    return menu;
  }

  destroy(): void {
    this.remove();
  }
}