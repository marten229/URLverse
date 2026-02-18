/**
 * Performance monitoring utilities for tracking operation durations and
 * detecting regressions in critical code paths.
 *
 * All measurements are stored in a bounded in-memory buffer. A `beforeunload`
 * listener at the bottom of this module automatically logs a summary report
 * so that performance data is captured even for single-page visits.
 */

import { logger } from './error-logger';

export interface PerformanceMetrics {
  readonly startTime: number;
  readonly endTime?: number;
  readonly duration?: number;
  readonly operation: string;
  readonly context?: Record<string, unknown>;
}

/**
 * Tracks timing metrics for named operations and warns when they exceed
 * operation-specific thresholds.
 *
 * The buffer is capped at `maxMetrics` entries to prevent unbounded memory
 * growth in long-running sessions.
 */
export class PerformanceMonitor {
  private static metrics: PerformanceMetrics[] = [];
  private static readonly maxMetrics = 100;

  /**
   * Records the start time of a named operation.
   *
   * @param operation - A stable identifier for the operation being measured
   *                    (e.g. `'api_call'`, `'dom_manipulation'`).
   * @param context   - Optional metadata to associate with this measurement.
   * @returns A partial `PerformanceMetrics` object to pass to `endMeasurement`.
   */
  static startMeasurement(operation: string, context?: Record<string, unknown>): PerformanceMetrics {
    const metric: PerformanceMetrics = {
      startTime: performance.now(),
      operation,
      context
    };

    return metric;
  }

  /**
   * Finalises a measurement started by `startMeasurement`, stores the result,
   * and emits a warning if the duration exceeds the threshold for this operation.
   *
   * @param metric - The partial metric returned by `startMeasurement`.
   * @returns The completed `PerformanceMetrics` object with `endTime` and `duration`.
   */
  static endMeasurement(metric: PerformanceMetrics): PerformanceMetrics {
    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    const completedMetric: PerformanceMetrics = {
      ...metric,
      endTime,
      duration
    };

    this.addMetric(completedMetric);
    this.logIfSlow(completedMetric);

    return completedMetric;
  }

  /**
   * Wraps an async function with automatic start/end measurement, ensuring
   * the timer is stopped even if the function throws.
   *
   * @param operation - Stable identifier for the operation.
   * @param fn        - The async function to measure.
   * @param context   - Optional metadata for the measurement.
   * @returns The return value of `fn`.
   * @throws Re-throws any error thrown by `fn`.
   */
  static async measureAsync<T>(
    operation: string,
    fn: () => Promise<T>,
    context?: Record<string, unknown>
  ): Promise<T> {
    const metric = this.startMeasurement(operation, context);

    try {
      const result = await fn();
      this.endMeasurement(metric);
      return result;
    } catch (error) {
      this.endMeasurement(metric);
      throw error;
    }
  }

  /**
   * Wraps a synchronous function with automatic start/end measurement,
   * ensuring the timer is stopped even if the function throws.
   *
   * @param operation - Stable identifier for the operation.
   * @param fn        - The synchronous function to measure.
   * @param context   - Optional metadata for the measurement.
   * @returns The return value of `fn`.
   * @throws Re-throws any error thrown by `fn`.
   */
  static measureSync<T>(
    operation: string,
    fn: () => T,
    context?: Record<string, unknown>
  ): T {
    const metric = this.startMeasurement(operation, context);

    try {
      const result = fn();
      this.endMeasurement(metric);
      return result;
    } catch (error) {
      this.endMeasurement(metric);
      throw error;
    }
  }

