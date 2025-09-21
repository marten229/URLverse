/**
 * DOM Utilities
 * Hilfsfunktionen für DOM-Manipulation
 */

/**
 * Wartet bis das DOM vollständig geladen ist
 */
export function domReady(callback: () => void): void {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback);
  } else {
    callback();
  }
}

/**
 * Element-Selektor mit Typsicherheit
 */
export function querySelector<T extends HTMLElement>(
  selector: string,
  context: Document | HTMLElement = document
): T | null {
  return context.querySelector<T>(selector);
}

/**
 * Mehrere Elemente selektieren
 */
export function querySelectorAll<T extends HTMLElement>(
  selector: string,
  context: Document | HTMLElement = document
): NodeListOf<T> {
  return context.querySelectorAll<T>(selector);
}

/**
 * Element erstellen mit Attributen und Inhalt
 */
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  options: {
    className?: string;
    id?: string;
    textContent?: string;
    innerHTML?: string;
    attributes?: Record<string, string>;
    dataset?: Record<string, string>;
  } = {}
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName);

  if (options.className) {
    element.className = options.className;
  }

  if (options.id) {
    element.id = options.id;
  }

  if (options.textContent) {
    element.textContent = options.textContent;
  }

  if (options.innerHTML) {
    element.innerHTML = options.innerHTML;
  }

  if (options.attributes) {
    Object.entries(options.attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
  }

  if (options.dataset) {
    Object.entries(options.dataset).forEach(([key, value]) => {
      element.dataset[key] = value;
    });
  }

  return element;
}

/**
 * CSS-Klassen hinzufügen/entfernen
 */
export function toggleClass(element: HTMLElement, className: string, force?: boolean): void {
  element.classList.toggle(className, force);
}

export function addClass(element: HTMLElement, ...classNames: string[]): void {
  element.classList.add(...classNames);
}

export function removeClass(element: HTMLElement, ...classNames: string[]): void {
  element.classList.remove(...classNames);
}

export function hasClass(element: HTMLElement, className: string): boolean {
  return element.classList.contains(className);
}

/**
 * Event Listener mit automatischer Cleanup
 */
export class EventManager {
  private listeners: Array<{
    element: EventTarget;
    event: string;
    handler: EventListener;
    options?: AddEventListenerOptions;
  }> = [];

  add<K extends keyof HTMLElementEventMap>(
    element: HTMLElement,
    event: K,
    handler: (event: HTMLElementEventMap[K]) => void,
    options?: AddEventListenerOptions
  ): void;
  add(
    element: EventTarget,
    event: string,
    handler: EventListener,
    options?: AddEventListenerOptions
  ): void;
  add(
    element: EventTarget,
    event: string,
    handler: EventListener,
    options?: AddEventListenerOptions
  ): void {
    element.addEventListener(event, handler, options);
    this.listeners.push({ element, event, handler, options });
  }

  remove(element: EventTarget, event: string, handler: EventListener): void {
    element.removeEventListener(event, handler);
    this.listeners = this.listeners.filter(
      listener => !(listener.element === element && listener.event === event && listener.handler === handler)
    );
  }

  removeAll(): void {
    this.listeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this.listeners = [];
  }
}

/**
 * Debounce Funktion für Performance
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | undefined;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle Funktion für Performance
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Intersection Observer Wrapper
 */
export function observeIntersection(
  elements: HTMLElement | HTMLElement[],
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver {
  const observer = new IntersectionObserver(callback, {
    threshold: 0.1,
    ...options
  });

  const elementsArray = Array.isArray(elements) ? elements : [elements];
  elementsArray.forEach(element => observer.observe(element));

  return observer;
}

/**
 * Smooth Scroll zu Element
 */
export function scrollToElement(
  element: HTMLElement,
  options: ScrollIntoViewOptions = {}
): void {
  element.scrollIntoView({
    behavior: 'smooth',
    block: 'center',
    ...options
  });
}

/**
 * Copy to Clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}
