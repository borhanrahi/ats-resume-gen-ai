/**
 * Bundle optimization utilities for code splitting and performance
 * Implements dynamic imports, tree shaking helpers, and bundle analysis
 */

export interface BundleConfig {
  enableCodeSplitting: boolean;
  enableTreeShaking: boolean;
  enablePreloading: boolean;
  chunkSizeLimit: number;
  priorityRoutes: string[];
}

export interface BundleStats {
  totalSize: number;
  chunkCount: number;
  largestChunk: number;
  smallestChunk: number;
  averageChunkSize: number;
  duplicatedModules: string[];
}

export interface ModuleInfo {
  name: string;
  size: number;
  imports: string[];
  exports: string[];
  isTreeShakeable: boolean;
}

class BundleOptimizer {
  private config: BundleConfig;
  private moduleRegistry = new Map<string, ModuleInfo>();
  private loadedChunks = new Set<string>();

  constructor(config: Partial<BundleConfig> = {}) {
    this.config = {
      enableCodeSplitting: true,
      enableTreeShaking: true,
      enablePreloading: true,
      chunkSizeLimit: 250 * 1024, // 250KB
      priorityRoutes: ['/analyze', '/dashboard'],
      ...config,
    };
  }

  /**
   * Create optimized dynamic import with intelligent chunking
   */
  createOptimizedImport<T>(
    importPath: string,
    chunkName?: string,
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): () => Promise<T> {
    return async (): Promise<T> => {
      const startTime = performance.now();
      
      try {
        // Use webpackChunkName for better chunk naming
        const module = await this.dynamicImportWithChunkName(importPath, chunkName);
        
        const loadTime = performance.now() - startTime;
        this.recordChunkLoad(chunkName || importPath, loadTime, true);
        
        return module;
      } catch (error) {
        const loadTime = performance.now() - startTime;
        this.recordChunkLoad(chunkName || importPath, loadTime, false);
        throw error;
      }
    };
  }

  /**
   * Dynamic import with chunk naming
   */
  private async dynamicImportWithChunkName(importPath: string, chunkName?: string): Promise<any> {
    // This would be replaced by webpack's dynamic import with magic comments
    // For now, we'll simulate the behavior
    const actualChunkName = chunkName || this.generateChunkName(importPath);
    
    // Mark chunk as loaded
    this.loadedChunks.add(actualChunkName);
    
    // Perform the actual import
    return import(/* webpackChunkName: "[request]" */ importPath);
  }

  /**
   * Generate intelligent chunk names based on import path
   */
  private generateChunkName(importPath: string): string {
    const pathParts = importPath.split('/');
    const fileName = pathParts[pathParts.length - 1];
    const directory = pathParts[pathParts.length - 2];
    
    return `${directory}-${fileName}`.replace(/[^a-zA-Z0-9]/g, '-');
  }

  /**
   * Preload critical chunks based on route
   */
  async preloadCriticalChunks(currentRoute: string): Promise<void> {
    const criticalChunks = this.getCriticalChunksForRoute(currentRoute);
    
    const preloadPromises = criticalChunks.map(async (chunk) => {
      try {
        await this.preloadChunk(chunk);
      } catch (error) {
        console.warn(`Failed to preload chunk ${chunk}:`, error);
      }
    });

    await Promise.allSettled(preloadPromises);
  }

  /**
   * Get critical chunks for a specific route
   */
  private getCriticalChunksForRoute(route: string): string[] {
    const routeChunkMap: Record<string, string[]> = {
      '/analyze': [
        'upload-DocumentUploader',
        'analysis-AnalysisResults',
        'parsers-pdfParser',
        'ai-analysisEngine',
      ],
      '/dashboard': [
        'dashboard-DashboardHome',
        'dashboard-AnalysisHistory',
        'auth-AuthGuard',
      ],
      '/editor': [
        'editor-ResumeEditor',
        'editor-TemplateSelector',
        'editor-AIResumeBuilder',
        'utils-exportUtils',
      ],
      '/admin': [
        'admin-AdminDashboard',
        'admin-UserManagement',
        'admin-SystemMetrics',
      ],
    };

    return routeChunkMap[route] || [];
  }

  /**
   * Preload a specific chunk
   */
  private async preloadChunk(chunkName: string): Promise<void> {
    if (this.loadedChunks.has(chunkName)) {
      return; // Already loaded
    }

    // Create a link element for preloading
    if (typeof window !== 'undefined') {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'script';
      link.href = this.getChunkUrl(chunkName);
      
      document.head.appendChild(link);
      
      // Remove the link after a delay to clean up
      setTimeout(() => {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
      }, 10000);
    }
  }

