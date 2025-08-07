/**
 * Lazy loading utilities for heavy components and modules
 * Implements intelligent loading with preloading, error boundaries, and performance monitoring
 */

import { lazy, ComponentType, LazyExoticComponent } from 'react';
import { componentCache } from './cacheManager';

export interface LazyLoadConfig {
  preload?: boolean;
  timeout?: number;
  retries?: number;
  fallback?: ComponentType;
  onError?: (error: Error) => void;
  onLoad?: (componentName: string, loadTime: number) => void;
}

export interface LoadingStats {
  componentName: string;
  loadTime: number;
  success: boolean;
  error?: string;
  timestamp: number;
}

class LazyLoadManager {
  private loadingStats: LoadingStats[] = [];
  private preloadedComponents = new Set<string>();
  private loadingPromises = new Map<string, Promise<any>>();

  /**
   * Create a lazy-loaded component with enhanced features
   */
  createLazyComponent<T extends ComponentType<any>>(
    importFn: () => Promise<{ default: T }>,
    componentName: string,
    config: LazyLoadConfig = {}
  ): LazyExoticComponent<T> {
    const {
      timeout = 10000,
      retries = 2,
      onError,
      onLoad,
    } = config;

    const enhancedImportFn = async (): Promise<{ default: T }> => {
      const startTime = performance.now();
      
      try {
        // Check if component is cached
        const cached = componentCache.get(`lazy:${componentName}`);
        if (cached) {
          const loadTime = performance.now() - startTime;
          this.recordLoadingStats(componentName, loadTime, true);
          onLoad?.(componentName, loadTime);
          return cached;
        }

        // Load component with timeout and retries
        const component = await this.loadWithRetries(importFn, retries, timeout);
        
        // Cache the loaded component
        componentCache.set(`lazy:${componentName}`, component, 15 * 60 * 1000); // 15 minutes
        
        const loadTime = performance.now() - startTime;
        this.recordLoadingStats(componentName, loadTime, true);
        onLoad?.(componentName, loadTime);
        
        return component;
      } catch (error) {
        const loadTime = performance.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        this.recordLoadingStats(componentName, loadTime, false, errorMessage);
        onError?.(error instanceof Error ? error : new Error(errorMessage));
        
        throw error;
      }
    };

    return lazy(enhancedImportFn);
  }

  /**
   * Preload a component without rendering it
   */
  async preloadComponent(
    importFn: () => Promise<any>,
    componentName: string
  ): Promise<void> {
    if (this.preloadedComponents.has(componentName)) {
      return;
    }

    // Check if already loading
    if (this.loadingPromises.has(componentName)) {
      await this.loadingPromises.get(componentName);
      return;
    }

    const loadingPromise = importFn().then(component => {
      componentCache.set(`lazy:${componentName}`, component, 15 * 60 * 1000);
      this.preloadedComponents.add(componentName);
      return component;
    }).catch(error => {
      console.warn(`Failed to preload component ${componentName}:`, error);
      throw error;
    }).finally(() => {
      this.loadingPromises.delete(componentName);
    });

    this.loadingPromises.set(componentName, loadingPromise);
    await loadingPromise;
  }

  /**
   * Load component with retries and timeout
   */
  private async loadWithRetries<T>(
    importFn: () => Promise<T>,
    retries: number,
    timeout: number
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await Promise.race([
          importFn(),
          new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Component load timeout')), timeout);
          })
        ]);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt < retries) {
          // Wait before retry with exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    throw lastError!;
  }

  /**
   * Record loading statistics
   */
  private recordLoadingStats(
    componentName: string,
    loadTime: number,
    success: boolean,
    error?: string
  ): void {
    this.loadingStats.push({
      componentName,
      loadTime,
      success,
      error,
      timestamp: Date.now(),
    });

    // Keep only last 100 entries
    if (this.loadingStats.length > 100) {
      this.loadingStats = this.loadingStats.slice(-100);
    }
  }

  /**
   * Get loading statistics
   */
  getLoadingStats(): LoadingStats[] {
    return [...this.loadingStats];
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    const stats = this.loadingStats;
    const successful = stats.filter(s => s.success);
    const failed = stats.filter(s => !s.success);

    return {
      totalLoads: stats.length,
      successfulLoads: successful.length,
      failedLoads: failed.length,
      successRate: stats.length > 0 ? successful.length / stats.length : 0,
      averageLoadTime: successful.length > 0 
        ? successful.reduce((sum, s) => sum + s.loadTime, 0) / successful.length 
        : 0,
      slowestLoad: successful.length > 0 
        ? Math.max(...successful.map(s => s.loadTime)) 
        : 0,
      fastestLoad: successful.length > 0 
        ? Math.min(...successful.map(s => s.loadTime)) 
        : 0,
    };
  }

  /**
   * Clear all cached components
   */
  clearCache(): void {
    this.preloadedComponents.clear();
    this.loadingPromises.clear();
    componentCache.clear();
  }
}

