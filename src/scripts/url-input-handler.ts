/**
 * Handles URL input on the homepage, normalising user-entered paths and
 * triggering navigation on submission.
 */

export interface URLInputOptions {
  inputSelector: string;
  autoFocus?: boolean;
  placeholder?: string;
  onNavigate?: (url: string) => void;
}

/**
 * Binds to a URL input element and manages the full input lifecycle:
 * focus, normalisation, and navigation.
 *
 * An `onNavigate` callback can be provided to intercept navigation (e.g. for
 * logging or analytics) before the browser performs the actual redirect.
 */
export class URLInputHandler {
  private input: HTMLInputElement | null = null;
  private options: URLInputOptions;

  constructor(options: URLInputOptions) {
    this.options = {
      autoFocus: true,
      ...options
    };

    this.init();
  }

  private init(): void {
    this.input = document.querySelector(this.options.inputSelector);

    if (!this.input) {
      console.warn(`URLInputHandler: Element with selector "${this.options.inputSelector}" not found`);
      return;
    }

    this.setupEventListeners();

    if (this.options.autoFocus) {
      this.focusInput();
    }

    if (this.options.placeholder) {
      this.input.placeholder = this.options.placeholder;
    }
  }

  private setupEventListeners(): void {
    if (!this.input) return;

    this.input.addEventListener('keypress', this.handleKeyPress.bind(this));
    this.input.addEventListener('input', this.handleInput.bind(this));
  }

  private handleKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.navigate();
    }
  }

  private handleInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    console.debug('URL input changed:', target.value);
  }

  private navigate(): void {
    if (!this.input) return;

    let url = this.input.value.trim();

    if (!url) {
      return;
    }

    url = this.normalizeURL(url);

    if (this.options.onNavigate) {
      this.options.onNavigate(url);
      return;
    }

    window.location.href = url;
  }

  /**
   * Normalises a user-entered URL string to a valid internal path.
   *
   * Users often omit the leading slash or enter duplicate slashes. This method
   * ensures the resulting URL is always a clean, absolute-looking path before
   * navigation is triggered.
   *
   * @param url - The raw string from the input field.
   * @returns A normalised path string starting with `/`.
   */
  private normalizeURL(url: string): string {
    url = url.trim();

    if (url && !url.startsWith('/')) {
      url = '/' + url;
    }

    // Collapse consecutive slashes (e.g. `//foo` → `/foo`).
    url = url.replace(/\/+/g, '/');

    return url;
  }

  /**
   * Defers focus by one tick to ensure the element is fully rendered before
   * `focus()` is called, which can fail silently on elements that are not yet
   * in the layout.
   */
  private focusInput(): void {
    if (this.input) {
      setTimeout(() => {
        this.input?.focus();
      }, 100);
    }
  }

  public focus(): void {
    this.focusInput();
  }

  public setValue(value: string): void {
    if (this.input) {
      this.input.value = value;
    }
  }

  public getValue(): string {
    return this.input?.value || '';
  }

  public clear(): void {
    this.setValue('');
  }

  /**
   * Removes all event listeners attached by this handler. Call this when the
   * input element is removed from the DOM to prevent memory leaks.
   */
  public destroy(): void {
    if (this.input) {
      this.input.removeEventListener('keypress', this.handleKeyPress.bind(this));
      this.input.removeEventListener('input', this.handleInput.bind(this));
    }
  }
}