  /**
   * Get URL for a chunk (this would be provided by webpack in real implementation)
   */
  private getChunkUrl(chunkName: string): string {
    // This is a placeholder - in real implementation, webpack would provide chunk URLs
    return `/_next/static/chunks/${chunkName}.js`;
  }

  /**
   * Record chunk loading statistics
   */
  private recordChunkLoad(chunkName: string, loadTime: number, success: boolean): void {
    // This could be sent to analytics or stored for performance monitoring
    if (process.env.NODE_ENV === 'development') {
      console.log(`Chunk ${chunkName} loaded in ${loadTime.toFixed(2)}ms (${success ? 'success' : 'failed'})`);
    }
  }

  /**
   * Analyze bundle composition and suggest optimizations
   */
  analyzeBundleComposition(): {
    stats: BundleStats;
    recommendations: string[];
  } {
    const stats = this.getBundleStats();
    const recommendations = this.generateOptimizationRecommendations(stats);

    return { stats, recommendations };
  }

  /**
   * Get bundle statistics
   */
  private getBundleStats(): BundleStats {
    // This would be populated by webpack bundle analyzer in real implementation
    return {
      totalSize: 0,
      chunkCount: this.loadedChunks.size,
      largestChunk: 0,
      smallestChunk: 0,
      averageChunkSize: 0,
      duplicatedModules: [],
    };
  }

  /**
   * Generate optimization recommendations
   */
  private generateOptimizationRecommendations(stats: BundleStats): string[] {
    const recommendations: string[] = [];

    if (stats.largestChunk > this.config.chunkSizeLimit) {
      recommendations.push(`Largest chunk (${stats.largestChunk} bytes) exceeds limit. Consider further code splitting.`);
    }

    if (stats.duplicatedModules.length > 0) {
      recommendations.push(`Found ${stats.duplicatedModules.length} duplicated modules. Consider using webpack's SplitChunksPlugin.`);
    }

    if (stats.chunkCount > 20) {
      recommendations.push('High number of chunks may impact loading performance. Consider consolidating smaller chunks.');
    }

    return recommendations;
  }

  /**
   * Tree shaking utilities
   */
  getTreeShakingHelpers() {
    return {
      /**
       * Mark exports as side-effect free for better tree shaking
       */
      markPure: <T>(fn: T): T => {
        // This would be used with webpack's /*#__PURE__*/ comment
        return fn;
      },

      /**
       * Create tree-shakeable module exports
       */
      createTreeShakeableExports: <T extends Record<string, any>>(exports: T): T => {
        // Ensure each export is individually importable
        return exports;
      },

      /**
       * Identify unused exports (development only)
       */
      identifyUnusedExports: (moduleName: string): string[] => {
        const moduleInfo = this.moduleRegistry.get(moduleName);
        if (!moduleInfo) return [];

        // This would analyze actual usage in a real implementation
        return [];
      },
    };
  }

  /**
   * Code splitting utilities
   */
  getCodeSplittingHelpers() {
    return {
      /**
       * Create route-based code splitting
       */
      createRouteChunk: (routePath: string) => {
        const chunkName = `route-${routePath.replace(/[^a-zA-Z0-9]/g, '-')}`;
        return this.createOptimizedImport(routePath, chunkName, 'high');
      },

      /**
       * Create feature-based code splitting
       */
      createFeatureChunk: (featureName: string, importPath: string) => {
        const chunkName = `feature-${featureName}`;
        return this.createOptimizedImport(importPath, chunkName, 'medium');
      },

      /**
       * Create vendor code splitting
       */
      createVendorChunk: (vendorName: string, importPath: string) => {
        const chunkName = `vendor-${vendorName}`;
        return this.createOptimizedImport(importPath, chunkName, 'low');
      },
    };
  }

  /**
   * Performance monitoring for bundles
   */
  getPerformanceMonitor() {
    return {
      /**
       * Monitor chunk loading performance
       */
      monitorChunkLoading: () => {
        if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry) => {
              if (entry.name.includes('chunk')) {
                console.log(`Chunk loaded: ${entry.name} in ${entry.duration}ms`);
              }
            });
          });

          observer.observe({ entryTypes: ['resource'] });
        }
      },

      /**
       * Get loading performance metrics
       */
      getLoadingMetrics: () => {
        if (typeof window === 'undefined') return null;

        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

        const jsResources = resources.filter(r => r.name.endsWith('.js'));
        const totalJSSize = jsResources.reduce((sum, r) => sum + (r.transferSize || 0), 0);

        return {
          totalLoadTime: navigation.loadEventEnd - navigation.navigationStart,
          jsLoadTime: jsResources.reduce((sum, r) => sum + r.duration, 0),
          totalJSSize,
          chunkCount: jsResources.length,
          averageChunkLoadTime: jsResources.length > 0 
            ? jsResources.reduce((sum, r) => sum + r.duration, 0) / jsResources.length 
            : 0,
        };
      },
    };
  }
}