// Global lazy load manager
export const lazyLoadManager = new LazyLoadManager();

// Convenience function for creating lazy components
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  componentName: string,
  config?: LazyLoadConfig
): LazyExoticComponent<T> {
  return lazyLoadManager.createLazyComponent(importFn, componentName, config);
}

// Preload function
export function preloadComponent(
  importFn: () => Promise<any>,
  componentName: string
): Promise<void> {
  return lazyLoadManager.preloadComponent(importFn, componentName);
}

// Heavy component definitions with lazy loading
export const LazyComponents = {
  // Editor components (heavy due to drag-drop and complex state)
  ResumeEditor: createLazyComponent(
    () => import('@/components/editor/ResumeEditor'),
    'ResumeEditor',
    {
      timeout: 15000,
      onLoad: (name, time) => console.log(`Loaded ${name} in ${time.toFixed(2)}ms`),
    }
  ),

  AIResumeBuilder: createLazyComponent(
    () => import('@/components/editor/AIResumeBuilder'),
    'AIResumeBuilder',
    {
      timeout: 15000,
    }
  ),

  TemplateSelector: createLazyComponent(
    () => import('@/components/editor/TemplateSelector'),
    'TemplateSelector'
  ),

  // Analysis components (heavy due to AI processing)
  AnalysisResults: createLazyComponent(
    () => import('@/components/results/AnalysisResults'),
    'AnalysisResults'
  ),

  DetailedBreakdown: createLazyComponent(
    () => import('@/components/results/DetailedBreakdown'),
    'DetailedBreakdown'
  ),

  // Dashboard components (heavy due to charts and data processing)
  DashboardHome: createLazyComponent(
    () => import('@/components/dashboard/DashboardHome'),
    'DashboardHome'
  ),

  AnalysisHistory: createLazyComponent(
    () => import('@/components/dashboard/AnalysisHistory'),
    'AnalysisHistory'
  ),

  // Admin components (heavy due to complex data tables and charts)
  AdminLogin: createLazyComponent(
    () => import('@/components/admin/AdminLogin'),
    'AdminLogin',
    {
      timeout: 20000, // Admin components might be larger
    }
  ),

  ModelManagement: createLazyComponent(
    () => import('@/components/admin/ModelManagement'),
    'ModelManagement'
  ),

  StatsOverview: createLazyComponent(
    () => import('@/components/admin/StatsOverview'),
    'StatsOverview'
  ),

  // Document parsers (heavy due to PDF.js and other libraries)
  DocumentUploader: createLazyComponent(
    () => import('@/components/upload/DocumentUploader'),
    'DocumentUploader'
  ),
};

