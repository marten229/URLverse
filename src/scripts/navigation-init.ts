/**
 * Navigation system initialiser for AI-generated pages.
 *
 * This module auto-initialises the navigation menu on all generated pages
 * (i.e. any path that is not the homepage, flavor selector, or admin panel).
 * It also registers keyboard shortcuts and shows a one-time API key warning
 * to guide users who have not yet configured their key.
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

  /**
   * Returns the singleton `NavigationInitializer` instance, creating it on
   * first access. The singleton pattern ensures the navigation menu and its
   * keyboard shortcuts are registered exactly once per page load.
   */
  static getInstance(): NavigationInitializer {
    if (!NavigationInitializer.instance) {
      NavigationInitializer.instance = new NavigationInitializer();
    }
    return NavigationInitializer.instance;
  }

  /**
   * Defers navigation setup until the DOM is ready to avoid querying elements
   * before they exist in the document.
   */
  private init(): void {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupNavigation());
    } else {
      this.setupNavigation();
    }
  }

  /**
   * Conditionally creates the navigation menu based on the current path.
   * The menu is intentionally suppressed on the homepage and admin pages
   * because those pages have their own dedicated navigation UI.
   */
  private setupNavigation(): void {
    const currentPath = window.location.pathname;

    if (this.shouldShowNavigation(currentPath)) {
      this.createNavigation();
      this.checkApiKeyStatus();
    }
  }

  /**
   * Determines whether the navigation menu should be shown on the given path.
   * Excluded paths have their own navigation or do not benefit from the menu.
   *
   * @param path - The current `window.location.pathname`.
   * @returns `true` if the navigation menu should be rendered.
   */
  private shouldShowNavigation(path: string): boolean {
    const excludePaths = ['/', '/flavor', '/admin'];
    return !excludePaths.includes(path);
  }

  /**
   * Creates and registers the navigation menu Web Component. Guards against
   * double-initialisation in case this method is called more than once.
   */
  private createNavigation(): void {
    if (this.navigationMenu) {
      return;
    }

    try {
      this.navigationMenu = NavigationMenu.initialize();
      this.addKeyboardShortcuts();
    } catch (error) {
      console.error('Failed to create navigation menu:', error);
    }
  }

  /**
   * Shows a one-time API key warning banner if no valid key is configured.
   * The warning is suppressed for the remainder of the session once dismissed
   * to avoid repeatedly interrupting the user.
   */
  private checkApiKeyStatus(): void {
    const hasApiKey = this.settingsManager.hasValidApiKey();

    if (!hasApiKey) {
      this.showApiKeyWarning();
    }
  }

  /**
   * Renders a dismissible API key warning banner at the top of the page.
   *
   * The banner is injected into the main document (not the Shadow DOM) so
   * that it appears above all other content. `sessionStorage` is used to
   * track whether the warning has already been shown this session, preventing
   * it from reappearing on every page navigation.
   *
   * NOTE: The banner auto-dismisses after 10 seconds to avoid permanently
   * blocking content for users who choose to ignore it.
   */
  private showApiKeyWarning(): void {
    // Suppress the warning for the rest of the session once it has been shown.
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

    // Inline styles are used here because the banner is injected into the
    // main document where global CSS may not be available on generated pages.
    const style = document.createElement('style');
    style.textContent = `
      .api-key-warning {
        position: fixed;
        top: 70px; /* Positioned below the navigation notch */
        left: 50%;
        transform: translateX(-50%);
        background: #fff3cd;
        border: 1px solid #ffeaa7;
        border-radius: 15px;
        padding: 1rem;
        z-index: 998; /* Below the nav notch but above page content */
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

    const openSettingsBtn = warning.querySelector('#openSettingsFromWarning');
    const dismissBtn = warning.querySelector('#dismissWarning');

    // Open the settings panel directly rather than routing through the nav menu
    // to reduce the number of steps for the user.
    openSettingsBtn?.addEventListener('click', () => {
      this.navigationMenu?.openSettings();
      this.removeWarning(warning);
    });

    dismissBtn?.addEventListener('click', () => {
      this.removeWarning(warning);
    });

    // Auto-dismiss after 10 seconds so the banner does not permanently obscure
    // content for users who choose not to interact with it.
    setTimeout(() => {
      if (document.body.contains(warning)) {
        this.removeWarning(warning);
      }
    }, 10000);
  }

  /**
   * Animates the warning banner out and removes it from the DOM.
   * Records the dismissal in `sessionStorage` to prevent the banner from
   * reappearing during the same browser session.
   *
   * @param warning - The warning banner element to remove.
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
   * Registers global keyboard shortcuts for power users.
   *
   * Shortcuts are intentionally suppressed when an input or textarea is
   * focused to avoid interfering with text entry.
   *
   * Registered shortcuts:
   * - `M` / `m`       — Toggle navigation menu
   * - `Ctrl/Cmd + ,`  — Open settings panel
   * - `H` / `h`       — Navigate to homepage
   * - `Ctrl/Cmd + R`  — Reload with current flavor settings
   */
  private addKeyboardShortcuts(): void {
    document.addEventListener('keydown', (e) => {
      // Do not intercept shortcuts while the user is typing in a form field.
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
   * Opens the settings panel, creating the navigation menu first if it has
   * not yet been initialised (e.g. when triggered via keyboard shortcut before
   * the menu has been rendered).
   */
  private openSettingsDirectly(): void {
    if (!this.navigationMenu) {
      this.createNavigation();
    }

    this.navigationMenu?.openSettings();
  }

  /**
   * Reloads the current page with the active flavor and a cache-busting
   * `refresh` timestamp to force a fresh AI generation.
   */
  private reloadWithCurrentSettings(): void {
    const settings = this.settingsManager.getSettings();
    const url = new URL(window.location.href);
    url.searchParams.set('flavor', settings.defaultFlavor);
    url.searchParams.set('refresh', Date.now().toString());
    window.location.href = url.toString();
  }

  /**
   * Tears down the navigation menu and releases associated resources.
   */
  destroy(): void {
    if (this.navigationMenu) {
      this.navigationMenu.destroy();
      this.navigationMenu = null;
    }
  }
}

// Auto-initialise on module load so the navigation is available immediately
// without requiring an explicit call from the page template.
NavigationInitializer.getInstance();

// Expose the class on `window` to allow debugging from the browser console.
(window as any).NavigationInitializer = NavigationInitializer;