// Global bundle optimizer instance
export const bundleOptimizer = new BundleOptimizer();

// Optimized imports for heavy modules
export const OptimizedImports = {
  // AI and analysis modules
  analysisEngine: bundleOptimizer.createOptimizedImport(
    '@/lib/ai/analysisEngine',
    'ai-analysis-engine',
    'high'
  ),

  openRouterClient: bundleOptimizer.createOptimizedImport(
    '@/lib/ai/openRouterClient',
    'ai-openrouter-client',
    'high'
  ),

  geminiClient: bundleOptimizer.createOptimizedImport(
    '@/lib/ai/geminiClient',
    'ai-gemini-client',
    'high'
  ),

  // Document parsers
  pdfParser: bundleOptimizer.createOptimizedImport(
    '@/lib/parsers/pdfParser',
    'parser-pdf',
    'high'
  ),

  docxParser: bundleOptimizer.createOptimizedImport(
    '@/lib/parsers/docxParser',
    'parser-docx',
    'high'
  ),

  // Export utilities
  exportUtils: bundleOptimizer.createOptimizedImport(
    '@/lib/utils/exportUtils',
    'utils-export',
    'medium'
  ),

  // Template utilities
  templateUtils: bundleOptimizer.createOptimizedImport(
    '@/lib/templateUtils',
    'utils-template',
    'medium'
  ),

  // Heavy UI libraries
  framerMotion: bundleOptimizer.createOptimizedImport(
    'framer-motion',
    'vendor-framer-motion',
    'low'
  ),

  chartLibrary: bundleOptimizer.createOptimizedImport(
    'recharts',
    'vendor-charts',
    'low'
  ),
};

// Bundle optimization strategies
export const optimizationStrategies = {
  /**
   * Initialize bundle optimization for the app
   */
  initialize: async (currentRoute: string) => {
    // Start performance monitoring
    bundleOptimizer.getPerformanceMonitor().monitorChunkLoading();

    // Preload critical chunks for current route
    await bundleOptimizer.preloadCriticalChunks(currentRoute);

    // Log performance metrics in development
    if (process.env.NODE_ENV === 'development') {
      setTimeout(() => {
        const metrics = bundleOptimizer.getPerformanceMonitor().getLoadingMetrics();
        if (metrics) {
          console.group('📦 Bundle Performance Metrics');
          console.table(metrics);
          console.groupEnd();
        }
      }, 2000);
    }
  },

  /**
   * Optimize for mobile devices
   */
  optimizeForMobile: () => {
    // Reduce chunk size limits for mobile
    bundleOptimizer['config'].chunkSizeLimit = 150 * 1024; // 150KB for mobile

    // Prioritize critical chunks only
    bundleOptimizer['config'].priorityRoutes = ['/analyze'];
  },

  /**
   * Optimize for desktop devices
   */
  optimizeForDesktop: () => {
    // Increase chunk size limits for desktop
    bundleOptimizer['config'].chunkSizeLimit = 500 * 1024; // 500KB for desktop

    // Enable more aggressive preloading
    bundleOptimizer['config'].priorityRoutes = ['/analyze', '/dashboard', '/editor'];
  },

  /**
   * Get optimization report
   */
  getOptimizationReport: () => {
    const analysis = bundleOptimizer.analyzeBundleComposition();
    const performanceMetrics = bundleOptimizer.getPerformanceMonitor().getLoadingMetrics();

    return {
      bundleAnalysis: analysis,
      performanceMetrics,
      recommendations: [
        ...analysis.recommendations,
        ...(performanceMetrics?.totalLoadTime > 3000 
          ? ['Consider reducing bundle sizes or improving caching'] 
          : []),
      ],
    };
  },
};

// Tree shaking helpers
export const treeShakingHelpers = bundleOptimizer.getTreeShakingHelpers();

// Code splitting helpers
export const codeSplittingHelpers = bundleOptimizer.getCodeSplittingHelpers();