// Preloading strategies
export const preloadStrategies = {
  /**
   * Preload components based on user route
   */
  preloadForRoute: async (route: string) => {
    const preloadMap: Record<string, string[]> = {
      '/analyze': ['DocumentUploader', 'AnalysisResults'],
      '/dashboard': ['DashboardHome', 'AnalysisHistory'],
      '/editor': ['ResumeEditor', 'TemplateSelector', 'AIResumeBuilder'],
      '/admin': ['AdminLogin', 'ModelManagement', 'StatsOverview'],
    };

    const componentsToPreload = preloadMap[route] || [];
    
    const preloadPromises = componentsToPreload.map(async (componentName) => {
      try {
        switch (componentName) {
          case 'DocumentUploader':
            await preloadComponent(() => import('@/components/upload/DocumentUploader'), componentName);
            break;
          case 'AnalysisResults':
            await preloadComponent(() => import('@/components/results/AnalysisResults'), componentName);
            break;
          case 'DashboardHome':
            await preloadComponent(() => import('@/components/dashboard/DashboardHome'), componentName);
            break;
          case 'AnalysisHistory':
            await preloadComponent(() => import('@/components/dashboard/AnalysisHistory'), componentName);
            break;
          case 'ResumeEditor':
            await preloadComponent(() => import('@/components/editor/ResumeEditor'), componentName);
            break;
          case 'TemplateSelector':
            await preloadComponent(() => import('@/components/editor/TemplateSelector'), componentName);
            break;
          case 'AIResumeBuilder':
            await preloadComponent(() => import('@/components/editor/AIResumeBuilder'), componentName);
            break;
          case 'AdminLogin':
            await preloadComponent(() => import('@/components/admin/AdminLogin'), componentName);
            break;
          case 'ModelManagement':
            await preloadComponent(() => import('@/components/admin/ModelManagement'), componentName);
            break;
          case 'StatsOverview':
            await preloadComponent(() => import('@/components/admin/StatsOverview'), componentName);
            break;
        }
      } catch (error) {
        console.warn(`Failed to preload ${componentName}:`, error);
      }
    });

    await Promise.allSettled(preloadPromises);
  },

  /**
   * Preload components on user interaction (hover, focus)
   */
  preloadOnInteraction: (componentName: string) => {
    // This would be called from component event handlers
    const importMap: Record<string, () => Promise<any>> = {
      'ResumeEditor': () => import('@/components/editor/ResumeEditor'),
      'AIResumeBuilder': () => import('@/components/editor/AIResumeBuilder'),
      'AnalysisResults': () => import('@/components/results/AnalysisResults'),
      'DashboardHome': () => import('@/components/dashboard/DashboardHome'),
      'AdminLogin': () => import('@/components/admin/AdminLogin'),
      'ModelManagement': () => import('@/components/admin/ModelManagement'),
      'StatsOverview': () => import('@/components/admin/StatsOverview'),
    };

    const importFn = importMap[componentName];
    if (importFn) {
      preloadComponent(importFn, componentName).catch(error => {
        console.warn(`Failed to preload ${componentName} on interaction:`, error);
      });
    }
  },

  /**
   * Preload critical components on app initialization
   */
  preloadCritical: async () => {
    const criticalComponents = [
      'DocumentUploader',
      'AnalysisResults',
    ];

    const preloadPromises = criticalComponents.map(componentName => 
      preloadStrategies.preloadOnInteraction(componentName)
    );

    await Promise.allSettled(preloadPromises);
  },
};

// Performance monitoring
export const performanceMonitor = {
  /**
   * Get lazy loading performance report
   */
  getReport: () => {
    const metrics = lazyLoadManager.getPerformanceMetrics();
    const cacheStats = componentCache.getStats();
    
    return {
      lazyLoading: metrics,
      caching: cacheStats,
      recommendations: performanceMonitor.getRecommendations(metrics),
    };
  },

  /**
   * Get performance recommendations
   */
  getRecommendations: (metrics: ReturnType<typeof lazyLoadManager.getPerformanceMetrics>) => {
    const recommendations: string[] = [];

    if (metrics.successRate < 0.95) {
      recommendations.push('Consider improving network reliability or reducing component sizes');
    }

    if (metrics.averageLoadTime > 3000) {
      recommendations.push('Components are loading slowly - consider code splitting or reducing bundle sizes');
    }

    if (metrics.slowestLoad > 10000) {
      recommendations.push('Some components are taking too long to load - investigate heavy dependencies');
    }

    return recommendations;
  },

  /**
   * Log performance metrics to console (development only)
   */
  logMetrics: () => {
    if (process.env.NODE_ENV === 'development') {
      const report = performanceMonitor.getReport();
      console.group('🚀 Lazy Loading Performance Report');
      console.table(report.lazyLoading);
      console.log('Cache Stats:', report.caching);
      if (report.recommendations.length > 0) {
        console.warn('Recommendations:', report.recommendations);
      }
      console.groupEnd();
    }
  },
};