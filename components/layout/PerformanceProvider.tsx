'use client';

import React, { useEffect } from 'react';
import { usePerformanceOptimization } from '@/lib/hooks/usePerformanceOptimization';

interface PerformanceProviderProps {
  children: React.ReactNode;
}

/**
 * Performance provider that initializes and manages performance optimizations
 * across the entire application
 */
export default function PerformanceProvider({ children }: PerformanceProviderProps) {
  const {
    getPerformanceMetrics,
    cacheManagement,
    bundleOptimization,
    isInitialized,
  } = usePerformanceOptimization({
    enableMonitoring: true,
    enablePreloading: true,
    enableCaching: true,
    enableBundleOptimization: true,
    preloadOnHover: true,
    preloadOnVisible: true,
  });

  useEffect(() => {
    // Log performance metrics in development
    if (process.env.NODE_ENV === 'development' && isInitialized) {
      const logPerformanceMetrics = () => {
        const metrics = getPerformanceMetrics();
        const cacheStats = cacheManagement().getStats();
        const bundleReport = bundleOptimization().getReport();

        console.group('📊 Performance Dashboard');
        console.log('Current Performance:', metrics.currentPerformance);
        console.log('Cache Statistics:', cacheStats);
        console.log('Bundle Report:', bundleReport);
        console.log('Performance Trend:', metrics.performanceTrend);
        
        if (metrics.priorityActions.length > 0) {
          console.warn('Priority Actions:', metrics.priorityActions);
        }
        
        console.groupEnd();
      };

      // Log metrics every 60 seconds in development
      const interval = setInterval(logPerformanceMetrics, 60000);
      
      // Log initial metrics after 5 seconds
      setTimeout(logPerformanceMetrics, 5000);

      return () => clearInterval(interval);
    }
  }, [isInitialized, getPerformanceMetrics, cacheManagement, bundleOptimization]);

  // Add performance monitoring to window for debugging
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      (window as any).__PERFORMANCE_UTILS__ = {
        getMetrics: getPerformanceMetrics,
        cache: cacheManagement(),
        bundle: bundleOptimization(),
      };

      console.log('🔧 Performance utilities available at window.__PERFORMANCE_UTILS__');
    }
  }, [getPerformanceMetrics, cacheManagement, bundleOptimization]);

  return <>{children}</>;
}