  /**
   * Appends a completed metric to the buffer, evicting the oldest entry when
   * the buffer is full to prevent unbounded memory growth.
   */
  private static addMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);

    if (this.metrics.length > this.maxMetrics) {
      this.metrics.splice(0, this.metrics.length - this.maxMetrics);
    }
  }

  /**
   * Emits a warning log when an operation's duration exceeds its threshold.
   *
   * Thresholds are defined per operation type to account for the fact that
   * an API call taking 1.5 s is acceptable, while a DOM manipulation taking
   * the same time indicates a serious performance problem.
   */
  private static logIfSlow(metric: PerformanceMetrics): void {
    if (!metric.duration) return;

    const thresholds: Record<string, number> = {
      'api_call': 2000,
      'dom_manipulation': 100,
      'data_processing': 500,
      'navigation': 300,
      'default': 1000
    };

    const threshold = thresholds[metric.operation] || thresholds.default;

    if (metric.duration > threshold) {
      logger.warn(
        `Slow operation detected: ${metric.operation}`,
        {
          duration: metric.duration,
          threshold,
          context: metric.context
        }
      );
    }
  }

  /**
   * Returns a snapshot of all buffered metrics.
   *
   * @returns An immutable copy of the metrics buffer.
   */
  static getMetrics(): ReadonlyArray<PerformanceMetrics> {
    return [...this.metrics];
  }

  /**
   * Filters the metrics buffer by operation name.
   *
   * @param operation - The operation identifier to filter by.
   * @returns All metrics matching the given operation.
   */
  static getMetricsByOperation(operation: string): ReadonlyArray<PerformanceMetrics> {
    return this.metrics.filter(m => m.operation === operation);
  }

  /**
   * Calculates the mean duration for all recorded instances of an operation.
   *
   * @param operation - The operation identifier to aggregate.
   * @returns The average duration in milliseconds, or `0` if no data exists.
   */
  static getAverageDuration(operation: string): number {
    const operationMetrics = this.getMetricsByOperation(operation);
    if (operationMetrics.length === 0) return 0;

    const total = operationMetrics.reduce((sum, m) => sum + (m.duration || 0), 0);
    return total / operationMetrics.length;
  }

  /**
   * Generates a JSON summary report of all recorded operations, including
   * count, average, min, and max durations per operation type.
   *
   * @returns A pretty-printed JSON string suitable for logging or display.
   */
  static generateReport(): string {
    const operations = [...new Set(this.metrics.map(m => m.operation))];

    const report = operations.map(op => {
      const metrics = this.getMetricsByOperation(op);
      const avg = this.getAverageDuration(op);
      const max = Math.max(...metrics.map(m => m.duration || 0));
      const min = Math.min(...metrics.map(m => m.duration || 0));

      return {
        operation: op,
        count: metrics.length,
        averageDuration: Math.round(avg * 100) / 100,
        maxDuration: Math.round(max * 100) / 100,
        minDuration: Math.round(min * 100) / 100
      };
    });

    return JSON.stringify(report, null, 2);
  }
}

/**
 * Browser-specific performance helpers for common patterns like debouncing,
 * throttling, and scheduling work in idle time.
 */
export class DOMPerformance {
  /**
   * Returns a debounced version of `func` that delays invocation until `wait`
   * milliseconds have elapsed since the last call. Useful for suppressing
   * rapid-fire events like `resize` or `input`.
   *
   * @param func - The function to debounce.
   * @param wait - Delay in milliseconds.
   * @returns A debounced wrapper function.
   */
  static debounce<T extends (...args: unknown[]) => void>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout>;

    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  /**
   * Returns a throttled version of `func` that invokes it at most once per
   * `limit` milliseconds. Useful for scroll or mousemove handlers where
   * debouncing would delay the first call too long.
   *
   * @param func  - The function to throttle.
   * @param limit - Minimum interval between invocations in milliseconds.
   * @returns A throttled wrapper function.
   */
  static throttle<T extends (...args: unknown[]) => void>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;

    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Creates an `IntersectionObserver` pre-configured for lazy-loading use
   * cases, with a 50 px root margin to start loading slightly before elements
   * enter the viewport.
   *
   * @param callback - Invoked when observed elements enter or leave the viewport.
   * @param options  - Optional overrides for the default observer configuration.
   * @returns The configured `IntersectionObserver` instance.
   */
  static createLazyLoader(
    callback: (entries: IntersectionObserverEntry[]) => void,
    options?: IntersectionObserverInit
  ): IntersectionObserver {
    return new IntersectionObserver(callback, {
      rootMargin: '50px',
      threshold: 0.1,
      ...options
    });
  }

