/**
 * Homepage Script
 * Client-side Logik für die Startseite
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

  // Settings UI Setup
  const settingsManager = SettingsManager.getInstance();
  const settingsUI = new SettingsUI();
  let settingsPanel: HTMLElement | null = null;

  // Settings Button Handler
  const settingsButton = document.querySelector('#openSettingsFromHome');
  if (settingsButton) {
    settingsButton.addEventListener('click', () => {
      if (!settingsPanel) {
        settingsPanel = settingsUI.create();
        document.body.appendChild(settingsPanel);
      }
      settingsUI.open();
    });

    // Update button text based on API key status
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

    // Initial update
    updateSettingsButton();

    // Listen for settings changes
    settingsManager.addListener(updateSettingsButton);
  }

  window.addEventListener('beforeunload', () => {
    urlInputHandler.destroy();
    if (settingsPanel) {
      settingsUI.destroy();
    }
  });

  console.log('Homepage initialized successfully');
});
