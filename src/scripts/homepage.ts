/**
 * Homepage initialisation script.
 *
 * Wires up the URL input field, the settings button, and the settings-change
 * listener that keeps the button label in sync with the API key status.
 */

import { domReady } from './dom-utils';
import { URLInputHandler } from './url-input-handler';
import { SettingsUI } from '../components/SettingsUI';
import { SettingsManager } from '../utils/settings-manager';

domReady(() => {
  const urlInputHandler = new URLInputHandler({
    inputSelector: '#urlInput',
    autoFocus: true,
    placeholder: 'Gib eine URL ein... z.B. /blog/mein-artikel',
    onNavigate: (url: string) => {
      console.log('Navigating to:', url);
      window.location.href = url;
    }
  });

  const settingsManager = SettingsManager.getInstance();

  const settingsButton = document.querySelector('#openSettingsFromHome');
  if (settingsButton) {
    settingsButton.addEventListener('click', () => {
      const settings = SettingsUI.initialize();
      settings.open();
    });

    /**
     * Updates the settings button label to reflect whether an API key is
     * configured. This gives first-time visitors a clear call-to-action
     * without requiring them to discover the settings panel on their own.
     */
    const updateSettingsButton = () => {
      const hasApiKey = settingsManager.hasValidApiKey();
      const button = settingsButton as HTMLElement;

      if (hasApiKey) {
        button.textContent = '⚙️ Einstellungen';
        button.classList.remove('homepage__settings-link--warning');
      } else {
        button.textContent = '🔑 API Key setzen';
        button.classList.add('homepage__settings-link--warning');
      }
    };

    updateSettingsButton();

    // Keep the button label in sync whenever the API key changes (e.g. after
    // the user saves or clears the key in the settings panel).
    settingsManager.addListener(updateSettingsButton);
  }

  window.addEventListener('beforeunload', () => {
    urlInputHandler.destroy();
  });

  console.log('Homepage initialized successfully');
});
