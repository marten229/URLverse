/**
 * Navigation Initializer
 * Lädt das Navigationsmenü automatisch auf generierten Seiten
 */

import { NavigationMenu } from '../components/NavigationMenu';
import { SettingsManager } from '../utils/settings-manager';

class NavigationInitializer {
  private static instance: NavigationInitializer;
  private navigationMenu: NavigationMenu | null = null;
  private settingsManager: SettingsManager;

  private constructor() {
    this.settingsManager = SettingsManager.getInstance();
    this.init();
  }

  static getInstance(): NavigationInitializer {
    if (!NavigationInitializer.instance) {
      NavigationInitializer.instance = new NavigationInitializer();
    }
    return NavigationInitializer.instance;
  }

  /**
   * Initialisiert das Navigation System
   */
  private init(): void {
    // Warten bis DOM geladen ist
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupNavigation());
    } else {
      this.setupNavigation();
    }
  }

  /**
   * Setup Navigation basierend auf der aktuellen Seite
   */
  private setupNavigation(): void {
    const currentPath = window.location.pathname;
    
    // Nur auf generierten Seiten (nicht Homepage oder Admin)
    if (this.shouldShowNavigation(currentPath)) {
      this.createNavigation();
      this.checkApiKeyStatus();
    }
  }

  /**
   * Prüft ob Navigation auf dieser Seite gezeigt werden soll
   */
  private shouldShowNavigation(path: string): boolean {
    // Navigation auf Homepage und Admin-Seite ausblenden
    const excludePaths = ['/', '/flavor', '/admin'];
    return !excludePaths.includes(path);
  }

  /**
   * Erstellt das Navigationsmenü
   */
  private createNavigation(): void {
    if (this.navigationMenu) {
      return; // Bereits erstellt
    }

    try {
      this.navigationMenu = NavigationMenu.initialize();
      this.addKeyboardShortcuts();
    } catch (error) {
      console.error('Fehler beim Erstellen des Navigationsmenüs:', error);
    }
  }

  /**
   * Prüft API Key Status und zeigt Warnung bei Bedarf
   */
  private checkApiKeyStatus(): void {
    const hasApiKey = this.settingsManager.hasValidApiKey();
    
    if (!hasApiKey) {
      this.showApiKeyWarning();
    }
  }

  /**
   * Zeigt eine Warnung wenn kein API Key gesetzt ist
   */
  private showApiKeyWarning(): void {
    // Nur anzeigen wenn noch nicht angezeigt wurde (Session Storage)
    if (sessionStorage.getItem('apiKeyWarningShown')) {
      return;
    }

    const warning = document.createElement('div');
    warning.className = 'api-key-warning';
    warning.innerHTML = `
      <div class="api-key-warning__content">
        <div class="api-key-warning__icon">⚠️</div>
        <div class="api-key-warning__message">
          <strong>Kein API Key gesetzt</strong><br>
          Für die Generierung neuer Inhalte benötigen Sie einen Gemini API Key.
        </div>
        <div class="api-key-warning__actions">
          <button class="api-key-warning__btn api-key-warning__btn--primary" id="openSettingsFromWarning">
            Einstellungen öffnen
          </button>
          <button class="api-key-warning__btn api-key-warning__btn--secondary" id="dismissWarning">
            Später
          </button>
        </div>
      </div>
    `;

    // Styling für die Warnung
    const style = document.createElement('style');
    style.textContent = `
      .api-key-warning {
        position: fixed;
        top: 70px; /* Unter dem sichtbaren Notch */
        left: 50%;
        transform: translateX(-50%);
        background: #fff3cd;
        border: 1px solid #ffeaa7;
        border-radius: 15px;
        padding: 1rem;
        z-index: 998; /* Unter dem Notch aber über dem Rest */
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        max-width: 400px;
        width: 90%;
        animation: slideDown 0.5s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      @keyframes slideDown {
        from { 
          transform: translateX(-50%) translateY(-20px); 
          opacity: 0; 
          scale: 0.95;
        }
        to { 
          transform: translateX(-50%) translateY(0); 
          opacity: 1; 
          scale: 1;
        }
      }
      
      .api-key-warning__content {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
      }
      
      .api-key-warning__icon {
        font-size: 1.5rem;
        flex-shrink: 0;
      }
      
      .api-key-warning__message {
        flex: 1;
        font-size: 0.9rem;
        line-height: 1.4;
      }
      
      .api-key-warning__actions {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        flex-shrink: 0;
      }
      
      .api-key-warning__btn {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 6px;
        font-size: 0.8rem;
        cursor: pointer;
        transition: all 0.2s ease;
        min-width: 100px;
      }
      
      .api-key-warning__btn--primary {
        background: #667eea;
        color: white;
      }
      
      .api-key-warning__btn--primary:hover {
        background: #5a6fd8;
      }
      
      .api-key-warning__btn--secondary {
        background: transparent;
        color: #856404;
        border: 1px solid #d6d8db;
      }
      
      .api-key-warning__btn--secondary:hover {
        background: #e9ecef;
      }
      
      @media (max-width: 768px) {
        .api-key-warning {
          top: 60px;
          left: 1rem;
          right: 1rem;
          transform: none;
          max-width: none;
          width: auto;
          border-radius: 12px;
        }
        
        .api-key-warning__content {
          flex-direction: column;
          text-align: center;
        }
        
        .api-key-warning__actions {
          flex-direction: row;
          justify-content: center;
        }
        
        @keyframes slideDown {
          from { 
            transform: translateY(-20px); 
            opacity: 0; 
            scale: 0.95;
          }
          to { 
            transform: translateY(0); 
            opacity: 1; 
            scale: 1;
          }
        }
      }
      
      @media (max-width: 480px) {
        .api-key-warning {
          top: 55px;
        }
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(warning);

    // Event Listeners
    const openSettingsBtn = warning.querySelector('#openSettingsFromWarning');
    const dismissBtn = warning.querySelector('#dismissWarning');

    openSettingsBtn?.addEventListener('click', () => {
      this.navigationMenu?.toggle();
      setTimeout(() => {
        const settingsBtn = document.querySelector('#openSettings') as HTMLElement;
        settingsBtn?.click();
      }, 100);
      this.removeWarning(warning);
    });

    dismissBtn?.addEventListener('click', () => {
      this.removeWarning(warning);
    });

    // Auto-dismiss nach 10 Sekunden
    setTimeout(() => {
      if (document.body.contains(warning)) {
        this.removeWarning(warning);
      }
    }, 10000);
  }

  /**
   * Entfernt die API Key Warnung
   */
  private removeWarning(warning: HTMLElement): void {
    warning.style.animation = 'slideUp 0.3s ease forwards';
    setTimeout(() => {
      if (document.body.contains(warning)) {
        document.body.removeChild(warning);
      }
    }, 300);
    
    sessionStorage.setItem('apiKeyWarningShown', 'true');
  }

  /**
   * Fügt Keyboard Shortcuts hinzu
   */
  private addKeyboardShortcuts(): void {
    document.addEventListener('keydown', (e) => {
      // Nur wenn kein Input Element fokussiert ist
      if (document.activeElement?.tagName.toLowerCase() === 'input' ||
          document.activeElement?.tagName.toLowerCase() === 'textarea') {
        return;
      }

      switch (e.key) {
        case 'm':
        case 'M':
          e.preventDefault();
          this.navigationMenu?.toggle();
          break;
        
        case ',':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            this.openSettingsDirectly();
          }
          break;
        
        case 'h':
        case 'H':
          e.preventDefault();
          window.location.href = '/';
          break;
        
        case 'r':
        case 'R':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            this.reloadWithCurrentSettings();
          }
          break;
      }
    });
  }

  /**
   * Öffnet Einstellungen direkt
   */
  private openSettingsDirectly(): void {
    if (!this.navigationMenu) {
      this.createNavigation();
    }
    
    // Settings Panel erstellen und öffnen
    const settingsBtn = document.querySelector('#openSettings') as HTMLElement;
    settingsBtn?.click();
  }

  /**
   * Lädt Seite mit aktuellen Einstellungen neu
   */
  private reloadWithCurrentSettings(): void {
    const settings = this.settingsManager.getSettings();
    const url = new URL(window.location.href);
    url.searchParams.set('flavor', settings.defaultFlavor);
    url.searchParams.set('refresh', Date.now().toString());
    window.location.href = url.toString();
  }

  /**
   * Cleanup beim Verlassen der Seite
   */
  destroy(): void {
    if (this.navigationMenu) {
      this.navigationMenu.destroy();
      this.navigationMenu = null;
    }
  }
}

// Auto-initialize
NavigationInitializer.getInstance();

// Global Access für Debugging
(window as any).NavigationInitializer = NavigationInitializer;