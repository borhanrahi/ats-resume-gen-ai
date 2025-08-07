'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { performanceUtils } from '@/lib/utils/performanceMonitor';
import { preloadStrategies } from '@/lib/utils/lazyLoader';
import { optimizationStrategies } from '@/lib/utils/bundleOptimizer';
import { cacheUtils } from '@/lib/utils/cacheManager';

interface PerformanceConfig {
  enableMonitoring: boolean;
  enablePreloading: boolean;
  enableCaching: boolean;
  enableBundleOptimization: boolean;
  preloadOnHover: boolean;
  preloadOnVisible: boolean;
}

const DEFAULT_CONFIG: PerformanceConfig = {
  enableMonitoring: true,
  enablePreloading: true,
  enableCaching: true,
  enableBundleOptimization: true,
  preloadOnHover: true,
  preloadOnVisible: true,
};

/**
 * Hook for managing performance optimizations across the application
 */
export function usePerformanceOptimization(config: Partial<PerformanceConfig> = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const router = useRouter();
  const pathname = usePathname();
  const initializationRef = useRef(false);

  // Initialize performance systems
  useEffect(() => {
    if (initializationRef.current) return;
    initializationRef.current = true;

    const initialize = async () => {
      try {
        // Initialize performance monitoring
        if (finalConfig.enableMonitoring) {
          performanceUtils.initialize();
        }

        // Initialize bundle optimization
        if (finalConfig.enableBundleOptimization) {
          await optimizationStrategies.initialize(pathname);
          
          // Optimize based on device type
          if (typeof window !== 'undefined') {
            const isMobile = window.innerWidth < 768;
            if (isMobile) {
              optimizationStrategies.optimizeForMobile();
            } else {
              optimizationStrategies.optimizeForDesktop();
            }
          }
        }

        // Warm up caches
        if (finalConfig.enableCaching) {
          await cacheUtils.warmup();
        }

        // Preload critical components
        if (finalConfig.enablePreloading) {
          await preloadStrategies.preloadCritical();
        }

        console.log('🚀 Performance optimization initialized');
      } catch (error) {
        console.warn('Failed to initialize performance optimizations:', error);
      }
    };

    initialize();
  }, [pathname, finalConfig]);

  // Preload components for route changes
  useEffect(() => {
    if (finalConfig.enablePreloading) {
      preloadStrategies.preloadForRoute(pathname).catch(error => {
        console.warn('Failed to preload components for route:', error);
      });
    }
  }, [pathname, finalConfig.enablePreloading]);

  // Preload on hover functionality
  const preloadOnHover = useCallback((componentName: string) => {
    if (finalConfig.preloadOnHover) {
      preloadStrategies.preloadOnInteraction(componentName);
    }
  }, [finalConfig.preloadOnHover]);

  // Preload on visible functionality
  const preloadOnVisible = useCallback((componentName: string, element: Element) => {
    if (!finalConfig.preloadOnVisible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            preloadStrategies.preloadOnInteraction(componentName);
            observer.unobserve(element);
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(element);

    return () => observer.unobserve(element);
  }, [finalConfig.preloadOnVisible]);

  // Performance metrics getter
  const getPerformanceMetrics = useCallback(() => {
    return performanceUtils.getOptimizationInsights();
  }, []);

  // Cache management
  const cacheManagement = useCallback(() => ({
    clear: cacheUtils.clearAll,
    getStats: cacheUtils.getAllStats,
    getHitRatio: cacheUtils.getOverallHitRatio,
  }), []);

  // Bundle optimization controls
  const bundleOptimization = useCallback(() => ({
    getReport: optimizationStrategies.getOptimizationReport,
    optimizeForMobile: optimizationStrategies.optimizeForMobile,
    optimizeForDesktop: optimizationStrategies.optimizeForDesktop,
  }), []);

  return {
    preloadOnHover,
    preloadOnVisible,
    getPerformanceMetrics,
    cacheManagement,
    bundleOptimization,
    isInitialized: initializationRef.current,
  };
}

/**
 * Hook for component-level performance optimization
 */
export function useComponentPerformance(componentName: string) {
  const renderStartTime = useRef<number>(Date.now());
  const mountTime = useRef<number | null>(null);

  useEffect(() => {
    mountTime.current = Date.now() - renderStartTime.current;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`⚡ ${componentName} mounted in ${mountTime.current}ms`);
    }
  }, [componentName]);

  const trackOperation = useCallback(
    async <T>(operation: () => Promise<T>, operationName?: string): Promise<T> => {
      const startTime = Date.now();
      try {
        const result = await operation();
        const duration = Date.now() - startTime;
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`⚡ ${componentName}${operationName ? `.${operationName}` : ''} completed in ${duration}ms`);
        }
        
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        console.warn(`❌ ${componentName}${operationName ? `.${operationName}` : ''} failed after ${duration}ms:`, error);
        throw error;
      }
    },
    [componentName]
  );

  return {
    mountTime: mountTime.current,
    trackOperation,
  };
}

/**
 * Hook for managing resource preloading
 */
export function useResourcePreloading() {
  const preloadedResources = useRef(new Set<string>());

  const preloadResource = useCallback((url: string, type: 'script' | 'style' | 'image' | 'font') => {
    if (preloadedResources.current.has(url)) return;
    
    preloadedResources.current.add(url);

    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    
    switch (type) {
      case 'script':
        link.as = 'script';
        break;
      case 'style':
        link.as = 'style';
        break;
      case 'image':
        link.as = 'image';
        break;
      case 'font':
        link.as = 'font';
        link.crossOrigin = 'anonymous';
        break;
    }

    document.head.appendChild(link);

    // Clean up after 30 seconds
    setTimeout(() => {
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
      preloadedResources.current.delete(url);
    }, 30000);
  }, []);

  const preloadImage = useCallback((src: string) => {
    preloadResource(src, 'image');
  }, [preloadResource]);

  const preloadFont = useCallback((src: string) => {
    preloadResource(src, 'font');
  }, [preloadResource]);

  return {
    preloadResource,
    preloadImage,
    preloadFont,
  };
}

/**
 * Hook for managing intersection-based optimizations
 */
export function useIntersectionOptimization() {
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const element = entry.target as HTMLElement;
          const componentName = element.dataset.component;
          
          if (entry.isIntersecting && componentName) {
            // Preload component when it becomes visible
            preloadStrategies.preloadOnInteraction(componentName);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
      }
    );

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const observeElement = useCallback((element: Element) => {
    if (observerRef.current) {
      observerRef.current.observe(element);
    }
  }, []);

  const unobserveElement = useCallback((element: Element) => {
    if (observerRef.current) {
      observerRef.current.unobserve(element);
    }
  }, []);

  return {
    observeElement,
    unobserveElement,
  };
}

/**
 * Hook for managing memory optimization
 */
export function useMemoryOptimization() {
  const cleanupFunctions = useRef<(() => void)[]>([]);

  const addCleanupFunction = useCallback((cleanup: () => void) => {
    cleanupFunctions.current.push(cleanup);
  }, []);

  const getMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
      };
    }
    return null;
  }, []);

  const forceGarbageCollection = useCallback(() => {
    // Run cleanup functions
    cleanupFunctions.current.forEach(cleanup => {
      try {
        cleanup();
      } catch (error) {
        console.warn('Cleanup function failed:', error);
      }
    });
    
    cleanupFunctions.current = [];

    // Force garbage collection if available (Chrome DevTools)
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
    }
  }, []);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      forceGarbageCollection();
    };
  }, [forceGarbageCollection]);

  return {
    addCleanupFunction,
    getMemoryUsage,
    forceGarbageCollection,
  };
}