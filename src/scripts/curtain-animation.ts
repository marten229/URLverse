/**
 * Cinema curtain animation with navigation interception.
 *
 * Handles the full close-then-open sequence for page transitions, ensuring
 * a seamless experience without FOUC or loading screen flashes.
 */

const SESSION_KEY = 'curtain-pre-closed';

/** Duration of the close animation in ms. Must match the CSS value. */
const CLOSE_DURATION_MS = 900;

/**
 * Intercepts internal link clicks to trigger the curtain close animation
 * before navigation begins.
 */
export function initNavigationCurtain(): void {
    document.addEventListener('click', (e) => {
        const anchor = (e.target as Element).closest('a');
        if (!anchor) return;

        const href = anchor.getAttribute('href');
        if (!href) return;

        // Only intercept same-origin, non-hash, non-external links.
        const isInternal =
            !href.startsWith('http') &&
            !href.startsWith('//') &&
            !href.startsWith('#') &&
            !href.startsWith('mailto:');

        if (!isInternal) return;

        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

        // Exclude system pages (e.g. Homepage, Flavor Admin) to prevent the curtain
        // from locking in a closed state on pages that lack the opening logic.
        if (isSystemPage(href)) return;

        e.preventDefault();

        const overlay = document.getElementById('curtain-overlay');
        if (!overlay) {
            window.location.href = href;
            return;
        }

        navigateTo(href);
    });
}


/**
 * Programmable navigation with curtain transition.
 */
export function navigateTo(url: string): void {
    // Skip animation for system pages since they don't support the curtain lifecycle.
    if (isSystemPage(url)) {
        window.location.href = url;
        return;
    }

    const overlay = document.getElementById('curtain-overlay');
    if (!overlay) {
        window.location.href = url;
        return;
    }

    sessionStorage.setItem(SESSION_KEY, '1');

    sessionStorage.setItem(SESSION_KEY, '1');

    // Reset any existing animation states (e.g. open/done) to ensure the
    // close animation plays cleanly from start to finish.
    overlay.classList.remove('is-done', 'is-opening', 'is-pre-closed', 'is-closed');
    overlay.classList.add('is-closing');

    setTimeout(() => {
        window.location.href = url;
    }, CLOSE_DURATION_MS);
}

/**
 * Starts the curtain close animation on initial page load (no prior navigation).
 * The curtain sweeps in over the loading spinner.
 */
export function closeCurtain(): void {
    const overlay = document.getElementById('curtain-overlay');
    if (!overlay) return;

    overlay.classList.add('is-closing');

    overlay.addEventListener(
        'animationend',
        () => {
            overlay.classList.remove('is-closing');
            overlay.classList.add('is-closed');
        },
        { once: true },
    );
}

/**
 * Checks whether the page was reached via a curtain-intercepted navigation.
 * If so, the curtain is already visually closed (pre-closed state) and we
 * skip the close animation entirely, going straight to waiting for content.
 *
 * @returns `true` if the curtain was pre-closed (navigation arrival), `false` otherwise.
 */
export function applyPreClosedStateIfNeeded(): boolean {
    const wasPreClosed = sessionStorage.getItem(SESSION_KEY) === '1';
    sessionStorage.removeItem(SESSION_KEY);

    if (wasPreClosed) {
        const overlay = document.getElementById('curtain-overlay');
        if (overlay) {
            // Snap the curtain to closed position instantly — no animation.
            overlay.classList.add('is-pre-closed');
        }
    }

    return wasPreClosed;
}

/**
 * Opens the curtain after content has been injected into the DOM.
 * Waits for the close animation to finish first if it is still running.
 */
export function openCurtain(): void {
    const overlay = document.getElementById('curtain-overlay');
    if (!overlay) return;

    const triggerOpen = () => {
        overlay.classList.remove('is-closed', 'is-pre-closed');
        overlay.classList.add('is-opening');

        overlay.addEventListener(
            'animationend',
            () => overlay.classList.add('is-done'),
            { once: true },
        );
    };

    if (overlay.classList.contains('is-closing')) {
        // Still closing — wait for it, then open.
        overlay.addEventListener('animationend', triggerOpen, { once: true });
    } else {
        // Already closed or pre-closed — open after a brief pause so the
        // closed state is perceptible before the reveal.
        setTimeout(triggerOpen, 120);
    }
}

/**
 * Checks if the given URL corresponds to a system page (Homepage, Flavor Admin, etc.)
 * where the curtain animation should NOT be triggered.
 */
function isSystemPage(url: string): boolean {
    if (!url) return true;
    // Normalized check: remove query params and hash for path comparison if needed,
    // but for now simple prefix checks are sufficient for our route structure.
    return url === '/' || url.startsWith('/flavor') || url.startsWith('/#') || url.startsWith('/?');
}
