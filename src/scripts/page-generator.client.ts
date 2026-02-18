/**
 * Client-side page generation entry point.
 *
 * This script runs entirely in the browser. The Gemini API key is read from
 * `localStorage` and sent directly to the Gemini API — it never reaches the
 * Astro server. This architecture ensures the key cannot be logged or leaked
 * through server-side request handling.
 */

import { GeminiService } from '../services/gemini';
import { createPromptForUrl } from '../lib/prompt-generator';
import { createParameterContext } from '../utils/slug-parser';
import { cleanHtmlContent, replaceBrokenImages, addParametersToLinks } from '../utils/content-processor';
import { CookieManager } from '../utils/cookie-utils';
import { config } from '../lib/config';
import { SettingsUI } from '../components/SettingsUI';

// ── Read page context from the server-rendered shell ────────────────────────
// The Astro page embeds the URL context in `data-*` attributes on the shell
// element so this client script can pick it up without an additional request.

const shell = document.getElementById('page-shell');
if (!shell) throw new Error('page-shell element not found');

const query = shell.dataset.query ?? '';
const flavorId = shell.dataset.flavor ?? config.app.defaultFlavor;
const params: Record<string, string> = JSON.parse(shell.dataset.params ?? '{}');

// ── DOM state helpers ────────────────────────────────────────────────────────

const loadingEl = document.getElementById('loading-state')!;
const contentEl = document.getElementById('generated-content')!;

function showLoading() {
    loadingEl.style.display = '';
    contentEl.style.display = 'none';
}

function showContent(html: string) {
    loadingEl.style.display = 'none';
    contentEl.style.display = '';
    contentEl.innerHTML = html;
}

/**
 * Clones an `<template>` element by ID, fills in the error message slot, and
 * renders it in place of the loading indicator.
 *
 * Using `<template>` elements for error states keeps the error markup in the
 * HTML (SSR-rendered) rather than in JS strings, making it easier to style
 * and localise.
 *
 * @param templateId   - The `id` of the `<template>` element to clone.
 * @param errorMessage - The human-readable error text to inject into the slot.
 */
function showTemplate(templateId: string, errorMessage: string) {
    const tpl = document.getElementById(templateId) as HTMLTemplateElement | null;
    if (!tpl) return;

    const clone = tpl.content.cloneNode(true) as DocumentFragment;

    const slot = clone.querySelector('[data-slot="error-message"]');
    if (slot) slot.textContent = errorMessage;

    loadingEl.style.display = 'none';
    contentEl.style.display = '';
    contentEl.innerHTML = '';
    contentEl.appendChild(clone);

    // Wire up the settings shortcut button that some error templates include.
    const settingsBtn = contentEl.querySelector('#openSettingsFromError');
    settingsBtn?.addEventListener('click', () => {
        const settings = SettingsUI.initialize();
        settings.open();
    });
}

// ── Main generation flow ─────────────────────────────────────────────────────

/**
 * Orchestrates the full client-side generation flow:
 * 1. Validates the API key from `localStorage`.
 * 2. Builds the Gemini prompt from the URL context.
 * 3. Calls the Gemini API directly from the browser.
 * 4. Post-processes and renders the returned HTML.
 */
async function generatePage() {
    showLoading();

    // The API key must come from localStorage — reading it here (not from the
    // server) is the core security guarantee of this architecture.
    const apiKey = CookieManager.getApiKeyClient();

    if (!apiKey) {
        showTemplate(
            'tpl-api-key-error',
            'Kein API Key gefunden. Bitte setzen Sie Ihren Gemini API Key in den Einstellungen.'
        );
        return;
    }

    if (!CookieManager.validateApiKeyFormat(apiKey)) {
        showTemplate(
            'tpl-api-key-error',
            'Ungültiges API Key Format. Bitte überprüfen Sie Ihren Gemini API Key.'
        );
        return;
    }

    const parameterContext = createParameterContext(params);
    const prompt = createPromptForUrl(query, parameterContext, flavorId);

    try {
        const gemini = GeminiService.create(apiKey);
        const result = await gemini.generateContent(prompt);

        if (result.error === 'INVALID_API_KEY') {
            showTemplate(
                'tpl-api-key-error',
                'Der verwendete API Key ist ungültig oder abgelaufen.'
            );
            return;
        }

        if (result.error) {
            showTemplate('tpl-generation-error', result.error);
            return;
        }

        // Post-process the raw HTML before injecting it into the DOM.
        let html = cleanHtmlContent(result.content);
        html = replaceBrokenImages(html);
        html = addParametersToLinks(html, params);

        showContent(html);

    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
        showTemplate('tpl-generation-error', message);
    }
}

generatePage();
