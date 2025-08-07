'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Database, 
  Package, 
  Zap, 
  AlertTriangle, 
  CheckCircle,
  RefreshCw,
  Trash2,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { performanceMonitor } from '@/lib/utils/performanceMonitor';
import { cacheUtils } from '@/lib/utils/cacheManager';
import { optimizationStrategies } from '@/lib/utils/bundleOptimizer';
import { lazyLoadManager } from '@/lib/utils/lazyLoader';

interface PerformanceDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Development-only performance dashboard for monitoring and debugging
 */
export function PerformanceDashboard({ isOpen, onClose }: PerformanceDashboardProps) {
  const [metrics, setMetrics] = useState<any>(null);
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [bundleReport, setBundleReport] = useState<any>(null);
  const [lazyLoadStats, setLazyLoadStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const refreshData = async () => {
    setRefreshing(true);
    try {
      const performanceReport = performanceMonitor.getPerformanceReport();
      const cacheData = cacheUtils.getAllStats();
      const bundleData = optimizationStrategies.getOptimizationReport();
      const lazyData = lazyLoadManager.getPerformanceMetrics();

      setMetrics(performanceReport);
      setCacheStats(cacheData);
      setBundleReport(bundleData);
      setLazyLoadStats(lazyData);
    } catch (error) {
      console.error('Failed to refresh performance data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
      const interval = setInterval(refreshData, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const clearAllCaches = () => {
    cacheUtils.clearAll();
    lazyLoadManager.clearCache();
    refreshData();
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (score >= 70) return <Minus className="w-4 h-4 text-yellow-600" />;
    return <TrendingDown className="w-4 h-4 text-red-600" />;
  };

  if (!isOpen || process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Performance Dashboard</h2>
            <Badge variant="outline" className="text-xs">
              Development Only
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshData}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllCaches}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Caches
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
        </div>

        <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="metrics">Core Metrics</TabsTrigger>
              <TabsTrigger value="cache">Cache</TabsTrigger>
              <TabsTrigger value="bundle">Bundle</TabsTrigger>
              <TabsTrigger value="lazy">Lazy Loading</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Performance Score</p>
                      <div className="flex items-center gap-2">
                        {getScoreIcon(metrics?.score || 0)}
                        <p className={`text-2xl font-bold ${getScoreColor(metrics?.score || 0)}`}>
                          {metrics?.score?.toFixed(1) || '0.0'}
                        </p>
                      </div>
                    </div>
                    <Zap className="w-8 h-8 text-blue-600" />
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Cache Hit Ratio</p>
                      <p className="text-2xl font-bold text-green-600">
                        {((cacheUtils.getOverallHitRatio() || 0) * 100).toFixed(1)}%
                      </p>
                    </div>
                    <Database className="w-8 h-8 text-green-600" />
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Active Alerts</p>
                      <p className="text-2xl font-bold text-red-600">
                        {metrics?.alerts?.length || 0}
                      </p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                  </div>
                </Card>
              </div>

              {metrics?.recommendations && metrics.recommendations.length > 0 && (
                <Card className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    Recommendations
                  </h3>
                  <div className="space-y-2">
                    {metrics.recommendations.slice(0, 5).map((rec: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                        <p className="text-sm text-gray-700">{rec}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="metrics" className="space-y-4">
              {metrics?.metrics && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(metrics.metrics).map(([key, value]) => (
                    <Card key={key} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </p>
                          <p className="text-lg font-semibold">
                            {typeof value === 'number' 
                              ? key.includes('Time') || key.includes('Delay')
                                ? `${value.toFixed(2)}ms`
                                : key.includes('Usage')
                                ? `${(value / 1024 / 1024).toFixed(2)}MB`
                                : key.includes('Rate') || key.includes('Ratio')
                                ? `${(value * 100).toFixed(2)}%`
                                : value.toFixed(2)
                              : String(value)
                            }
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="cache" className="space-y-4">
              {cacheStats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(cacheStats).map(([cacheType, stats]: [string, any]) => (
                    <Card key={cacheType} className="p-4">
                      <h3 className="font-semibold mb-3 capitalize">{cacheType} Cache</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Hits:</span>
                          <span className="font-mono">{stats.memoryHits + stats.localStorageHits}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Misses:</span>
                          <span className="font-mono">{stats.memoryMisses + stats.localStorageMisses}</span>
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
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="bundle" className="space-y-4">
              {bundleReport && (
                <div className="space-y-4">
                  {bundleReport.performanceMetrics && (
                    <Card className="p-4">
                      <h3 className="font-semibold mb-3">Bundle Performance</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Total Load Time</p>
                          <p className="font-mono">{bundleReport.performanceMetrics.totalLoadTime?.toFixed(2)}ms</p>
                        </div>
                        <div>
                          <p className="text-gray-600">JS Load Time</p>
                          <p className="font-mono">{bundleReport.performanceMetrics.jsLoadTime?.toFixed(2)}ms</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Total JS Size</p>
                          <p className="font-mono">{(bundleReport.performanceMetrics.totalJSSize / 1024).toFixed(1)}KB</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Chunk Count</p>
                          <p className="font-mono">{bundleReport.performanceMetrics.chunkCount}</p>
                        </div>
                      </div>
                    </Card>
                  )}

                  {bundleReport.recommendations && bundleReport.recommendations.length > 0 && (
                    <Card className="p-4">
                      <h3 className="font-semibold mb-3">Bundle Recommendations</h3>
                      <div className="space-y-2">
                        {bundleReport.recommendations.map((rec: string, index: number) => (
                          <div key={index} className="flex items-start gap-2">
                            <Package className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-700">{rec}</p>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="lazy" className="space-y-4">
              {lazyLoadStats && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4">
                    <h3 className="font-semibold mb-3">Lazy Loading Stats</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total Loads:</span>
                        <span className="font-mono">{lazyLoadStats.totalLoads}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Successful:</span>
                        <span className="font-mono text-green-600">{lazyLoadStats.successfulLoads}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Failed:</span>
                        <span className="font-mono text-red-600">{lazyLoadStats.failedLoads}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Success Rate:</span>
                        <span className="font-mono">{(lazyLoadStats.successRate * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <h3 className="font-semibold mb-3">Load Times</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Average:</span>
                        <span className="font-mono">{lazyLoadStats.averageLoadTime?.toFixed(2)}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Fastest:</span>
                        <span className="font-mono text-green-600">{lazyLoadStats.fastestLoad?.toFixed(2)}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Slowest:</span>
                        <span className="font-mono text-red-600">{lazyLoadStats.slowestLoad?.toFixed(2)}ms</span>
                      </div>
                    </div>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

/**
 * Floating performance indicator for development
 */
export function PerformanceIndicator() {
  const [isOpen, setIsOpen] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const updateScore = () => {
        const report = performanceMonitor.getPerformanceReport();
        setScore(report.score);
      };

      updateScore();
      const interval = setInterval(updateScore, 5000);
      return () => clearInterval(interval);
    }
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-4 right-4 w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white font-bold text-sm z-40 transition-colors ${
          score >= 90 ? 'bg-green-600 hover:bg-green-700' :
          score >= 70 ? 'bg-yellow-600 hover:bg-yellow-700' :
          'bg-red-600 hover:bg-red-700'
        }`}
        title="Performance Dashboard"
      >
        {score.toFixed(0)}
      </button>

      <PerformanceDashboard isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}