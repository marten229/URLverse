/**
 * Lightweight DOM utility functions.
 *
 * These helpers provide type-safe wrappers around common browser APIs and
 * higher-level abstractions (debounce, throttle, EventManager) that reduce
 * boilerplate in component code.
 */

/**
 * Executes `callback` as soon as the DOM is ready, or immediately if it
 * already is. Avoids the common pitfall of querying elements before the
 * parser has finished building the document tree.
 *
 * @param callback - Function to invoke when the DOM is interactive.
 */
export function domReady(callback: () => void): void {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback);
  } else {
    callback();
  }
}

/**
 * Type-safe wrapper around `querySelector` that returns the element cast to
 * the requested type, or `null` if no match is found.
 *
 * @param selector - A valid CSS selector string.
 * @param context  - The root element to search within (defaults to `document`).
 * @returns The first matching element typed as `T`, or `null`.
 */
export function querySelector<T extends HTMLElement>(
  selector: string,
  context: Document | HTMLElement = document
): T | null {
  return context.querySelector<T>(selector);
}

/**
 * Type-safe wrapper around `querySelectorAll`.
 *
 * @param selector - A valid CSS selector string.
 * @param context  - The root element to search within (defaults to `document`).
 * @returns A `NodeList` of all matching elements typed as `T`.
 */
export function querySelectorAll<T extends HTMLElement>(
  selector: string,
  context: Document | HTMLElement = document
): NodeListOf<T> {
  return context.querySelectorAll<T>(selector);
}

/**
 * Creates a DOM element and applies a set of properties in a single call,
 * reducing the verbosity of imperative element construction.
 *
 * @param tagName - The HTML tag name for the new element.
 * @param options - Optional properties to apply to the element.
 * @returns The newly created element.
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
 * Toggles a CSS class on an element, with an optional `force` parameter to
 * explicitly add or remove it.
 *
 * @param element   - The target element.
 * @param className - The CSS class to toggle.
 * @param force     - If `true`, adds the class; if `false`, removes it.
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
 * Tracks event listeners and provides a single `removeAll` call to clean them
 * up, preventing memory leaks in components that are frequently created and
 * destroyed.
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
 * Returns a debounced version of `func` that delays invocation until `wait`
 * milliseconds have elapsed since the last call. Prevents expensive operations
 * (e.g. API calls, layout recalculations) from running on every keystroke or
 * scroll event.
 *
 * @param func - The function to debounce.
 * @param wait - Delay in milliseconds.
 * @returns A debounced wrapper function.
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
 * Returns a throttled version of `func` that invokes it at most once per
 * `limit` milliseconds. Unlike debounce, the first call executes immediately,
 * making throttle better suited for continuous events like scroll or mousemove.
 *
 * @param func  - The function to throttle.
 * @param limit - Minimum interval between invocations in milliseconds.
 * @returns A throttled wrapper function.
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
 * Creates an `IntersectionObserver` for one or more elements and begins
 * observing them immediately.
 *
 * @param elements  - A single element or array of elements to observe.
 * @param callback  - Invoked when observed elements enter or leave the viewport.
 * @param options   - Optional overrides for the default observer configuration.
 * @returns The configured `IntersectionObserver` instance (call `.disconnect()`
 *          to stop observing).
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
 * Smoothly scrolls the given element into the visible viewport area.
 *
 * @param element - The element to scroll into view.
 * @param options - Optional overrides for the default scroll behaviour.
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
 * Copies text to the clipboard using the modern `navigator.clipboard` API.
 *
 * @param text - The string to copy.
 * @returns `true` if the copy succeeded, `false` if it failed (e.g. due to
 *          missing permissions or an insecure context).
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
