/**
 * Performance monitoring and analytics system
 * Tracks Core Web Vitals, component performance, and user experience metrics
 */

export interface PerformanceMetrics {
  // Core Web Vitals
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift
  fcp: number | null; // First Contentful Paint
  ttfb: number | null; // Time to First Byte

  // Custom metrics
  componentLoadTime: number;
  analysisTime: number;
  documentParseTime: number;
  renderTime: number;
  memoryUsage: number;
  
  // User experience metrics
  interactionLatency: number;
  errorRate: number;
  bounceRate: number;
}

export interface PerformanceEntry {
  id: string;
  timestamp: number;
  metrics: Partial<PerformanceMetrics>;
  userAgent: string;
  url: string;
  userId?: string;
  sessionId: string;
}

export interface PerformanceAlert {
  type: 'warning' | 'critical';
  metric: keyof PerformanceMetrics;
  value: number;
  threshold: number;
  message: string;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {};
  private entries: PerformanceEntry[] = [];
  private alerts: PerformanceAlert[] = [];
  private observers: PerformanceObserver[] = [];
  private sessionId: string;
  private isMonitoring = false;

  // Performance thresholds
  private thresholds = {
    lcp: 2500, // 2.5s
    fid: 100,  // 100ms
    cls: 0.1,  // 0.1
    fcp: 1800, // 1.8s
    ttfb: 800, // 800ms
    componentLoadTime: 3000, // 3s
    analysisTime: 30000, // 30s
    documentParseTime: 5000, // 5s
    renderTime: 1000, // 1s
    memoryUsage: 100 * 1024 * 1024, // 100MB
    interactionLatency: 200, // 200ms
    errorRate: 0.05, // 5%
    bounceRate: 0.7, // 70%
  };

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeMonitoring();
  }

  /**
   * Initialize performance monitoring
   */
  private initializeMonitoring(): void {
    // Only initialize browser-specific monitoring on client side
    if (typeof window === 'undefined') {
      this.isMonitoring = false;
      return;
    }

    this.isMonitoring = true;
    this.setupCoreWebVitalsMonitoring();
    this.setupCustomMetricsMonitoring();
    this.setupMemoryMonitoring();
    this.setupErrorMonitoring();
  }

  /**
   * Setup Core Web Vitals monitoring
   */
  private setupCoreWebVitalsMonitoring(): void {
    // LCP (Largest Contentful Paint)
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number };
        this.updateMetric('lcp', lastEntry.startTime);
      });

      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);
      } catch (e) {
        console.warn('LCP monitoring not supported');
      }

      // FID (First Input Delay)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.updateMetric('fid', entry.processingStart - entry.startTime);
        });
      });

      try {
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);
      } catch (e) {
        console.warn('FID monitoring not supported');
      }

      // CLS (Cumulative Layout Shift)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            this.updateMetric('cls', clsValue);
          }
        });
      });

      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      } catch (e) {
        console.warn('CLS monitoring not supported');
      }
    }

    // FCP and TTFB from Navigation Timing
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        this.updateMetric('ttfb', navigation.responseStart - navigation.requestStart);
        
        // Get FCP from paint timing
        const paintEntries = performance.getEntriesByType('paint');
        const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
        if (fcpEntry) {
          this.updateMetric('fcp', fcpEntry.startTime);
        }
      }
    });
  }

  /**
   * Setup custom metrics monitoring
   */
  private setupCustomMetricsMonitoring(): void {
    // Monitor resource loading times
    if ('PerformanceObserver' in window) {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: PerformanceResourceTiming) => {
          if (entry.name.includes('chunk') || entry.name.includes('component')) {
            this.updateMetric('componentLoadTime', entry.duration);
          }
        });
      });

      try {
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.push(resourceObserver);
      } catch (e) {
        console.warn('Resource monitoring not supported');
      }
    }

    // Monitor user interactions
    ['click', 'keydown', 'touchstart'].forEach(eventType => {
      document.addEventListener(eventType, (event) => {
        const startTime = performance.now();
        
        // Measure interaction latency
        requestAnimationFrame(() => {
          const latency = performance.now() - startTime;
          this.updateMetric('interactionLatency', latency);
        });
      }, { passive: true });
    });
  }

  /**
   * Setup memory monitoring
   */
  private setupMemoryMonitoring(): void {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        if (memory) {
          this.updateMetric('memoryUsage', memory.usedJSHeapSize);
        }
      }, 30000); // Check every 30 seconds
    }
  }

  /**
   * Setup error monitoring
   */
  private setupErrorMonitoring(): void {
    let errorCount = 0;
    let totalInteractions = 0;

    window.addEventListener('error', () => {
      errorCount++;
      this.updateMetric('errorRate', errorCount / Math.max(totalInteractions, 1));
    });

    window.addEventListener('unhandledrejection', () => {
      errorCount++;
      this.updateMetric('errorRate', errorCount / Math.max(totalInteractions, 1));
    });

    // Track total interactions for error rate calculation
    ['click', 'keydown', 'touchstart'].forEach(eventType => {
      document.addEventListener(eventType, () => {
        totalInteractions++;
        this.updateMetric('errorRate', errorCount / totalInteractions);
      }, { passive: true });
    });
  }

  /**
   * Update a specific metric
   */
  private updateMetric(metric: keyof PerformanceMetrics, value: number): void {
    // Only update metrics on client side
    if (typeof window === 'undefined') return;
    
    this.metrics[metric] = value;
    this.checkThreshold(metric, value);
    this.recordEntry();
  }

  /**
   * Check if metric exceeds threshold and create alert
   */
  private checkThreshold(metric: keyof PerformanceMetrics, value: number): void {
    const threshold = this.thresholds[metric];
    if (threshold && value > threshold) {
      const alert: PerformanceAlert = {
        type: value > threshold * 1.5 ? 'critical' : 'warning',
        metric,
        value,
        threshold,
        message: `${metric} (${value.toFixed(2)}) exceeds threshold (${threshold})`,
        timestamp: Date.now(),
      };

      this.alerts.push(alert);
      
      // Keep only last 50 alerts
      if (this.alerts.length > 50) {
        this.alerts = this.alerts.slice(-50);
      }

      // Log critical alerts
      if (alert.type === 'critical') {
        console.warn('🚨 Performance Alert:', alert.message);
      }
    }
  }

  /**
   * Record performance entry
   */
  private recordEntry(): void {
    const entry: PerformanceEntry = {
      id: this.generateEntryId(),
      timestamp: Date.now(),
      metrics: { ...this.metrics },
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
      url: typeof window !== 'undefined' ? window.location.href : 'server',
      sessionId: this.sessionId,
    };

    this.entries.push(entry);

    // Keep only last 100 entries
    if (this.entries.length > 100) {
      this.entries = this.entries.slice(-100);
    }
  }

  /**
   * Manually track component performance
   */
  trackComponentPerformance<T>(
    componentName: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    
    return operation().then(
      (result) => {
        const duration = performance.now() - startTime;
        this.updateMetric('componentLoadTime', duration);
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`⚡ ${componentName} loaded in ${duration.toFixed(2)}ms`);
        }
        
        return result;
      },
      (error) => {
        const duration = performance.now() - startTime;
        console.warn(`❌ ${componentName} failed after ${duration.toFixed(2)}ms:`, error);
        throw error;
      }
    );
  }

  /**
   * Track analysis performance
   */
  trackAnalysisPerformance<T>(operation: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    
    return operation().then(
      (result) => {
        const duration = performance.now() - startTime;
        this.updateMetric('analysisTime', duration);
        return result;
      },
      (error) => {
        const duration = performance.now() - startTime;
        this.updateMetric('analysisTime', duration);
        throw error;
      }
    );
  }

  /**
   * Track document parsing performance
   */
  trackDocumentParsePerformance<T>(operation: () => Promise<T>): Promise<T> {
    // Use Date.now() as fallback for server-side
    const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    
    return operation().then(
      (result) => {
        const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
        const duration = endTime - startTime;
        if (typeof window !== 'undefined') {
          this.updateMetric('documentParseTime', duration);
        }
        return result;
      },
      (error) => {
        const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
        const duration = endTime - startTime;
        if (typeof window !== 'undefined') {
          this.updateMetric('documentParseTime', duration);
        }
        throw error;
      }
    );
  }

  /**
   * Track render performance
   */
  trackRenderPerformance(componentName: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      this.updateMetric('renderTime', duration);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🎨 ${componentName} rendered in ${duration.toFixed(2)}ms`);
      }
    };
  }

  /**
   * Get current metrics
   */
  getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  /**
   * Get performance score (0-100)
   */
  getPerformanceScore(): number {
    const scores: number[] = [];

    // Core Web Vitals scoring
    if (this.metrics.lcp !== null && this.metrics.lcp !== undefined) {
      scores.push(this.metrics.lcp <= 2500 ? 100 : Math.max(0, 100 - (this.metrics.lcp - 2500) / 25));
    }

    if (this.metrics.fid !== null && this.metrics.fid !== undefined) {
      scores.push(this.metrics.fid <= 100 ? 100 : Math.max(0, 100 - (this.metrics.fid - 100) / 2));
    }

    if (this.metrics.cls !== null && this.metrics.cls !== undefined) {
      scores.push(this.metrics.cls <= 0.1 ? 100 : Math.max(0, 100 - (this.metrics.cls - 0.1) * 500));
    }

    // Custom metrics scoring
    if (this.metrics.componentLoadTime !== null && this.metrics.componentLoadTime !== undefined) {
      scores.push(this.metrics.componentLoadTime <= 3000 ? 100 : Math.max(0, 100 - (this.metrics.componentLoadTime - 3000) / 50));
    }

    return scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
  }

  /**
   * Get performance alerts
   */
  getAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }

  /**
   * Get performance report
   */
  getPerformanceReport(): {
    metrics: Partial<PerformanceMetrics>;
    score: number;
    alerts: PerformanceAlert[];
    recommendations: string[];
  } {
    const metrics = this.getMetrics();
    const score = this.getPerformanceScore();
    const alerts = this.getAlerts();
    const recommendations = this.generateRecommendations(metrics, alerts);

    return {
      metrics,
      score,
      alerts,
      recommendations,
    };
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(
    metrics: Partial<PerformanceMetrics>,
    alerts: PerformanceAlert[]
  ): string[] {
    const recommendations: string[] = [];

    // Core Web Vitals recommendations
    if (metrics.lcp && metrics.lcp > 2500) {
      recommendations.push('Optimize Largest Contentful Paint by reducing image sizes and improving server response times');
    }

    if (metrics.fid && metrics.fid > 100) {
      recommendations.push('Reduce First Input Delay by minimizing JavaScript execution time');
    }

    if (metrics.cls && metrics.cls > 0.1) {
      recommendations.push('Improve Cumulative Layout Shift by setting dimensions for images and ads');
    }

    // Custom metrics recommendations
    if (metrics.componentLoadTime && metrics.componentLoadTime > 3000) {
      recommendations.push('Optimize component loading with code splitting and lazy loading');
    }

    if (metrics.analysisTime && metrics.analysisTime > 30000) {
      recommendations.push('Consider caching analysis results or optimizing AI processing');
    }

    if (metrics.memoryUsage && metrics.memoryUsage > 100 * 1024 * 1024) {
      recommendations.push('Reduce memory usage by cleaning up unused objects and optimizing data structures');
    }

    // Alert-based recommendations
    const criticalAlerts = alerts.filter(alert => alert.type === 'critical');
    if (criticalAlerts.length > 0) {
      recommendations.push(`Address ${criticalAlerts.length} critical performance issues immediately`);
    }

    return recommendations;
  }

  /**
   * Export performance data for analytics
   */
  exportPerformanceData(): {
    entries: PerformanceEntry[];
    summary: {
      averageScore: number;
      totalAlerts: number;
      criticalAlerts: number;
      sessionDuration: number;
    };
  } {
    const scores = this.entries.map(() => this.getPerformanceScore());
    const averageScore = scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
    const criticalAlerts = this.alerts.filter(alert => alert.type === 'critical').length;
    const sessionDuration = Date.now() - (this.entries[0]?.timestamp || Date.now());

    return {
      entries: [...this.entries],
      summary: {
        averageScore,
        totalAlerts: this.alerts.length,
        criticalAlerts,
        sessionDuration,
      },
    };
  }

  /**
   * Clear all performance data
   */
  clearData(): void {
    this.metrics = {};
    this.entries = [];
    this.alerts = [];
  }

  /**
   * Stop monitoring and cleanup
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate entry ID
   */
  private generateEntryId(): string {
    return `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Performance monitoring utilities
export const performanceUtils = {
  /**
   * Initialize performance monitoring for the app
   */
  initialize: () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 Performance monitoring initialized');
      
      // Log performance report every 30 seconds in development
      setInterval(() => {
        const report = performanceMonitor.getPerformanceReport();
        if (report.score < 80 || report.alerts.length > 0) {
          console.group('⚡ Performance Report');
          console.log('Score:', report.score.toFixed(1));
          console.log('Metrics:', report.metrics);
          if (report.alerts.length > 0) {
            console.warn('Alerts:', report.alerts);
          }
          if (report.recommendations.length > 0) {
            console.info('Recommendations:', report.recommendations);
          }
          console.groupEnd();
        }
      }, 30000);
    }
  },

  /**
   * Track component with performance monitoring
   */
  withPerformanceTracking: <T extends (...args: any[]) => any>(
    fn: T,
    componentName: string
  ): T => {
    return ((...args: unknown[]) => {
      return performanceMonitor.trackComponentPerformance(
        componentName,
        async () => fn(...args)
      );
    }) as T;
  },

  /**
   * Get performance insights for optimization
   */
  getOptimizationInsights: () => {
    const report = performanceMonitor.getPerformanceReport();
    const data = performanceMonitor.exportPerformanceData();
    
    return {
      currentPerformance: report,
      historicalData: data,
      priorityActions: report.recommendations.slice(0, 3),
      performanceTrend: data.summary.averageScore >= 80 ? 'good' : 'needs-improvement',
    };
  },
};