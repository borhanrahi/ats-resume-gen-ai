'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  Database, 
  Package, 
  Activity,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { usePerformanceOptimization, useComponentPerformance } from '@/lib/hooks/usePerformanceOptimization';
import { analysisCache, templateCache } from '@/lib/utils/cacheManager';
import { performanceMonitor } from '@/lib/utils/performanceMonitor';
import { LazyComponents } from '@/lib/utils/lazyLoader';

/**
 * Example component demonstrating performance optimization features
 */
export default function PerformanceOptimizationExample() {
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [demoResults, setDemoResults] = useState<string[]>([]);

  const { 
    preloadOnHover, 
    getPerformanceMetrics, 
    cacheManagement 
  } = usePerformanceOptimization();

  const { trackOperation } = useComponentPerformance('PerformanceOptimizationExample');

  useEffect(() => {
    // Update stats every 2 seconds
    const interval = setInterval(() => {
      setCacheStats(cacheManagement().getStats());
      setPerformanceMetrics(getPerformanceMetrics());
    }, 2000);

    return () => clearInterval(interval);
  }, [cacheManagement, getPerformanceMetrics]);

  const runCacheDemo = async () => {
    setIsLoading(true);
    const results: string[] = [];

    try {
      await trackOperation(async () => {
        // Demo 1: Cache miss and hit
        results.push('🔍 Testing cache miss...');
        const key = 'demo-analysis-' + Date.now();
        const cachedResult = analysisCache.get(key);
        results.push(`Cache miss: ${cachedResult === null ? '✅' : '❌'}`);

        // Store in cache
        results.push('💾 Storing in cache...');
        const mockAnalysis = {
          score: 85,
          breakdown: { formatting: 90, keywords: 80, structure: 85, length: 85 },
          timestamp: Date.now()
        };
        analysisCache.set(key, mockAnalysis);
        results.push('Cache stored: ✅');

        // Test cache hit
        results.push('🎯 Testing cache hit...');
        const hitResult = analysisCache.get(key);
        results.push(`Cache hit: ${hitResult !== null ? '✅' : '❌'}`);

        // Demo 2: Template cache
        results.push('📄 Testing template cache...');
        const templateKey = 'demo-template-' + Date.now();
        templateCache.set(templateKey, { name: 'Modern Template', styles: {} });
        const templateResult = templateCache.get(templateKey);
        results.push(`Template cached: ${templateResult !== null ? '✅' : '❌'}`);

        setDemoResults([...results]);
      }, 'cacheDemo');
    } catch (error) {
      results.push(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setDemoResults([...results]);
    } finally {
      setIsLoading(false);
    }
  };

  const runPerformanceDemo = async () => {
    setIsLoading(true);
    const results: string[] = [];

    try {
      await trackOperation(async () => {
        results.push('⚡ Testing performance monitoring...');

        // Simulate component loading
        results.push('📦 Simulating component load...');
        await performanceMonitor.trackComponentPerformance(
          'DemoComponent',
          async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
            return 'Component loaded';
          }
        );
        results.push('Component load tracked: ✅');

        // Simulate analysis
        results.push('🧠 Simulating analysis...');
        await performanceMonitor.trackAnalysisPerformance(async () => {
          await new Promise(resolve => setTimeout(resolve, 200));
          return { score: 92 };
        });
        results.push('Analysis tracked: ✅');

        // Simulate document parsing
        results.push('📄 Simulating document parsing...');
        await performanceMonitor.trackDocumentParsePerformance(async () => {
          await new Promise(resolve => setTimeout(resolve, 150));
          return { content: 'Parsed content' };
        });
        results.push('Document parsing tracked: ✅');

        setDemoResults([...results]);
      }, 'performanceDemo');
    } catch (error) {
      results.push(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setDemoResults([...results]);
    } finally {
      setIsLoading(false);
    }
  };

  const runLazyLoadingDemo = () => {
    const results: string[] = [];
    
    results.push('🚀 Testing lazy loading...');
    
    // Preload components on hover simulation
    results.push('🖱️ Simulating hover preload...');
    preloadOnHover('ResumeEditor');
    results.push('Hover preload triggered: ✅');
    
    preloadOnHover('AnalysisResults');
    results.push('Analysis results preload triggered: ✅');
    
    results.push('✨ Lazy loading demo complete!');
    setDemoResults(results);
  };

  const clearCaches = () => {
    cacheManagement().clear();
    setDemoResults(['🗑️ All caches cleared!']);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Performance Optimization Demo
        </h1>
        <p className="text-gray-600">
          Interactive demonstration of caching, lazy loading, and performance monitoring
        </p>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Performance Score</p>
              <p className="text-2xl font-bold text-green-600">
                {performanceMetrics?.currentPerformance?.score?.toFixed(1) || '0.0'}
              </p>
            </div>
            <Zap className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Cache Hit Ratio</p>
              <p className="text-2xl font-bold text-green-600">
                {cacheStats ? 
                  `${(Object.values(cacheStats).reduce((sum: number, stats: any) => 
                    sum + stats.memoryHits + stats.localStorageHits, 0) / 
                    Math.max(1, Object.values(cacheStats).reduce((sum: number, stats: any) => 
                    sum + stats.memoryHits + stats.localStorageHits + stats.memoryMisses + stats.localStorageMisses, 0)) * 100).toFixed(1)}%`
                  : '0.0%'
                }
              </p>
            </div>
            <Database className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Cached Entries</p>
              <p className="text-2xl font-bold text-blue-600">
                {cacheStats ? 
                  Object.values(cacheStats).reduce((sum: number, stats: any) => sum + stats.entryCount, 0)
                  : 0
                }
              </p>
            </div>
            <Package className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Cache Size</p>
              <p className="text-2xl font-bold text-purple-600">
                {cacheStats ? 
                  `${(Object.values(cacheStats).reduce((sum: number, stats: any) => sum + stats.totalSize, 0) / 1024).toFixed(1)}KB`
                  : '0KB'
                }
              </p>
            </div>
            <Activity className="w-8 h-8 text-purple-600" />
          </div>
        </Card>
      </div>

      {/* Demo Controls */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Performance Demos
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Button 
            onClick={runCacheDemo}
            disabled={isLoading}
            className="w-full"
          >
            <Database className="w-4 h-4 mr-2" />
            Test Caching
          </Button>
          
          <Button 
            onClick={runPerformanceDemo}
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            <Activity className="w-4 h-4 mr-2" />
            Test Performance
          </Button>
          
          <Button 
            onClick={runLazyLoadingDemo}
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            <Package className="w-4 h-4 mr-2" />
            Test Lazy Loading
          </Button>
          
          <Button 
            onClick={clearCaches}
            variant="destructive"
            className="w-full"
          >
            <Database className="w-4 h-4 mr-2" />
            Clear Caches
          </Button>
        </div>

        {/* Demo Results */}
        {demoResults.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Demo Results
            </h3>
            <div className="space-y-2 font-mono text-sm">
              {demoResults.map((result, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-gray-500">{index + 1}.</span>
                  <span>{result}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Cache Statistics */}
      {cacheStats && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Database className="w-5 h-5" />
            Cache Statistics
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(cacheStats).map(([cacheType, stats]: [string, any]) => (
              <div key={cacheType} className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-3 capitalize flex items-center gap-2">
                  <Badge variant="outline">{cacheType}</Badge>
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Memory Hits:</span>
                    <span className="font-mono text-green-600">{stats.memoryHits}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Memory Misses:</span>
                    <span className="font-mono text-red-600">{stats.memoryMisses}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Storage Hits:</span>
                    <span className="font-mono text-blue-600">{stats.localStorageHits}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Storage Misses:</span>
                    <span className="font-mono text-orange-600">{stats.localStorageMisses}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Entries:</span>
                    <span className="font-mono">{stats.entryCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Size:</span>
                    <span className="font-mono">{(stats.totalSize / 1024).toFixed(1)}KB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Evictions:</span>
                    <span className="font-mono">{stats.evictions}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Performance Recommendations */}
      {performanceMetrics?.priorityActions && performanceMetrics.priorityActions.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            Performance Recommendations
          </h2>
          
          <div className="space-y-3">
            {performanceMetrics.priorityActions.map((action: string, index: number) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">{action}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Feature List */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Implemented Performance Features</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h3 className="font-semibold text-green-600">✅ Caching System</h3>
            <ul className="space-y-1 text-sm text-gray-600 ml-4">
              <li>• Memory cache with LRU eviction</li>
              <li>• localStorage persistence</li>
              <li>• Analysis result caching</li>
              <li>• Template caching</li>
              <li>• Component data caching</li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <h3 className="font-semibold text-green-600">✅ Lazy Loading</h3>
            <ul className="space-y-1 text-sm text-gray-600 ml-4">
              <li>• Component lazy loading</li>
              <li>• Route-based preloading</li>
              <li>• Hover-based preloading</li>
              <li>• Intersection-based loading</li>
              <li>• Error handling & retries</li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <h3 className="font-semibold text-green-600">✅ Bundle Optimization</h3>
            <ul className="space-y-1 text-sm text-gray-600 ml-4">
              <li>• Code splitting</li>
              <li>• Tree shaking</li>
              <li>• Chunk optimization</li>
              <li>• Dynamic imports</li>
              <li>• Bundle analysis</li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <h3 className="font-semibold text-green-600">✅ Performance Monitoring</h3>
            <ul className="space-y-1 text-sm text-gray-600 ml-4">
              <li>• Core Web Vitals tracking</li>
              <li>• Component performance</li>
              <li>• Memory usage monitoring</li>
              <li>• Error rate tracking</li>
              <li>• Performance scoring</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}