  /**
   * Returns a promise that resolves on the next animation frame, allowing
   * callers to yield to the browser's rendering pipeline before performing
   * expensive DOM work.
   *
   * @returns A promise that resolves after the next `requestAnimationFrame`.
   */
  static nextFrame(): Promise<void> {
    return new Promise(resolve => {
      requestAnimationFrame(() => resolve());
    });
  }

  /**
   * Returns a promise that resolves when the browser is idle, deferring
   * non-critical work to avoid competing with user interactions.
   *
   * NOTE: Falls back to `setTimeout(0)` in browsers that do not support
   * `requestIdleCallback` (e.g. Safari < 16).
   *
   * @param timeout - Maximum wait time in milliseconds before the promise
   *                  resolves regardless of browser idle state.
   * @returns A promise that resolves during an idle period.
   */
  static nextIdle(timeout = 5000): Promise<void> {
    return new Promise(resolve => {
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(resolve, { timeout });
      } else {
        setTimeout(resolve, 0);
      }
    });
  }
}

/**
 * Memory-management utilities for building caches that do not prevent
 * garbage collection of their keys.
 */
export class MemoryPerformance {
  /**
   * Returns the current JS heap usage if the non-standard `performance.memory`
   * API is available (Chromium-based browsers only).
   *
   * @returns Heap size metrics in bytes, or `null` in unsupported environments.
   */
  static getMemoryUsage(): Record<string, number> | null {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit
      };
    }
    return null;
  }

  /**
   * Creates a `WeakMap`-backed cache whose entries are automatically evicted
   * when their keys are garbage-collected, preventing memory leaks for
   * object-keyed caches.
   *
   * @returns A cache object with `get`, `set`, `has`, and `delete` methods.
   */
  static createWeakCache<K extends object, V>(): {
    get: (key: K) => V | undefined;
    set: (key: K, value: V) => void;
    has: (key: K) => boolean;
    delete: (key: K) => boolean;
  } {
    const cache = new WeakMap<K, V>();

    return {
      get: (key: K) => cache.get(key),
      set: (key: K, value: V) => cache.set(key, value),
      has: (key: K) => cache.has(key),
      delete: (key: K) => cache.delete(key)
    };
  }

  /**
   * Creates a Least-Recently-Used (LRU) cache with a fixed maximum size.
   * When the cache is full, the least-recently-accessed entry is evicted to
   * make room for new entries.
   *
   * NOTE: The LRU order is maintained by deleting and re-inserting entries on
   * access, exploiting the insertion-order guarantee of `Map`.
   *
   * @param maxSize - Maximum number of entries the cache may hold.
   * @returns A cache object with `get`, `set`, `has`, `clear`, and `size` methods.
   */
  static createLRUCache<K, V>(maxSize: number): {
    get: (key: K) => V | undefined;
    set: (key: K, value: V) => void;
    has: (key: K) => boolean;
    clear: () => void;
    size: () => number;
  } {
    const cache = new Map<K, V>();

    return {
      get: (key: K) => {
        if (cache.has(key)) {
          const value = cache.get(key)!;
          // Move to end to mark as most-recently used.
          cache.delete(key);
          cache.set(key, value);
          return value;
        }
        return undefined;
      },

      set: (key: K, value: V) => {
        if (cache.has(key)) {
          cache.delete(key);
        } else if (cache.size >= maxSize) {
          // Evict the least-recently-used entry (first key in insertion order).
          const firstKey = cache.keys().next().value;
          if (firstKey !== undefined) {
            cache.delete(firstKey);
          }
        }
        cache.set(key, value);
      },

      has: (key: K) => cache.has(key),
      clear: () => cache.clear(),
      size: () => cache.size
    };
  }
}

// Log a performance summary on page unload so that data from the current
// session is captured before the browser discards it.
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    const report = PerformanceMonitor.generateReport();
    logger.info('Performance Report', { report });
  });
}