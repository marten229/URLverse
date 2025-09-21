/**
 * URL Input Handler
 * Behandelt die URL-Eingabe auf der Homepage
 */

export interface URLInputOptions {
  inputSelector: string;
  autoFocus?: boolean;
  placeholder?: string;
  onNavigate?: (url: string) => void;
}

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

  private normalizeURL(url: string): string {
    url = url.trim();

    if (url && !url.startsWith('/')) {
      url = '/' + url;
    }

    url = url.replace(/\/+/g, '/');

    return url;
  }

  private focusInput(): void {
    if (this.input) {
      setTimeout(() => {
        this.input?.focus();
      }, 100);
    }
  }

  /**
   * Öffentliche Methoden
   */
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

  public destroy(): void {
    if (this.input) {
      this.input.removeEventListener('keypress', this.handleKeyPress.bind(this));
      this.input.removeEventListener('input', this.handleInput.bind(this));
    }
  }
}
