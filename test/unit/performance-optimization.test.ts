/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { CacheManager, analysisCache, templateCache, componentCache } from '@/lib/utils/cacheManager';
import { lazyLoadManager } from '@/lib/utils/lazyLoader';
import { bundleOptimizer } from '@/lib/utils/bundleOptimizer';
import { performanceMonitor } from '@/lib/utils/performanceMonitor';

// Mock performance API
Object.defineProperty(window, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
    getEntriesByType: vi.fn(() => []),
    mark: vi.fn(),
    measure: vi.fn(),
    memory: {
      usedJSHeapSize: 50 * 1024 * 1024,
      totalJSHeapSize: 100 * 1024 * 1024,
      jsHeapSizeLimit: 2 * 1024 * 1024 * 1024,
    },
  },
  writable: true,
});

// Mock PerformanceObserver
global.PerformanceObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe('Performance Optimization System', () => {
  beforeEach(() => {
    // Clear all caches before each test
    analysisCache.clear();
    templateCache.clear();
    componentCache.clear();
    
    // Reset localStorage
    localStorage.clear();
    
    // Reset performance monitoring
    performanceMonitor.clearData();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('CacheManager', () => {
    it('should store and retrieve data correctly', () => {
      const cache = new CacheManager();
      const testData = { test: 'data', number: 42 };
      
      cache.set('test-key', testData);
      const retrieved = cache.get('test-key');
      
      expect(retrieved).toEqual(testData);
    });

    it('should respect TTL and expire entries', async () => {
      const cache = new CacheManager();
      const testData = { test: 'data' };
      
      // Set with 100ms TTL
      cache.set('test-key', testData, 100);
      
      // Should be available immediately
      expect(cache.get('test-key')).toEqual(testData);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Should be expired
      expect(cache.get('test-key')).toBeNull();
    });

    it('should handle cache size limits with LRU eviction', () => {
      const cache = new CacheManager({
        maxMemorySize: 1024, // 1KB limit
        defaultTTL: 60000,
        persistToLocalStorage: false,
      });

      // Fill cache beyond limit
      for (let i = 0; i < 10; i++) {
        const largeData = 'x'.repeat(200); // 200 bytes each
        cache.set(`key-${i}`, largeData);
      }

      const stats = cache.getStats();
      expect(stats.totalSize).toBeLessThanOrEqual(1024);
      expect(stats.evictions).toBeGreaterThan(0);
    });

    it('should calculate hit ratio correctly', () => {
      const cache = new CacheManager();
      
      // Set some data
      cache.set('key1', 'data1');
      cache.set('key2', 'data2');
      
      // Generate hits and misses
      cache.get('key1'); // hit
      cache.get('key2'); // hit
      cache.get('key3'); // miss
      cache.get('key4'); // miss
      
      const hitRatio = cache.getHitRatio();
      expect(hitRatio).toBe(0.5); // 2 hits out of 4 requests
    });
  });

  describe('Analysis Cache', () => {
    it('should generate consistent cache keys for same content', () => {
      const resumeContent = 'John Doe\nSoftware Engineer\nExperience with React';
      const jobDescription = 'Looking for React developer';
      
      const key1 = analysisCache.generateAnalysisKey(resumeContent, jobDescription);
      const key2 = analysisCache.generateAnalysisKey(resumeContent, jobDescription);
      
      expect(key1).toBe(key2);
    });

    it('should generate different cache keys for different content', () => {
      const resumeContent1 = 'John Doe\nSoftware Engineer';
      const resumeContent2 = 'Jane Smith\nData Scientist';
      
      const key1 = analysisCache.generateAnalysisKey(resumeContent1);
      const key2 = analysisCache.generateAnalysisKey(resumeContent2);
      
      expect(key1).not.toBe(key2);
    });

    it('should cache analysis results', () => {
      const mockAnalysisResult = {
        score: 85,
        breakdown: { formatting: 90, keywords: 80, structure: 85, length: 85 },
        recommendations: [],
        keywordMatch: { found: [], missing: [], matchPercentage: 75, density: 2.5, suggestions: [] },
        grammarIssues: [],
        modelUsed: 'test-model',
        fallbacksUsed: [],
        processingTime: 1500,
        errors: [],
        warnings: [],
      };

      const cacheKey = analysisCache.generateAnalysisKey('test resume content');
      analysisCache.set(cacheKey, mockAnalysisResult);
      
      const cached = analysisCache.get(cacheKey);
      expect(cached).toEqual(mockAnalysisResult);
    });
  });

  describe('Lazy Loading Manager', () => {
    it('should track component loading performance', async () => {
      const mockComponent = { default: () => 'Test Component' };
      const mockImport = vi.fn().mockResolvedValue(mockComponent);
      
      const lazyComponent = lazyLoadManager.createLazyComponent(
        mockImport,
        'TestComponent'
      );
      
      expect(lazyComponent).toBeDefined();
      expect(mockImport).not.toHaveBeenCalled(); // Should be lazy
    });

    it('should handle component loading failures', async () => {
      const mockError = new Error('Failed to load component');
      const mockImport = vi.fn().mockRejectedValue(mockError);
      
      await expect(
        lazyLoadManager.preloadComponent(mockImport, 'FailingComponent')
      ).rejects.toThrow('Failed to load component');
    });

    it('should provide performance metrics', () => {
      const metrics = lazyLoadManager.getPerformanceMetrics();
      
      expect(metrics).toHaveProperty('totalLoads');
      expect(metrics).toHaveProperty('successfulLoads');
      expect(metrics).toHaveProperty('failedLoads');
      expect(metrics).toHaveProperty('successRate');
      expect(metrics).toHaveProperty('averageLoadTime');
    });
  });

  describe('Bundle Optimizer', () => {
    it('should create optimized imports', () => {
      const optimizedImport = bundleOptimizer.createOptimizedImport(
        '@/components/TestComponent',
        'test-component',
        'high'
      );
      
      expect(typeof optimizedImport).toBe('function');
    });

    it('should analyze bundle composition', () => {
      const analysis = bundleOptimizer.analyzeBundleComposition();
      
      expect(analysis).toHaveProperty('stats');
      expect(analysis).toHaveProperty('recommendations');
      expect(Array.isArray(analysis.recommendations)).toBe(true);
    });

    it('should provide tree shaking helpers', () => {
      const helpers = bundleOptimizer.getTreeShakingHelpers();
      
      expect(helpers).toHaveProperty('markPure');
      expect(helpers).toHaveProperty('createTreeShakeableExports');
      expect(helpers).toHaveProperty('identifyUnusedExports');
    });

    it('should provide code splitting helpers', () => {
      const helpers = bundleOptimizer.getCodeSplittingHelpers();
      
      expect(helpers).toHaveProperty('createRouteChunk');
      expect(helpers).toHaveProperty('createFeatureChunk');
      expect(helpers).toHaveProperty('createVendorChunk');
    });
  });

  describe('Performance Monitor', () => {
    it('should track component performance', async () => {
      const mockOperation = vi.fn().mockResolvedValue('result');
      
      const result = await performanceMonitor.trackComponentPerformance(
        'TestComponent',
        mockOperation
      );
      
      expect(result).toBe('result');
      expect(mockOperation).toHaveBeenCalled();
    });

    it('should track analysis performance', async () => {
      const mockAnalysis = vi.fn().mockResolvedValue({ score: 85 });
      
      const result = await performanceMonitor.trackAnalysisPerformance(mockAnalysis);
      
      expect(result).toEqual({ score: 85 });
      expect(mockAnalysis).toHaveBeenCalled();
    });

    it('should track document parsing performance', async () => {
      const mockParser = vi.fn().mockResolvedValue({ content: 'parsed content' });
      
      const result = await performanceMonitor.trackDocumentParsePerformance(mockParser);
      
      expect(result).toEqual({ content: 'parsed content' });
      expect(mockParser).toHaveBeenCalled();
    });

    it('should calculate performance score', () => {
      // Mock some metrics
      performanceMonitor['metrics'] = {
        lcp: 2000, // Good LCP
        fid: 50,   // Good FID
        cls: 0.05, // Good CLS
        componentLoadTime: 2000, // Good load time
      };
      
      const score = performanceMonitor.getPerformanceScore();
      expect(score).toBeGreaterThan(80); // Should be a good score
    });

    it('should generate performance recommendations', () => {
      // Mock poor metrics
      performanceMonitor['metrics'] = {
        lcp: 4000, // Poor LCP
        fid: 200,  // Poor FID
        cls: 0.3,  // Poor CLS
      };
      
      const report = performanceMonitor.getPerformanceReport();
      expect(report.recommendations.length).toBeGreaterThan(0);
      expect(report.recommendations.some(rec => rec.includes('Largest Contentful Paint'))).toBe(true);
    });

    it('should export performance data', () => {
      const exportedData = performanceMonitor.exportPerformanceData();
      
      expect(exportedData).toHaveProperty('entries');
      expect(exportedData).toHaveProperty('summary');
      expect(exportedData.summary).toHaveProperty('averageScore');
      expect(exportedData.summary).toHaveProperty('totalAlerts');
      expect(exportedData.summary).toHaveProperty('sessionDuration');
    });
  });

  describe('Integration Tests', () => {
    it('should work together for complete performance optimization', async () => {
      // Test caching
      const testData = { test: 'integration data' };
      analysisCache.set('integration-test', testData);
      expect(analysisCache.get('integration-test')).toEqual(testData);
      
      // Test lazy loading
      const mockComponent = { default: () => 'Integration Component' };
      await lazyLoadManager.preloadComponent(
        () => Promise.resolve(mockComponent),
        'IntegrationComponent'
      );
      
      // Test performance monitoring
      const mockOperation = () => Promise.resolve('integration result');
      const result = await performanceMonitor.trackComponentPerformance(
        'IntegrationTest',
        mockOperation
      );
      expect(result).toBe('integration result');
      
      // Test bundle optimization
      const analysis = bundleOptimizer.analyzeBundleComposition();
      expect(analysis).toHaveProperty('stats');
      
      // Verify all systems are working
      const cacheStats = analysisCache.getStats();
      const lazyStats = lazyLoadManager.getPerformanceMetrics();
      const perfReport = performanceMonitor.getPerformanceReport();
      
      expect(cacheStats.entryCount).toBeGreaterThan(0);
      expect(lazyStats).toHaveProperty('totalLoads');
      expect(perfReport).toHaveProperty('score');
    });

    it('should handle errors gracefully across all systems', async () => {
      // Test cache with invalid data
      expect(() => analysisCache.get('non-existent-key')).not.toThrow();
      
      // Test lazy loading with failing import
      const failingImport = () => Promise.reject(new Error('Import failed'));
      await expect(
        lazyLoadManager.preloadComponent(failingImport, 'FailingComponent')
      ).rejects.toThrow();
      
      // Test performance monitoring with failing operation
      const failingOperation = () => Promise.reject(new Error('Operation failed'));
      await expect(
        performanceMonitor.trackComponentPerformance('FailingComponent', failingOperation)
      ).rejects.toThrow();
      
      // Verify systems remain stable after errors
      const cacheStats = analysisCache.getStats();
      const perfReport = performanceMonitor.getPerformanceReport();
      
      expect(cacheStats).toBeDefined();
      expect(perfReport).toBeDefined();
    });
  });
});