/**
 * Performance Utilities
 * Tools für Performance-Monitoring und Optimierung
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
 * Performance Monitor für kritische Operationen
 */
export class PerformanceMonitor {
  private static metrics: PerformanceMetrics[] = [];
  private static readonly maxMetrics = 100;

  /**
   * Performance-Messung starten
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
   * Performance-Messung beenden
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
   * Async-Operation mit Performance-Messung
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
   * Sync-Operation mit Performance-Messung
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
   * Metrik hinzufügen
   */
  private static addMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);
    
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.splice(0, this.metrics.length - this.maxMetrics);
    }
  }

  /**
   * Warnung bei langsamen Operationen
   */
  private static logIfSlow(metric: PerformanceMetrics): void {
    if (!metric.duration) return;
    
    // Schwellenwerte für verschiedene Operationen
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
   * Alle Metriken abrufen
   */
  static getMetrics(): ReadonlyArray<PerformanceMetrics> {
    return [...this.metrics];
  }

  /**
   * Metriken nach Operation filtern
   */
  static getMetricsByOperation(operation: string): ReadonlyArray<PerformanceMetrics> {
    return this.metrics.filter(m => m.operation === operation);
  }

  /**
   * Durchschnittliche Dauer für Operation
   */
  static getAverageDuration(operation: string): number {
    const operationMetrics = this.getMetricsByOperation(operation);
    if (operationMetrics.length === 0) return 0;
    
    const total = operationMetrics.reduce((sum, m) => sum + (m.duration || 0), 0);
    return total / operationMetrics.length;
  }

  /**
   * Performance-Report generieren
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
 * DOM Performance Utilities
 */
export class DOMPerformance {
  /**
   * Debounce für Event Handler
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
   * Throttle für Event Handler
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
   * Intersection Observer für Lazy Loading
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
   * RequestAnimationFrame Promise wrapper
   */
  static nextFrame(): Promise<void> {
    return new Promise(resolve => {
      requestAnimationFrame(() => resolve());
    });
  }

  /**
   * Idle Callback Promise wrapper
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
 * Memory Performance Utilities
 */
export class MemoryPerformance {
  /**
   * Memory Usage abrufen (wenn verfügbar)
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
   * WeakMap-basierte Cache-Implementierung
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
   * LRU Cache Implementierung
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

// Performance Monitor automatisch für Navigation starten
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    const report = PerformanceMonitor.generateReport();
    logger.info('Performance Report', { report });
  });
}